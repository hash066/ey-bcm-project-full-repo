"""
Pydantic schemas for module request operations.
"""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel


class ModuleRequestCreate(BaseModel):
    """Schema for creating a new module request"""
    module_id: str
    module_name: str
    request_reason: Optional[str] = None


class ModuleRequestApproval(BaseModel):
    """Schema for approving/rejecting a module request"""
    action: str  # "approve" or "reject"
    comments: Optional[str] = None


class ModuleRequestResponse(BaseModel):
    """Schema for module request response"""
    id: UUID
    organization_id: UUID
    module_id: str
    module_name: str
    
    # Requester info
    requester_username: str
    requester_email: Optional[str]
    requester_display_name: Optional[str]
    request_reason: Optional[str]
    
    # Status and approvals
    status: str
    client_head_approved: Optional[str]
    client_head_approved_by: Optional[str]
    client_head_approved_at: Optional[datetime]
    client_head_comments: Optional[str]
    
    project_sponsor_approved: Optional[str]
    project_sponsor_approved_by: Optional[str]
    project_sponsor_approved_at: Optional[datetime]
    project_sponsor_comments: Optional[str]
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class ModuleRequestSummary(BaseModel):
    """Simplified schema for listing module requests"""
    id: UUID
    module_id: str
    module_name: str
    requester_username: str
    requester_display_name: Optional[str]
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True
