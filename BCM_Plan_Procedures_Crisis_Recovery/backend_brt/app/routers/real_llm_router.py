"""
Real LLM Router - API endpoints for real AI generation
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.services.real_llm_service import RealLLMService
from app.services.enhanced_procedure_service import EnhancedProcedureService
from app.db.postgres import get_db
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/real-llm", tags=["Real LLM"])

# Request models
class DescriptionRequest(BaseModel):
    query_type: str
    query_name: str

class ImpactMatrixRequest(BaseModel):
    process_name: str
    impact_name: str

class PeakPeriodRequest(BaseModel):
    department: str
    process_name: str
    sector: str

class BCMPolicyRequest(BaseModel):
    organization_name: str
    standards: List[str] = []
    custom_notes: str = ""

# Initialize service
llm_service = RealLLMService()

@router.post("/get-description")
async def get_description(request: DescriptionRequest):
    """Generate AI description for a process or department"""
    try:
        result = await llm_service.get_description(request.query_type, request.query_name)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/get-impact-scale-matrix")
async def get_impact_scale_matrix(request: ImpactMatrixRequest):
    """Generate AI impact scale matrix"""
    try:
        result = await llm_service.get_impact_scale_matrix(request.process_name, request.impact_name)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/get-peak-period")
async def get_peak_period(request: PeakPeriodRequest):
    """Generate AI peak period prediction"""
    try:
        result = await llm_service.get_peak_period(request.department, request.process_name, request.sector)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-bcm-policy")
async def generate_bcm_policy(request: BCMPolicyRequest):
    """Generate AI BCM policy"""
    try:
        result = await llm_service.generate_bcm_policy(request.organization_name, request.standards, request.custom_notes)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/generate-bcm-questions")
async def generate_bcm_questions():
    """Generate AI BCM questions"""
    try:
        result = await llm_service.generate_bcm_questions()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Enhanced procedure endpoints
class ProcedureGenerationRequest(BaseModel):
    procedure_type: str
    options: Optional[Dict[str, Any]] = {}

class ProcedureRefinementRequest(BaseModel):
    procedure_type: str
    refinement_instructions: str
    current_content: Dict[str, Any]

class ExistingProcedureAnalysisRequest(BaseModel):
    procedure_type: str
    existing_content: str

@router.post("/enhanced/generate")
async def generate_complete_procedure(
    request: ProcedureGenerationRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate complete procedure document"""
    try:
        service = EnhancedProcedureService(db)
        result = await service.generate_complete_procedure(
            current_user["organization_id"],
            request.procedure_type,
            request.options
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/enhanced/refine")
async def refine_procedure(
    request: ProcedureRefinementRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Refine existing procedure based on instructions"""
    try:
        service = EnhancedProcedureService(db)
        result = await service.refine_procedure(
            current_user["organization_id"],
            request.procedure_type,
            request.refinement_instructions,
            request.current_content
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/enhanced/analyze-existing")
async def analyze_existing_procedure(
    request: ExistingProcedureAnalysisRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Analyze existing procedure and suggest improvements"""
    try:
        service = EnhancedProcedureService(db)
        result = await service.analyze_existing_procedure(
            current_user["organization_id"],
            request.procedure_type,
            request.existing_content
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))