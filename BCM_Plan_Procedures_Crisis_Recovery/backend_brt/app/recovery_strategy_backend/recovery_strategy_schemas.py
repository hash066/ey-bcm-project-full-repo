from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


class RecoveryStrategyBase(BaseModel):
    people_unavailability_strategy: Optional[str] = None
    people_reasoning: Optional[str] = None
    technology_data_unavailability_strategy: Optional[str] = None
    technology_reasoning: Optional[str] = None
    site_unavailability_strategy: Optional[str] = None
    site_reasoning: Optional[str] = None
    third_party_vendors_unavailability_strategy: Optional[str] = None
    vendor_reasoning: Optional[str] = None
    process_vulnerability_strategy: Optional[str] = None
    process_vulnerability_reasoning: Optional[str] = None
    people_status: Optional[str] = "Not Implemented"
    technology_status: Optional[str] = "Not Implemented"
    site_status: Optional[str] = "Not Implemented"
    vendor_status: Optional[str] = "Not Implemented"
    process_vulnerability_status: Optional[str] = "Not Implemented"
    enabled_strategies: Optional[str] = "people,technology,site,vendor,process_vulnerability"
    ai_generated_sections: Optional[str] = None
    ai_last_updated: Optional[datetime] = None


class RecoveryStrategyCreate(RecoveryStrategyBase):
    process_id: UUID


class RecoveryStrategyInDB(RecoveryStrategyBase):
    process_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            UUID: lambda v: str(v),
        }


# New schemas for Department, SubDepartment, Function
class Function(BaseModel):
    id: UUID
    name: str
    recovery_strategies: List[RecoveryStrategyInDB] = []

    class Config:
        from_attributes = True
        json_encoders = {
            UUID: lambda v: str(v),
        }


class SubDepartment(BaseModel):
    id: UUID
    name: str
    functions: List[Function] = []

    class Config:
        from_attributes = True
        json_encoders = {
            UUID: lambda v: str(v),
        }


class DepartmentWithStrategies(BaseModel):
    id: UUID
    name: str
    sub_departments: List[SubDepartment] = []

    class Config:
        from_attributes = True
        json_encoders = {
            UUID: lambda v: str(v),
        }

class DepartmentRecoveryConfigBase(BaseModel):
    default_enabled_strategies: Optional[str] = "people,technology,site,vendor,process_vulnerability"
    people_strategy_template: Optional[str] = None
    technology_strategy_template: Optional[str] = None
    site_strategy_template: Optional[str] = None
    vendor_strategy_template: Optional[str] = None
    process_vulnerability_strategy_template: Optional[str] = None
    enable_ai_generation: Optional[bool] = True
    ai_generation_frequency: Optional[str] = "weekly"

class DepartmentRecoveryConfigCreate(DepartmentRecoveryConfigBase):
    department_id: UUID

class DepartmentRecoveryConfigResponse(DepartmentRecoveryConfigBase):
    department_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            UUID: lambda v: str(v),
        }

class AIGenerationRequest(BaseModel):
    process_id: Optional[UUID] = None
    department_id: Optional[UUID] = None
    content_types: List[str] = ["all"]
    force_regenerate: bool = False

class AIGenerationResponse(BaseModel):
    success: bool
    generated_content: Optional[Dict[str, Any]] = None
    errors: Optional[List[str]] = None
    cached: bool = False

class ProcessVulnerabilityAnalysis(BaseModel):
    vulnerability_type: str
    risk_level: str
    description: str
    mitigation_strategy: str
    responsible_party: Optional[str] = None
    timeline: Optional[str] = None
