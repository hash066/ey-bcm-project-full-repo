"""
SQLAlchemy models for Review Management functionality.
"""
from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.db.postgres import Base

class ScheduledReview(Base):
    """
    Model for storing scheduled reviews and activities.
    """
    __tablename__ = "scheduled_review"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)  # Review name
    description = Column(Text, nullable=True)  # Review description
    review_type = Column(String(50), nullable=False)  # BIA, Recovery, Compliance, etc.
    scheduled_date = Column(DateTime, nullable=False)  # When review is scheduled
    completed = Column(Boolean, default=False)  # Whether review is completed
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organization.id"), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    organization = relationship("GlobalOrganization", back_populates="scheduled_reviews")