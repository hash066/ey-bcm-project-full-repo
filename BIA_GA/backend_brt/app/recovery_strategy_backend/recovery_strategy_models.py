"""
SQLAlchemy models for recovery strategies.
"""
import uuid
from sqlalchemy import Column, Text, DateTime, ForeignKey
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
    people_unavailability_strategy = Column(Text)
    technology_data_unavailability_strategy = Column(Text)
    site_unavailability_strategy = Column(Text)
    third_party_vendors_unavailability_strategy = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    people_reasoning = Column(Text)
    technology_reasoning = Column(Text)
    site_reasoning = Column(Text)
    vendor_reasoning = Column(Text)

    bia_process_info = relationship("BIAProcessInfo", back_populates="recovery_strategy")