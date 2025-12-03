"""
RBAC Service - Database-driven permission and role management.
Unified permission engine for the RBAC system.
"""

from typing import List, Optional, Dict, Any, Set
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.db.postgres import get_db
from app.models.role import Role, Permission, UserRole, RolePermission, AuditLog
from app.models import User
import logging

logger = logging.getLogger(__name__)


class PermissionService:
    """Database-driven permission checking service."""

    def __init__(self, db: Session):
        self.db = db

    def check_permission(self, user: User, resource: str, action: str) -> bool:
        """
        Check if user has permission for a specific resource and action.

        Args:
            user: User object
            resource: Resource name (e.g., 'users', 'bia', 'approvals')
            action: Action name (e.g., 'view', 'create', 'update', 'delete')

        Returns:
            True if user has permission, False otherwise
        """
        if not user:
            return False

        # Check if user is active (avoid SQLAlchemy column comparison)
        if hasattr(user, 'is_active') and user.is_active is False:
            return False

        # Get all active roles for the user
        user_roles = self.db.query(UserRole).filter(
            and_(
                UserRole.user_id == user.id,
                UserRole.is_active == True
            )
        ).all()

        if not user_roles:
            logger.warning(f"User {user.id} has no active roles")
            return False

        role_ids = [ur.role_id for ur in user_roles]

        # Check if any of the user's roles has the required permission
        permission_exists = self.db.query(RolePermission).filter(
            and_(
                RolePermission.role_id.in_(role_ids),
                RolePermission.permission_id.in_(
                    self.db.query(Permission.id).filter(
                        and_(
                            Permission.resource == resource,
                            Permission.action == action
                        )
                    )
                )
            )
        ).first()

        has_permission = permission_exists is not None

        # Log permission check for security monitoring
        if not has_permission:
            logger.info(f"Permission denied: user={user.id}, resource={resource}, action={action}")

        return has_permission

    def get_user_permissions(self, user: User) -> List[Permission]:
        """
        Get all permissions for a user.

        Args:
            user: User object

        Returns:
            List of Permission objects
        """
        if not user or not user.is_active:
            return []

        # Get all active roles for the user
        user_roles = self.db.query(UserRole).filter(
            and_(
                UserRole.user_id == user.id,
                UserRole.is_active == True
            )
        ).all()

        if not user_roles:
            return []

        role_ids = [ur.role_id for ur in user_roles]

        # Get all permissions for these roles
        permissions = self.db.query(Permission).filter(
            Permission.id.in_(
                self.db.query(RolePermission.permission_id).filter(
                    RolePermission.role_id.in_(role_ids)
                )
            )
        ).all()

        return permissions

    def get_user_permissions_dict(self, user: User) -> Dict[str, List[str]]:
        """
        Get user permissions as a dictionary grouped by resource.

        Args:
            user: User object

        Returns:
            Dict with resource names as keys and list of actions as values
        """
        permissions = self.get_user_permissions(user)
        result = {}

        for perm in permissions:
            if perm.resource not in result:
                result[perm.resource] = []
            result[perm.resource].append(perm.action)

        return result

    def has_role(self, user: User, role_name: str) -> bool:
        """
        Check if user has a specific role.

        Args:
            user: User object
            role_name: Name of the role to check

        Returns:
            True if user has the role, False otherwise
        """
        if not user or not user.is_active:
            return False

        role_exists = self.db.query(UserRole).filter(
            and_(
                UserRole.user_id == user.id,
                UserRole.role_id.in_(
                    self.db.query(Role.id).filter(Role.name == role_name)
                ),
                UserRole.is_active == True
            )
        ).first()

        return role_exists is not None

    def get_user_roles(self, user: User) -> List[Role]:
        """
        Get all active roles for a user.

        Args:
            user: User object

        Returns:
            List of Role objects
        """
        if not user or not user.is_active:
            return []

        roles = self.db.query(Role).filter(
            Role.id.in_(
                self.db.query(UserRole.role_id).filter(
                    and_(
                        UserRole.user_id == user.id,
                        UserRole.is_active == True
                    )
                )
            )
        ).all()

        return roles

    def can_user_approve(self, user: User, target_user: User = None, target_role: str = None) -> bool:
        """
        DEPRECATED: Use app.models.unified_rbac.user_can_approve() instead.
        Check if user can approve requests for another user or role.
        """
        if not user or not user.is_active:
            return False

        # Redirect to unified RBAC system
        from app.models.unified_rbac import user_can_approve as unified_can_approve

        if target_role:
            # Check if user can approve for a specific role
            return unified_can_approve(self.db, user.id, target_role)

        if target_user:
            # Check if user can approve for another user's roles
            # Get target user's highest role and check if current user can approve it
            target_roles = self.get_user_roles(target_user)
            if target_roles:
                # Find the highest level role the target user has
                target_max_level = max(role.hierarchy_level for role in target_roles)
                # Map hierarchy level back to role name for unified system
                role_level_map = {role.hierarchy_level: role.name for role in self.db.query(Role).all()}
                target_role_name = role_level_map.get(target_max_level)
                if target_role_name:
                    return unified_can_approve(self.db, user.id, target_role_name)

        return False


class RoleService:
    """Role management service."""

    def __init__(self, db: Session):
        self.db = db

    def assign_role(self, user: User, role: Role, assigned_by: User) -> UserRole:
        """
        Assign a role to a user.

        Args:
            user: User to assign role to
            role: Role to assign
            assigned_by: User performing the assignment

        Returns:
            UserRole object

        Raises:
            ValueError: If role is already assigned
        """
        # Check if user already has this role
        existing = self.db.query(UserRole).filter(
            and_(
                UserRole.user_id == user.id,
                UserRole.role_id == role.id,
                UserRole.is_active == True
            )
        ).first()

        if existing:
            raise ValueError(f"User {user.id} already has role {role.name}")

        # Create new user-role assignment
        user_role = UserRole(
            user_id=user.id,
            role_id=role.id,
            assigned_by=assigned_by.id if assigned_by else None
        )

        self.db.add(user_role)
        self.db.commit()
        self.db.refresh(user_role)

        # Log the assignment
        audit_log = AuditLog(
            user_id=assigned_by.id if assigned_by else None,
            action="role_assigned",
            resource_type="user_role",
            resource_id=user_role.id,
            new_values=f"Assigned role {role.name} to user {user.email}",
            ip_address=None,  # Would be populated from request context
            user_agent=None
        )
        self.db.add(audit_log)
        self.db.commit()

        logger.info(f"Role {role.name} assigned to user {user.email} by {assigned_by.email if assigned_by else 'system'}")

        return user_role

    def revoke_role(self, user: User, role: Role, revoked_by: User) -> bool:
        """
        Revoke a role from a user.

        Args:
            user: User to revoke role from
            role: Role to revoke
            revoked_by: User performing the revocation

        Returns:
            True if role was revoked, False if not found
        """
        user_role = self.db.query(UserRole).filter(
            and_(
                UserRole.user_id == user.id,
                UserRole.role_id == role.id,
                UserRole.is_active == True
            )
        ).first()

        if not user_role:
            return False

        # Mark as inactive instead of deleting for audit trail
        user_role.is_active = False
        self.db.commit()

        # Log the revocation
        audit_log = AuditLog(
            user_id=revoked_by.id if revoked_by else None,
            action="role_revoked",
            resource_type="user_role",
            resource_id=user_role.id,
            old_values=f"Revoked role {role.name} from user {user.email}",
            ip_address=None,
            user_agent=None
        )
        self.db.add(audit_log)
        self.db.commit()

        logger.info(f"Role {role.name} revoked from user {user.email} by {revoked_by.email if revoked_by else 'system'}")

        return True

    def get_role_by_name(self, role_name: str) -> Optional[Role]:
        """
        Get role by name.

        Args:
            role_name: Name of the role

        Returns:
            Role object or None if not found
        """
        return self.db.query(Role).filter(Role.name == role_name).first()

    def get_all_roles(self) -> List[Role]:
        """
        Get all roles.

        Returns:
            List of all Role objects
        """
        return self.db.query(Role).order_by(Role.hierarchy_level).all()

    def create_role(self, name: str, display_name: str, hierarchy_level: int,
                   description: str = None, created_by: User = None) -> Role:
        """
        Create a new role.

        Args:
            name: Role name (unique)
            display_name: Human-readable name
            hierarchy_level: Hierarchy level (1-6)
            description: Optional description
            created_by: User creating the role

        Returns:
            Created Role object
        """
        # Check if role name already exists
        existing = self.db.query(Role).filter(Role.name == name).first()
        if existing:
            raise ValueError(f"Role with name '{name}' already exists")

        role = Role(
            name=name,
            display_name=display_name,
            hierarchy_level=hierarchy_level,
            description=description,
            is_system_role=False
        )

        self.db.add(role)
        self.db.commit()
        self.db.refresh(role)

        # Log role creation
        audit_log = AuditLog(
            user_id=created_by.id if created_by else None,
            action="role_created",
            resource_type="role",
            resource_id=role.id,
            new_values=f"Created role {role.name} with level {hierarchy_level}",
            ip_address=None,
            user_agent=None
        )
        self.db.add(audit_log)
        self.db.commit()

        logger.info(f"Role {role.name} created by {created_by.email if created_by else 'system'}")

        return role


class AuditService:
    """Audit logging service for security and compliance."""

    def __init__(self, db: Session):
        self.db = db

    def log_action(self, user: User, action: str, resource_type: str,
                  resource_id: int = None, old_values: dict = None,
                  new_values: dict = None, ip_address: str = None,
                  user_agent: str = None) -> AuditLog:
        """
        Log an action for audit purposes.

        Args:
            user: User performing the action
            action: Action performed (e.g., 'login', 'create', 'update')
            resource_type: Type of resource (e.g., 'user', 'role', 'bia')
            resource_id: ID of the resource (optional)
            old_values: Previous values (optional)
            new_values: New values (optional)
            ip_address: Client IP address (optional)
            user_agent: Client user agent (optional)

        Returns:
            Created AuditLog object
        """
        audit_log = AuditLog(
            user_id=user.id if user else None,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            old_values=str(old_values) if old_values else None,
            new_values=str(new_values) if new_values else None,
            ip_address=ip_address,
            user_agent=user_agent
        )

        self.db.add(audit_log)
        self.db.commit()
        self.db.refresh(audit_log)

        logger.info(f"Audit log: {action} on {resource_type} by user {user.id if user else 'anonymous'}")

        return audit_log

    def get_audit_logs(self, user_id: int = None, resource_type: str = None,
                      action: str = None, limit: int = 100) -> List[AuditLog]:
        """
        Get audit logs with optional filtering.

        Args:
            user_id: Filter by user ID
            resource_type: Filter by resource type
            action: Filter by action
            limit: Maximum number of logs to return

        Returns:
            List of AuditLog objects
        """
        query = self.db.query(AuditLog)

        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        if resource_type:
            query = query.filter(AuditLog.resource_type == resource_type)
        if action:
            query = query.filter(AuditLog.action == action)

        return query.order_by(AuditLog.created_at.desc()).limit(limit).all()


class RBACService:
    """Unified RBAC Service that combines all RBAC functionality."""

    @staticmethod
    def get_users(db: Session, skip: int = 0, limit: int = 100):
        """Get all users with pagination."""
        from app.models import User
        return db.query(User).offset(skip).limit(limit).all()

    @staticmethod
    def create_user(db: Session, user_data: dict):
        """Create a new user."""
        from app.models import User
        user = User(**user_data)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def get_user_by_username(db: Session, username: str):
        """Get a user by username."""
        from app.models import User
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def create_client(db, name: str, description: str = None, license_days: int = 365,
                     sponsor_name: str = None, sponsor_email: str = None, sponsor_phoneno: str = None):
        """Create a new client."""
        # This would need to be implemented based on your Client model
        # For now, return a placeholder
        return {"message": "Client creation not implemented yet"}

    @staticmethod
    def get_clients(db: Session, skip: int = 0, limit: int = 100):
        """Get all clients."""
        # This would need to be implemented based on your Client model
        return []

    @staticmethod
    def get_client(db: Session, client_id: int):
        """Get a client by ID."""
        # This would need to be implemented based on your Client model
        return None

    @staticmethod
    def create_department(db: Session, client_id: int, department_data: dict):
        """Create a new department."""
        # This would need to be implemented based on your Department model
        return type('Department', (), {'id': 1, 'name': department_data.get('name', 'New Department')})()

    @staticmethod
    def create_subdepartment(db: Session, department_id: int, subdepartment_data: dict):
        """Create a new subdepartment."""
        # This would need to be implemented based on your SubDepartment model
        return type('SubDepartment', (), {'id': 1, 'name': subdepartment_data.get('name', 'New SubDepartment')})()

    @staticmethod
    def assign_role(db: Session, user_id: int, role_id: int, assigned_by: int, valid_until=None):
        """Assign a role to a user."""
        role_service = RoleService(db)
        from app.models import User
        user = db.query(User).filter(User.id == user_id).first()
        role = db.query(Role).filter(Role.id == role_id).first()
        assigner = db.query(User).filter(User.id == assigned_by).first() if assigned_by else None

        if user and role:
            return role_service.assign_role(user, role, assigner)
        return None

    @staticmethod
    def get_user_roles(db: Session, user_id: int):
        """Get all roles for a user."""
        permission_service = PermissionService(db)
        from app.models import User
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            return permission_service.get_user_roles(user)
        return []

    @staticmethod
    def check_user_permission(db: Session, user_id: int, resource: str, action: str) -> bool:
        """Check if user has permission."""
        permission_service = PermissionService(db)
        from app.models import User
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            return permission_service.check_permission(user, resource, action)
        return False

    @staticmethod
    def setup_default_permissions(db: Session):
        """Setup default permissions."""
        # This would need to be implemented
        return []

    @staticmethod
    def setup_default_roles(db: Session, permissions):
        """Setup default roles."""
        # This would need to be implemented
        return []


# Dependency functions for FastAPI
def get_permission_service(db: Session = get_db()) -> PermissionService:
    """Get PermissionService instance."""
    return PermissionService(db)


def get_role_service(db: Session = get_db()) -> RoleService:
    """Get RoleService instance."""
    return RoleService(db)


def get_audit_service(db: Session = get_db()) -> AuditService:
    """Get AuditService instance."""
    return AuditService(db)
