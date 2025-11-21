"""
Database models for the RBAC and approval system.
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

# Role hierarchy constants
ROLE_PROCESS_OWNER = "process_owner"
ROLE_DEPARTMENT_HEAD = "department_head"
ROLE_ORGANIZATION_HEAD = "organization_head"
ROLE_EY_ADMIN = "ey_admin"

ROLE_HIERARCHY = {
    ROLE_PROCESS_OWNER: 1,
    ROLE_DEPARTMENT_HEAD: 2,
    ROLE_ORGANIZATION_HEAD: 3,
    ROLE_EY_ADMIN: 4
}

APPROVAL_STATUS_PENDING = "pending"
APPROVAL_STATUS_APPROVED = "approved"
APPROVAL_STATUS_REJECTED = "rejected"

REQUEST_TYPE_CLAUSE_EDIT = "clause_edit"
REQUEST_TYPE_FRAMEWORK_ADDITION = "framework_addition"

class User(Base):
    """User model with role-based access control."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # process_owner, department_head, organization_head, ey_admin
    department = Column(String(255), nullable=False)
    organization = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    submitted_requests = relationship("ApprovalRequest", back_populates="submitted_by_user")
    approval_steps = relationship("ApprovalStep", back_populates="approver")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"

    def get_role_level(self) -> int:
        """Get the numeric level of the user's role."""
        return ROLE_HIERARCHY.get(self.role, 0)

    def can_approve_role(self, target_role: str) -> bool:
        """Check if this user can approve requests for the given role."""
        return self.get_role_level() > ROLE_HIERARCHY.get(target_role, 0)

class ApprovalRequest(Base):
    """Approval request model for clause edits and framework additions."""
    __tablename__ = "approval_requests"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(50), nullable=False)  # clause_edit, framework_addition
    title = Column(String(500), nullable=False)
    payload = Column(JSON, nullable=False)  # The actual request data
    submitted_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    current_approver_role = Column(String(50), nullable=False)
    status = Column(String(50), default=APPROVAL_STATUS_PENDING)  # pending, approved, rejected
    approval_history = Column(JSON, default=list)  # List of approval steps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    submitted_by_user = relationship("User", back_populates="submitted_requests")
    approval_steps = relationship("ApprovalStep", back_populates="request", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ApprovalRequest(id={self.id}, type={self.type}, status={self.status})>"

    def get_next_approver_role(self) -> str:
        """Get the next role in the approval hierarchy."""
        current_level = ROLE_HIERARCHY.get(self.current_approver_role, 0)
        for role, level in ROLE_HIERARCHY.items():
            if level > current_level:
                return role
        return ROLE_EY_ADMIN  # Default to highest level

    def is_approved(self) -> bool:
        """Check if the request is fully approved."""
        return self.status == APPROVAL_STATUS_APPROVED

    def is_rejected(self) -> bool:
        """Check if the request is rejected."""
        return self.status == APPROVAL_STATUS_REJECTED

class ApprovalStep(Base):
    """Individual approval step in the approval workflow."""
    __tablename__ = "approval_steps"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("approval_requests.id"), nullable=False)
    role = Column(String(50), nullable=False)  # Role that performed this approval
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Can be None for auto-approval
    decision = Column(String(50), nullable=False)  # approved, rejected
    comments = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    request = relationship("ApprovalRequest", back_populates="approval_steps")
    approver = relationship("User", back_populates="approval_steps")

    def __repr__(self):
        return f"<ApprovalStep(id={self.id}, role={self.role}, decision={self.decision})>"

class Framework(Base):
    """Approved frameworks stored in the global database."""
    __tablename__ = "frameworks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    version = Column(String(50), nullable=False)
    description = Column(Text)
    content = Column(JSON, nullable=False)  # Framework definition data
    submitted_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    global_available = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    submitted_by_user = relationship("User", foreign_keys=[submitted_by], back_populates="submitted_frameworks")
    approved_by_user = relationship("User", foreign_keys=[approved_by], back_populates="approved_frameworks")

    def __repr__(self):
        return f"<Framework(id={self.id}, name={self.name}, version={self.version})>"

class TrainingCorpus(Base):
    """Training corpus for AI model improvement with approved clause-remedy pairs."""
    __tablename__ = "training_corpus"

    id = Column(Integer, primary_key=True, index=True)
    clause_id = Column(String(255), nullable=False)  # Reference to the clause/control
    remedy = Column(Text, nullable=False)
    source = Column(String(255))  # Source of the remedy (AI, manual, etc.)
    approval_status = Column(String(50), default=APPROVAL_STATUS_PENDING)
    submitted_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    submitted_by_user = relationship("User", foreign_keys=[submitted_by], back_populates="submitted_training_items")
    approved_by_user = relationship("User", foreign_keys=[approved_by], back_populates="approved_training_items")

    def __repr__(self):
        return f"<TrainingCorpus(id={self.id}, clause_id={self.clause_id}, approval_status={self.approval_status})>"

# Add relationships to User model
User.submitted_frameworks = relationship("Framework", foreign_keys="Framework.submitted_by", back_populates="submitted_by_user")
User.approved_frameworks = relationship("Framework", foreign_keys="Framework.approved_by", back_populates="approved_by_user")
User.submitted_training_items = relationship("TrainingCorpus", foreign_keys="TrainingCorpus.submitted_by", back_populates="submitted_by_user")
User.approved_training_items = relationship("TrainingCorpus", foreign_keys="TrainingCorpus.approved_by", back_populates="approved_by_user")
