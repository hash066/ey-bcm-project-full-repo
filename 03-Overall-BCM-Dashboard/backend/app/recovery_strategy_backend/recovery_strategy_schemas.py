from typing import Optional, List
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
