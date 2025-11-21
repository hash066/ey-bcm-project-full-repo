"""
SQLAlchemy models for RBAC (Role-Based Access Control).
"""
from datetime import datetime, timezone
from enum import Enum as PyEnum
from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Table, Enum,
    Boolean, Text, UniqueConstraint
)
from sqlalchemy.orm import relationship

from app.db.postgres import Base  # Assuming you have a Base from SQLAlchemy

# Define enums for role types
class RoleType(str, PyEnum):
    ADMIN = "ADMIN"
    CEO = "CEO"
    REPORTEE = "REPORTEE"
    SUB_REPORTEE = "SUB_REPORTEE"
    CXO = "CXO"
    PROJECT_SPONSOR = "PROJECT_SPONSOR"
    CLIENT_HEAD = "CLIENT_HEAD"
    BCM_COORDINATOR = "BCM_COORDINATOR"
    DEPARTMENT_HEAD = "DEPARTMENT_HEAD"
    SUBDEPT_HEAD = "SUBDEPT_HEAD"
    PROCESS_OWNER = "PROCESS_OWNER"

# Define User model first to avoid circular dependencies
class User(Base):
    """User model for authentication and role assignment"""
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Foreign keys
    client_id = Column(Integer, ForeignKey('clients.id'), nullable=True)
    
    # Relationships - these will be populated by the other models
    roles = relationship('Role', secondary='user_roles', 
                       primaryjoin="User.id == user_roles.c.user_id",
                       secondaryjoin="Role.id == user_roles.c.role_id",
                       back_populates='users')
    client = relationship('Client', back_populates='users', foreign_keys=[client_id])
    departments_headed = relationship('Department', foreign_keys='Department.head_user_id', back_populates='head')
    subdepartments_headed = relationship('SubDepartment', foreign_keys='SubDepartment.head_user_id', back_populates='head')
    processes_owned = relationship('Process', foreign_keys='Process.owner_user_id', back_populates='owner')

# Association table for many-to-many relationship between User and Role
user_roles = Table(
    'user_roles',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    Column('role_id', Integer, ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True),
    Column('assigned_by', Integer, ForeignKey('users.id'), nullable=True),
    Column('assigned_at', DateTime, default=lambda: datetime.now(timezone.utc)),
    Column('valid_until', DateTime, nullable=True),
)

class Role(Base):
    """Role model representing different access levels in the system."""
    __tablename__ = 'roles'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    type = Column(Enum(RoleType), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    permissions = relationship('Permission', secondary='role_permissions', back_populates='roles')
    users = relationship('User', secondary=user_roles, 
                       primaryjoin="Role.id == user_roles.c.role_id",
                       secondaryjoin="User.id == user_roles.c.user_id",
                       back_populates='roles')
    client_id = Column(Integer, ForeignKey('clients.id', ondelete='CASCADE'), nullable=True)
    client = relationship('Client', back_populates='roles')

class Permission(Base):
    """Permission model representing actions that can be performed."""
    __tablename__ = 'permissions'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    resource = Column(String(100), nullable=False)
    action = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    roles = relationship('Role', secondary='role_permissions', back_populates='permissions')

# Association table for many-to-many relationship between Role and Permission
role_permissions = Table(
    'role_permissions',
    Base.metadata,
    Column('role_id', Integer, ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True),
    Column('permission_id', Integer, ForeignKey('permissions.id', ondelete='CASCADE'), primary_key=True),
)

class Client(Base):
    """Client/Organization model."""
    __tablename__ = 'clients'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    license_start = Column(DateTime, nullable=False)
    license_end = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    sponsor_name= Column(String(100), nullable=False)
    sponsor_email= Column(String(100), nullable=False)
    sponsor_phoneno= Column(String(20), nullable=False)
    
    # New role columns for the hierarchy
    ceo_user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    reportee_user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    sub_reportee_user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    cxo_user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    project_sponsor_user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    client_head_user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    bcm_coordinator_user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    
    # Relationships
    departments = relationship('Department', back_populates='client', cascade='all, delete-orphan')
    users = relationship('User', back_populates='client', primaryjoin="Client.id == User.client_id")
    roles = relationship('Role', back_populates='client', cascade='all, delete-orphan')
    
    # New role relationships
    ceo = relationship('User', foreign_keys=[ceo_user_id])
    reportee = relationship('User', foreign_keys=[reportee_user_id])
    sub_reportee = relationship('User', foreign_keys=[sub_reportee_user_id])
    cxo = relationship('User', foreign_keys=[cxo_user_id])
    project_sponsor = relationship('User', foreign_keys=[project_sponsor_user_id])
    client_head = relationship('User', foreign_keys=[client_head_user_id])
    bcm_coordinator = relationship('User', foreign_keys=[bcm_coordinator_user_id])
    
    def is_license_valid(self):
        """Check if the client license is still valid."""
        now = datetime.now(timezone.utc)
        return self.is_active and self.license_start <= now <= self.license_end

class Department(Base):
    """Department model within a client organization."""
    __tablename__ = 'rbac_departments'  # Changed table name to avoid conflict

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    client_id = Column(Integer, ForeignKey('clients.id', ondelete='CASCADE'), nullable=False)
    head_user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    client = relationship('Client', back_populates='departments')
    head = relationship('User', foreign_keys=[head_user_id])
    subdepartments = relationship('SubDepartment', back_populates='department', cascade='all, delete-orphan')
    
    __table_args__ = (
        UniqueConstraint('client_id', 'name', name='rbac_uq_department_client_name'),
    )

class SubDepartment(Base):
    """Sub-department model within a department."""
    __tablename__ = 'rbac_subdepartments'  # Changed table name to avoid conflict

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    department_id = Column(Integer, ForeignKey('rbac_departments.id', ondelete='CASCADE'), nullable=False)
    head_user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    department = relationship('Department', back_populates='subdepartments')
    head = relationship('User', foreign_keys=[head_user_id])
    processes = relationship('Process', back_populates='subdepartment', cascade='all, delete-orphan')
    
    __table_args__ = (
        UniqueConstraint('department_id', 'name', name='rbac_uq_subdepartment_department_name'),
    )

class Process(Base):
    """Process model within a sub-department."""
    __tablename__ = 'rbac_processes'  # Changed table name to avoid conflict

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    subdepartment_id = Column(Integer, ForeignKey('rbac_subdepartments.id', ondelete='CASCADE'), nullable=False)
    owner_user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    subdepartment = relationship('SubDepartment', back_populates='processes')
    owner = relationship('User', foreign_keys=[owner_user_id])
    
    __table_args__ = (
        UniqueConstraint('subdepartment_id', 'name', name='rbac_uq_process_subdepartment_name'),
    )
