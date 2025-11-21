from typing import Optional, List, Union, Dict
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
    people_status: Optional[str] = "Not Implemented"
    technology_status: Optional[str] = "Not Implemented"
    site_status: Optional[str] = "Not Implemented"
    vendor_status: Optional[str] = "Not Implemented"


class RecoveryStrategyCreate(RecoveryStrategyBase):
    process_id: UUID


class RecoveryStrategyInDB(RecoveryStrategyBase):
    process_id: Optional[Union[UUID, str]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            UUID: lambda v: str(v),
        }


# New schemas for Department, SubDepartment, Function
class Function(BaseModel):
    id: Union[UUID, str]
    name: str
    recovery_strategies: List[RecoveryStrategyInDB] = []

    class Config:
        from_attributes = True
        json_encoders = {
            UUID: lambda v: str(v),
        }


class SubDepartment(BaseModel):
    id: Union[UUID, str]
    name: str
    functions: List[Function] = []

    class Config:
        from_attributes = True
        json_encoders = {
            UUID: lambda v: str(v),
        }


class DepartmentWithStrategies(BaseModel):
    id: Union[UUID, str]
    name: str
    sub_departments: List[SubDepartment] = []

    class Config:
        from_attributes = True
        json_encoders = {
            UUID: lambda v: str(v),
        }


class DepartmentRecoveryConfigBase(BaseModel):
    department_id: UUID
    default_enabled_strategies: Optional[str] = "people,technology,site,vendor,process_vulnerability"
    enable_ai_generation: Optional[bool] = True
    ai_generation_frequency: Optional[str] = "weekly"


class DepartmentRecoveryConfigCreate(DepartmentRecoveryConfigBase):
    pass


class DepartmentRecoveryConfigUpdate(BaseModel):
    default_enabled_strategies: Optional[str] = None
    enable_ai_generation: Optional[bool] = None
    ai_generation_frequency: Optional[str] = None


class DepartmentRecoveryConfigResponse(DepartmentRecoveryConfigBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        json_encoders = {
            UUID: lambda v: str(v),
            datetime: lambda v: v.isoformat(),
        }


class AIGenerationRequest(BaseModel):
    process_id: UUID
    strategy_types: List[str] = ["people", "technology", "site", "vendor", "process_vulnerability"]


class AIGenerationResponse(BaseModel):
    success: bool
    message: str
    generated_strategies: Dict[str, str] = {}


class ProcessVulnerabilityAnalysis(BaseModel):
    vulnerability_type: str
    description: str
    impact: str
    mitigation_strategy: str
    status: str = "Not Mitigated"
