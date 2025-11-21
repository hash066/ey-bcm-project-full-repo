"""
Authentication router for handling login and token generation.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta, datetime, timezone
from typing import Dict, Any

from app.db.postgres import get_db
from app.core.config import settings
from app.middleware.auth import RBACMiddleware, create_access_token, get_current_user
from app.services.org_hierarchy_service import OrgHierarchyService
from app.services.activity_log_service import ActivityLogService

# Create router
router = APIRouter(
    prefix="/auth",
    tags=["authentication"],
    responses={401: {"description": "Unauthorized"}},
)

# Create RBAC middleware
rbac_middleware = RBACMiddleware(
    ad_server_uri=settings.AD_SERVER_URI,
    ad_base_dn=settings.AD_BASE_DN
)

@router.post("/token", response_model=Dict[str, Any])
async def login_for_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    OAuth2 compatible token login, get an access token for future requests.
    
    Args:
        request: FastAPI request object
        form_data: OAuth2 password request form
        db: Database session
        
    Returns:
        Dict: Access token and token type
        
    Raises:
        HTTPException: If authentication fails
    """
    # Authenticate user against AD
    user = await rbac_middleware.authenticate_user(
        username=form_data.username,
        password=form_data.password,
        db=db
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Debug: Print user object to see what's coming from the authenticator
    print(f"User object from authenticator: {user}")
    print(f"Path information: {user.get('path')}")
    
    # Synchronize organizational hierarchy from AD DS to database
    path = user.get("path", {})
    if path:
        try:
            # Get user roles from the authenticated user
            role_names = user.get("roles", [])
            
            # Sync organization hierarchy and get resolved IDs
            resolved_ids = await OrgHierarchyService.sync_org_hierarchy(
                path=path,
                username=user["username"],
                db=db,
                roles=role_names
            )
            print(f"Resolved organization hierarchy IDs: {resolved_ids}")
            
            # Add resolved IDs to user object
            user["organization_id"] = resolved_ids.get("organization_id")
            user["department_id"] = resolved_ids.get("department_id")
            user["subdepartment_id"] = resolved_ids.get("subdepartment_id")
            user["process_id"] = resolved_ids.get("process_id")
        except Exception as e:
            print(f"Error synchronizing organization hierarchy: {str(e)}")
            # Continue with authentication even if hierarchy sync fails
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Use roles directly from the authenticated user
    # These roles were already mapped from AD groups in the authenticate_user method
    role_names = user.get("roles", [])
    
    # Create access token with roles and organization hierarchy IDs
    access_token = create_access_token(
        data={
            "sub": user["username"],
            "roles": role_names,
            "user_id": user["id"],
            "client_id": user.get("client_id"),
            "organization_id": str(user.get("organization_id")) if user.get("organization_id") else None,
            "department_id": str(user.get("department_id")) if user.get("department_id") else None,
            "subdepartment_id": str(user.get("subdepartment_id")) if user.get("subdepartment_id") else None,
            "process_id": str(user.get("process_id")) if user.get("process_id") else None
        },
        expires_delta=access_token_expires
    )
    
    # Determine user role based on AD groups
    user_role = "User"  # Default role
    is_admin = False  # Flag to indicate if user is an administrator
    
    # Check if the user is the Administrator or belongs to admin groups
    if user["username"] == "Administrator":
        is_admin = True
        user_role = "System Admin"
    else:
        # Define role hierarchy from highest to lowest
        role_hierarchy = [
            {"group": "BRT_Admins", "role": "System Admin", "is_admin": True},
            {"group": "BRT_CEOs", "role": "CEO", "is_admin": False},
            {"group": "BRT_Reportees", "role": "Reportee", "is_admin": False},
            {"group": "BRT_SubReportees", "role": "Sub-reportee", "is_admin": False},
            {"group": "BRT_CXOs", "role": "CXO", "is_admin": False},
            {"group": "BRT_ProjectSponsors", "role": "Project Sponsor", "is_admin": False},
            {"group": "BRT_ClientHeads", "role": "Client Head", "is_admin": False},
            {"group": "BRT_BCMCoordinators", "role": "BCM Coordinator", "is_admin": False},
            {"group": "BRT_DepartmentHeads", "role": "Department Head", "is_admin": False},
            {"group": "BRT_SubDepartmentHeads", "role": "SubDepartment Head", "is_admin": False},
            {"group": "BRT_ProcessOwners", "role": "Process Owner", "is_admin": False}
        ]
        
        # Check user's groups against the role hierarchy
        for role_info in role_hierarchy:
            if role_info["group"] in user["groups"]:
                user_role = role_info["role"]
                is_admin = role_info["is_admin"]
                break
                
        # Check for AD admin groups
        if not is_admin:
            for group in user["groups"]:
                if group in ["Domain Admins", "Enterprise Admins", "Schema Admins", "Administrators"]:
                    is_admin = True
                    break
    
    # Use account expiration date from AD if available, otherwise use a default
    account_expires_on = user.get("account_expires_on")
    if not account_expires_on:
        # Fallback to 6 months from now (matching AD setting)
        account_expires_on = (datetime.now(timezone.utc) + timedelta(days=180)).strftime("%Y-%m-%d %H:%M:%S UTC")
    
    # Log the login activity if the user belongs to an organization
    if user.get("organization_id"):
        try:
            # Extract department and subdepartment names from path
            department_name = path.get("department")
            subdepartment_name = path.get("subdepartment")
            
            # Create activity log entry
            await ActivityLogService.log_activity(
                db=db,
                request=request,
                organization_id=str(user.get("organization_id")),
                username=user["username"],
                department=department_name,
                subdepartment=subdepartment_name,
                action_info=f"User login - {user_role}",
                endpoint="/auth/token"
            )
        except Exception as e:
            # Log error but don't interrupt the login process
            print(f"Error logging login activity: {str(e)}")
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user["id"],
        "username": user["username"],
        "groups": user["groups"],
        "path": user.get("path", {
            "organization": None,
            "department": None,
            "subdepartment": None,
            "process": None
        }),
        "organization_id": user.get("organization_id"),
        "department_id": user.get("department_id"),
        "subdepartment_id": user.get("subdepartment_id"),
        "process_id": user.get("process_id"),
        "account_valid": user.get("account_valid", True),
        "account_expires_on": account_expires_on,
        "is_bcm_coordinator": "BRT_BCMCoordinator" in user["groups"],
        "role": user_role,
        "is_admin": is_admin  # Add is_admin flag to response
    }

@router.post("/refresh")
async def refresh_access_token(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Refresh the access token.
    
    Args:
        current_user: Current user from token
        db: Database session
        
    Returns:
        Dict: New access token and token type
    """
    # Create new access token with same data
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    access_token = create_access_token(
        data={
            "sub": current_user.username,
            "roles": current_user.roles,
            "user_id": current_user.id,
            "client_id": current_user.client_id,
            "organization_id": str(current_user.organization_id) if current_user.organization_id else None,
            "department_id": str(current_user.department_id) if current_user.department_id else None,
            "subdepartment_id": str(current_user.subdepartment_id) if current_user.subdepartment_id else None,
            "process_id": str(current_user.process_id) if current_user.process_id else None
        },
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=Dict[str, Any])
async def read_users_me(
    current_user = Depends(get_current_user)
):
    """
    Get current user information.
    
    Args:
        current_user: Current user from token
        
    Returns:
        Dict: User information
    """
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "is_active": current_user.is_active
    }
