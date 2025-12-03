"""
SQLAlchemy models for Business Impact Analysis (BIA) module.
"""
from sqlalchemy import Column, String, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.db.postgres import Base

class BIAProcessInfo(Base):
    """
    Model for storing BIA information related to processes.
    """
    __tablename__ = "bia_process_info"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    process_id = Column(UUID(as_uuid=True), ForeignKey("process.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=True)
    peak_period = Column(String(255), nullable=True)
    spoc = Column(String(255), nullable=True)
    review_status = Column(String(50), nullable=False, default="Draft")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    process = relationship("GlobalProcess", back_populates="bia_process_info")
    recovery_strategy = relationship("RecoveryStrategy", back_populates="bia_process_info", uselist=False) #relation formed 
    #between bia process info and recovery strategy

class BIADepartmentInfo(Base):
    """
    Model for storing BIA information related to departments.
    """
    __tablename__ = "bia_department_info"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    department_id = Column(UUID(as_uuid=True), ForeignKey("department.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=True)
    peak_period = Column(String(255), nullable=True)
    spoc = Column(String(255), nullable=True)
    review_status = Column(String(50), nullable=False, default="Draft")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    department = relationship("GlobalDepartment", back_populates="bia_info_rel", uselist=False)

class BIASubdepartmentInfo(Base):
    """
    Model for storing BIA information related to subdepartments.
    """
    __tablename__ = "bia_subdepartment_info"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subdepartment_id = Column(UUID(as_uuid=True), ForeignKey("subdepartment.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=True)
    peak_period = Column(String(255), nullable=True)
    spoc = Column(String(255), nullable=True)
    review_status = Column(String(50), nullable=False, default="Draft")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    subdepartment = relationship("GlobalSubdepartment", back_populates="bia_info_rel", uselist=False)