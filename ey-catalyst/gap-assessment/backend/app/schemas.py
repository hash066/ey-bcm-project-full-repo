"""
Pydantic schemas for API request/response models.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr
from app.models import (
    ROLE_PROCESS_OWNER, ROLE_DEPARTMENT_HEAD, ROLE_ORGANIZATION_HEAD, ROLE_EY_ADMIN,
    APPROVAL_STATUS_PENDING, APPROVAL_STATUS_APPROVED, APPROVAL_STATUS_REJECTED,
    REQUEST_TYPE_CLAUSE_EDIT, REQUEST_TYPE_FRAMEWORK_ADDITION
)

# User schemas
class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr = Field(..., description="User email address")
    name: str = Field(..., description="User full name")
    role: str = Field(..., description="User role")
    department: str = Field(..., description="User department")
    organization: str = Field(..., description="User organization")

class UserCreate(UserBase):
    """Schema for creating a new user."""
    password: str = Field(..., min_length=8, description="User password")

class UserUpdate(BaseModel):
    """Schema for updating a user."""
    name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    organization: Optional[str] = None
    is_active: Optional[bool] = None

class User(UserBase):
    """Schema for user response."""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str

class Token(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    """Schema for token data."""
    email: Optional[str] = None

# Approval request schemas
class ApprovalRequestBase(BaseModel):
    """Base approval request schema."""
    type: str = Field(..., description="Request type (clause_edit, framework_addition)")
    title: str = Field(..., description="Request title")
    payload: Dict[str, Any] = Field(..., description="Request payload data")

class ApprovalRequestCreate(ApprovalRequestBase):
    """Schema for creating an approval request."""
    pass

class ApprovalRequest(ApprovalRequestBase):
    """Schema for approval request response."""
    id: int
    submitted_by: int
    current_approver_role: str
    status: str
    approval_history: List[Dict[str, Any]]
    created_at: datetime
    updated_at: Optional[datetime]
    submitted_by_user: Optional[User] = None

    class Config:
        from_attributes = True

class ApprovalStepBase(BaseModel):
    """Base approval step schema."""
    decision: str = Field(..., description="Approval decision (approved, rejected)")
    comments: Optional[str] = None

class ApprovalStepCreate(ApprovalStepBase):
    """Schema for creating an approval step."""
    request_id: int

class ApprovalStep(ApprovalStepBase):
    """Schema for approval step response."""
    id: int
    request_id: int
    role: str
    approver_id: Optional[int]
    timestamp: datetime
    approver: Optional[User] = None

    class Config:
        from_attributes = True

# Framework schemas
class FrameworkBase(BaseModel):
    """Base framework schema."""
    name: str = Field(..., description="Framework name")
    version: str = Field(..., description="Framework version")
    description: Optional[str] = None
    content: Dict[str, Any] = Field(..., description="Framework definition")
    global_available: bool = True

class FrameworkCreate(FrameworkBase):
    """Schema for creating a framework."""
    pass

class Framework(FrameworkBase):
    """Schema for framework response."""
    id: int
    submitted_by: int
    approved_by: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]
    submitted_by_user: Optional[User] = None
    approved_by_user: Optional[User] = None

    class Config:
        from_attributes = True

# Training corpus schemas
class TrainingCorpusBase(BaseModel):
    """Base training corpus schema."""
    clause_id: str = Field(..., description="Clause/control identifier")
    remedy: str = Field(..., description="Remedy text")
    source: Optional[str] = None

class TrainingCorpusCreate(TrainingCorpusBase):
    """Schema for creating a training corpus entry."""
    pass

class TrainingCorpus(TrainingCorpusBase):
    """Schema for training corpus response."""
    id: int
    approval_status: str
    submitted_by: int
    approved_by: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]
    submitted_by_user: Optional[User] = None
    approved_by_user: Optional[User] = None

    class Config:
        from_attributes = True

# Request/Response schemas for specific operations
class ClauseEditRequest(BaseModel):
    """Schema for clause edit request."""
    job_id: str
    control_id: str
    clause_data: Dict[str, Any]
    remedy: str
    justification: str

class FrameworkAdditionRequest(BaseModel):
    """Schema for framework addition request."""
    framework_data: Dict[str, Any]
    justification: str

class ApprovalActionRequest(BaseModel):
    """Schema for approval action."""
    decision: str = Field(..., pattern="^(approved|rejected)$")
    comments: Optional[str] = None

# Dashboard and statistics schemas
class DashboardStats(BaseModel):
    """Schema for dashboard statistics."""
    total_users: int
    total_requests: int
    pending_approvals: int
    approved_requests: int
    rejected_requests: int
    requests_by_type: Dict[str, int]
    requests_by_role: Dict[str, int]

class UserStats(BaseModel):
    """Schema for user statistics."""
    total_submitted: int
    total_approved: int
    total_rejected: int
    pending_approvals: int

# Filter and pagination schemas
class RequestFilters(BaseModel):
    """Schema for filtering approval requests."""
    status: Optional[str] = None
    type: Optional[str] = None
    role: Optional[str] = None
    submitted_by: Optional[int] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None

class PaginationParams(BaseModel):
    """Schema for pagination parameters."""
    page: int = Field(default=1, gt=0)
    size: int = Field(default=20, gt=0, le=100)

class PaginatedResponse(BaseModel):
    """Generic schema for paginated responses."""
    items: List[Any]
    total: int
    page: int
    size: int
    pages: int

# Role and permission schemas
class RoleInfo(BaseModel):
    """Schema for role information."""
    role: str
    name: str
    level: int
    description: str

class PermissionCheck(BaseModel):
    """Schema for permission check response."""
    has_permission: bool
    required_role: str
    user_role: str
    user_level: int
    required_level: int
