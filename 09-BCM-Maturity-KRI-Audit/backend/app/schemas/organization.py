from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime

# Impact Matrix Schema
class ImpactMatrixCell(BaseModel):
    """Schema for a single cell in the impact matrix"""
    impact_type: str  # e.g., "Financial Impact"
    impact_level: str  # e.g., "Major - 3"
    description: str  # The cell content/description
    
class ImpactMatrix(BaseModel):
    """Schema for the entire impact matrix"""
    cells: List[ImpactMatrixCell] = []
    impact_types: List[str] = []  # List of row headers (Financial Impact, Operational Impact, etc.)
    impact_levels: List[str] = []  # List of column headers (Insignificant, Low, etc.)
    areas_of_impact: Dict[str, str] = {}  # Maps impact_type to its area of impact description
    metadata: Optional[Dict[str, Any]] = None  # For storing additional matrix metadata

# Frontend-specific schemas for impact matrix
class ImpactLevel(BaseModel):
    """Schema for an impact level in the frontend matrix"""
    id: str  # e.g., "major"
    name: str  # e.g., "Major - 3"
    description: Optional[str] = None
    color: Optional[str] = None  # For frontend color coding
    value: Optional[int] = None  # Numerical value for calculations

class ImpactType(BaseModel):
    """Schema for an impact type in the frontend matrix"""
    id: str  # e.g., "financial"
    name: str  # e.g., "Financial Impact"
    area_of_impact: Optional[str] = None  # Description of the area of impact

class MatrixCell(BaseModel):
    """Schema for a cell in the frontend impact matrix"""
    impact_type_id: str
    impact_level_id: str
    description: str

class FrontendImpactMatrix(BaseModel):
    """Frontend-friendly schema for the impact matrix"""
    organization_id: UUID
    title: Optional[str] = "Impact Matrix"
    description: Optional[str] = None
    sector: Optional[str] = None  # Sector field for updating organization's sector
    impact_types: List[ImpactType] = []  # Rows
    impact_levels: List[ImpactLevel] = []  # Columns
    cells: List[MatrixCell] = []  # Cell values
    created_by: Optional[str] = None
    updated_at: Optional[datetime] = None
    
    def to_storage_format(self) -> ImpactMatrix:
        """Convert frontend format to storage format"""
        # Create mapping of impact type IDs to their areas of impact
        areas_of_impact = {}
        for impact_type in self.impact_types:
            if impact_type.area_of_impact:
                areas_of_impact[impact_type.name] = impact_type.area_of_impact
        
        # Create storage cells
        storage_cells = []
        for cell in self.cells:
            # Find the impact type and level names
            impact_type_name = next((t.name for t in self.impact_types if t.id == cell.impact_type_id), cell.impact_type_id)
            impact_level_name = next((l.name for l in self.impact_levels if l.id == cell.impact_level_id), cell.impact_level_id)
            
            storage_cells.append(
                ImpactMatrixCell(
                    impact_type=impact_type_name,
                    impact_level=impact_level_name,
                    description=cell.description
                )
            )
        
        # Create metadata
        metadata = {
            "title": self.title,
            "description": self.description,
            "impact_levels": [level.dict() for level in self.impact_levels],
            "impact_types": [type.dict() for type in self.impact_types],
            "created_by": self.created_by,
            "updated_at": self.updated_at or datetime.now().isoformat()
        }
        
        return ImpactMatrix(
            cells=storage_cells,
            impact_types=[t.name for t in self.impact_types],
            impact_levels=[l.name for l in self.impact_levels],
            areas_of_impact=areas_of_impact,
            metadata=metadata
        )

# Module licensing schemas
class Module(BaseModel):
    """Schema for a single module"""
    id: int
    name: str
    description: Optional[str] = None
    
class ModuleLicense(BaseModel):
    """Schema for module licensing"""
    module_id: int
    is_licensed: bool = False
    start_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None

class OrganizationModules(BaseModel):
    """Schema for updating organization module licenses"""
    modules: List[ModuleLicense]

class AvailableModules(BaseModel):
    """Schema for available modules that can be licensed"""
    modules: List[Module]

# Define available modules
AVAILABLE_MODULES = [
    Module(id=1, name="Process Mapping", description="Map and document critical business processes"),
    Module(id=2, name="Service Mapping", description="Map services to processes and infrastructure"),
    Module(id=3, name="BIA Process", description="Business Impact Analysis for critical processes"),
    Module(id=4, name="Risk Assessment", description="Identify and assess risks to business continuity"),
    Module(id=5, name="Recovery Strategy Development", description="Develop strategies for business recovery"),
    Module(id=6, name="Business Continuity Plan Development", description="Create comprehensive continuity plans"),
    Module(id=7, name="Crisis Management & Communication Plan", description="Plan for crisis response and communication"),
    Module(id=8, name="Business Resilience Testing", description="Test and validate resilience measures"),
    Module(id=9, name="Continual Improvement", description="Continuously improve resilience capabilities"),
    Module(id=10, name="BCM Maturity & KPIs", description="Measure and track business continuity maturity"),
    Module(id=11, name="Internal Audit & Management Review", description="Review and audit resilience measures"),
    Module(id=12, name="Business Resilience Gap Assessment", description="Identify and address resilience gaps")
]

# Shared properties
class OrganizationDescription(BaseModel):
    """Schema for updating organization description"""
    location: Optional[str] = None
    purpose: Optional[str] = None
    established: Optional[str] = None
    employee_count: Optional[int] = None
    website: Optional[str] = None
    additional_contacts: Optional[Dict[str, str]] = None
    other_details: Optional[Dict[str, Any]] = None

class OrganizationBase(BaseModel):
    """Base schema for organization data"""
    name: str
    industry: Optional[str] = None
    size: Optional[int] = None
    address: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    website: Optional[str] = None
    description: Optional[OrganizationDescription] = None
    head_username: Optional[str] = None
    sector: Optional[str] = None
    criticality: Optional[str] = None
    impact_matrix: Optional[ImpactMatrix] = None
    licensed_modules: Optional[List[ModuleLicense]] = None
    modules: Optional[List[ModuleLicense]] = None

# Schema for creating a minimal organization with description
class OrganizationCreateMinimal(BaseModel):
    """Schema for creating a minimal organization with just name and description"""
    name: str
    description: Optional[OrganizationDescription] = None

# Properties to receive on organization creation
class OrganizationCreate(OrganizationBase):
    pass

# Properties to receive on organization update
class OrganizationUpdate(OrganizationBase):
    name: Optional[str] = None

# Properties shared by models stored in DB
class OrganizationInDBBase(OrganizationBase):
    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True  # Replaces orm_mode=True in Pydantic v2

# Properties to return to client
class Organization(OrganizationInDBBase):
    pass

# Properties stored in DB
class OrganizationInDB(OrganizationInDBBase):
    pass

# Schema for updating organization criticality
class OrganizationCriticality(BaseModel):
    """Schema for updating organization criticality"""
    criticality: str
