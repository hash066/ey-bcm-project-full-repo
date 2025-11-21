"""
SQLAlchemy models for Audit Trail functionality.
"""
from sqlalchemy import Column, String, Text, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

from app.db.postgres import Base

class AuditLog(Base):
    """
    Model for storing audit trail activities.
    """
    __tablename__ = "audit_log"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    module = Column(String(50), nullable=False)  # BCM, BIA, Recovery, etc.
    action_type = Column(String(100), nullable=False)  # Action description
    username = Column(String(100), nullable=False)  # User who performed action
    details = Column(Text, nullable=True)  # Additional details
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)