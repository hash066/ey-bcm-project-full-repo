from pydantic import BaseModel, UUID4
from typing import Optional

class TechMappingExternalAppBase(BaseModel):
    application_name: str
    application_owner: Optional[str]
    application_status: Optional[str]
    integration_with_inhouse_app: Optional[str]
    organization_id: UUID4

class TechMappingExternalAppCreate(TechMappingExternalAppBase):
    pass

class TechMappingExternalAppUpdate(TechMappingExternalAppBase):
    pass

class TechMappingExternalAppOut(TechMappingExternalAppBase):
    id: UUID4
    class Config:
        from_attributes = True 