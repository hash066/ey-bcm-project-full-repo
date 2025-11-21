"""
Procedures Router
Handles API endpoints for the Procedures module including BIA, Risk Assessment, and BCM Plan procedures.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import logging
from datetime import datetime

from app.db.postgres import get_db
from app.middleware.auth import get_current_user
from app.models.rbac_models import User
from app.schemas.procedures import (
    ProcedureDocumentCreate,
    ProcedureDocumentUpdate,
    ProcedureDocumentResponse,
    ProcedureTemplateResponse,
    LLMContentRequest,
    LLMContentResponse
)
from app.services.procedures_service import ProceduresService

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/procedures",
    tags=["procedures"],
    responses={404: {"description": "Not found"}},
)

@router.get("/templates", response_model=List[ProcedureTemplateResponse])
async def get_procedure_templates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get available procedure templates.
    """
    try:
        service = ProceduresService(db)
        templates = await service.get_procedure_templates()
        return templates
    except Exception as e:
        logger.error(f"Error getting procedure templates: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve procedure templates"
        )

@router.get("/bia-procedure/{organization_id}", response_model=ProcedureDocumentResponse)
async def get_bia_procedure(
    organization_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get BIA procedure document for an organization.
    """
    try:
        service = ProceduresService(db)
        procedure = await service.get_bia_procedure(organization_id, current_user.id)
        return procedure
    except Exception as e:
        logger.error(f"Error getting BIA procedure: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve BIA procedure"
        )

@router.post("/bia-procedure/{organization_id}", response_model=ProcedureDocumentResponse)
async def create_or_update_bia_procedure(
    organization_id: int,
    procedure_data: ProcedureDocumentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create or update BIA procedure document for an organization.
    """
    try:
        service = ProceduresService(db)
        procedure = await service.create_or_update_bia_procedure(
            organization_id, 
            procedure_data, 
            current_user.id
        )
        return procedure
    except Exception as e:
        logger.error(f"Error creating/updating BIA procedure: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create or update BIA procedure"
        )

@router.get("/risk-assessment-procedure/{organization_id}", response_model=ProcedureDocumentResponse)
async def get_risk_assessment_procedure(
    organization_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get Risk Assessment procedure document for an organization.
    """
    try:
        service = ProceduresService(db)
        procedure = await service.get_risk_assessment_procedure(organization_id, current_user.id)
        return procedure
    except Exception as e:
        logger.error(f"Error getting Risk Assessment procedure: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve Risk Assessment procedure"
        )

@router.post("/risk-assessment-procedure/{organization_id}", response_model=ProcedureDocumentResponse)
async def create_or_update_risk_assessment_procedure(
    organization_id: int,
    procedure_data: ProcedureDocumentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create or update Risk Assessment procedure document for an organization.
    """
    try:
        service = ProceduresService(db)
        procedure = await service.create_or_update_risk_assessment_procedure(
            organization_id, 
            procedure_data, 
            current_user.id
        )
        return procedure
    except Exception as e:
        logger.error(f"Error creating/updating Risk Assessment procedure: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create or update Risk Assessment procedure"
        )

@router.get("/bcm-plan-procedure/{organization_id}", response_model=ProcedureDocumentResponse)
async def get_bcm_plan_procedure(
    organization_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get BCM Plan Development procedure document for an organization.
    """
    try:
        service = ProceduresService(db)
        procedure = await service.get_bcm_plan_procedure(organization_id, current_user.id)
        return procedure
    except Exception as e:
        logger.error(f"Error getting BCM Plan procedure: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve BCM Plan procedure"
        )

@router.post("/bcm-plan-procedure/{organization_id}", response_model=ProcedureDocumentResponse)
async def create_or_update_bcm_plan_procedure(
    organization_id: int,
    procedure_data: ProcedureDocumentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create or update BCM Plan Development procedure document for an organization.
    """
    try:
        service = ProceduresService(db)
        procedure = await service.create_or_update_bcm_plan_procedure(
            organization_id, 
            procedure_data, 
            current_user.id
        )
        return procedure
    except Exception as e:
        logger.error(f"Error creating/updating BCM Plan procedure: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create or update BCM Plan procedure"
        )

@router.get("/crisis-communication-procedure/{organization_id}", response_model=ProcedureDocumentResponse)
async def get_crisis_communication_procedure(
    organization_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get Crisis Communication procedure document for an organization.
    """
    try:
        service = ProceduresService(db)
        procedure = await service.get_crisis_communication_procedure(organization_id, current_user.id)
        return procedure
    except Exception as e:
        logger.error(f"Error getting Crisis Communication procedure: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve Crisis Communication procedure"
        )

@router.post("/crisis-communication-procedure/{organization_id}", response_model=ProcedureDocumentResponse)
async def create_or_update_crisis_communication_procedure(
    organization_id: int,
    procedure_data: ProcedureDocumentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create or update Crisis Communication procedure document for an organization.
    """
    try:
        service = ProceduresService(db)
        procedure = await service.create_or_update_crisis_communication_procedure(
            organization_id, 
            procedure_data, 
            current_user.id
        )
        return procedure
    except Exception as e:
        logger.error(f"Error creating/updating Crisis Communication procedure: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create or update Crisis Communication procedure"
        )

@router.get("/nonconformity-procedure/{organization_id}", response_model=ProcedureDocumentResponse)
async def get_nonconformity_procedure(
    organization_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get Nonconformity procedure document for an organization."""
    try:
        service = ProceduresService(db)
        procedure = await service.get_nonconformity_procedure(organization_id, current_user.id)
        return procedure
    except Exception as e:
        logger.error(f"Error getting Nonconformity procedure: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve Nonconformity procedure"
        )

@router.post("/nonconformity-procedure/{organization_id}", response_model=ProcedureDocumentResponse)
async def create_or_update_nonconformity_procedure(
    organization_id: int,
    procedure_data: ProcedureDocumentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or update Nonconformity procedure document for an organization."""
    try:
        service = ProceduresService(db)
        procedure = await service.create_or_update_nonconformity_procedure(
            organization_id, 
            procedure_data, 
            current_user.id
        )
        return procedure
    except Exception as e:
        logger.error(f"Error creating/updating Nonconformity procedure: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create or update Nonconformity procedure"
        )

@router.get("/performance-monitoring-procedure/{organization_id}", response_model=ProcedureDocumentResponse)
async def get_performance_monitoring_procedure(
    organization_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get Performance Monitoring procedure document for an organization."""
    try:
        service = ProceduresService(db)
        procedure = await service.get_performance_monitoring_procedure(organization_id, current_user.id)
        return procedure
    except Exception as e:
        logger.error(f"Error getting Performance Monitoring procedure: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve Performance Monitoring procedure"
        )

@router.post("/performance-monitoring-procedure/{organization_id}", response_model=ProcedureDocumentResponse)
async def create_or_update_performance_monitoring_procedure(
    organization_id: int,
    procedure_data: ProcedureDocumentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or update Performance Monitoring procedure document for an organization."""
    try:
        service = ProceduresService(db)
        procedure = await service.create_or_update_performance_monitoring_procedure(
            organization_id, 
            procedure_data, 
            current_user.id
        )
        return procedure
    except Exception as e:
        logger.error(f"Error creating/updating Performance Monitoring procedure: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create or update Performance Monitoring procedure"
        )

@router.get("/testing-exercising-procedure/{organization_id}", response_model=ProcedureDocumentResponse)
async def get_testing_exercising_procedure(
    organization_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get Testing and Exercising procedure document for an organization."""
    try:
        service = ProceduresService(db)
        procedure = await service.get_testing_exercising_procedure(organization_id, current_user.id)
        return procedure
    except Exception as e:
        logger.error(f"Error getting Testing and Exercising procedure: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve Testing and Exercising procedure"
        )

@router.post("/testing-exercising-procedure/{organization_id}", response_model=ProcedureDocumentResponse)
async def create_or_update_testing_exercising_procedure(
    organization_id: int,
    procedure_data: ProcedureDocumentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or update Testing and Exercising procedure document for an organization."""
    try:
        service = ProceduresService(db)
        procedure = await service.create_or_update_testing_exercising_procedure(
            organization_id, 
            procedure_data, 
            current_user.id
        )
        return procedure
    except Exception as e:
        logger.error(f"Error creating/updating Testing and Exercising procedure: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create or update Testing and Exercising procedure"
        )

@router.get("/training-awareness-procedure/{organization_id}", response_model=ProcedureDocumentResponse)
async def get_training_awareness_procedure(
    organization_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get Training and Awareness procedure document for an organization."""
    try:
        service = ProceduresService(db)
        procedure = await service.get_training_awareness_procedure(organization_id, current_user.id)
        return procedure
    except Exception as e:
        logger.error(f"Error getting Training and Awareness procedure: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve Training and Awareness procedure"
        )

@router.post("/training-awareness-procedure/{organization_id}", response_model=ProcedureDocumentResponse)
async def create_or_update_training_awareness_procedure(
    organization_id: int,
    procedure_data: ProcedureDocumentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or update Training and Awareness procedure document for an organization."""
    try:
        service = ProceduresService(db)
        procedure = await service.create_or_update_training_awareness_procedure(
            organization_id, 
            procedure_data, 
            current_user.id
        )
        return procedure
    except Exception as e:
        logger.error(f"Error creating/updating Training and Awareness procedure: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create or update Training and Awareness procedure"
        )

@router.post("/regenerate", response_model=ProcedureDocumentResponse)
async def regenerate_procedure(
    procedure_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Regenerate an existing procedure document.
    """
    try:
        service = ProceduresService(db)
        procedure = await service.regenerate_procedure(procedure_id, current_user.id)
        return procedure
    except Exception as e:
        logger.error(f"Error regenerating procedure: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to regenerate procedure"
        )

@router.post("/refine", response_model=ProcedureDocumentResponse)
async def refine_procedure(
    procedure_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Refine an existing procedure document.
    """
    try:
        service = ProceduresService(db)
        procedure = await service.refine_procedure(procedure_id, current_user.id)
        return procedure
    except Exception as e:
        logger.error(f"Error refining procedure: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to refine procedure"
        )

@router.post("/analyze-existing", response_model=Dict[str, Any])
async def analyze_existing_procedure(
    procedure_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyze an existing procedure document.
    """
    try:
        service = ProceduresService(db)
        analysis_results = await service.analyze_existing_procedure(procedure_id, current_user.id)
        return analysis_results
    except Exception as e:
        logger.error(f"Error analyzing existing procedure: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze existing procedure"
        )

@router.get("/versions/{procedure_type}", response_model=List[ProcedureDocumentResponse])
async def get_all_procedure_versions(
    procedure_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all versions of a procedure type.
    """
    try:
        service = ProceduresService(db)
        versions = await service.get_all_procedure_versions(procedure_type, current_user.id)
        return versions
    except Exception as e:
        logger.error(f"Error getting all procedure versions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve procedure versions"
        )

@router.get("/version/{procedure_type}/{version_id}", response_model=ProcedureDocumentResponse)
async def get_specific_procedure_version(
    procedure_type: str,
    version_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific version of a procedure.
    """
    try:
        service = ProceduresService(db)
        version = await service.get_specific_procedure_version(procedure_type, version_id, current_user.id)
        return version
    except Exception as e:
        logger.error(f"Error getting specific procedure version: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve specific procedure version"
        )

@router.post("/set-current", response_model=ProcedureDocumentResponse)
async def set_current_procedure_version(
    procedure_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Set a specific procedure version as current.
    """
    try:
        service = ProceduresService(db)
        procedure = await service.set_current_procedure_version(procedure_id, current_user.id)
        return procedure
    except Exception as e:
        logger.error(f"Error setting current procedure version: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to set current procedure version"
        )

@router.post("/upload", response_model=ProcedureDocumentResponse)
async def upload_procedure(
    procedure_data: ProcedureDocumentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload an existing procedure document.
    """
    try:
        service = ProceduresService(db)
        procedure = await service.upload_procedure(procedure_data, current_user.id)
        return procedure
    except Exception as e:
        logger.error(f"Error uploading procedure: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload procedure"
        )

@router.get("/current/{procedure_type}")
async def get_current_procedure(
    procedure_type: str,
    db: Session = Depends(get_db)
):
    """
    Get the current version of a procedure by type.
    """
    try:
        # Return empty for now - frontend will use fallback content
        return {
            "id": None,
            "generated_content": {},
            "created_at": None,
            "version": "1.0"
        }
    except Exception as e:
        logger.error(f"Error getting current procedure: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Procedure not found"
        )

@router.post("/generate-llm-content")
async def generate_llm_content(
    request: dict,
    db: Session = Depends(get_db)
):
    """
    Generate LLM content for procedures.
    """
    try:
        # Simple mock response for now
        return {
            "success": True,
            "generated_content": {
                "introduction": "AI-generated content for " + request.get("procedure_type", "procedure"),
                "scope": "AI-generated scope content",
                "objective": "AI-generated objective content"
            },
            "procedure_type": request.get("procedure_type"),
            "message": "Content generated successfully"
        }
    except Exception as e:
        logger.error(f"Error generating LLM content: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate LLM content"
        )

@router.get("/organization/{organization_id}/procedures", response_model=List[ProcedureDocumentResponse])
async def get_organization_procedures(
    organization_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all procedure documents for an organization.
    """
    try:
        service = ProceduresService(db)
        procedures = await service.get_organization_procedures(organization_id, current_user.id)
        return procedures
    except Exception as e:
        logger.error(f"Error getting organization procedures: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve organization procedures"
        )

@router.delete("/procedure/{procedure_id}")
async def delete_procedure(
    procedure_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a procedure document.
    """
    try:
        service = ProceduresService(db)
        await service.delete_procedure(procedure_id, current_user.id)
        return {"message": "Procedure deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting procedure: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete procedure"
        )

@router.get("/procedure/{procedure_id}/export")
async def export_procedure(
    procedure_id: int,
    format: str = "pdf",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export procedure document in specified format.
    """
    try:
        service = ProceduresService(db)
        export_data = await service.export_procedure(procedure_id, format, current_user.id)
        return export_data
    except Exception as e:
        logger.error(f"Error exporting procedure: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to export procedure"
        )