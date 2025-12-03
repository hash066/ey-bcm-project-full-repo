"""
Schema definitions for Process Mapping module.
"""
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

# Basic Info Schema
class BasicInfo(BaseModel):
    slno: str = Field(..., description="Serial number")
    department_name: str = Field(..., description="Department name")
    sub_dept_name: Optional[str] = Field(None, description="Sub-department name")

# Department Head Contact Details Schema
class DepartmentHeadContact(BaseModel):
    dept_head_name: str = Field(..., description="Department head name")
    dept_head_phone: str = Field(..., description="Department head phone number")
    dept_head_email: EmailStr = Field(..., description="Department head email ID")

# BCM Coordinator Contact Details Schema
class BCMCoordinatorContact(BaseModel):
    bcm_cord_name: str = Field(..., description="BCM coordinator name")
    bcm_cord_phone: str = Field(..., description="BCM coordinator phone number")
    bcm_cord_email: EmailStr = Field(..., description="BCM coordinator email ID")

# Process Mapping Schema
class ProcessMapping(BaseModel):
    process_name: str = Field(..., description="Process name")
    process_description: str = Field(..., description="Process description")
    sub_process_name: Optional[str] = Field(None, description="Sub-process name")

# Process Owner Details Schema
class ProcessOwnerDetails(BaseModel):
    process_owner_name: str = Field(..., description="Process owner name")
    process_owner_contact: str = Field(..., description="Process owner contact number")
    process_owner_email: EmailStr = Field(..., description="Process owner email ID")

# Third Party Dependencies Schema
class ThirdPartyDependencies(BaseModel):
    vendor_info: Optional[str] = Field(None, description="Information about third party vendors if any")
    sop_name: Optional[str] = Field(None, description="SOP name")
    service_name: Optional[str] = Field(None, description="Service name")

# Complete Process Mapping Module Schema
class ProcessMappingModule(BaseModel):
    basic_info: BasicInfo
    department_head_contact: DepartmentHeadContact
    bcm_coordinator_contact: BCMCoordinatorContact
    process_mapping: ProcessMapping
    process_owner_details: ProcessOwnerDetails
    third_party_dependencies: ThirdPartyDependencies
    
    # Additional metadata fields
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    version: Optional[int] = 1
    status: Optional[str] = "draft"

# Request model for updating Process Mapping data
class ProcessMappingUpdate(BaseModel):
    data: ProcessMappingModule
