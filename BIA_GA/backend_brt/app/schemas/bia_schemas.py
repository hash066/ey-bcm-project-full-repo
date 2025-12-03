"""
Pydantic schemas for Business Impact Analysis (BIA) module.
"""
from pydantic import BaseModel, Field, UUID4
from typing import List, Dict, Any, Optional
from datetime import datetime
from uuid import UUID

# Request schemas
class BIAProcessRequest(BaseModel):
    """Schema for requesting processes for BIA based on organization, department, and subdepartment."""
    organization_id: UUID
    department_name: str
    subdepartment_name: str

class BIAProcessInfoCreate(BaseModel):
    """Schema for creating BIA information for a process."""
    process_id: UUID
    description: Optional[str] = None
    peak_period: Optional[str] = None
    spoc: Optional[str] = None
    review_status: str = "Draft"

class BIAProcessInfoUpdate(BaseModel):
    """Schema for updating BIA information for a process."""
    description: Optional[str] = None
    peak_period: Optional[str] = None
    spoc: Optional[str] = None
    review_status: Optional[str] = None

class BIAProcessBulkUpdate(BaseModel):
    """Schema for bulk updating BIA information for multiple processes."""
    organization_id: UUID
    department_name: str
    subdepartment_name: str
    processes: List[Dict[str, Any]]
    review_status: str = "Draft"

# Response schemas
class BIAProcessInfo(BaseModel):
    """Schema for BIA process information response."""
    id: UUID
    process_id: UUID
    description: Optional[str] = None
    peak_period: Optional[str] = None
    spoc: Optional[str] = None
    review_status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

class BIAProcessInfoWithName(BIAProcessInfo):
    """Schema for BIA process information response with process name."""
    process_name: str

    class Config:
        orm_mode = True
        from_attributes = True

class BIADepartmentInfo(BaseModel):
    """Schema for BIA department information response."""
    id: UUID
    department_id: UUID
    description: Optional[str] = None
    impact_level: Optional[str] = None
    review_status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

class BIASubdepartmentInfo(BaseModel):
    """Schema for BIA subdepartment information response."""
    id: UUID
    subdepartment_id: UUID
    description: Optional[str] = None
    impact_level: Optional[str] = None
    review_status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

# Process Impact Analysis schemas
class ImpactScoreItem(BaseModel):
    """Schema for a single impact score item."""
    impact_type: str
    time_period: str
    score: int

class ProcessImpactAnalysisCreate(BaseModel):
    """Schema for creating process impact analysis."""
    process_id: UUID
    rto: Optional[str] = None
    mtpd: Optional[str] = None
    impact_data: Dict[str, Any]  # JSON containing all impact scores
    highest_impact: Optional[str] = None
    is_critical: bool = False
    rationale: Optional[str] = None

class ProcessImpactAnalysisUpdate(BaseModel):
    """Schema for updating process impact analysis."""
    rto: Optional[str] = None
    mtpd: Optional[str] = None
    impact_data: Optional[Dict[str, Any]] = None
    highest_impact: Optional[str] = None
    is_critical: Optional[bool] = None
    rationale: Optional[str] = None

class ProcessImpactAnalysisResponse(BaseModel):
    """Schema for process impact analysis response."""
    id: UUID
    process_id: UUID
    rto: Optional[str] = None
    mtpd: Optional[str] = None
    is_critical: bool = False
    
    class Config:
        orm_mode = True
        from_attributes = True

class ProcessImpactAnalysisItem(BaseModel):
    """Schema for a single process impact analysis item in bulk update."""
    process_id: Optional[UUID] = None
    process_name: Optional[str] = None
    rto: Optional[str] = None
    mtpd: Optional[str] = None
    impact_data: Optional[Dict[str, Any]] = None
    highest_impact: Optional[Any] = None  # Can be string or dict
    is_critical: Optional[bool] = None
    rationale: Optional[str] = None

class BulkProcessImpactAnalysisUpdate(BaseModel):
    """Schema for bulk updating process impact analysis with typed items."""
    processes: List[ProcessImpactAnalysisItem]

class ProcessImpactAnalysisBulkUpdate(BaseModel):
    """Schema for bulk updating process impact analysis."""
    organization_id: UUID
    processes: List[Dict[str, Any]]
