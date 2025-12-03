"""
Pydantic schemas for password management operations.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from uuid import UUID


class PasswordChangeRequest(BaseModel):
    """Schema for user password change request."""
    current_password: str = Field(..., description="Current password for verification")
    new_password: str = Field(..., min_length=8, description="New password (minimum 8 characters)")


class PasswordChangeResponse(BaseModel):
    """Schema for password change response."""
    success: bool
    message: str
    password_changed_at: datetime


class UserPasswordInfo(BaseModel):
    """Schema for user password information (for admin view)."""
    id: UUID
    username: str
    decrypted_password: str
    is_default_password: str
    password_changed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserPasswordSummary(BaseModel):
    """Schema for user password summary (without decrypted password)."""
    id: UUID
    username: str
    is_default_password: str
    password_changed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class AdminPasswordResetRequest(BaseModel):
    """Schema for admin password reset request."""
    username: str = Field(..., description="Username to reset password for")
    new_password: str = Field(..., min_length=8, description="New password to set")
    mark_as_default: bool = Field(default=True, description="Mark as default password requiring change")


class AdminPasswordResetResponse(BaseModel):
    """Schema for admin password reset response."""
    success: bool
    message: str
    username: str
    reset_at: datetime
