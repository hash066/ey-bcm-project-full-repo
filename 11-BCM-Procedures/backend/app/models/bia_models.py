"""
SQLAlchemy models for Business Impact Analysis (BIA) module.
"""
from sqlalchemy import Column, String, Text, ForeignKey, DateTime, func, Boolean, Integer
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

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    process_id = Column(UUID(as_uuid=True), ForeignKey("process.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=True)
    peak_period = Column(String(255), nullable=True)
    spoc = Column(String(255), nullable=True)  # Single Point of Contact
    review_status = Column(String(50), nullable=False, default="Draft")  # Draft, In Review, Approved
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    process = relationship("GlobalProcess", back_populates="bia_info")

class BIADepartmentInfo(Base):
    """
    Model for storing BIA information related to departments.
    """
    __tablename__ = "bia_department_info"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    department_id = Column(UUID(as_uuid=True), ForeignKey("department.id", ondelete="CASCADE"), nullable=False)
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

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subdepartment_id = Column(UUID(as_uuid=True), ForeignKey("subdepartment.id", ondelete="CASCADE"), nullable=False)
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

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    process_id = Column(UUID(as_uuid=True), ForeignKey("process.id", ondelete="CASCADE"), nullable=False)

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

class BIASnapshot(Base):
    """
    Model for storing encrypted, versioned BIA snapshots with audit trail.
    """
    __tablename__ = "bia_snapshots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    # Snapshot versioning
    version = Column(Integer, nullable=False, default=1)
    snapshot_data = Column(Text, nullable=False)  # Encrypted JSON data

    # Encryption metadata
    encryption_metadata = Column(Text, nullable=False)  # JSON string with IV, tag, algorithm, etc.

    # Source and user information
    saved_by = Column(UUID(as_uuid=True), nullable=False)  # User ID who saved the snapshot
    source = Column(String(20), nullable=False, default="HUMAN")  # HUMAN or AI

    # Audit information
    saved_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    checksum = Column(String(64), nullable=True)  # SHA-256 checksum of decrypted data

    # Optional notes
    notes = Column(Text, nullable=True)

class BiaAuditLog(Base):
    """
    Model for auditing BIA operations (saves, approvals, rollbacks).
    """
    __tablename__ = "bia_audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    snapshot_id = Column(UUID(as_uuid=True), ForeignKey("bia_snapshots.id"), nullable=True)

    # Audit details
    action = Column(String(20), nullable=False)  # SAVE, APPROVE, REJECT, ROLLBACK
    user_id = Column(UUID(as_uuid=True), nullable=False)
    organization_id = Column(UUID(as_uuid=True), nullable=False)

    # Action details
    details = Column(Text, nullable=True)  # JSON string with additional context
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Request tracking
    request_id = Column(String(100), nullable=True)  # For tracing requests
