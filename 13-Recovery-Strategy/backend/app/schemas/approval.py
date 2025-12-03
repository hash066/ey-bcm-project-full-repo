from typing import Any, Optional
from pydantic import BaseModel
from datetime import datetime

class ApprovalRequestCreate(BaseModel):
    """Schema for creating new approval requests."""
    type: str
    title: str
    payload: dict

class ApprovalRequestUpdate(BaseModel):
    """Schema for updating approval requests."""
    status: Optional[str] = None
    current_approver_role: Optional[str] = None
    comments: Optional[str] = None

class ApprovalRequest(BaseModel):
    """Approval request schema."""
    id: int
    type: str
    title: str
    payload: dict
    submitted_by: int
    current_approver_role: str
    status: str
    approval_history: list = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ApprovalActionRequest(BaseModel):
    """Schema for approval actions."""
    decision: str  # 'approved' or 'rejected'
    comments: Optional[str] = None

class ApprovalResponse(BaseModel):
    """Response schema for approval operations."""
    success: bool
    message: str
    approval_required: bool = False
    approval_request_id: Optional[int] = None
