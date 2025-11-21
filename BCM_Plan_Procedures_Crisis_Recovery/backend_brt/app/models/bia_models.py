"""
SQLAlchemy models for Business Impact Analysis (BIA) module.
"""
from sqlalchemy import Column, String, Text, ForeignKey, DateTime, func, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.db.postgres import Base
from app.db.postgres import SQLALCHEMY_DATABASE_URL
from sqlalchemy import String

UUID_TYPE = UUID(as_uuid=True) if not SQLALCHEMY_DATABASE_URL.startswith('sqlite') else String(36)

class BIAProcessInfo(Base):
    """
    Model for storing BIA information related to processes.
    """
    __tablename__ = "bia_process_info"

    id = Column(UUID_TYPE, primary_key=True, default=uuid.uuid4)
    process_id = Column(UUID_TYPE, ForeignKey("process.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=True)
    peak_period = Column(String(255), nullable=True)
    spoc = Column(String(255), nullable=True)  # Single Point of Contact
    critical = Column(Boolean, default=False)  # Whether the process is critical
    review_status = Column(String(50), nullable=False, default="Draft")  # Draft, In Review, Approved
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    process = relationship("GlobalProcess", back_populates="bia_process_info")
    recovery_strategy = relationship("RecoveryStrategy", back_populates="bia_process_info", uselist=False)

class BIADepartmentInfo(Base):
    """
    Model for storing BIA information related to departments.
    """
    __tablename__ = "bia_department_info"

    id = Column(UUID_TYPE, primary_key=True, default=uuid.uuid4)
    department_id = Column(UUID_TYPE, ForeignKey("department.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=True)
    impact_level = Column(String(50), nullable=True)  # High, Medium, Low
    review_status = Column(String(50), nullable=False, default="Draft")  # Draft, In Review, Approved
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    department = relationship("GlobalDepartment", back_populates="bia_info")

class BIASubdepartmentInfo(Base):
    """
    Model for storing BIA information related to subdepartments.
    """
    __tablename__ = "bia_subdepartment_info"

    id = Column(UUID_TYPE, primary_key=True, default=uuid.uuid4)
    subdepartment_id = Column(UUID_TYPE, ForeignKey("subdepartment.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=True)
    impact_level = Column(String(50), nullable=True)  # High, Medium, Low
    review_status = Column(String(50), nullable=False, default="Draft")  # Draft, In Review, Approved
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    subdepartment = relationship("GlobalSubdepartment", back_populates="bia_info")

class ProcessImpactAnalysis(Base):
    """
    Model for storing process impact analysis (RTO) data.
    """
    __tablename__ = "process_impact_analysis"

    id = Column(UUID_TYPE, primary_key=True, default=uuid.uuid4)
    process_id = Column(UUID_TYPE, ForeignKey("process.id", ondelete="CASCADE"), nullable=False)
    
    # RTO and MTPD values
    rto = Column(String(50), nullable=True)  # e.g., "Up to 8 hours"
    mtpd = Column(String(50), nullable=True)  # e.g., "Up to 12 hours"
    
    # Impact analysis data stored as JSON
    impact_data = Column(Text, nullable=True)  # JSON string containing all impact scores
    
    # Highest impact values
    highest_impact = Column(Text, nullable=True)  # JSON string or text description
    
    # Criticality status
    is_critical = Column(Boolean, default=False)
    
    # Rationale and comments
    rationale = Column(Text, nullable=True)
    
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    process = relationship("GlobalProcess", back_populates="impact_analysis")
