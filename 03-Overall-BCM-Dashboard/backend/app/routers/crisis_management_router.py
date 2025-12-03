"""
Crisis Management module router.
"""
import os
import shutil
from typing import List, Dict, Any, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse, FileResponse
from sqlalchemy.orm import Session
import pdfplumber
import json

from app.core.config import settings
from app.db.postgres import get_db
from app.models.crisis_management_models import (
    CrisisTemplate, 
    CrisisPlan, 
    CrisisPlanSection, 
    CrisisCommunicationPlan
)
from app.middleware.auth import get_current_user, require_module_access
from app.services.supabase_service import upload_file_to_supabase, get_file_from_supabase

# Create router
router = APIRouter(
    prefix="/crisis-management",
    tags=["Crisis Management"],
    responses={404: {"description": "Not found"}},
)

# Temporary directory for file uploads
TEMP_DIR = os.path.join(os.path.dirname(__file__), "temp")
os.makedirs(TEMP_DIR, exist_ok=True)

# Module ID for access control
MODULE_ID = 6  # ID for Crisis Management module

# Dependency for module access
def require_crisis_management_access(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Dependency to check if the current user's organization has access to the Crisis Management module.
    """
    if not current_user or not hasattr(current_user, "organization_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not associated with an organization"
        )
    
    return require_module_access(MODULE_ID, current_user.organization_id, db, current_user)

@router.post("/template/upload", status_code=status.HTTP_201_CREATED)
async def upload_crisis_template(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    _: None = Depends(require_crisis_management_access)
):
    """
    Upload a crisis management template PDF and extract its content.
    """
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    temp_path = None
    try:
        # Save file temporarily
        temp_path = os.path.join(TEMP_DIR, file.filename)
        os.makedirs(os.path.dirname(temp_path), exist_ok=True)
        with open(temp_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        
        # Extract text from PDF
        extracted_text = ""
        with pdfplumber.open(temp_path) as pdf:
            extracted_text = "\n\n".join(page.extract_text() or "" for page in pdf.pages)
        
        # Upload to Supabase storage
        storage_path = f"crisis_management/{current_user.organization_id}/templates/{file.filename}"
        supabase_url = upload_file_to_supabase(temp_path, storage_path, file.content_type)
        
        # Analyze for missing fields (placeholder - in a real implementation, 
        # this would use NLP or a predefined template structure)
        missing_fields = [
            {"name": "organization_name", "label": "Organization Name", "type": "text"},
            {"name": "crisis_team_lead", "label": "Crisis Team Lead", "type": "text"},
            {"name": "emergency_contact", "label": "Emergency Contact Number", "type": "text"}
        ]
        
        # Create database record
        template = CrisisTemplate(
            organization_id=current_user.organization_id,
            name=file.filename,
            file_path=storage_path,
            file_size=os.path.getsize(temp_path),
            content_type=file.content_type,
            extracted_text=extracted_text,
            missing_fields=missing_fields
        )
        
        db.add(template)
        db.commit()
        db.refresh(template)
        
        return {
            "template_id": template.id,
            "name": template.name,
            "missing_fields": missing_fields
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred during template upload: {str(e)}")
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


@router.post("/template/missing-fields", status_code=status.HTTP_200_OK)
async def fill_missing_fields(
    template_id: UUID,
    missing_fields: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    _: None = Depends(require_crisis_management_access)
):
    """
    Fill in missing fields for a template.
    """
    template = db.query(CrisisTemplate).filter(
        CrisisTemplate.id == template_id,
        CrisisTemplate.organization_id == current_user.organization_id
    ).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Store the provided values
    # In a real implementation, you might want to update the template or create a new record
    return {"status": "success", "template_id": template_id}


@router.post("/generate", status_code=status.HTTP_201_CREATED)
async def generate_crisis_plan(
    template_id: UUID,
    name: str = Form(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    _: None = Depends(require_crisis_management_access)
):
    """
    Generate a crisis management plan from a template.
    """
    template = db.query(CrisisTemplate).filter(
        CrisisTemplate.id == template_id,
        CrisisTemplate.organization_id == current_user.organization_id
    ).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Create a new crisis plan
    crisis_plan = CrisisPlan(
        template_id=template_id,
        organization_id=current_user.organization_id,
        name=name,
        status="draft"
    )
    
    db.add(crisis_plan)
    db.commit()
    db.refresh(crisis_plan)
    
    # Create default sections based on the template
    sections = [
        {"heading": "Executive Summary", "content": "Executive summary of the crisis management plan.", "order": 1},
        {"heading": "Action Plan", "content": "Step-by-step actions for crisis response and recovery.", "order": 2},
        {"heading": "Crisis Management Team (CMT)", "content": "Key team members, roles, and contact information.", "order": 3},
        {"heading": "Stakeholders", "content": "List of internal and external stakeholders.", "order": 4},
        {"heading": "Potential Crises & Scenarios", "content": "Types of crises the organization may face.", "order": 5},
        {"heading": "Communication Plan", "content": "How information is communicated during a crisis.", "order": 6},
        {"heading": "Media Statement Template", "content": "Template for official media statements.", "order": 7},
        {"heading": "FAQ in a Crisis", "content": "Frequently asked questions and answers.", "order": 8},
        {"heading": "Checklists", "content": "Internal and external checklists for crisis response.", "order": 9},
        {"heading": "Company Information & Contacts", "content": "Organization details and main contacts.", "order": 10}
    ]
    
    for section_data in sections:
        section = CrisisPlanSection(
            crisis_plan_id=crisis_plan.id,
            heading=section_data["heading"],
            content=section_data["content"],
            order=section_data["order"]
        )
        db.add(section)
    
    # Create a communication plan
    communication_plan = CrisisCommunicationPlan(
        crisis_plan_id=crisis_plan.id,
        organization_id=current_user.organization_id,
        media_statement="Default media statement template.",
        faq=[{"question": "What is a crisis?", "answer": "A crisis is an unexpected event that threatens operations."}],
        stakeholder_communications={"internal": [], "external": []}
    )
    
    db.add(communication_plan)
    db.commit()
    
    return {"plan_id": crisis_plan.id, "name": crisis_plan.name, "status": crisis_plan.status}


@router.get("/plans", status_code=status.HTTP_200_OK)
async def get_crisis_plans(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    _: None = Depends(require_crisis_management_access)
):
    """
    Get all crisis plans for the current organization.
    """
    plans = db.query(CrisisPlan).filter(
        CrisisPlan.organization_id == current_user.organization_id
    ).all()
    
    return [
        {
            "id": plan.id,
            "name": plan.name,
            "status": plan.status,
            "created_at": plan.created_at,
            "updated_at": plan.updated_at
        }
        for plan in plans
    ]


@router.get("/plan/{plan_id}", status_code=status.HTTP_200_OK)
async def get_crisis_plan(
    plan_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    _: None = Depends(require_crisis_management_access)
):
    """
    Get a specific crisis plan with all its sections.
    """
    plan = db.query(CrisisPlan).filter(
        CrisisPlan.id == plan_id,
        CrisisPlan.organization_id == current_user.organization_id
    ).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Crisis plan not found")
    
    sections = db.query(CrisisPlanSection).filter(
        CrisisPlanSection.crisis_plan_id == plan_id
    ).order_by(CrisisPlanSection.order).all()
    
    return {
        "id": plan.id,
        "name": plan.name,
        "status": plan.status,
        "created_at": plan.created_at,
        "updated_at": plan.updated_at,
        "sections": [
            {
                "id": section.id,
                "heading": section.heading,
                "content": section.content,
                "order": section.order
            }
            for section in sections
        ]
    }


@router.get("/section/{section_id}", status_code=status.HTTP_200_OK)
async def get_crisis_section(
    section_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    _: None = Depends(require_crisis_management_access)
):
    """
    Get a specific section of a crisis plan.
    """
    section = db.query(CrisisPlanSection).join(CrisisPlan).filter(
        CrisisPlanSection.id == section_id,
        CrisisPlan.organization_id == current_user.organization_id
    ).first()
    
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    return {
        "id": section.id,
        "heading": section.heading,
        "content": section.content,
        "order": section.order
    }


@router.post("/section/{section_id}", status_code=status.HTTP_200_OK)
async def update_crisis_section(
    section_id: UUID,
    content: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    _: None = Depends(require_crisis_management_access)
):
    """
    Update a specific section of a crisis plan.
    """
    section = db.query(CrisisPlanSection).join(CrisisPlan).filter(
        CrisisPlanSection.id == section_id,
        CrisisPlan.organization_id == current_user.organization_id
    ).first()
    
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    section.content = content
    db.commit()
    db.refresh(section)
    
    return {
        "id": section.id,
        "heading": section.heading,
        "content": section.content,
        "order": section.order
    }


@router.get("/pdf/{plan_id}", status_code=status.HTTP_200_OK)
async def download_crisis_plan_pdf(
    plan_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    _: None = Depends(require_crisis_management_access)
):
    """
    Generate and download a PDF of the crisis management plan.
    """
    plan = db.query(CrisisPlan).filter(
        CrisisPlan.id == plan_id,
        CrisisPlan.organization_id == current_user.organization_id
    ).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Crisis plan not found")
    
    # In a real implementation, you would generate a PDF here
    # For now, we'll just return a placeholder response
    return {"message": "PDF generation would happen here", "plan_id": plan_id}


@router.get("/communication/pdf/{plan_id}", status_code=status.HTTP_200_OK)
async def download_communication_pdf(
    plan_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    _: None = Depends(require_crisis_management_access)
):
    """
    Generate and download a PDF of the crisis communication plan.
    """
    plan = db.query(CrisisPlan).filter(
        CrisisPlan.id == plan_id,
        CrisisPlan.organization_id == current_user.organization_id
    ).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Crisis plan not found")
    
    # In a real implementation, you would generate a PDF here
    # For now, we'll just return a placeholder response
    return {"message": "Communication PDF generation would happen here", "plan_id": plan_id}


@router.post("/llm/completion", status_code=status.HTTP_200_OK)
async def generate_section_with_llm(
    section: str,
    context: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    _: None = Depends(require_crisis_management_access)
):
    """
    Generate content for a section using an LLM.
    """
    # In a real implementation, you would call an LLM API here
    # For now, we'll just return placeholder content
    generated_content = f"This is AI-generated content for the {section} section, based on the provided context."
    
    return {"generated_content": generated_content}
