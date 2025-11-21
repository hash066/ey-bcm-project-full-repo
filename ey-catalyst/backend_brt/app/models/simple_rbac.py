"""
Simple RBAC Extension - Multiple Users per Role
Extends the existing gap assessment role system to allow multiple users per role.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.postgres import Base

# DEPRECATED: Use unified RBAC system instead
# Import from unified system for consistency
from app.models.unified_rbac import (
    ROLE_PROCESS_OWNER, ROLE_SUB_DEPARTMENT_HEAD, ROLE_DEPARTMENT_HEAD,
    ROLE_BCM_COORDINATOR, ROLE_CEO, ROLE_EY_ADMIN, ROLE_HIERARCHY
)

# Legacy compatibility
ROLE_ORGANIZATION_HEAD = ROLE_DEPARTMENT_HEAD  # Map to department_head


class UserRole(Base):
    """Simple user-role assignment table for multiple users per role."""
    __tablename__ = "user_roles_simple"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("gap_assessment_users.id"), nullable=False)
    role_name = Column(String(50), nullable=False)  # Use role name instead of ID
    assigned_by = Column(Integer, ForeignKey("gap_assessment_users.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    assigner = relationship("User", foreign_keys=[assigned_by])

    def __repr__(self):
        return f"<UserRole(user_id={self.user_id}, role={self.role_name}, active={self.is_active})>"


class RoleService:
    """Simple service for managing user-role assignments."""

    @staticmethod
    def assign_role(db, user_id: int, role_name: str, assigned_by: int = None) -> UserRole:
        """Assign a role to a user."""
        # Validate role exists
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
    def get_users_by_role(db, role_name: str):
        """Get all users with a specific role."""
        return db.query(UserRole).filter(
            UserRole.role_name == role_name,
            UserRole.is_active == True
        ).all()

    @staticmethod
    def get_all_roles():
        """Get all available roles."""
        return list(ROLE_HIERARCHY.keys())

    @staticmethod
    def get_role_hierarchy():
        """Get role hierarchy."""
        return ROLE_HIERARCHY


# Helper functions for easy access
def assign_user_role(db, user_id: int, role_name: str, assigned_by: int = None):
    """Helper function to assign role to user."""
    return RoleService.assign_role(db, user_id, role_name, assigned_by)


def revoke_user_role(db, user_id: int, role_name: str):
    """Helper function to revoke role from user."""
    return RoleService.revoke_role(db, user_id, role_name)


def get_user_roles(db, user_id: int):
    """Helper function to get user roles."""
    return RoleService.get_user_roles(db, user_id)


def get_users_with_role(db, role_name: str):
    """Helper function to get users with specific role."""
    return RoleService.get_users_by_role(db, role_name)


def user_has_role(db, user_id: int, role_name: str) -> bool:
    """Check if user has a specific role."""
    roles = get_user_roles(db, user_id)
    return any(role.role_name == role_name for role in roles)


# DEPRECATED: Use app.models.unified_rbac.user_can_approve instead
def user_can_approve(db, user_id: int, target_role: str) -> bool:
    """DEPRECATED: Use unified RBAC system instead."""
    from app.models.unified_rbac import user_can_approve as unified_can_approve
    return unified_can_approve(db, user_id, target_role)
