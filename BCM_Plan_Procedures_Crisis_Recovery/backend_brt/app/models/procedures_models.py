"""
SQLAlchemy models for the Procedures module.
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.postgres import Base

class ProcedureDocument(Base):
    """
    Model for storing procedure documents.
    """
    __tablename__ = "procedure_documents"

    id = Column(Integer, primary_key=True, index=True)
    procedure_type = Column(String(50), nullable=False, index=True)  # 'bia', 'risk_assessment', 'bcm_plan'
    organization_id = Column(Integer, nullable=False, index=True)
    
    # Document metadata
    document_name = Column(String(255), nullable=False)
    document_owner = Column(String(255), nullable=False)
    document_version_no = Column(String(50), nullable=False)
    document_version_date = Column(String(50), nullable=False)
    prepared_by = Column(String(255), nullable=False)
    reviewed_by = Column(String(255), nullable=False)
    approved_by = Column(String(255), nullable=False)
    
    # Content settings
    use_llm_content = Column(Boolean, default=False, nullable=False)
    llm_content = Column(JSON, nullable=True)  # Store LLM-generated content as JSON
    custom_content = Column(JSON, nullable=True)  # Store custom content overrides as JSON
    
    # Audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    created_by = Column(Integer, nullable=False)
    updated_by = Column(Integer, nullable=True)
    
    # Relationships
    change_log_entries = relationship("ProcedureChangeLog", back_populates="procedure_document", cascade="all, delete-orphan")

class ProcedureChangeLog(Base):
    """
    Model for storing procedure document change log entries.
    """
    __tablename__ = "procedure_change_log"

    id = Column(Integer, primary_key=True, index=True)
    procedure_document_id = Column(Integer, ForeignKey("procedure_documents.id"), nullable=False)
    
    # Change log fields
    sr_no = Column(Integer, nullable=False)
    version_no = Column(String(50), nullable=False)
    approval_date = Column(String(50), nullable=True)
    description_of_change = Column(Text, nullable=False)
    reviewed_by = Column(String(255), nullable=False)
    approved_by = Column(String(255), nullable=False)
    
    # Audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_by = Column(Integer, nullable=False)
    
    # Relationships
    procedure_document = relationship("ProcedureDocument", back_populates="change_log_entries")

class ProcedureTemplate(Base):
    """
    Model for storing procedure templates.
    """
    __tablename__ = "procedure_templates"

    id = Column(Integer, primary_key=True, index=True)
    procedure_type = Column(String(50), nullable=False, index=True)
    template_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Template content
    default_document_info = Column(JSON, nullable=False)  # Default document information
    sections = Column(JSON, nullable=False)  # Template sections
    default_content = Column(JSON, nullable=True)  # Default content for sections
    
    # Template settings
    is_active = Column(Boolean, default=True, nullable=False)
    version = Column(String(50), nullable=False, default="1.0")
    
    # Audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    created_by = Column(Integer, nullable=False)
    updated_by = Column(Integer, nullable=True)

class LLMContentCache(Base):
    """
    Model for caching LLM-generated content to improve performance.
    """
    __tablename__ = "llm_content_cache"

    id = Column(Integer, primary_key=True, index=True)
    content_type = Column(String(100), nullable=False, index=True)  # 'introduction', 'scope', etc.
    procedure_type = Column(String(50), nullable=False, index=True)
    organization_id = Column(Integer, nullable=False, index=True)
    
    # Content
    content_key = Column(String(255), nullable=False, index=True)  # Hash of input parameters
    generated_content = Column(JSON, nullable=False)  # The generated content
    
    # Cache metadata
    generation_parameters = Column(JSON, nullable=True)  # Parameters used for generation
    expires_at = Column(DateTime(timezone=True), nullable=True)  # Cache expiration
    
    # Audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_by = Column(Integer, nullable=False)

class ProcedureExport(Base):
    """
    Model for tracking procedure document exports.
    """
    __tablename__ = "procedure_exports"

    id = Column(Integer, primary_key=True, index=True)
    procedure_document_id = Column(Integer, ForeignKey("procedure_documents.id"), nullable=False)
    
    # Export details
    export_format = Column(String(50), nullable=False)  # 'pdf', 'docx', 'html'
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=True)
    
    # Export settings
    include_llm_content = Column(Boolean, default=True, nullable=False)
    custom_styling = Column(JSON, nullable=True)
    
    # Status and metadata
    status = Column(String(50), default="pending", nullable=False)  # 'pending', 'completed', 'failed'
    download_count = Column(Integer, default=0, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_by = Column(Integer, nullable=False)
    
    # Relationships
    procedure_document = relationship("ProcedureDocument")