"""
Gap Assessment Module Models
Contains models specific to the gap assessment functionality
"""

from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Table, Text,
    Boolean, Enum, Float, JSON, func
)
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

# Approval Request Model (for clause edits and framework additions)
class ApprovalRequest(Base):
    """Approval request model for clause edits and framework additions."""
    __tablename__ = 'approval_requests'

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(50), nullable=False)  # 'clause_edit', 'framework_addition'
    title = Column(String(255), nullable=False)
    payload = Column(JSON, nullable=False)  # Request data
    submitted_by = Column(Integer, index=True)  # User ID who submitted
    current_approver_role = Column(String(100), nullable=False)  # Current approver's role
    status = Column(String(50), default='pending')  # pending, approved, rejected
    approval_history = Column(JSON, default=list())  # History of approvals/steps

    # Audit fields
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    submitted_by_user = relationship('User', foreign_keys=[submitted_by])

    def dict(self):
        """Convert to dictionary for JSON responses."""
        return {
            "id": self.id,
            "type": self.type,
            "title": self.title,
            "payload": self.payload,
            "submitted_by": self.submitted_by,
            "current_approver_role": self.current_approver_role,
            "status": self.status,
            "approval_history": self.approval_history,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }

# Approval Step Model
class ApprovalStep(Base):
    """Individual approval step in the approval process."""
    __tablename__ = 'approval_steps'

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey('approval_requests.id'), nullable=False)
    role = Column(String(100), nullable=False)  # Approver's role
    approver_id = Column(Integer, index=True)  # User ID who approved/rejected
    decision = Column(String(50), nullable=False)  # approved, rejected
    comments = Column(Text, nullable=True)

    # Timestamp
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    approval_request = relationship('ApprovalRequest')
    approver = relationship('User', foreign_keys=[approver_id])

    def dict(self):
        """Convert to dictionary for JSON responses."""
        return {
            "id": self.id,
            "request_id": self.request_id,
            "role": self.role,
            "approver_id": self.approver_id,
            "decision": self.decision,
            "comments": self.comments,
            "timestamp": self.timestamp.isoformat()
        }

# Framework Model
class Framework(Base):
    """Compliance framework model."""
    __tablename__ = 'frameworks'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    version = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    content = Column(JSON, nullable=True)  # Framework definition/content
    submitted_by = Column(Integer, index=True)  # User ID
    global_available = Column(Boolean, default=False)  # Publicly available
    approved_by = Column(Integer, nullable=True)  # Approver user ID

    # Audit fields
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    submitted_by_user = relationship('User', foreign_keys=[submitted_by])
    approved_by_user = relationship('User', foreign_keys=[approved_by])

    def dict(self):
        """Convert to dictionary for JSON responses."""
        return {
            "id": self.id,
            "name": self.name,
            "version": self.version,
            "description": self.description,
            "content": self.content,
            "submitted_by": self.submitted_by,
            "global_available": self.global_available,
            "approved_by": self.approved_by,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }

# Framework Version Model
class FrameworkVersion(Base):
    """Framework versioning model."""
    __tablename__ = 'framework_versions'

    id = Column(Integer, primary_key=True, index=True)
    framework_id = Column(Integer, ForeignKey('frameworks.id'), nullable=False)
    version = Column(String(50), nullable=False)
    content = Column(JSON, nullable=False)
    changelog = Column(Text, nullable=True)
    created_by = Column(Integer, index=True)

    # Audit fields
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def dict(self):
        """Convert to dictionary for JSON responses."""
        return {
            "id": self.id,
            "framework_id": self.framework_id,
            "version": self.version,
            "content": self.content,
            "changelog": self.changelog,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat()
        }

# Training Corpus Model
class TrainingCorpus(Base):
    """Training corpus for AI model improvement."""
    __tablename__ = 'training_corpus'

    id = Column(Integer, primary_key=True, index=True)
    clause_id = Column(String(255), nullable=False, index=True)  # Reference to clause
    remedy = Column(Text, nullable=False)  # Suggested remedy
    source = Column(String(255), nullable=False)  # Source of the data
    submitted_by = Column(Integer, index=True)  # User ID
    approval_status = Column(String(50), default='pending')  # pending, approved, rejected
    approved_by = Column(Integer, nullable=True, index=True)  # Approver user ID

    # Audit fields
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    submitted_by_user = relationship('User', foreign_keys=[submitted_by])
    approved_by_user = relationship('User', foreign_keys=[approved_by])

    def dict(self):
        """Convert to dictionary for JSON responses."""
        return {
            "id": self.id,
            "clause_id": self.clause_id,
            "remedy": self.remedy,
            "source": self.source,
            "submitted_by": self.submitted_by,
            "approval_status": self.approval_status,
            "approved_by": self.approved_by,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
