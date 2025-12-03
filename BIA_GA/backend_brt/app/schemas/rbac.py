from datetime import datetime, timezone
from enum import Enum as PyEnum
from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Table, Enum,
    Boolean, Text, UniqueConstraint
)
from sqlalchemy.orm import relationship

from app.db.postgres import Base  # Assuming you have a Base from SQLAlchemy

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
    client = relationship('Client', back_populates='users')

# Enums for role types
class RoleType(str, PyEnum):
    ADMIN = "admin"
    CLIENT_HEAD = "client_head"
    DEPARTMENT_HEAD = "dept_head"
    SUBDEPT_HEAD = "subdept_head"
    PROCESS_OWNER = "process_owner"

# Association table for many-to-many relationship between User and Role
user_roles = Table(
    'user_roles',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    Column('role_id', Integer, ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True),
    Column('assigned_at', DateTime, default=lambda: datetime.now(timezone.utc)),
    Column('assigned_by', Integer, ForeignKey('users.id')),
    Column('is_active', Boolean, default=True),
    Column('valid_from', DateTime, default=lambda: datetime.now(timezone.utc)),
    Column('valid_until', DateTime, nullable=True)
)

class Role(Base):
    """Role model representing different access levels in the system."""
    __tablename__ = 'roles'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)  # e.g., 'admin', 'client_head'
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
    
    # For client-specific roles
    client_id = Column(Integer, ForeignKey('clients.id', ondelete='CASCADE'), nullable=True)
    client = relationship('Client', back_populates='roles')

class Permission(Base):
    """Permission model representing actions that can be performed."""
    __tablename__ = 'permissions'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)  # e.g., 'create_user', 'view_document'
    description = Column(Text, nullable=True)
    resource = Column(String(100), nullable=False)  # e.g., 'user', 'document', 'process'
    action = Column(String(50), nullable=False)     # e.g., 'create', 'read', 'update', 'delete'
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    roles = relationship('Role', secondary='role_permissions', back_populates='permissions')

# Association table for many-to-many relationship between Role and Permission
role_permissions = Table(
    'role_permissions',
    Base.metadata,
    Column('role_id', Integer, ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True),
    Column('permission_id', Integer, ForeignKey('permissions.id', ondelete='CASCADE'), primary_key=True)
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

    # Relationships
    departments = relationship('Department', back_populates='client', cascade='all, delete-orphan')
    users = relationship('User', back_populates='client')
    roles = relationship('Role', back_populates='client', cascade='all, delete-orphan')

    #validity test
    def is_license_valid(self):
        now=datetime.now()
        return self.license_start<=now<=self.license_end

class Department(Base):
    """Department model within a client organization."""
    __tablename__ = 'departments'
    
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
    
    # Ensure department name is unique within a client
    __table_args__ = (
        UniqueConstraint('client_id', 'name', name='uq_department_client_name'),
    )

class SubDepartment(Base):
    """Sub-department model within a department."""
    __tablename__ = 'subdepartments'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    department_id = Column(Integer, ForeignKey('departments.id', ondelete='CASCADE'), nullable=False)
    head_user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    department = relationship('Department', back_populates='subdepartments')
    head = relationship('User', foreign_keys=[head_user_id])
    processes = relationship('Process', back_populates='subdepartment', cascade='all, delete-orphan')
    
    # Ensure subdepartment name is unique within a department
    __table_args__ = (
        UniqueConstraint('department_id', 'name', name='uq_subdepartment_department_name'),
    )

class Process(Base):
    """Process model within a sub-department."""
    __tablename__ = 'processes'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    subdepartment_id = Column(Integer, ForeignKey('subdepartments.id', ondelete='CASCADE'), nullable=False)
    owner_user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    subdepartment = relationship('SubDepartment', back_populates='processes')
    owner = relationship('User', foreign_keys=[owner_user_id])
    
    # Ensure process name is unique within a subdepartment
    __table_args__ = (
        UniqueConstraint('subdepartment_id', 'name', name='uq_process_subdepartment_name'),
    )

# Add additional relationships to the User model
User.departments_headed = relationship('Department', foreign_keys='Department.head_user_id', back_populates='head')
User.subdepartments_headed = relationship('SubDepartment', foreign_keys='SubDepartment.head_user_id', back_populates='head')
User.processes_owned = relationship('Process', foreign_keys='Process.owner_user_id', back_populates='owner')

def setup_rbac_permissions():
    """Helper function to set up default permissions and roles."""
    # This would be called during application startup to ensure all required permissions exist
    pass

def create_default_roles():
    """Helper function to create default roles if they don't exist."""
    # This would be called during application startup
    pass





