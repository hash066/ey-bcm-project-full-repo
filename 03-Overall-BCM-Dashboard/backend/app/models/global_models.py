"""
SQLAlchemy models for global tables in the database.
"""
from uuid import uuid4
from sqlalchemy import Column, String, ForeignKey, DateTime, Text, JSON, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.postgres import Base


class GlobalOrganization(Base):
    """
    Organization model representing the top level of the organizational hierarchy.
    """
    __tablename__ = "organization"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(Text, nullable=False)
    head_username = Column(Text, nullable=True)
    sector = Column(Text, nullable=True)
    criticality = Column(Text, nullable=True)
    description = Column(JSONB, nullable=True, default={})  # JSONB field for storing structured organization details (location, purpose, etc.)
    impact_matrix = Column(JSONB, nullable=True, default={})  # JSON object for impact matrix
    licensed_modules = Column(JSONB, nullable=True, default=list)  # List of module IDs that the organization has access to
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Role user IDs - reference users table (from rbac_models)
    ceo_user_id = Column(Text, ForeignKey("users.id"), nullable=True)
    reportee_user_id = Column(Text, ForeignKey("users.id"), nullable=True)
    sub_reportee_user_id = Column(Text, ForeignKey("users.id"), nullable=True)
    cxo_user_id = Column(Text, ForeignKey("users.id"), nullable=True)
    project_sponsor_user_id = Column(Text, ForeignKey("users.id"), nullable=True)
    client_head_user_id = Column(Text, ForeignKey("users.id"), nullable=True)
    bcm_coordinator_user_id = Column(Text, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    departments = relationship("GlobalDepartment", back_populates="organization", cascade="all, delete-orphan")
    module_requests = relationship("ModuleRequest", back_populates="organization", cascade="all, delete-orphan")
    
    # Role user relationships
    ceo_user = relationship("User", foreign_keys=[ceo_user_id])
    reportee_user = relationship("User", foreign_keys=[reportee_user_id])
    sub_reportee_user = relationship("User", foreign_keys=[sub_reportee_user_id])
    cxo_user = relationship("User", foreign_keys=[cxo_user_id])
    project_sponsor_user = relationship("User", foreign_keys=[project_sponsor_user_id])
    client_head_user = relationship("User", foreign_keys=[client_head_user_id])
    bcm_coordinator_user = relationship("User", foreign_keys=[bcm_coordinator_user_id])


class GlobalDepartment(Base):
    """
    Department model representing the second level of the organizational hierarchy.
    """
    __tablename__ = "department"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(Text, nullable=False)
    head_username = Column(Text, nullable=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organization.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    organization = relationship("GlobalOrganization", back_populates="departments")
    subdepartments = relationship("GlobalSubdepartment", back_populates="department", cascade="all, delete-orphan")
    bia_info = relationship("BIADepartmentInfo", back_populates="department", cascade="all, delete-orphan", uselist=False)


class GlobalSubdepartment(Base):
    """
    Subdepartment model representing the third level of the organizational hierarchy.
    """
    __tablename__ = "subdepartment"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(Text, nullable=False)
    head_username = Column(Text, nullable=True)
    department_id = Column(UUID(as_uuid=True), ForeignKey("department.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    department = relationship("GlobalDepartment", back_populates="subdepartments")
    processes = relationship("GlobalProcess", back_populates="subdepartment", cascade="all, delete-orphan")
    bia_info = relationship("BIASubdepartmentInfo", back_populates="subdepartment", cascade="all, delete-orphan", uselist=False)


class GlobalProcess(Base):
    """
    Process model representing the fourth level of the organizational hierarchy.
    """
    __tablename__ = "process"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(Text, nullable=False)
    process_owner = Column(Text, nullable=True)  # AD DS Username
    subdepartment_id = Column(UUID(as_uuid=True), ForeignKey("subdepartment.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    subdepartment = relationship("GlobalSubdepartment", back_populates="processes")
    bia_info = relationship("BIAProcessInfo", back_populates="process", cascade="all, delete-orphan", uselist=False)
    # Make this relationship optional with viewonly=True to avoid errors if the table doesn't exist
    impact_analysis = relationship("ProcessImpactAnalysis", back_populates="process", cascade="all, delete-orphan", uselist=False, viewonly=True)


class ModuleRequest(Base):
    """
    Model for tracking module access requests from users.
    Follows approval pipeline: User -> Client Head & Project Sponsor -> Manual handling
    """
    __tablename__ = "module_requests"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    
    # Request details
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organization.id"), nullable=False)
    module_id = Column(String, nullable=False)  # Module identifier (integer as string)
    module_name = Column(String, nullable=False)  # Human readable module name
    
    # Requester information
    requester_username = Column(String, nullable=False)
    requester_email = Column(String, nullable=True)
    requester_display_name = Column(String, nullable=True)
    request_reason = Column(Text, nullable=True)  # Why they need this module
    
    # Approval workflow
    status = Column(String, nullable=False, default="pending")  # pending, client_head_approved, project_sponsor_approved, approved, rejected, completed
    
    # Client Head approval
    client_head_approved = Column(String, nullable=True)  # null, approved, rejected
    client_head_approved_by = Column(String, nullable=True)  # username who approved/rejected
    client_head_approved_at = Column(DateTime(timezone=True), nullable=True)
    client_head_comments = Column(Text, nullable=True)
    
    # Project Sponsor approval  
    project_sponsor_approved = Column(String, nullable=True)  # null, approved, rejected
    project_sponsor_approved_by = Column(String, nullable=True)  # username who approved/rejected
    project_sponsor_approved_at = Column(DateTime(timezone=True), nullable=True)
    project_sponsor_comments = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    organization = relationship("GlobalOrganization", back_populates="module_requests")


class UserPassword(Base):
    """
    Model for storing user passwords in encrypted format.
    Allows users to change their default passwords and admins to view them.
    """
    __tablename__ = "user_passwords"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    username = Column(String, nullable=False, unique=True, index=True)  # AD DS username - references gap_assessment_users
    encrypted_password = Column(Text, nullable=False)  # AES encrypted password
    is_default_password = Column(String, nullable=False, default="true")  # "true" or "false" - tracks if user changed from default
    password_changed_at = Column(DateTime(timezone=True), nullable=True)  # When user last changed password
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
