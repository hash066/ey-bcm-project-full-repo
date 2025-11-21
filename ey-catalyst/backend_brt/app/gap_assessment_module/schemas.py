"""
Pydantic schemas for Gap Assessment Module API requests and responses
"""

from datetime import datetime
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field


# Clause Edit Request
class ClauseEditRequest(BaseModel):
    """Schema for clause edit requests."""
    job_id: str = Field(..., description="Job ID containing the control")
    control_id: str = Field(..., description="Control ID to edit")
    clause_data: Dict[str, Any] = Field(..., description="Updated clause data")
    remedy: str = Field(..., description="Proposed remedy")
    justification: str = Field(..., description="Justification for the edit")
    required_actions: Optional[List[str]] = Field(default=None, description="Required actions")
    evidence_required: Optional[List[str]] = Field(default=None, description="Evidence required")


# Framework Addition Request
class FrameworkAdditionRequest(BaseModel):
    """Schema for framework addition requests."""
    document_file: str = Field(..., description="Uploaded document file path")
    description: str = Field(..., description="Short description of the framework")
    justification: str = Field(..., description="Justification for addition")


# Approval Request Schemas
class ApprovalRequest(BaseModel):
    """Approval request model."""
    id: int
    type: str
    title: str
    payload: Dict[str, Any]
    submitted_by: int
    current_approver_role: str
    status: str
    approval_history: List[Dict[str, Any]]
    submitted_by_user: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class ApprovalRequestCreate(BaseModel):
    """Schema for creating approval requests."""
    type: str = Field(..., description="Request type (clause_edit, framework_addition)")
    title: str = Field(..., description="Request title")
    payload: Dict[str, Any] = Field(..., description="Request data payload")


class ApprovalStep(BaseModel):
    """Approval step model."""
    id: int
    request_id: int
    role: str
    approver_id: int
    decision: str
    comments: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True


class ApprovalStepCreate(BaseModel):
    """Schema for creating approval steps."""
    request_id: int
    role: str
    approver_id: int
    decision: str
    comments: Optional[str]


class ApprovalActionRequest(BaseModel):
    """Schema for approval actions."""
    decision: str = Field(..., description="approved or rejected")
    comments: Optional[str] = Field("", description="Approval comments")


# Framework Schemas
class FrameworkCreate(BaseModel):
    """Schema for creating frameworks."""
    name: str = Field(..., description="Framework name")
    version: str = Field(..., description="Framework version")
    description: Optional[str] = Field(None, description="Framework description")
    content: Optional[Dict[str, Any]] = Field(None, description="Framework content")
    global_available: bool = Field(False, description="Whether globally available")


class Framework(ApprovalRequest):
    """Framework model - inherits basic fields."""
    id: int
    name: str
    version: str
    description: Optional[str]
    content: Optional[Dict[str, Any]]
    submitted_by: int
    global_available: bool
    approved_by: Optional[int]
    submitted_by_user: Optional[Dict[str, Any]] = None
    approved_by_user: Optional[Dict[str, Any]] = None


class FrameworkVersion(BaseModel):
    """Framework version model."""
    id: int
    framework_id: int
    version: str
    content: Dict[str, Any]
    changelog: Optional[str]
    created_by: int
    created_at: datetime


class FrameworkVersionCreate(BaseModel):
    """Schema for creating framework versions."""
    version: str = Field(..., description="Version string")
    content: Dict[str, Any] = Field(..., description="Version content")
    changelog: Optional[str] = Field(None, description="Change log")


# Training Corpus Schemas
class TrainingCorpusCreate(BaseModel):
    """Schema for creating training corpus entries."""
    clause_id: str = Field(..., description="Reference to clause")
    remedy: str = Field(..., description="Suggested remedy")
    source: str = Field(..., description="Source of the data")


class TrainingCorpus(TrainingCorpusCreate):
    """Training corpus model."""
    id: int
    submitted_by: int
    approval_status: str
    approved_by: Optional[int]
    submitted_by_user: Optional[Dict[str, Any]] = None
    approved_by_user: Optional[Dict[str, Any]] = None


# Statistics and Dashboard Schemas
class RequestFilters(BaseModel):
    """Filters for approval requests."""
    status: Optional[str] = Field(None, description="Filter by status")
    type: Optional[str] = Field(None, description="Filter by type")
    role: Optional[str] = Field(None, description="Filter by role")


class PaginationParams(BaseModel):
    """Pagination parameters."""
    page: int = Field(1, gt=0, description="Page number")
    size: int = Field(20, gt=0, le=100, description="Page size")


class PaginatedResponse(BaseModel):
    """Paginated response model."""
    items: List[Union[ApprovalRequest, Framework, TrainingCorpus]]
    total: int
    page: int
    size: int
    pages: int


class DashboardStats(BaseModel):
    """Dashboard statistics."""
    total_users: int
    total_requests: int
    pending_approvals: int
    approved_requests: int
    rejected_requests: int
    requests_by_type: Dict[str, int]
    requests_by_role: Dict[str, int]


class RoleInfo(BaseModel):
    """Role information model."""
    role: str
    name: str
    level: int
    description: str


class PermissionCheck(BaseModel):
    """Permission check result."""
    has_permission: bool
    required_role: str
    user_role: str
    user_level: int
    required_level: int


class UserStats(BaseModel):
    """User statistics."""
    total_submitted: int
    total_approved: int
    total_rejected: int
    pending_approvals: int


class ProcessMappingModule(BaseModel):
    """Process Mapping Module schema for validation."""
    # Add fields based on your process mapping requirements
    name: Optional[str] = Field(None, description="Process name")
    description: Optional[str] = Field(None, description="Process description")
    steps: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Process steps")
    dependencies: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Process dependencies")


class LLMProcessMappingRequest(BaseModel):
    """Request model for LLM process mapping."""
    llm_output: Union[str, List[str]] = Field(..., description="LLM output to process")
    confidence_threshold: Optional[float] = Field(0.7, description="Confidence threshold for extraction")


class ClauseEditResponse(BaseModel):
    """Response for clause edit operations."""
    success: bool = Field(..., description="Operation success")
    message: str = Field(..., description="Operation message")
    approval_required: bool = Field(..., description="Whether approval is required")
    approval_request_id: Optional[int] = Field(None, description="Approval request ID")
    updated_control: Optional[Dict[str, Any]] = Field(None, description="Updated control data")


class CommentRequest(BaseModel):
    """Request model for adding comments."""
    comment: str = Field(..., description="Comment text")
    reviewer: str = Field(..., description="Reviewer name")


class CommentResponse(BaseModel):
    """Response model for comment operations."""
    success: bool = Field(..., description="Operation success")
    message: str = Field(..., description="Operation result")
    comment: Dict[str, Any] = Field(..., description="Added comment")


# Gap Analysis Result Model (for controls)
class GapAnalysisResult(BaseModel):
    """Gap analysis result."""
    id: str = Field(..., description="Control ID")
    control_name: str = Field(..., description="Control name")
    domain: str = Field(..., description="Control domain")
    framework: str = Field(..., description="Source framework")
    current_score: float = Field(..., description="Current compliance score")
    target_score: float = Field(..., description="Target compliance score")
    priority: str = Field(..., description="Implementation priority")
    gap_percentage: float = Field(..., description="Compliance gap percentage")
    required_actions: List[str] = Field(default_factory=list, description="Required actions")
    evidence_required: List[str] = Field(default_factory=list, description="Evidence required")
    assessment_comments: List[Dict[str, Any]] = Field(default_factory=list, description="Assessment comments")
    created_at: Optional[datetime] = Field(None, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Update timestamp")


# Assessment Comment Model
class AssessmentComment(BaseModel):
    """Assessment comment model."""
    comment: str = Field(..., description="Comment text")
    reviewer: str = Field(..., description="Reviewer name")
    timestamp: Optional[datetime] = Field(None, description="Comment timestamp")
