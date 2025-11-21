"""
Authentication router for handling login and token generation.
Migrated to use Supabase as the primary database.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, Form
from sqlalchemy.orm import Session
from datetime import timedelta, datetime, timezone
from typing import Dict, Any
from fastapi.responses import JSONResponse, RedirectResponse

from app.db.postgres import get_db
from app.core.config import settings
from app.middleware.auth import RBACMiddleware, create_access_token, get_current_user
from app.services.org_hierarchy_service import OrgHierarchyService
from app.services.activity_log_service import ActivityLogService
from app.services.ldap_auth_service import authenticate_with_adds
from app.utils.supabase_migration_utils import (
    supabase_select, supabase_insert, supabase_update,
    convert_uuid_to_string, prepare_record_for_supabase
)

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
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Authenticate user with demo mode fallback to ADDS.
    First checks for demo credentials, then falls back to ADDS authentication.
    """

    # DEMO MODE CHECK: Check if credentials match demo format before trying ADDS
    demo_users = {
        # EY Admin (System Admin)
        ("ey_admin", "demo123"): {
            "roles": ["ey_admin"],
            "role_name": "EY Admin",
            "is_admin": True,
            "user_id": "dev-ey-admin-001"
        },
        # CEO
        ("ceo", "demo123"): {
            "roles": ["ceo"],
            "role_name": "CEO",
            "is_admin": False,
            "user_id": "dev-ceo-001"
        },
        # BCM Coordinator
        ("bcm_admin", "demo123"): {
            "roles": ["bcm_coordinator"],
            "role_name": "BCM Coordinator",
            "is_admin": False,
            "user_id": "dev-bcm-001"
        },
        # Department Head
        ("dept_head", "demo123"): {
            "roles": ["department_head"],
            "role_name": "Department Head",
            "is_admin": False,
            "user_id": "dev-dept-head-001"
        },
        # Sub-department Head
        ("sub_head", "demo123"): {
            "roles": ["sub_department_head"],
            "role_name": "Sub-department Head",
            "is_admin": False,
            "user_id": "dev-sub-dept-head-001"
        },
        # Process Owner (default)
        ("process_owner", "demo123"): {
            "roles": ["process_owner"],
            "role_name": "Process Owner",
            "is_admin": False,
            "user_id": "dev-process-owner-001"
        },
        # Legacy credentials for backward compatibility
        ("admin", "demo123"): {
            "roles": ["ey_admin"],
            "role_name": "EY Admin",
            "is_admin": True,
            "user_id": "dev-admin-001"
        },
        ("user", "demo123"): {
            "roles": ["User"],
            "role_name": "User",
            "is_admin": False,
            "user_id": "dev-user-001"
        }
    }

    # Normalize inputs for comparison
    username_str = str(username) if username else ""
    password_str = str(password) if password else ""
    user_key = (username_str, password_str)

    # If demo credentials match, return demo token
    if user_key in demo_users:
        print(f"🎭 Demo login successful for user: {username}")
        user_config = demo_users[user_key]

        # Create JWT token
        access_token = create_access_token(
            data={
                "sub": username,
                "roles": user_config["roles"],
                "user_id": user_config["user_id"]
            },
            expires_delta=timedelta(hours=24)
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user_config["user_id"],
                "username": username,
                "email": f"{username}@demo.local",
                "full_name": user_config["role_name"],
                "roles": user_config["roles"]
            },
            "expires_in": 86400  # 24 hours
        }

    # If not demo credentials, try real ADDS authentication
    try:
        print(f"🔐 Attempting ADDS login for user: {username}")

        # Authenticate against ADDS using LDAP service
        auth_result = authenticate_with_adds(username, password, db)

        if not auth_result:
            print(f"❌ ADDS authentication failed for user: {username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid ADDS credentials or user not found",
                headers={"WWW-Authenticate": "Bearer"},
            )

        print(f"✅ ADDS authentication successful for user: {username}")
        print(f"   User roles: {auth_result['user']['roles']}")
        print(f"   Primary role: {auth_result['user']['roles'][0] if auth_result['user']['roles'] else 'None'}")

        # Log successful authentication
        try:
            await ActivityLogService.log_activity(
                db=db,
                request=request,
                organization_id=None,  # Will be determined from user context
                username=username,
                department=None,
                subdepartment=None,
                action_info=f"ADDS login successful - Role: {auth_result['user']['roles'][0] if auth_result['user']['roles'] else 'None'}",
                endpoint="/auth/token"
            )
        except Exception as e:
            print(f"Warning: Could not log authentication activity: {str(e)}")

        return auth_result

    except HTTPException:
        raise
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.exception("LDAP auth failed for %s: %s", username, e)
        print(f"❌ Login error for {username}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed (AD error)",
        )


# Original auth code commented out but preserved below:
# @router.post("/token", response_model=Dict[str, Any])
# async def orig_login_for_access_token(
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
    resolved_ids = {}
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
            # Initialize with None IDs for development bypass users
            if user.get("path") and user["path"].get("organization") == "Test Organization":
                # For development bypass users, create default UUIDs
                import uuid
                user["organization_id"] = str(uuid.uuid4())
                user["department_id"] = str(uuid.uuid4())
                user["subdepartment_id"] = str(uuid.uuid4())
                user["process_id"] = str(uuid.uuid4())
                print("Used default UUIDs for development bypass user")
            else:
                # Continue with authentication even if hierarchy sync fails
                pass
    
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
    
    # Log the login activity if the user belongs to an organization and it's not a development bypass user
    if user.get("organization_id") and user.get("path", {}).get("organization") != "Test Organization":
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


# Simple login functions for development bypass (used in main.py)
async def login(request: Request):
    """
    Simple login endpoint for development purposes.
    Bypasses normal authentication for testing.

    Available demo credentials (password is always "demo123"):
    - ey_admin / demo123 : EY Admin (System Admin)
    - ceo / demo123 : CEO role
    - bcm_admin / demo123 : BCM Coordinator role
    - dept_head / demo123 : Department Head role
    - sub_head / demo123 : Sub-department Head role
    - process_owner / demo123 : Process Owner role (default)
    """
    try:
        # Get form data
        form_data = await request.form()
        username = form_data.get("username")
        password = form_data.get("password")

        if not username or not password:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"error": "Username and password required"}
            )

        # Demo credentials for different RBAC roles
        demo_users = {
            # EY Admin (System Admin)
            ("ey_admin", "demo123"): {
                "roles": ["ey_admin"],
                "role_name": "EY Admin",
                "is_admin": True,
                "user_id": "dev-ey-admin-001"
            },
            # CEO
            ("ceo", "demo123"): {
                "roles": ["ceo"],
                "role_name": "CEO",
                "is_admin": False,
                "user_id": "dev-ceo-001"
            },
            # BCM Coordinator
            ("bcm_admin", "demo123"): {
                "roles": ["bcm_coordinator"],
                "role_name": "BCM Coordinator",
                "is_admin": False,
                "user_id": "dev-bcm-001"
            },
            # Department Head
            ("dept_head", "demo123"): {
                "roles": ["department_head"],
                "role_name": "Department Head",
                "is_admin": False,
                "user_id": "dev-dept-head-001"
            },
            # Sub-department Head
            ("sub_head", "demo123"): {
                "roles": ["sub_department_head"],
                "role_name": "Sub-department Head",
                "is_admin": False,
                "user_id": "dev-sub-dept-head-001"
            },
            # Process Owner (default)
            ("process_owner", "demo123"): {
                "roles": ["process_owner"],
                "role_name": "Process Owner",
                "is_admin": False,
                "user_id": "dev-process-owner-001"
            },
            # Legacy credentials for backward compatibility
            ("admin", "admin"): {
                "roles": ["System Admin"],
                "role_name": "System Admin",
                "is_admin": True,
                "user_id": "dev-admin-001"
            },
            ("user", "user"): {
                "roles": ["User"],
                "role_name": "User",
                "is_admin": False,
                "user_id": "dev-user-001"
            }
        }

        # Check credentials (ensure strings)
        username_str = str(username) if username else ""
        password_str = str(password) if password else ""
        user_key = (username_str, password_str)

        if user_key in demo_users:
            user_config = demo_users[user_key]

            # Create JWT token
            access_token = create_access_token(
                data={
                    "sub": username,
                    "roles": user_config["roles"],
                    "user_id": user_config["user_id"]
                },
                expires_delta=timedelta(hours=24)
            )

            return JSONResponse(content={
                "access_token": access_token,
                "token_type": "bearer",
                "username": username,
                "role": user_config["role_name"],
                "roles": user_config["roles"],
                "is_admin": user_config["is_admin"],
                "message": f"Demo login successful as {user_config['role_name']} (development mode)"
            })
        else:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "error": "Invalid demo credentials",
                    "available_logins": {
                        "ey_admin/demo123": "EY Admin (System Admin)",
                        "ceo/demo123": "CEO",
                        "bcm_admin/demo123": "BCM Coordinator",
                        "dept_head/demo123": "Department Head",
                        "sub_head/demo123": "Sub-department Head",
                        "process_owner/demo123": "Process Owner"
                    }
                }
            )

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": f"Login failed: {str(e)}"}
        )


async def admin_login(request: Request):
    """
    Simple admin login endpoint for development purposes.
    Always logs in as admin user.
    """
    try:
        # Get form data
        form_data = await request.form()
        username = form_data.get("username", "admin")
        password = form_data.get("password", "admin")

        # Create admin token
        access_token = create_access_token(
            data={
                "sub": username,
                "roles": ["System Admin"],
                "user_id": "dev-admin-001"
            },
            expires_delta=timedelta(hours=24)
        )

        return JSONResponse(content={
            "access_token": access_token,
            "token_type": "bearer",
            "username": username,
            "role": "System Admin",
            "is_admin": True,
            "message": "Admin login successful (development mode)"
        })

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": f"Admin login failed: {str(e)}"}
        )
