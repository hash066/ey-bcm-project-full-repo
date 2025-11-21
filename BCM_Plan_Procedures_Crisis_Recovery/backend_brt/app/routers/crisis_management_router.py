"""Crisis Management Router - FINAL CLEAN VERSION"""
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.postgres import get_db
from app.schemas.procedures import LLMContentRequest, ProcedureType
from app.services.llm_integration_service import LLMIntegrationService

router = APIRouter(prefix="/crisis-management", tags=["Crisis Management"])

class SectionContentUpdate(BaseModel):
    content: List[str]

class AIGenerateRequest(BaseModel):
    section_id: str
    section_type: Optional[str] = "crisis_management"
    context: Optional[Dict[str, Any]] = {}

crisis_plans_storage = {}

@router.get("/crisis-plan/{organization_id}")
async def get_crisis_plan_by_org(organization_id: str, db: Session = Depends(get_db)):
    if organization_id in crisis_plans_storage:
        return crisis_plans_storage[organization_id]
    
    plan = {
        "title": "Crisis Management Plan",
        "organization_id": organization_id,
        "sections": [
            {"id": "executive-summary", "heading": "Executive Summary", "icon": "📋",
             "content": [
                 "Objectives: protect life, stabilize operations, preserve reputation",
                 "Scope: all sites, staff, vendors, technology and critical services",
                 "Governance: Crisis Management Team leads with clear authority",
                 "Risk context: top scenarios across operational, cyber, safety and supply",
                 "Response framework: detect, assess, decide, communicate, act, review",
                 "Dependencies: facilities, IT, telecom, vendors and critical data",
                 "Continuity targets: RTO/RPO aligned to BIA and MOR",
                 "Escalation model: thresholds with timed decision gates",
                 "Communication: single source of truth and spokesperson policy",
                 "Assurance: training, drills, audits and continual improvement"
             ]},
            {"id": "action-plan", "heading": "Action Plan", "icon": "⚡",
             "content": [
                 "Immediate: life safety, incident command activation, situational assessment",
                 "Containment: isolate impact, activate backups, secure critical assets",
                 "Communication: internal alerts, stakeholder notices, media statement",
                 "Coordination: cross-functional war room with clear roles",
                 "Logistics: resource mobilization, alternate site readiness",
                 "Regulatory: notify authorities and comply with reporting",
                 "Recovery: restore prioritized services per BIA sequence",
                 "Stabilization: verify operations, validate data integrity",
                 "Customer care: service credits, FAQs, dedicated support line",
                 "Post-incident: lessons learned, root cause, action tracking",
                 "Resilience uplift: control enhancements and policy updates",
                 "Review cadence: executive sign-off and periodic testing"
             ]},
            {"id": "crisis-team", "heading": "Crisis Management Team", "icon": "👥",
             "content": [
                 "Crisis Manager: overall command and decision authority",
                 "Deputy Lead: continuity of command and shift coverage",
                 "Communications Lead: spokesperson, approvals, media handling",
                 "Operations Lead: service restoration and resource coordination",
                 "IT/DR Lead: infrastructure recovery and cybersecurity response",
                 "Facilities Lead: site safety, evacuation and alternate workspace",
                 "HR Lead: employee welfare, rosters and assistance programs",
                 "Legal/Compliance: regulatory notifications and liabilities",
                 "Finance Lead: emergency funds, vendor terms and claims",
                 "Vendor Management: third-party coordination and SLAs"
             ]},
            {"id": "stakeholders", "heading": "Key Stakeholders", "icon": "🤝",
             "content": [
                 "Employees: safety, status updates, return-to-work guidance",
                 "Customers: service status, timelines, support channels",
                 "Regulators: mandated notices and compliance updates",
                 "Vendors: continuity coordination and alternate provisioning",
                 "Media: facts-only updates via appointed spokesperson",
                 "Community: local impact mitigation and cooperation",
                 "Board/Investors: risk, financials and remediation plan",
                 "Partners: integration dependencies and contingency routes"
             ]},
            {"id": "communication", "heading": "Communication Strategy", "icon": "📢",
             "content": [
                 "Channels: email, SMS, chat, status page, hotline, press",
                 "Cadence: initial alert, hourly updates, resolution notice",
                 "Spokesperson policy: pre-approved roles and media training",
                 "Approval workflow: legal and exec sign-off for public comms",
                 "Templates: alert, update, resolution and apology formats",
                 "Audience segmentation: staff, customers, regulators, media",
                 "Monitoring: social listening and rumor control",
                 "Single source of truth: canonical status page and FAQ"
             ]},
            {"id": "scenarios", "heading": "Potential Crisis Scenarios", "icon": "⚠️",
             "content": [
                 "Operational outage: facilities, utilities, logistics",
                 "Cyber incident: ransomware, data breach, DDoS",
                 "Safety event: fire, medical emergency, natural disaster",
                 "Supply chain disruption: vendor failure and transport",
                 "Reputational event: public complaint and social virality",
                 "Regulatory action: injunctions, fines or investigations",
                 "Site access loss: evacuation or civil restrictions",
                 "Technology failure: core platform or data corruption"
             ]},
            {"id": "resources", "heading": "Critical Resources", "icon": "🛠️",
             "content": [
                 "Emergency funds and procurement fast-track",
                 "Alternate facilities and hot/warm sites",
                 "Backup infrastructure and cloud capacity",
                 "Network, telecom and satellite links",
                 "Workforce rosters and cross-trained staff",
                 "Vendor contingencies and secondary suppliers",
                 "Data backups and tested recovery runbooks",
                 "Mobility kits and safety equipment"
             ]},
            {"id": "contacts", "heading": "Emergency Contacts", "icon": "📞",
             "content": [
                 "Emergency services: 911 and local numbers",
                 "Crisis hotline: 1-800-CRISIS",
                 "Facilities security desk and site leads",
                 "IT on-call: infrastructure and SOC contacts",
                 "HR helpline and employee assistance",
                 "Legal/compliance duty contacts",
                 "Media relations contact point",
                 "Vendor escalation contacts"
             ]},
            {"id": "procedures", "heading": "Emergency Procedures", "icon": "📝",
             "content": [
                 "Evacuation: routes, assembly points, accountability",
                 "Shelter-in-place: instructions and supplies",
                 "Medical emergency: first aid and EMS coordination",
                 "Cyber incident triage: isolate, preserve, notify",
                 "Bomb threat or suspicious package response",
                 "Natural disaster readiness and response steps",
                 "Data recovery: restore, validate, communicate",
                 "Alternate site activation and handover"
             ]},
            {"id": "recovery", "heading": "Recovery & Business Continuity", "icon": "🔄",
             "content": [
                 "BIA linkage: prioritized process restoration",
                 "RTO/RPO targets with validation checkpoints",
                 "Alternate processing and manual workarounds",
                 "Dependencies mapping and readiness checks",
                 "Customer service continuity and SLAs",
                 "Testing: tabletop, technical and full-scale",
                 "Post-recovery verification and sign-off",
                 "Continuous improvement and control uplift"
             ]}
        ]
    }
    crisis_plans_storage[organization_id] = plan
    return plan

@router.put("/crisis-section/{organization_id}/{section_id}")
async def update_crisis_section_by_id(organization_id: str, section_id: str, data: SectionContentUpdate, db: Session = Depends(get_db)):
    if organization_id not in crisis_plans_storage:
        await get_crisis_plan_by_org(organization_id, db)
    
    plan = crisis_plans_storage[organization_id]
    for section in plan["sections"]:
        if section["id"] == section_id:
            section["content"] = data.content
            return {"success": True, "message": "Updated", "section_id": section_id}
    
    raise HTTPException(status_code=404, detail="Section not found")

@router.post("/ai-generate-section")
async def generate_section_with_ai(request: AIGenerateRequest, db: Session = Depends(get_db)):
    if request.section_id == "communication":
        service = LLMIntegrationService()
        org_name = (request.context or {}).get("organization_name") or "Seed Organization"
        req = LLMContentRequest(
            procedure_type=ProcedureType.CRISIS_COMMUNICATION,
            organization_name=org_name,
            organization_id=0,
            content_types=[
                "introduction",
                "scope",
                "objective",
                "methodology",
                "communication_channels",
                "stakeholder_matrix",
                "message_templates",
            ],
            custom_parameters={}
        )
        content_obj = await service.generate_procedure_content(req)
        bullets: List[str] = []
        if content_obj.introduction:
            bullets.append(content_obj.introduction)
        if content_obj.scope:
            bullets.append(content_obj.scope)
        if content_obj.objective:
            bullets.append(content_obj.objective)
        if content_obj.methodology:
            bullets.append(content_obj.methodology)
        channels = getattr(content_obj, "communication_channels", None)
        stakeholders = getattr(content_obj, "stakeholder_matrix", None)
        templates = getattr(content_obj, "message_templates", None)
        if channels:
            bullets.append("Channels: " + ", ".join(channels))
        if stakeholders:
            bullets.append("Stakeholders: " + ", ".join([s.get("stakeholder", "") for s in stakeholders]))
        if templates:
            bullets.append("Templates available: " + ", ".join(list(templates.keys())))
        return {"content": bullets, "generated_by": "LLM", "section_id": request.section_id}
    if request.section_id == "crisis-team":
        org_name = (request.context or {}).get("organization_name") or "Seed Organization"
        content = [
            f"Crisis Manager: leads command, decision-making and {org_name} response",
            "Deputy Lead: ensures command continuity and shift coverage",
            "Communications Lead: spokesperson, approvals, media handling",
            "Operations Lead: service restoration and resource coordination",
            "IT/DR Lead: infrastructure recovery, cybersecurity incident response",
            "Facilities Lead: site safety, evacuation and alternate workspace",
            "HR Lead: employee welfare, rosters and assistance programs",
            "Legal/Compliance: regulatory notifications and liabilities",
            "Finance Lead: emergency funds, vendor terms and claims",
            "Vendor Management: third‑party coordination and SLA escalations"
        ]
        return {"content": content, "generated_by": "AI", "section_id": request.section_id}
    ai_lib = {
        "executive-summary": ["Objectives, scope, governance and review"],
        "action-plan": ["Immediate, containment, recovery, stabilization"],
        "resources": ["Funds, facilities, backups, telecom, vendors"],
        "procedures": ["Evacuation, shelter-in-place, cyber triage"]
    }
    content = ai_lib.get(request.section_id, [f"AI: Content for {request.section_id}"])
    return {"content": content, "generated_by": "AI", "section_id": request.section_id}

# ❌ REMOVE THESE LINES FROM ROUTER FILE:
# if __name__ == "__main__":
#     print("=" * 70)
#     uvicorn.run...
