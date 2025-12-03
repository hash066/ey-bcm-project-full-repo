"""
Pydantic schemas for the Procedures module.
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

class ProcedureType(str, Enum):
    """Procedure types."""
    BIA = "bia"
    RISK_ASSESSMENT = "risk_assessment"
    BCM_PLAN = "bcm_plan"
    CRISIS_COMMUNICATION = "crisis_communication"
    RECOVERY_STRATEGY = "recovery_strategy"
    TESTING_EXERCISING = "testing_exercising"
    TRAINING_AWARENESS = "training_awareness"
    PERFORMANCE_MONITORING = "performance_monitoring"
    NONCONFORMITY_CORRECTIVE_ACTIONS = "nonconformity_corrective_actions"

class DocumentInfo(BaseModel):
    """Document information schema."""
    document_name: str = Field(..., description="Document name")
    document_owner: str = Field(..., description="Document owner")
    document_version_no: str = Field(..., description="Document version number")
    document_version_date: str = Field(..., description="Document version date")
    prepared_by: str = Field(..., description="Prepared by")
    reviewed_by: str = Field(..., description="Reviewed by")
    approved_by: str = Field(..., description="Approved by")

class ChangeLogEntry(BaseModel):
    """Change log entry schema."""
    sr_no: int = Field(..., description="Serial number")
    version_no: str = Field(..., description="Version number")
    approval_date: Optional[str] = Field(None, description="Approval date")
    description_of_change: str = Field(..., description="Description of change")
    reviewed_by: str = Field(..., description="Reviewed by")
    approved_by: str = Field(..., description="Approved by")

class LLMContent(BaseModel):
    """LLM generated content schema."""
    introduction: Optional[str] = Field(None, description="AI-generated introduction")
    scope: Optional[str] = Field(None, description="AI-generated scope")
    objective: Optional[str] = Field(None, description="AI-generated objective")
    methodology: Optional[str] = Field(None, description="AI-generated methodology")
    process_flow: Optional[str] = Field(None, description="AI-generated process flow")
    roles_responsibilities: Optional[str] = Field(None, description="AI-generated roles and responsibilities")
    review_frequency: Optional[str] = Field(None, description="AI-generated review frequency")
    
    # BIA-specific fields
    impact_parameters: Optional[List[str]] = Field(None, description="AI-generated impact parameters")
    critical_processes: Optional[List[Dict[str, Any]]] = Field(None, description="AI-generated critical processes")
    peak_periods: Optional[Dict[str, str]] = Field(None, description="AI-predicted peak periods")
    impact_scale_matrix: Optional[Dict[str, Any]] = Field(None, description="AI-generated impact scale matrix")
    
    # BCM Plan specific fields
    bcm_policy: Optional[str] = Field(None, description="AI-generated BCM policy")
    bcm_questions: Optional[List[str]] = Field(None, description="AI-generated BCM questions")
    
    # Risk Assessment specific fields
    risk_parameters: Optional[List[str]] = Field(None, description="AI-generated risk parameters")
    control_effectiveness: Optional[Dict[str, Any]] = Field(None, description="AI-generated control effectiveness")
    risk_value_matrix: Optional[Dict[str, Any]] = Field(None, description="AI-generated risk value matrix")

class ProcedureDocumentBase(BaseModel):
    """Base procedure document schema."""
    procedure_type: ProcedureType = Field(..., description="Type of procedure")
    organization_id: int = Field(..., description="Organization ID")
    document_info: DocumentInfo = Field(..., description="Document information")
    change_log: List[ChangeLogEntry] = Field(..., description="Change log entries")
    use_llm_content: bool = Field(False, description="Whether to use LLM-generated content")
    llm_content: Optional[LLMContent] = Field(None, description="LLM-generated content")
    custom_content: Optional[Dict[str, Any]] = Field(None, description="Custom content overrides")

class ProcedureDocumentCreate(ProcedureDocumentBase):
    """Schema for creating a procedure document."""
    pass

class ProcedureDocumentUpdate(BaseModel):
    """Schema for updating a procedure document."""
    document_info: Optional[DocumentInfo] = Field(None, description="Document information")
    change_log: Optional[List[ChangeLogEntry]] = Field(None, description="Change log entries")
    use_llm_content: Optional[bool] = Field(None, description="Whether to use LLM-generated content")
    llm_content: Optional[LLMContent] = Field(None, description="LLM-generated content")
    custom_content: Optional[Dict[str, Any]] = Field(None, description="Custom content overrides")

class ProcedureDocumentResponse(ProcedureDocumentBase):
    """Schema for procedure document response."""
    id: int = Field(..., description="Procedure document ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    created_by: int = Field(..., description="User ID who created the document")
    updated_by: Optional[int] = Field(None, description="User ID who last updated the document")

    class Config:
        from_attributes = True

class ProcedureTemplateResponse(BaseModel):
    """Schema for procedure template response."""
    procedure_type: ProcedureType = Field(..., description="Type of procedure")
    template_name: str = Field(..., description="Template name")
    description: str = Field(..., description="Template description")
    default_document_info: DocumentInfo = Field(..., description="Default document information")
    sections: List[str] = Field(..., description="Template sections")

class LLMContentRequest(BaseModel):
    """Schema for LLM content generation request."""
    procedure_type: ProcedureType = Field(..., description="Type of procedure")
    organization_name: str = Field(..., description="Organization name")
    organization_id: int = Field(..., description="Organization ID")
    content_types: List[str] = Field(..., description="Types of content to generate")
    custom_parameters: Optional[Dict[str, Any]] = Field(None, description="Custom parameters for generation")

class LLMContentResponse(BaseModel):
    """Schema for LLM content generation response."""
    success: bool = Field(..., description="Whether generation was successful")
    content: Optional[LLMContent] = Field(None, description="Generated content")
    errors: Optional[List[str]] = Field(None, description="Any errors that occurred")
    warnings: Optional[List[str]] = Field(None, description="Any warnings")

class ProcedureExportRequest(BaseModel):
    """Schema for procedure export request."""
    procedure_id: int = Field(..., description="Procedure document ID")
    format: str = Field("pdf", description="Export format (pdf, docx, html)")
    include_llm_content: bool = Field(True, description="Whether to include LLM content")
    custom_styling: Optional[Dict[str, Any]] = Field(None, description="Custom styling options")

class ProcedureExportResponse(BaseModel):
    """Schema for procedure export response."""
    success: bool = Field(..., description="Whether export was successful")
    download_url: Optional[str] = Field(None, description="Download URL for the exported file")
    file_name: str = Field(..., description="Name of the exported file")
    file_size: Optional[int] = Field(None, description="Size of the exported file in bytes")
    expires_at: Optional[datetime] = Field(None, description="When the download link expires")
