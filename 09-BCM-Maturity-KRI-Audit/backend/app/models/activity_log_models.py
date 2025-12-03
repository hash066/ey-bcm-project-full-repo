"""
SQLAlchemy models for activity logging in the database.
"""
from uuid import uuid4
from sqlalchemy import Column, String, ForeignKey, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.postgres import Base


class OrganizationActivityLog(Base):
    """
    Organization activity log model for tracking user actions within an organization.
    """
    __tablename__ = "organization_activity_log"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organization.id", ondelete="CASCADE"), nullable=False)
    username = Column(Text, nullable=False)  # Username of the user who performed the action
    department = Column(Text, nullable=True)  # Department name (if applicable)
    subdepartment = Column(Text, nullable=True)  # Subdepartment name (if applicable)
    action_info = Column(Text, nullable=False)  # Description of the action performed
    endpoint = Column(Text, nullable=True)  # API endpoint that was called
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    organization = relationship("GlobalOrganization")
