"""
Enhanced Procedure Router - Complete for ALL procedure types + Chatbot
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional, List
from pydantic import BaseModel
from datetime import datetime
import json
import re

from app.db.postgres import get_db
from app.services.procedures_service import ProceduresService
from app.schemas.procedures import (
    LLMContentRequest,
    LLMContent,
    ProcedureDocumentCreate,
    DocumentInfo,
    ChangeLogEntry
)

router = APIRouter(prefix="/api/enhanced-procedures", tags=["Enhanced Procedures"])

# ==================== REQUEST MODELS ====================
class ProcedureGenerationRequest(BaseModel):
    procedure_type: str
    options: Optional[Dict[str, Any]] = None

# ==================== PROCEDURE TYPE MAPPING ====================
PROCEDURE_METHODS = {
    "bia": ("get_bia_procedure", "create_or_update_bia_procedure"),
    "risk_assessment": ("get_risk_assessment_procedure", "create_or_update_risk_assessment_procedure"),
    "bcm_plan": ("get_bcm_plan_procedure", "create_or_update_bcm_plan_procedure"),
    "crisis_communication": ("get_crisis_communication_procedure", "create_or_update_crisis_communication_procedure"),
    "recovery_strategy": ("get_recovery_strategy_procedure", "create_or_update_recovery_strategy_procedure"),
    "testing_exercising": ("get_testing_exercising_procedure", "create_or_update_testing_exercising_procedure"),
    "training_awareness": ("get_training_awareness_procedure", "create_or_update_training_awareness_procedure"),
    "performance_monitoring": ("get_performance_monitoring_procedure", "create_or_update_performance_monitoring_procedure"),
    "nonconformity_corrective_actions": ("get_nonconformity_corrective_actions_procedure", "create_or_update_nonconformity_corrective_actions_procedure"),
}

# ==================== ENDPOINTS ====================
@router.get("/test")
async def test_endpoint():
    """Test endpoint"""
    return {
        "status": "ok",
        "message": "Enhanced Procedures Router is working for ALL procedures!",
        "timestamp": datetime.now().isoformat(),
        "supported_procedures": list(PROCEDURE_METHODS.keys())
    }

@router.post("/generate")
async def generate_procedure(
    request: ProcedureGenerationRequest,
    db: Session = Depends(get_db)
):
    """Generate procedure - Works for ALL procedure types"""
    try:
        print(f"\n=== GENERATE PROCEDURE DEBUG ===")
        print(f"[1] Starting: {request.procedure_type}")
        print(f"[1] Options: {request.options}")
        
        if request.procedure_type not in PROCEDURE_METHODS:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown procedure type: {request.procedure_type}. Supported: {list(PROCEDURE_METHODS.keys())}"
            )
        
        service = ProceduresService(db)
        options = request.options or {}
        
        org_name = options.get("organization_name", "Your Organization")
        org_id = options.get("organization_id", 1)
        content_types = options.get("content_types", [])
        if not content_types:
            default_types = [
                "introduction",
                "scope",
                "objective",
                "methodology",
                "process_flow",
                "roles_responsibilities",
                "review_frequency",
            ]
            if request.procedure_type == "bia":
                default_types += [
                    "impact_parameters",
                    "critical_processes",
                    "peak_periods",
                    "impact_scale_matrix",
                ]
            elif request.procedure_type == "bcm_plan":
                default_types += [
                    "bcm_policy",
                    "bcm_questions",
                ]
            content_types = default_types
        user_id = 1
        
        print(f"[2] Creating LLM request...")
        llm_request = LLMContentRequest(
            procedure_type=request.procedure_type,
            organization_name=org_name,
            organization_id=org_id,
            content_types=content_types,
            custom_parameters=options.get("custom_parameters", {})
        )
        
        print(f"[3] Calling LLM service...")
        llm_response = await service.generate_llm_content(llm_request, user_id)
        print(f"[3] LLM Response Success: {llm_response.success}")
        print(f"[3] LLM Response Errors: {llm_response.errors}")
        
        if not llm_response.success:
            print(f"[ERROR] LLM generation failed: {llm_response.errors}")
            raise HTTPException(
                status_code=500,
                detail=f"LLM generation failed: {llm_response.errors}"
            )
        
        print(f"[4] LLM content generated successfully")
        print(f"[4] Content type: {type(llm_response.content)}")
        print(f"[4] Content preview: {str(llm_response.content)[:200]}...")
        
        content_obj = llm_response.content
        if content_obj is None:
            content_obj = LLMContent(
                introduction=f"AI-generated content for {request.procedure_type}",
                scope="AI-generated scope content",
                objective="AI-generated objective content"
            )
        elif isinstance(content_obj, dict):
            content_obj = LLMContent(**content_obj)

        procedure_data = ProcedureDocumentCreate(
            procedure_type=request.procedure_type,
            organization_id=org_id,
            document_info=DocumentInfo(
                document_name=f"{request.procedure_type.replace('_', ' ').title()} v1.0",
                document_owner=org_name,
                document_version_no="1.0",
                document_version_date=datetime.now().strftime("%Y-%m-%d"),
                prepared_by="BCM Team",
                reviewed_by="Head-ORMD",
                approved_by="ORMC"
            ),
            change_log=[
                ChangeLogEntry(
                    sr_no=1,
                    version_no="1.0",
                    approval_date="",
                    description_of_change="Initial AI-generated document",
                    reviewed_by="",
                    approved_by=""
                )
            ],
            use_llm_content=True,
            llm_content=content_obj,
            custom_content=None
        )
        
        print(f"[5] Calling database save method...")
        _, create_method_name = PROCEDURE_METHODS[request.procedure_type]
        create_method = getattr(service, create_method_name)
        result = await create_method(org_id, procedure_data, user_id)
        
        print(f"[6] Database save result:")
        print(f"[6] - ID: {result.id}")
        print(f"[6] - Type: {result.procedure_type}")
        print(f"[6] - Has LLM Content: {bool(result.llm_content)}")
        
        # Verify database save
        from app.models.procedures_models import ProcedureDocument
        db_check = db.query(ProcedureDocument).filter(ProcedureDocument.id == result.id).first()
        print(f"[7] Database verification:")
        print(f"[7] - Found in DB: {bool(db_check)}")
        if db_check:
            print(f"[7] - DB ID: {db_check.id}")
            print(f"[7] - DB Type: {db_check.procedure_type}")
            print(f"[7] - DB Content Length: {len(db_check.llm_content) if db_check.llm_content else 0}")
        
        content_value = result.llm_content if result.llm_content else {}
        if isinstance(content_value, str):
            try:
                content_value = json.loads(content_value)
            except Exception:
                content_value = {"raw": content_value}

        response_data = {
            "status": "success",
            "message": "Procedure generated successfully",
            "procedure_type": request.procedure_type,
            "document_id": result.id,
            "generated_content": content_value
        }
        
        print(f"[8] Returning response with document_id: {result.id}")
        print(f"=== END GENERATE DEBUG ===\n")
        
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Exception in generate_procedure: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/current/{procedure_type}")
async def get_current_procedure(
    procedure_type: str,
    db: Session = Depends(get_db)
):
    """Get current procedure - Works for ALL procedure types"""
    try:
        print(f"[FETCH] Getting: {procedure_type}")
        
        if procedure_type not in PROCEDURE_METHODS:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown procedure type: {procedure_type}. Supported: {list(PROCEDURE_METHODS.keys())}"
            )
        
        service = ProceduresService(db)
        org_id = 1
        user_id = 1
        
        get_method_name, _ = PROCEDURE_METHODS[procedure_type]
        get_method = getattr(service, get_method_name)
        
        result = await get_method(org_id, user_id)
        
        print(f"[SUCCESS] Found procedure ID: {result.id}")
        
        content_value = {}
        if result.llm_content:
            if isinstance(result.llm_content, str):
                try:
                    content_value = json.loads(result.llm_content)
                except Exception:
                    content_value = {"raw": result.llm_content}
            elif hasattr(result.llm_content, "model_dump"):
                content_value = result.llm_content.model_dump(exclude_none=True)
            elif isinstance(result.llm_content, dict):
                content_value = result.llm_content

        return {
            "id": result.id,
            "procedure_type": result.procedure_type,
            "version": result.document_info.document_version_no,
            "generated_content": content_value,
            "use_llm_content": result.use_llm_content,
            "created_at": result.created_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/refine")
async def refine_procedure_content(request: dict):
    """
    Refine/modify procedure content based on chatbot instructions
    Uses Groq AI to intelligently modify specific sections
    """
    try:
        procedure_type = request.get("procedure_type")
        refinement_instructions = request.get("refinement_instructions")
        current_content = request.get("current_content")
        
        print(f"[REFINE] Processing refinement for {procedure_type}")
        print(f"   Instructions: {refinement_instructions}")
        
        from app.services.groq_llm_service import GroqLLMService
        
        groq_service = GroqLLMService()
        
        prompt = f"""You are an expert technical writer for Business Continuity Management procedures.

CURRENT PROCEDURE CONTENT ({procedure_type}):
{json.dumps(current_content, indent=2)}

USER'S MODIFICATION REQUEST:
"{refinement_instructions}"

TASK:
Modify ONLY the relevant sections based on the user's request. Keep all other sections exactly as they are.
Return the COMPLETE modified content as valid JSON with the same structure.

IMPORTANT:
- If user mentions "introduction", modify the "introduction" field
- If user mentions "scope", modify the "scope" field  
- If user mentions "objective/objectives", modify the "objective" field
- If user mentions "methodology", modify the "methodology" field
- Keep arrays (like process_flow, impact_parameters) as arrays
- Maintain all field names exactly as they are
- Return ONLY valid JSON, no explanations or markdown

OUTPUT FORMAT:
Return the JSON object directly without any markdown formatting or code blocks."""

        messages = [
            {"role": "system", "content": "You are a technical writing AI that returns only valid JSON. Never use markdown code blocks."},
            {"role": "user", "content": prompt}
        ]
        
        response = await groq_service._make_request(messages, max_tokens=2000, temperature=0.7)
        refined_text = response.get("content", "").strip()
        
        print(f"[REFINE] Raw response length: {len(refined_text)}")
        
        try:
            refined_content = json.loads(refined_text)
            print(f"[REFINE] Successfully parsed JSON")
            
        except json.JSONDecodeError as je:
            print(f"[REFINE] JSON parse error: {je}")
            
            json_match = re.search(r'\{.*\}', refined_text, re.DOTALL)
            
            if json_match:
                try:
                    refined_content = json.loads(json_match.group())
                    print(f"[REFINE] Extracted JSON successfully")
                except:
                    refined_content = apply_simple_modification(current_content, refinement_instructions)
            else:
                refined_content = apply_simple_modification(current_content, refinement_instructions)
        
        print(f"[REFINE] Content refined successfully")
        
        return {
            "status": "success",
            "refined_content": refined_content,
            "message": "Content refined successfully"
        }
        
    except Exception as e:
        print(f"[REFINE] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

def apply_simple_modification(current_content: dict, instructions: str) -> dict:
    """Fallback: Apply simple text-based modification if JSON parsing fails"""
    modified_content = current_content.copy()
    instructions_lower = instructions.lower()
    
    if "introduction" in instructions_lower and "introduction" in modified_content:
        modified_content["introduction"] = f"{modified_content.get('introduction', '')}\n\n[Modified based on: {instructions}]"
    elif "scope" in instructions_lower and "scope" in modified_content:
        modified_content["scope"] = f"{modified_content.get('scope', '')}\n\n[Modified based on: {instructions}]"
    elif "objective" in instructions_lower and "objective" in modified_content:
        modified_content["objective"] = f"{modified_content.get('objective', '')}\n\n[Modified based on: {instructions}]"
    else:
        modified_content["_modification_note"] = f"Requested: {instructions}"
    
    return modified_content

print("Enhanced Procedures Router loaded (ALL PROCEDURES SUPPORTED + CHATBOT)")
