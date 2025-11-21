"""
Enhanced Procedure Router - WORKING VERSION
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
import os
import json
import re

from app.db.postgres import get_db
from app.models.procedures_models import ProcedureDocument  # ✅ CORRECT MODEL NAME

router = APIRouter(prefix="/api/enhanced-procedures", tags=["Enhanced Procedures"])

# ==================== REQUEST MODELS ====================
class ProcedureGenerationRequest(BaseModel):
    procedure_type: str
    options: Optional[Dict[str, Any]] = None

# ==================== HELPER FUNCTIONS ====================
async def call_groq_api(prompt: str, groq_api_key: str) -> str:
    """Call Groq API"""
    import aiohttp

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "llama-3.1-70b-versatile",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": 4000
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(url, headers=headers, json=payload) as response:
            if response.status != 200:
                error_text = await response.text()
                raise HTTPException(status_code=500, detail=f"Groq API error: {error_text}")

            result = await response.json()
            return result["choices"][0]["message"]["content"]

def extract_json_from_response(text: str) -> str:
    """Extract JSON from markdown code blocks"""
    text = text.strip()
    pattern = r'``````'
    match = re.search(pattern, text, re.DOTALL)
    return match.group(1).strip() if match else text

# ==================== ENDPOINTS ====================
@router.get("/test")
async def test_endpoint():
    """Test endpoint"""
    print("✅ TEST ENDPOINT CALLED")
    return {
        "status": "ok",
        "message": "Router is working!",
        "timestamp": datetime.now().isoformat()
    }

@router.post("/generate")
async def generate_procedure(request: ProcedureGenerationRequest, db: Session = Depends(get_db)):
    """Generate procedure - NO AUTH"""
    try:
        print(f"🚀 Generating: {request.procedure_type}")

        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            raise HTTPException(status_code=500, detail="GROQ_API_KEY not set")

        options = request.options or {}
        org_name = options.get("organization_name", "Test Org")
        org_id = options.get("organization_id", 1)
        content_types = options.get("content_types", [])

        # Build prompt
        prompt = f"""Generate a {request.procedure_type.replace('_', ' ').title()} procedure for {org_name}.

Create detailed content for: {', '.join(content_types)}

Return ONLY valid JSON with these keys. Each value should be 2-3 detailed paragraphs."""

        print("🤖 Calling Groq...")
        llm_response = await call_groq_api(prompt, groq_api_key)

        # Parse JSON
        json_str = extract_json_from_response(llm_response)
        generated_content = json.loads(json_str)
        print(f"✅ Generated {len(generated_content)} sections")

        # Save to DB
        new_doc = ProcedureDocument(
            procedure_type=request.procedure_type,
            organization_id=org_id,
            document_name=f"{request.procedure_type} v1.0",
            document_owner="Auto-generated",
            document_version_no="1.0",
            document_version_date=datetime.now().strftime("%Y-%m-%d"),
            prepared_by="System",
            reviewed_by="Pending",
            approved_by="Pending",
            use_llm_content=True,
            llm_content=generated_content,
            created_by=1
        )

        db.add(new_doc)
        try:
            db.commit()
            db.refresh(new_doc)
            print(f"💾 Saved to DB with ID: {new_doc.id}")
        except Exception as db_error:
            print(f"❌ Database error: {str(db_error)}")
            db.rollback()
            # If database fails, return the generated content without saving
            return {
                "status": "partial_success",
                "procedure_type": request.procedure_type,
                "generated_content": generated_content,
                "document_id": None,
                "error": "Database save failed, but content was generated"
            }

        return {
            "status": "success",
            "procedure_type": request.procedure_type,
            "generated_content": generated_content,
            "document_id": new_doc.id
        }

    except json.JSONDecodeError as e:
        print(f"❌ JSON error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Parse error: {str(e)}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        # Only rollback if db session exists
        if 'db' in locals():
            db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/current/{procedure_type}")
async def get_current(procedure_type: str, db: Session = Depends(get_db)):
    """Get current procedure"""
    try:
        print(f"📥 Fetching: {procedure_type}")

        doc = db.query(ProcedureDocument).filter(
            ProcedureDocument.procedure_type == procedure_type,
            ProcedureDocument.organization_id == 1
        ).order_by(ProcedureDocument.created_at.desc()).first()

        if not doc:
            raise HTTPException(status_code=404, detail="Not found")

        return {
            "id": doc.id,
            "procedure_type": doc.procedure_type,
            "version": doc.document_version_no,
            "generated_content": doc.llm_content or {},
            "created_at": doc.created_at.isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

print("✅ Enhanced Procedures Router loaded successfully")
