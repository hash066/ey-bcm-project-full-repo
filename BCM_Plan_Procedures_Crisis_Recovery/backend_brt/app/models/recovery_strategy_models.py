"""
SQLAlchemy models for recovery strategies.
"""
import uuid
from sqlalchemy import Column, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.postgres import Base
from app.db.postgres import SQLALCHEMY_DATABASE_URL
from sqlalchemy import String

UUID_TYPE = UUID(as_uuid=True) if not SQLALCHEMY_DATABASE_URL.startswith('sqlite') else String(36)

class DepartmentRecoveryConfig(Base):
    """
    Configuration for recovery strategies at department level.
    Changes here cascade to all processes in the department.
    """
    __tablename__ = "department_recovery_config"
    __table_args__ = {'extend_existing': True}
    
    department_id = Column(UUID_TYPE, ForeignKey("department.id"), nullable=False, primary_key=True)
    
    # Strategy configuration
    default_enabled_strategies = Column(Text, default="people,technology,site,vendor,process_vulnerability")
    
    # Department-level strategy templates
    people_strategy_template = Column(Text)
    technology_strategy_template = Column(Text)
    site_strategy_template = Column(Text)
    vendor_strategy_template = Column(Text)
    process_vulnerability_strategy_template = Column(Text)
    
    # AI generation settings
    enable_ai_generation = Column(Boolean, default=True)
    ai_generation_frequency = Column(Text, default="weekly")  # daily, weekly, monthly, manual
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    department = relationship("GlobalDepartment")

class RecoveryStrategy(Base):
    """
    Represents a recovery strategy for a specific process.
    """
    __tablename__ = "recovery_strategies"
    __table_args__ = {'extend_existing': True}

    process_id = Column(UUID_TYPE, ForeignKey("bia_process_info.id"), nullable=False, primary_key=True)
    people_unavailability_strategy = Column(Text)
    technology_data_unavailability_strategy = Column(Text)
    site_unavailability_strategy = Column(Text)
    third_party_vendors_unavailability_strategy = Column(Text)
    process_vulnerability_strategy = Column(Text)  # New field for process vulnerability
    
    # NEW: Separate technology and third party unavailability strategies
    technology_unavailability_strategy = Column(Text)
    third_party_unavailability_strategy = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    people_reasoning = Column(Text)
    technology_reasoning = Column(Text)
    site_reasoning = Column(Text)
    vendor_reasoning = Column(Text)
    process_vulnerability_reasoning = Column(Text)  # New reasoning field
    
    # NEW: Reasoning for new unavailability types
    technology_unavailability_reasoning = Column(Text)
    third_party_unavailability_reasoning = Column(Text)
    
    people_status = Column(Text, default="Not Implemented")
    technology_status = Column(Text, default="Not Implemented")
    site_status = Column(Text, default="Not Implemented")
    vendor_status = Column(Text, default="Not Implemented")
    process_vulnerability_status = Column(Text, default="Not Implemented")  # New status field
    
    # NEW: Status for new unavailability types
    technology_unavailability_status = Column(Text, default="Not Implemented")
    third_party_unavailability_status = Column(Text, default="Not Implemented")
    
    # Dynamic strategy configuration - stores which strategies are enabled for this process
    enabled_strategies = Column(Text, default="people,technology,site,vendor,process_vulnerability,technology_unavailability,third_party_unavailability")
    
    # AI-generated sections
    ai_generated_sections = Column(Text)  # JSON string storing AI-generated content
    ai_last_updated = Column(DateTime(timezone=True))

    bia_process_info = relationship("BIAProcessInfo", back_populates="recovery_strategy")