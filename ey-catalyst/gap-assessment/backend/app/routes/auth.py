"""
Authentication routes for user login, registration, and management.
"""

from datetime import timedelta
from typing import List
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import (
    authenticate_user,
    create_access_token,
    get_current_active_user,
    get_password_hash,
    check_role_hierarchy
)
from app.models import User, ROLE_PROCESS_OWNER, ROLE_DEPARTMENT_HEAD, ROLE_ORGANIZATION_HEAD, ROLE_EY_ADMIN
from app.schemas import (
    User, UserCreate, UserUpdate, UserLogin, Token,
    RoleInfo, PermissionCheck, UserStats
)

router = APIRouter()

# Role definitions
ROLES = [
    {
        "role": ROLE_PROCESS_OWNER,
        "name": "Process Owner",
        "level": 1,
        "description": "Owns specific processes and can submit clause-level edits or framework suggestions"
    },
    {
        "role": ROLE_DEPARTMENT_HEAD,
        "name": "Department Head",
        "level": 2,
        "description": "Oversees multiple process owners and reviews their submissions"
    },
    {
        "role": ROLE_ORGANIZATION_HEAD,
        "name": "Organization Head",
        "level": 3,
        "description": "Oversees multiple departments and reviews department-level submissions"
    },
    {
        "role": ROLE_EY_ADMIN,
        "name": "EY Admin",
        "level": 4,
        "description": "Has global oversight, final approval authority, and manages the global framework database"
    }
]

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return JWT token.

    - **username**: User email address
    - **password**: User password

    Returns JWT access token for authenticated user.
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(hours=24)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    return Token(access_token=access_token, token_type="bearer")

@router.post("/register", response_model=User)
async def register_user(
    user_data: UserCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Register a new user. Only users with sufficient privileges can create new users.

    - **user_data**: User registration data

    Returns created user information.
    """
    # Check if current user can create users (only higher-level roles can create users)
    if not check_role_hierarchy(current_user, ROLE_DEPARTMENT_HEAD):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to create users"
        )

    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Validate role hierarchy - users can only create users with lower or equal roles
    if not check_role_hierarchy(current_user, user_data.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create user with higher role level"
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        department=user_data.department,
        organization=user_data.organization,
        hashed_password=hashed_password
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user

@router.get("/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """
    Get current user information.

    Returns information about the currently authenticated user.
    """
    return current_user

@router.put("/me", response_model=User)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update current user information.

    - **user_update**: Fields to update

    Returns updated user information.
    """
    # Update user fields
    for field, value in user_update.dict(exclude_unset=True).items():
        if value is not None:
            setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)

    return current_user

@router.get("/users", response_model=List[User])
async def get_users(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get list of all users. Only accessible to users with sufficient privileges.

    Returns list of all users in the system.
    """
    # Only department heads and above can view all users
    if not check_role_hierarchy(current_user, ROLE_DEPARTMENT_HEAD):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to view all users"
        )

    users = db.query(User).filter(User.is_active == True).all()
    return users

@router.get("/users/{user_id}", response_model=User)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get specific user information.

    - **user_id**: User ID to retrieve

    Returns user information for the specified user.
    """
    # Users can view their own info or higher-level roles can view others
    if user_id != current_user.id and not check_role_hierarchy(current_user, ROLE_DEPARTMENT_HEAD):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to view other users"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user

@router.put("/users/{user_id}", response_model=User)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update user information.

    - **user_id**: User ID to update
    - **user_update**: Fields to update

    Returns updated user information.
    """
    # Check permissions
    if user_id != current_user.id and not check_role_hierarchy(current_user, ROLE_ORGANIZATION_HEAD):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to update other users"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Validate role hierarchy if updating role
    if user_update.role and user_update.role != user.role:
        if not check_role_hierarchy(current_user, user_update.role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot assign higher role level"
            )

    # Update user fields
    for field, value in user_update.dict(exclude_unset=True).items():
        if value is not None:
            setattr(user, field, value)

    db.commit()
    db.refresh(user)

    return user

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete/deactivate a user.

    - **user_id**: User ID to delete

    Returns success message.
    """
    # Only organization heads and above can delete users
    if not check_role_hierarchy(current_user, ROLE_ORGANIZATION_HEAD):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to delete users"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Deactivate user instead of deleting
    user.is_active = False
    db.commit()

    return {"message": "User deactivated successfully"}

@router.get("/roles", response_model=List[RoleInfo])
async def get_roles():
    """
    Get available roles and their hierarchy.

    Returns list of all available roles with their descriptions.
    """
    return ROLES

@router.get("/permissions/check")
async def check_permissions(
    required_role: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Check if current user has required permissions.

    - **required_role**: Role level to check against

    Returns permission check result.
    """
    from app.models import ROLE_HIERARCHY

    has_permission = check_role_hierarchy(current_user, required_role)

    return PermissionCheck(
        has_permission=has_permission,
        required_role=required_role,
        user_role=current_user.role,
        user_level=ROLE_HIERARCHY.get(current_user.role, 0),
        required_level=ROLE_HIERARCHY.get(required_role, 0)
    )

@router.get("/stats", response_model=UserStats)
async def get_user_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get user statistics for dashboard.

    Returns statistics about the current user's activity.
    """
    from app.models import ApprovalRequest, ApprovalStep

    # Get user's submitted requests
    total_submitted = db.query(ApprovalRequest).filter(
        ApprovalRequest.submitted_by == current_user.id
    ).count()

    # Get requests approved by user
    total_approved = db.query(ApprovalStep).filter(
        ApprovalStep.approver_id == current_user.id,
        ApprovalStep.decision == "approved"
    ).count()

    # Get requests rejected by user
    total_rejected = db.query(ApprovalStep).filter(
        ApprovalStep.approver_id == current_user.id,
        ApprovalStep.decision == "rejected"
    ).count()

    # Get pending approvals for user
    pending_approvals = db.query(ApprovalRequest).filter(
        ApprovalRequest.current_approver_role == current_user.role,
        ApprovalRequest.status == "pending"
    ).count()

    return UserStats(
        total_submitted=total_submitted,
        total_approved=total_approved,
        total_rejected=total_rejected,
        pending_approvals=pending_approvals
    )
