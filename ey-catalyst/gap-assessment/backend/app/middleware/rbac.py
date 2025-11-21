"""
Role-Based Access Control (RBAC) middleware for protecting API endpoints.
"""

from typing import List, Optional
from fastapi import HTTPException, status, Depends, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_active_user
from app.models import User, ROLE_PROCESS_OWNER, ROLE_DEPARTMENT_HEAD, ROLE_ORGANIZATION_HEAD, ROLE_EY_ADMIN
from app.auth import check_role_hierarchy, check_approval_permission

class RBACMiddleware:
    """RBAC middleware for enforcing role-based permissions."""

    def __init__(self, required_roles: Optional[List[str]] = None, allow_approval: bool = False):
        """
        Initialize RBAC middleware.

        Args:
            required_roles: List of roles that can access the endpoint
            allow_approval: Whether to allow users who can approve for the required roles
        """
        self.required_roles = required_roles or []
        self.allow_approval = allow_approval

    def __call__(self, current_user: User = Depends(get_current_active_user)):
        """
        Check if current user has required permissions.

        Args:
            current_user: Current authenticated user

        Returns:
            User object if authorized

        Raises:
            HTTPException: If user doesn't have required permissions
        """
        if not self.required_roles:
            return current_user

        # Check if user has any of the required roles
        has_role = any(check_role_hierarchy(current_user, role) for role in self.required_roles)

        if has_role:
            return current_user

        # If approval is allowed, check if user can approve for any of the required roles
        if self.allow_approval:
            can_approve = any(check_approval_permission(current_user, role) for role in self.required_roles)
            if can_approve:
                return current_user

        # User doesn't have required permissions
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Insufficient permissions. Required roles: {', '.join(self.required_roles)}"
        )

# Predefined middleware instances for common use cases
require_process_owner = RBACMiddleware([ROLE_PROCESS_OWNER])
require_department_head = RBACMiddleware([ROLE_DEPARTMENT_HEAD])
require_organization_head = RBACMiddleware([ROLE_ORGANIZATION_HEAD])
require_ey_admin = RBACMiddleware([ROLE_EY_ADMIN])

# Allow users who can approve for the specified roles
require_process_owner_or_approver = RBACMiddleware([ROLE_PROCESS_OWNER], allow_approval=True)
require_department_head_or_approver = RBACMiddleware([ROLE_DEPARTMENT_HEAD], allow_approval=True)
require_organization_head_or_approver = RBACMiddleware([ROLE_ORGANIZATION_HEAD], allow_approval=True)

# Hierarchical access - allow users with sufficient role level
require_department_head_or_above = RBACMiddleware([ROLE_DEPARTMENT_HEAD, ROLE_ORGANIZATION_HEAD, ROLE_EY_ADMIN])
require_organization_head_or_above = RBACMiddleware([ROLE_ORGANIZATION_HEAD, ROLE_EY_ADMIN])
require_ey_admin_only = RBACMiddleware([ROLE_EY_ADMIN])

def require_roles(*roles: str, allow_approval: bool = False):
    """
    Create a custom RBAC middleware requiring specific roles.

    Args:
        roles: Variable number of role strings
        allow_approval: Whether to allow users who can approve for the roles

    Returns:
        RBAC middleware instance
    """
    return RBACMiddleware(list(roles), allow_approval)

def check_resource_ownership(
    resource_user_id: int,
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Check if current user owns the resource or has sufficient permissions to access it.

    Args:
        resource_user_id: ID of the user who owns the resource
        current_user: Current authenticated user

    Returns:
        User object if authorized

    Raises:
        HTTPException: If user doesn't have permission to access the resource
    """
    # Users can always access their own resources
    if resource_user_id == current_user.id:
        return current_user

    # Higher-level roles can access lower-level resources
    if check_role_hierarchy(current_user, ROLE_DEPARTMENT_HEAD):
        return current_user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Not authorized to access this resource"
    )

def check_approval_request_access(
    request_submitted_by: int,
    request_approver_role: str,
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Check if current user can access an approval request.

    Args:
        request_submitted_by: ID of user who submitted the request
        request_approver_role: Current approver role for the request
        current_user: Current authenticated user

    Returns:
        User object if authorized

    Raises:
        HTTPException: If user doesn't have permission to access the request
    """
    # Users can access requests they submitted
    if request_submitted_by == current_user.id:
        return current_user

    # Users can access requests pending their approval
    if request_approver_role == current_user.role:
        return current_user

    # Higher-level roles can access lower-level requests
    if check_approval_permission(current_user, request_approver_role):
        return current_user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Not authorized to access this approval request"
    )

def get_user_permissions(current_user: User = Depends(get_current_active_user)) -> dict:
    """
    Get permissions for the current user.

    Args:
        current_user: Current authenticated user

    Returns:
        Dictionary of user permissions
    """
    permissions = {
        "can_create_users": check_role_hierarchy(current_user, ROLE_DEPARTMENT_HEAD),
        "can_approve_requests": check_approval_permission(current_user, ROLE_PROCESS_OWNER),
        "can_manage_frameworks": check_role_hierarchy(current_user, ROLE_DEPARTMENT_HEAD),
        "can_approve_frameworks": check_role_hierarchy(current_user, ROLE_ORGANIZATION_HEAD),
        "can_delete_frameworks": current_user.role == ROLE_EY_ADMIN,
        "can_view_all_users": check_role_hierarchy(current_user, ROLE_DEPARTMENT_HEAD),
        "can_view_dashboard": check_role_hierarchy(current_user, ROLE_PROCESS_OWNER),
        "can_submit_clause_edits": current_user.role == ROLE_PROCESS_OWNER,
        "can_submit_framework_additions": check_approval_permission(current_user, ROLE_DEPARTMENT_HEAD),
    }

    return permissions
