"""
Unified RBAC System
Consolidates all role systems into a single, clean architecture.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.postgres import Base

# Standardized role hierarchy - Updated to match your requirements
ROLE_HIERARCHY = {
    'process_owner': 1,        # Process Owners
    'sub_department_head': 2,  # Sub Department Heads
    'department_head': 3,      # Department Heads
    'bcm_coordinator': 4,      # BCM Coordinator
    'ceo': 5,                  # CEO
    'ey_admin': 6              # EY Admin
}

# Individual role constants for easy importing
ROLE_PROCESS_OWNER = 'process_owner'
ROLE_SUB_DEPARTMENT_HEAD = 'sub_department_head'
ROLE_DEPARTMENT_HEAD = 'department_head'
ROLE_BCM_COORDINATOR = 'bcm_coordinator'
ROLE_CEO = 'ceo'
ROLE_EY_ADMIN = 'ey_admin'

class UserRole(Base):
    """Unified user-role assignment table (many-to-many)."""
    __tablename__ = "user_roles_unified"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)  # FK to users.id
    role_name = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    assigned_by = Column(Integer, nullable=True)  # FK to users.id

    # Note: Relationships commented out to avoid conflicts with multiple User models
    # user = relationship("User", foreign_keys=[user_id])
    # assigner = relationship("User", foreign_keys=[assigned_by])

    def __repr__(self):
        return f"<UserRole(user_id={self.user_id}, role={self.role_name}, active={self.is_active})>"


class UnifiedRBACService:
    """Single, unified RBAC service with consistent logic."""

    @staticmethod
    def assign_role(db, user_id: int, role_name: str, assigned_by: int = None) -> UserRole:
        """Assign a role to a user."""
        if role_name not in ROLE_HIERARCHY:
            raise ValueError(f"Invalid role: {role_name}")

        # Check if user already has this role
        existing = db.query(UserRole).filter(
            UserRole.user_id == user_id,
            UserRole.role_name == role_name,
            UserRole.is_active == True
        ).first()

        if existing:
            raise ValueError(f"User already has role: {role_name}")

        # Create assignment
        user_role = UserRole(
            user_id=user_id,
            role_name=role_name,
            assigned_by=assigned_by
        )

        db.add(user_role)
        db.commit()
        db.refresh(user_role)
        return user_role

    @staticmethod
    def revoke_role(db, user_id: int, role_name: str) -> bool:
        """Revoke a role from a user."""
        user_role = db.query(UserRole).filter(
            UserRole.user_id == user_id,
            UserRole.role_name == role_name,
            UserRole.is_active == True
        ).first()

        if not user_role:
            return False

        user_role.is_active = False
        db.commit()
        return True

    @staticmethod
    def get_user_roles(db, user_id: int):
        """Get all active roles for a user."""
        return db.query(UserRole).filter(
            UserRole.user_id == user_id,
            UserRole.is_active == True
        ).all()

    @staticmethod
    def get_users_with_role(db, role_name: str):
        """Get all users with a specific role."""
        return db.query(UserRole).filter(
            UserRole.role_name == role_name,
            UserRole.is_active == True
        ).all()

    @staticmethod
    def user_has_role(db, user_id: int, role_name: str) -> bool:
        """Check if user has a specific role."""
        roles = UnifiedRBACService.get_user_roles(db, user_id)
        return any(role.role_name == role_name for role in roles)

    @staticmethod
    def can_user_approve(db, user_id: int, target_role: str) -> bool:
        """
        Single, consistent approval logic.
        User can approve if their highest role level > target role level.
        """
        user_roles = UnifiedRBACService.get_user_roles(db, user_id)
        if not user_roles:
            return False

        user_max_level = max(ROLE_HIERARCHY[role.role_name] for role in user_roles)
        target_level = ROLE_HIERARCHY.get(target_role, 0)

        return user_max_level > target_level

    @staticmethod
    def get_role_hierarchy():
        """Get the complete role hierarchy."""
        return ROLE_HIERARCHY

    @staticmethod
    def get_available_roles():
        """Get all available role names."""
        return list(ROLE_HIERARCHY.keys())


# Helper functions for easy access
def assign_user_role(db, user_id: int, role_name: str, assigned_by: int = None):
    """Helper function to assign role to user."""
    return UnifiedRBACService.assign_role(db, user_id, role_name, assigned_by)

def revoke_user_role(db, user_id: int, role_name: str):
    """Helper function to revoke role from user."""
    return UnifiedRBACService.revoke_role(db, user_id, role_name)

def get_user_roles(db, user_id: int):
    """Helper function to get user roles."""
    return UnifiedRBACService.get_user_roles(db, user_id)

def get_users_with_role(db, role_name: str):
    """Helper function to get users with specific role."""
    return UnifiedRBACService.get_users_with_role(db, role_name)

def user_has_role(db, user_id: int, role_name: str) -> bool:
    """Check if user has a specific role."""
    return UnifiedRBACService.user_has_role(db, user_id, role_name)

def user_can_approve(db, user_id: int, target_role: str) -> bool:
    """Check if user can approve for a target role."""
    return UnifiedRBACService.can_user_approve(db, user_id, target_role)
