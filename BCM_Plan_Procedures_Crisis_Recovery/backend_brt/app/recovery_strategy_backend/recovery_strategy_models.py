"""
SQLAlchemy models for recovery strategies.
"""
import uuid
from sqlalchemy import Column, Text, DateTime, ForeignKey, Boolean, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.postgres import Base

class RecoveryStrategy(Base):
    """
    Represents a recovery strategy for a specific process.
    """
    __tablename__ = "recovery_strategies"
    __table_args__ = {'extend_existing': True}
    
    process_id = Column(UUID(as_uuid=True), ForeignKey("bia_process_info.id"), nullable=False, primary_key=True)
    
    # Strategy fields
    people_unavailability_strategy = Column(Text)
    technology_data_unavailability_strategy = Column(Text)
    site_unavailability_strategy = Column(Text)
    third_party_vendors_unavailability_strategy = Column(Text)
    process_vulnerability_strategy = Column(Text)  # NEW
    
    # Reasoning fields
    people_reasoning = Column(Text)
    technology_reasoning = Column(Text)
    site_reasoning = Column(Text)
    vendor_reasoning = Column(Text)
    process_vulnerability_reasoning = Column(Text)  # NEW
    
    # Status fields
    people_status = Column(String(50), default="Not Implemented")
    technology_status = Column(String(50), default="Not Implemented")
    site_status = Column(String(50), default="Not Implemented")
    vendor_status = Column(String(50), default="Not Implemented")
    process_vulnerability_status = Column(String(50), default="Not Implemented")  # NEW
    
    # Configuration fields
    enabled_strategies = Column(String(255), default="people,technology,site,vendor,vulnerability")  # NEW
    
    # AI tracking fields
    ai_generated_sections = Column(Text)  # NEW - JSON string of generated sections
    ai_last_updated = Column(DateTime(timezone=True))  # NEW
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship
    process = relationship("BIAProcessInfo", back_populates="recovery_strategy")


class DepartmentRecoveryConfig(Base):
    """
    Department-level recovery strategy configuration and templates.
    """
    __tablename__ = "department_recovery_config"
    __table_args__ = {'extend_existing': True}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    department_id = Column(UUID(as_uuid=True), ForeignKey("department.id"), nullable=False, unique=True)
    
    # Template fields for each strategy type
    people_template = Column(Text)
    technology_template = Column(Text)
    site_template = Column(Text)
    vendor_template = Column(Text)
    vulnerability_template = Column(Text)
    
    # AI configuration
    enable_ai_generation = Column(Boolean, default=True)
    ai_generation_frequency = Column(String(50), default="on_demand")  # on_demand, daily, weekly
    
    # Strategy enablement
    enabled_strategies = Column(String(255), default="people,technology,site,vendor,vulnerability")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship
    department = relationship("GlobalDepartment", backref="recovery_config")
