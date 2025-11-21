"""
Pydantic schemas for activity logs.
"""
from uuid import UUID
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class ActivityLogBase(BaseModel):
    """Base schema for activity logs."""
    username: str
    department: Optional[str] = None
    subdepartment: Optional[str] = None
    action_info: str
    endpoint: Optional[str] = None


class ActivityLogCreate(ActivityLogBase):
    """Schema for creating an activity log."""
    organization_id: UUID


class ActivityLog(ActivityLogBase):
    """Schema for returning an activity log."""
    id: UUID
    organization_id: UUID
    timestamp: datetime
    
    class Config:
        orm_mode = True


class ActivityLogList(BaseModel):
    """Schema for returning a list of activity logs."""
    items: List[ActivityLog]
    total: int
    limit: int
    offset: int
