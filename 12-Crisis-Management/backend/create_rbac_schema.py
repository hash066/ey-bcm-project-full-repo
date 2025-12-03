"""
Script to create RBAC tables directly in a SQLite database.
"""
import os
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Table, create_engine, Enum,
    Boolean, Text, UniqueConstraint, MetaData
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker

# Create a local SQLite database in the project directory
DB_PATH = os.path.join(os.path.dirname(__file__), 'rbac_schema.db')
LOCAL_DB_URL = f"sqlite:///{DB_PATH}"

# Create a new engine for the local database
engine = create_engine(LOCAL_DB_URL)
Base = declarative_base()
metadata = MetaData()

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
    Column('assigned_at', DateTime, default=datetime.utcnow),
    Column('assigned_by', Integer, ForeignKey('users.id')),
    Column('is_active', Boolean, default=True),
    Column('valid_from', DateTime, default=datetime.utcnow),
    Column('valid_until', DateTime, nullable=True)
)

# Association table for many-to-many relationship between Role and Permission
role_permissions = Table(
    'role_permissions',
    Base.metadata,
    Column('role_id', Integer, ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True),
    Column('permission_id', Integer, ForeignKey('permissions.id', ondelete='CASCADE'), primary_key=True)
)

# Define a placeholder User model just to satisfy foreign key relationships
class User(Base):
    """Placeholder User model."""
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    client_id = Column(Integer, ForeignKey('clients.id', ondelete='SET NULL'), nullable=True)
    
    # Relationships
    client = relationship('Client', back_populates='users')
    roles = relationship('Role', secondary=user_roles, back_populates='users')
    
    # Head relationships
    managed_departments = relationship('Department', foreign_keys='Department.head_user_id', back_populates='head')
    managed_subdepartments = relationship('SubDepartment', foreign_keys='SubDepartment.head_user_id', back_populates='head')
    owned_processes = relationship('Process', foreign_keys='Process.owner_user_id', back_populates='owner')

class Role(Base):
    """Role model representing different access levels in the system."""
    __tablename__ = 'roles'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)  # e.g., 'admin', 'client_head'
    type = Column(String(20), nullable=False)  # Using String instead of Enum for SQLite compatibility
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    permissions = relationship('Permission', secondary=role_permissions, back_populates='roles')
    users = relationship('User', secondary=user_roles, back_populates='roles')
    
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
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    roles = relationship('Role', secondary=role_permissions, back_populates='permissions')

class Client(Base):
    """Client/Organization model."""
    __tablename__ = 'clients'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    license_start = Column(DateTime, nullable=False)
    license_end = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    departments = relationship('Department', back_populates='client', cascade='all, delete-orphan')
    users = relationship('User', back_populates='client')
    roles = relationship('Role', back_populates='client', cascade='all, delete-orphan')

class Department(Base):
    """Department model within a client organization."""
    __tablename__ = 'departments'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    client_id = Column(Integer, ForeignKey('clients.id', ondelete='CASCADE'), nullable=False)
    head_user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    client = relationship('Client', back_populates='departments')
    head = relationship('User', foreign_keys=[head_user_id], back_populates='managed_departments')
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
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    department = relationship('Department', back_populates='subdepartments')
    head = relationship('User', foreign_keys=[head_user_id], back_populates='managed_subdepartments')
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
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    subdepartment = relationship('SubDepartment', back_populates='processes')
    owner = relationship('User', foreign_keys=[owner_user_id], back_populates='owned_processes')
    
    # Ensure process name is unique within a subdepartment
    __table_args__ = (
        UniqueConstraint('subdepartment_id', 'name', name='uq_process_subdepartment_name'),
    )

def create_tables():
    """Create all tables in the SQLite database."""
    print(f"Creating RBAC tables in SQLite database: {DB_PATH}")
    
    # Drop existing tables if they exist
    Base.metadata.drop_all(bind=engine)
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    print("Tables created successfully!")
    print(f"You can view the database using an SQLite browser at: {DB_PATH}")

def list_tables():
    """List all tables in the SQLite database."""
    import sqlite3
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    
    print(f"\nRBAC Database Tables:")
    print("=" * 30)
    for idx, table in enumerate(tables, 1):
        print(f"{idx}. {table[0]}")
    
    print("\nTable Schemas:")
    print("=" * 30)
    for table in tables:
        print(f"\nSchema for table '{table[0]}':")
        cursor.execute(f"PRAGMA table_info({table[0]});")
        columns = cursor.fetchall()
        for col in columns:
            print(f"  - {col[1]} ({col[2]}){' PRIMARY KEY' if col[5] else ''}")
    
    conn.close()
    
if __name__ == "__main__":
    create_tables()
    list_tables()
