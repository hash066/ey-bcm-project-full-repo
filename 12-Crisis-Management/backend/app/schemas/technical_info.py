from pydantic import BaseModel, UUID4
from typing import Optional

class TechnicalInfoBase(BaseModel):
    service: Optional[str]
    owner: Optional[str]
    interdependency: Optional[str]
    rto: Optional[str]
    rpo: Optional[str]
    min_human_resource: Optional[str]
    admin_accounts: Optional[str]
    internet_connectivity: Optional[str]
    special_tools: Optional[str]
    external: Optional[str]
    service_provider: Optional[str]
    vendor_onsite_support: Optional[str]
    vendor_offsite_support: Optional[str]
    organization_id: UUID4

class TechnicalInfoCreate(TechnicalInfoBase):
    pass

class TechnicalInfoUpdate(TechnicalInfoBase):
    pass

class TechnicalInfoOut(TechnicalInfoBase):
    id: UUID4

    class Config:
        orm_mode = True 