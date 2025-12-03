"""
UNIFIED RBAC MODELS - Complete Role-Based Access Control System
Replaces the old RBAC models with the new comprehensive system.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from app.db.postgres import Base

# Define User model for backward compatibility
class User(Base):
    """User model for authentication and role assignment."""
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

# Import the new unified RBAC models
from app.models.role import (
    Role, Permission, UserRole, RolePermission, AuditLog
)

# Re-export for backward compatibility
__all__ = [
    'User', 'Role', 'Permission', 'UserRole', 'RolePermission', 'AuditLog'
]
