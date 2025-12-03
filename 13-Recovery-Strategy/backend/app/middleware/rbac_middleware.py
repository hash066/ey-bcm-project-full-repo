"""
FastAPI RBAC Middleware - Permission-based access control for API endpoints.
Replaces the old role-based middleware with database-driven permission checking.
"""

from typing import List, Optional, Callable, Any
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.postgres import get_db
from app.services.rbac_service import PermissionService, get_permission_service
from app.models import User
import logging

logger = logging.getLogger(__name__)

# Security scheme for token extraction
security = HTTPBearer(auto_error=False)


class RBACMiddleware:
    """
    Database-driven RBAC middleware for FastAPI endpoints.

    Replaces hard-coded role checking with dynamic permission verification.
    """

    def __init__(self,
                 required_permissions: Optional[List[str]] = None,
                 require_all: bool = True,
                 allow_approval: bool = False):
        """
        Initialize RBAC middleware.

        Args:
            required_permissions: List of permission strings (e.g., ['users.view', 'users.create'])
            require_all: If True, user must have ALL permissions; if False, ANY permission
            allow_approval: If True, allow users who can approve for the required permissions
        """
        self.required_permissions = required_permissions or []
        self.require_all = require_all
        self.allow_approval = allow_approval

    def __call__(self,
                 request: Request,
                 credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
                 permission_service: PermissionService = Depends(get_permission_service)):
        """
        Middleware execution - check permissions for the current request.

        Args:
            request: FastAPI request object
            credentials: JWT token credentials
            permission_service: Permission checking service

        Returns:
            None (proceeds to endpoint) or raises HTTPException
        """
        # If no permissions required, allow access
        if not self.required_permissions:
            return

        # Extract user from request context (set by auth middleware)
        current_user = getattr(request.state, 'user', None)
        if not current_user:
            logger.warning("No user found in request context for RBAC check")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )

        # Check permissions
        has_access = self._check_permissions(current_user, permission_service)

        if not has_access:
            # Log permission denial for security monitoring
            permissions_str = ', '.join(self.required_permissions)
            logger.warning(f"Permission denied: user={current_user.id}, "
                         f"permissions=[{permissions_str}], path={request.url.path}")

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required: {permissions_str}"
            )

    def _check_permissions(self, user: User, permission_service: PermissionService) -> bool:
        """
        Check if user has required permissions.

        Args:
            user: Current user
            permission_service: Permission checking service

        Returns:
            True if user has access, False otherwise
        """
        if self.require_all:
            # User must have ALL required permissions
            return all(
                self._check_single_permission(user, perm, permission_service)
                for perm in self.required_permissions
            )
        else:
            # User must have ANY of the required permissions
            return any(
                self._check_single_permission(user, perm, permission_service)
                for perm in self.required_permissions
            )

    def _check_single_permission(self, user: User, permission: str,
                               permission_service: PermissionService) -> bool:
        """
        Check if user has a specific permission.

        Args:
            user: Current user
            permission: Permission string (format: "resource.action")
            permission_service: Permission checking service

        Returns:
            True if user has permission, False otherwise
        """
        try:
            # Parse permission string
            if '.' not in permission:
                logger.error(f"Invalid permission format: {permission}")
                return False

            resource, action = permission.split('.', 1)

            # Check direct permission
            if permission_service.check_permission(user, resource, action):
                return True

            # If approval is allowed, check if user can approve for this permission
            if self.allow_approval:
                # For approval permissions, check if user has higher-level access
                # This is a simplified check - in production you might want more granular approval logic
                if permission_service.check_permission(user, resource, 'approve'):
                    return True

            return False

        except Exception as e:
            logger.error(f"Error checking permission {permission} for user {user.id}: {e}")
            return False


# Predefined middleware instances for common use cases
def require_permissions(*permissions: str, require_all: bool = True, allow_approval: bool = False):
    """
    Create a permission-based middleware for specific permissions.

    Args:
        permissions: Variable number of permission strings
        require_all: Whether user needs all permissions or any permission
        allow_approval: Whether to allow approval permissions

    Returns:
        RBAC middleware instance
    """
    return RBACMiddleware(list(permissions), require_all, allow_approval)


def require_any_permission(*permissions: str, allow_approval: bool = False):
    """
    Create middleware requiring ANY of the specified permissions.

    Args:
        permissions: Variable number of permission strings
        allow_approval: Whether to allow approval permissions

    Returns:
        RBAC middleware instance
    """
    return RBACMiddleware(list(permissions), require_all=False, allow_approval=allow_approval)


# Common permission-based middleware instances
require_admin_access = require_permissions('system.admin')
require_user_management = require_permissions('users.view_all', 'users.create', 'users.update')
require_role_management = require_permissions('roles.view_all', 'roles.create', 'roles.assign_permissions')
require_organization_admin = require_permissions('organizations.view_all', 'organizations.update')
require_department_admin = require_permissions('departments.view_all', 'departments.update')
require_process_management = require_permissions('processes.view_all', 'processes.update')
require_bia_management = require_permissions('bia.view_all', 'bia.update', 'bia.approve')
require_gap_assessment = require_permissions('gap_assessment.view_all', 'gap_assessment.update', 'gap_assessment.approve')
require_approval_workflow = require_permissions('approvals.view_all', 'approvals.approve', 'approvals.reject')
require_audit_access = require_permissions('audit.view_all')
require_reports_access = require_permissions('reports.view_all', 'reports.export')

# Hierarchical access patterns
require_management_access = require_any_permission(
    'organizations.view_all', 'departments.view_all', 'users.view_all'
)

require_content_creation = require_any_permission(
    'frameworks.create', 'training.create', 'gap_assessment.create'
)

require_approval_capability = require_permissions(
    'approvals.approve',
    allow_approval=True
)


class ResourceOwnershipMiddleware:
    """
    Middleware for checking resource ownership and access permissions.
    """

    def __init__(self, resource_type: str, allow_department_access: bool = True):
        """
        Initialize resource ownership middleware.

        Args:
            resource_type: Type of resource (e.g., 'user', 'organization', 'bia')
            allow_department_access: Whether department-level users can access resources
        """
        self.resource_type = resource_type
        self.allow_department_access = allow_department_access

    def __call__(self,
                 request: Request,
                 resource_id: Optional[int] = None,
                 permission_service: PermissionService = Depends(get_permission_service)):
        """
        Check resource ownership and access permissions.

        Args:
            request: FastAPI request object
            resource_id: ID of the resource being accessed
            permission_service: Permission checking service

        Returns:
            None or raises HTTPException
        """
        current_user = getattr(request.state, 'user', None)
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )

        # Check if user has general access to this resource type
        view_permission = f"{self.resource_type}.view_all"
        if permission_service.check_permission(current_user, self.resource_type, 'view_all'):
            return  # User has global access

        # Check department-level access if allowed
        if self.allow_department_access:
            dept_view_permission = f"{self.resource_type}.view_department"
            if permission_service.check_permission(current_user, self.resource_type, 'view_department'):
                return  # User has department access

        # Check organization-level access
        org_view_permission = f"{self.resource_type}.view_organization"
        if permission_service.check_permission(current_user, self.resource_type, 'view_organization'):
            return  # User has organization access

        # Check ownership (if resource_id provided and ownership checking implemented)
        # This would require additional logic to check resource ownership

        # If none of the above, deny access
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied to {self.resource_type} resources"
        )


# Resource ownership middleware instances
check_user_resource_access = ResourceOwnershipMiddleware('users')
check_organization_access = ResourceOwnershipMiddleware('organizations')
check_bia_access = ResourceOwnershipMiddleware('bia')
check_gap_assessment_access = ResourceOwnershipMiddleware('gap_assessment')


def get_current_user_permissions(
    request: Request,
    permission_service: PermissionService = Depends(get_permission_service)
) -> dict:
    """
    Get current user's permissions as a dependency.

    Returns:
        Dictionary of user permissions grouped by resource
    """
    current_user = getattr(request.state, 'user', None)
    if not current_user:
        return {}

    return permission_service.get_user_permissions_dict(current_user)


def require_elevated_access(min_hierarchy_level: int = 4):
    """
    Require user to have a minimum hierarchy level.

    Args:
        min_hierarchy_level: Minimum required hierarchy level

    Returns:
        Middleware function
    """
    def middleware(
        request: Request,
        permission_service: PermissionService = Depends(get_permission_service)
    ):
        current_user = getattr(request.state, 'user', None)
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )

        user_roles = permission_service.get_user_roles(current_user)
        if not user_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No roles assigned"
            )

        max_level = max(role.hierarchy_level for role in user_roles)
        if max_level < min_hierarchy_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires hierarchy level {min_hierarchy_level} or higher"
            )

    return middleware


# Elevated access middleware instances
require_department_level = require_elevated_access(4)  # Department Head and above
require_organization_level = require_elevated_access(5)  # Organization Head and above
require_admin_level = require_elevated_access(6)  # System Admin only
