from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field
from uuid import UUID, uuid4
from datetime import datetime
from enum import Enum

class ImpactScaleBase(BaseModel):
    """Base model for impact scale"""
    title: str
    description: Optional[str] = None
    client_id: int
    department_id: Optional[int] = None
    subdepartment_id: Optional[int] = None
    process_id: Optional[int] = None
    is_global: Optional[bool] = None
    status: Optional[str] = None
    version: Optional[str] = None

class ImpactScaleCreate(ImpactScaleBase):
    """Model for creating an impact scale"""
    uploaded_by: int

class ImpactScaleDB(ImpactScaleBase):
    """Model for impact scale in database"""
    id: str
    upload_date: datetime
    content: List[Dict[str, Any]]
    status: str = "active"
    
    class Config:
        from_attributes = True

class ImpactScaleResponse(ImpactScaleDB):
    """Model for impact scale response"""
    pass

class ImpactScaleUpdate(BaseModel):
    """Model for updating an impact scale"""
    title: Optional[str] = None
    description: Optional[str] = None
    department_id: Optional[int] = None
    subdepartment_id: Optional[int] = None
    process_id: Optional[int] = None
    is_global: Optional[bool] = None
    status: Optional[str] = None
    version: Optional[str] = None

class ImpactScaleQuery(BaseModel):
    """Model for querying impact scales"""
    client_id: int
    department_id: Optional[int] = None
    subdepartment_id: Optional[int] = None
    process_id: Optional[int] = None
    is_global: Optional[bool] = None
    limit: int = 100
    skip: int = 0

class ImpactLevel(str, Enum):
    """Impact levels for BIA matrix"""
    INSIGNIFICANT = "Insignificant"
    LOW = "Low"
    MODERATE = "Moderate"
    MAJOR = "Major"
    CATASTROPHIC = "Catastrophic"

class ImpactMatrixCell(BaseModel):
    """Model for a single cell in the impact matrix"""
    impact_type: str
    impact_level: ImpactLevel
    description: str

class ImpactMatrix(BaseModel):
    """Model for the complete impact matrix"""
    client_id: int
    sector: str
    created_by: int
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = None
    cells: List[ImpactMatrixCell]

class ImpactMatrixCreate(BaseModel):
    """Model for creating an impact matrix"""
    client_id: int
    sector: str
    cells: List[Dict[str, Any]]

class ImpactMatrixUpdate(BaseModel):
    """Model for updating an impact matrix"""
    sector: Optional[str] = None
    cells: Optional[List[Dict[str, Any]]] = None

class LLMSuggestionRequest(BaseModel):
    """Request model for getting LLM suggestions for impact matrix cells"""
    process_name: str
    impact_type: str
    impact_level: str
    sector: str

class LLMSuggestionResponse(BaseModel):
    """Response model for LLM suggestions"""
    choices: List[str]