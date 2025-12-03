"""
SQLAlchemy models for crisis management module.
"""
from uuid import uuid4
from sqlalchemy import Column, String, ForeignKey, DateTime, Text, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.postgres import Base


class CrisisTemplate(Base):
    """
    Model for storing crisis management templates uploaded by users.
    """
    __tablename__ = "crisis_template"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organization.id", ondelete="CASCADE"), nullable=False)
    name = Column(Text, nullable=False)
    file_path = Column(Text, nullable=False)  # Path to the file in Supabase storage
    file_size = Column(Integer, nullable=False)
    content_type = Column(Text, nullable=False)
    extracted_text = Column(Text, nullable=True)  # Full text extracted from PDF
    missing_fields = Column(JSONB, nullable=True)  # Fields that need to be filled by the user
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    organization = relationship("GlobalOrganization")
    crisis_plans = relationship("CrisisPlan", back_populates="template", cascade="all, delete-orphan")


class CrisisPlan(Base):
    """
    Model for storing generated crisis management plans.
    """
    __tablename__ = "crisis_plan"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    template_id = Column(UUID(as_uuid=True), ForeignKey("crisis_template.id", ondelete="CASCADE"), nullable=False)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organization.id", ondelete="CASCADE"), nullable=False)
    name = Column(Text, nullable=False)
    file_path = Column(Text, nullable=True)  # Path to the generated PDF in Supabase storage
    status = Column(Text, nullable=False, default="draft")  # draft, published, archived
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    template = relationship("CrisisTemplate", back_populates="crisis_plans")
    organization = relationship("GlobalOrganization")
    sections = relationship("CrisisPlanSection", back_populates="crisis_plan", cascade="all, delete-orphan")


class CrisisPlanSection(Base):
    """
    Model for storing individual sections of a crisis management plan.
    """
    __tablename__ = "crisis_plan_section"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    crisis_plan_id = Column(UUID(as_uuid=True), ForeignKey("crisis_plan.id", ondelete="CASCADE"), nullable=False)
    heading = Column(Text, nullable=False)
    content = Column(Text, nullable=True)
    order = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    crisis_plan = relationship("CrisisPlan", back_populates="sections")


class CrisisCommunicationPlan(Base):
    """
    Model for storing crisis communication plans.
    """
    __tablename__ = "crisis_communication_plan"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    crisis_plan_id = Column(UUID(as_uuid=True), ForeignKey("crisis_plan.id", ondelete="CASCADE"), nullable=False)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organization.id", ondelete="CASCADE"), nullable=False)
    file_path = Column(Text, nullable=True)  # Path to the generated PDF in Supabase storage
    media_statement = Column(Text, nullable=True)
    faq = Column(JSONB, nullable=True)  # List of FAQs and answers
    stakeholder_communications = Column(JSONB, nullable=True)  # Communication plans for different stakeholders
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    crisis_plan = relationship("CrisisPlan")
    organization = relationship("GlobalOrganization")
