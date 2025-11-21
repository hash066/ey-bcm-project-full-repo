"""
AI-powered routes using OpenAI for gap analysis assistance.
"""

import json
import logging
import asyncio
from typing import Dict, List, Optional, Any
from pathlib import Path
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
import openai

from app.config_settings import settings
from app.utils.gap_calculator import GapAnalysisResult

logger = logging.getLogger(__name__)

# Initialize Grok client
openai_client = None
try:
    # Create client with Grok's base URL
    openai_client = openai.OpenAI(api_key=settings.grok_api_key, base_url="https://api.x.ai/v1")
    logger.info("Grok client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Grok client: {str(e)}")
    logger.info("AI features will be unavailable. Check API key configuration.")

# Pydantic Models
class AIRequest(BaseModel):
    """Request model for AI operations."""
    job_id: str = Field(..., alias="jobId", description="Job ID containing the control")
    control_id: str = Field(..., alias="controlId", description="Control ID to analyze")

class AIResponse(BaseModel):
    """Response model for AI operations."""
    model_config = {"protected_namespaces": ()}

    job_id: str = Field(..., description="Job ID")
    control_id: str = Field(..., description="Control ID")
    result: str = Field(..., description="AI-generated content")
    timestamp: str = Field(..., description="Response timestamp")
    model_used: str = Field(..., description="OpenAI model used")

class RemediationPlanResponse(AIResponse):
    """Response model for remediation plan."""
    plan_type: str = Field(default="remediation_plan", description="Type of plan generated")

class RiskExplanationResponse(AIResponse):
    """Response model for risk explanation."""
    explanation_type: str = Field(default="risk_explanation", description="Type of explanation")

class EvidenceSuggestionResponse(AIResponse):
    """Response model for evidence suggestions."""
    suggestion_type: str = Field(default="evidence_suggestions", description="Type of suggestion")

# Create router
router = APIRouter()

def load_control_data(job_id: str, control_id: str) -> GapAnalysisResult:
    """
    Load specific control data from processed results.

    Args:
        job_id: Job identifier
        control_id: Control identifier

    Returns:
        GapAnalysisResult object

    Raises:
        HTTPException: If control not found
    """
    file_path = Path("data/processed") / f"{job_id}.json"

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Processed data not found for job {job_id}"
        )

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Find the control
        gap_results = data.get('gap_analysis', {}).get('results', [])
        for result_data in gap_results:
            if result_data.get('id') == control_id:
                return GapAnalysisResult(**result_data)

        raise HTTPException(
            status_code=404,
            detail=f"Control {control_id} not found in job {job_id}"
        )

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail=f"Invalid JSON data for job {job_id}"
        )
    except Exception as e:
        logger.error(f"Error loading control data: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error loading control data: {str(e)}"
        )

def format_control_details(control: GapAnalysisResult) -> str:
    """
    Format control details for AI prompts.

    Args:
        control: GapAnalysisResult object

    Returns:
        Formatted string with control details
    """
    return f"""
Control ID: {control.id}
Framework: {control.framework}
Domain: {control.domain}
Control Name: {control.control_name}
Description: {control.control_description}
Current Score: {control.current_score}/4
Gap Percentage: {control.gap_percentage}%
Compliance Status: {control.compliance_status}
Priority: {control.priority}
Missing Items: {', '.join(control.missing_items) if control.missing_items else 'None identified'}
Required Actions: {', '.join(control.required_actions) if control.required_actions else 'None specified'}
Evidence Required: {', '.join(control.evidence_required) if control.evidence_required else 'Not specified'}
"""

def generate_mock_ai_response(prompt_type: str, control_data: GapAnalysisResult) -> str:
    """
    Generate mock AI responses based on control data for demonstration.

    Args:
        prompt_type: Type of prompt (plan, risk, evidence)
        control_data: Control information

    Returns:
        Realistic AI-generated response
    """
    if prompt_type == "plan":
        gap_severity = "critical" if control_data.priority == "Critical" else "moderate" if control_data.priority == "High" else "minor"

        return f"""# {gap_severity.upper()} COMPLIANCE GAP REMEDIATION PLAN
## Control: {control_data.control_name}

### Gap Analysis
Current implementation shows {control_data.gap_percentage}% gap with {control_data.current_score}/4 compliance score ({control_data.priority}-priority issue).

### IMMEDIATE ACTIONS (Days 1-30)
1. **Staff Awareness & Training**
   - Conduct emergency compliance briefing within 3 business days
   - Assign dedicated compliance officer to oversee remediation
   - Review current policies against {control_data.framework} requirements

2. **Quick Wins Implementation**
   - Document existing control artifacts within 1 week
   - Establish basic monitoring procedures immediately
   - Create control implementation roadmap

### SHORT-TERM OBJECTIVES (Days 31-90)
3. **Infrastructure & Process Setup**
   - Develop comprehensive control procedures aligned with {control_data.framework}
   - Implement automated monitoring and logging systems
   - Train operation teams on compliance requirements

4. **Documentation & Governance**
   - Complete policy and procedure documentation
   - Establish change management processes
   - Implement regular compliance reviews

### LONG-TERM IMPROVEMENT (Days 91-365)
5. **Continuous Improvement**
   - Establish metrics and KPIs for ongoing compliance
   - Implement regular audits and assessments
   - Develop continuous monitoring capabilities

### Required Resources
- **Personnel**: 2 FTE for implementation (compliance officer + technical lead)
- **Budget**: ${30_000 if control_data.priority == "Critical" else 15_000} for tools and training
- **Timeline**: {6 if control_data.priority == "Critical" else 9} months to full compliance

### Success Metrics
- Control score improvement to 3.5+ within 3 months
- Audit-ready documentation by month 4
- Sustained compliance above 80% for 6 months
- Zero high-risk findings in next audit

### Potential Challenges & Mitigations
- **Resource Constraints**: Mitigation - Secure executive sponsorship early
- **Technical Complexity**: Mitigation - Engage specialized compliance consultants
- **Change Resistance**: Mitigation - Develop clear communication and training plans
"""

    elif prompt_type == "risk":
        business_risks = []
        if control_data.priority == "Critical":
            business_risks = [
                "Severe regulatory penalties up to $500K per violation",
                "Complete operational shutdown risk during regulatory audit",
                "Executive liability and potential criminal charges",
                "Irrevocable damage to market reputation and customer trust",
                "Inability to win government contracts requiring compliance"
            ]
        elif control_data.priority == "High":
            business_risks = [
                "Moderate fines of $50K-$250K for compliance violations",
                "Increased audit scrutiny and reporting requirements",
                "Delayed business expansion requiring certified compliance",
                "Reduced confidence from key business partners",
                "Additional compliance monitoring costs"
            ]
        else:
            business_risks = [
                "Minor penalties up to $10K for small violations",
                "Increased likelihood of regulatory investigations",
                "Operational inefficiencies from manual processes",
                "Competitive disadvantage vs compliant competitors"
            ]

        return f"""# BUSINESS RISK ANALYSIS: {control_data.control_name}

## Executive Summary
Failure to address this compliance gap presents {control_data.priority.lower()}-level business risk with potential impact across multiple strategic pillars.

## Key Business Impacts

### Financial Impact
- **Direct Costs**: {', '.join(business_risks[:2] if len(business_risks) >= 2 else business_risks)}
- **Opportunity Costs**: Lost revenue from delayed approvals and increased compliance overhead
- **Mitigation Costs**: Implementation of remediation could cost ${30_000 if control_data.priority == "Critical" else 15_000}

### Operational Impact
- Potential disruption of core business processes during remediation
- Increased operational complexity from compliance monitoring requirements
- Resource diversion from strategic initiatives to compliance activities

### Reputational Impact
- Market perception of non-compliance affecting customer acquisition
- Impact on investor confidence and stock performance
- Difficulty attracting top talent in regulated industry sectors

### Compliance Impact
- Escalating severity of {control_data.framework} compliance violations
- Potential regulatory orders that limit business activities
- Cumulative fines and penalties over time
- Increased scrutiny in future regulatory examinations

## Risk Mitigation Strategy
1. **Immediate Action**: Secure executive commitment and resources this week
2. **Short-term**: Achieve significant compliance improvement within 90 days
3. **Long-term**: Establish robust compliance monitoring and continuous improvement

## Decision Framework
- **Probability**: High (current {control_data.gap_percentage}% gap indicates likely regulatory finding)
- **Cost of Inaction**: Severe (escalating penalties and operational restrictions)
- **Cost of Action**: Manageable (${30_000 if control_data.priority == "Critical" else 15_000} investment with clear ROI)

## Recommended Action
**APPROVE** remediation plan immediately. The risk of non-compliance far outweighs the implementation costs, with potential penalties far exceeding remediation investment.
"""

    elif prompt_type == "evidence":
        return f"""# EVIDENCE CHECKLIST: {control_data.control_name}

## {control_data.framework} Compliance Requirements

### ☑️ PRIMARY EVIDENCE DOCUMENTS
1. **Policy Document** (`POL-{control_data.id}-v1.0`)
   - Executive approval signature (dated within last 18 months)
   - Complete control objectives and scope
   - Reference to {control_data.framework} standard sections
   - Annual review sign-offs

2. **Control Procedures Manual** (`PROC-{control_data.id}-v1.0`)
   - Step-by-step implementation guidance
   - Assigned responsible parties and timelines
   - Exception handling processes
   - Escalation procedures

3. **Implementation Records** (`IMPL-{control_data.id}-YYYYMM`)
   - Configuration change logs (last 12 months)
   - System deployment checklists
   - Testing and validation records
   - Staff training completion certificates

### ☑️ MONITORING & TESTING EVIDENCE
4. **Monitoring Reports** (`MON-{control_data.id}-monthly`)
   - Automated alerting system logs
   - Manual control assessment reports
   - Incident response logs (if applicable)
   - Performance metrics tracking

5. **Independent Testing Records** (`TEST-{control_data.id}-quarterly`)
   - Third-party audit reports (where applicable)
   - Internal control testing results
   - Vulnerability assessment reports
   - Penetration testing results

6. **Remediation Records** (`REM-{control_data.id}-YYYYMM`)
   - Deficiency remediation plans
   - Implementation verification records
   - Risk mitigation documentation
   - Effectiveness measurement reports

### ☑️ SUPPORTING DOCUMENTATION
7. **Training Records** (`TRAIN-{control_data.id}-annual`)
   - Staff training completion certificates
   - Training materials and curricula
   - Training effectiveness assessments
   - Competency evaluation results

8. **Change Management Records** (`CHG-{control_data.id}-YYYYMM`)
   - Change approval documents
   - Impact assessments
   - Rollback procedures
   - Post-implementation reviews

### ☑️ COMPLIANCE CERTIFICATIONS
9. **Compliance Attestations** (`ATT-{control_data.id}-annual`)
   - Annual compliance statements
   - Management assertions of compliance
   - Regulatory submission records
   - Audit opinion letters

10. **Documentation Repository** (`REPO-{control_data.id}`)
   - Centralized evidence library organization
   - Version control and retention schedules
   - Access control logs
   - Back-up integrity verification

---

## Evidence Collection Priorities
**HIGH PRIORITY** (Days 1-30): Items 1-5 (basic compliance foundation)
**MEDIUM PRIORITY** (Days 31-90): Items 6-8 (monitoring and testing)
**LOW PRIORITY** (Days 91-180): Items 9-10 (maturity and optimization)

## Strength Classification: {'WEAK' if control_data.compliance_status == 'Non-Compliant' else 'ADEQUATE' if control_data.compliance_status == 'Partially Compliant' else 'STRONG'}
"""

async def call_openai_api(prompt: str, temperature: float = 0.7, max_tokens: int = 1000) -> str:
    """
    Call OpenAI API with fallback to mock responses for demonstration.

    Args:
        prompt: Prompt text
        temperature: Creativity/randomness parameter
        max_tokens: Maximum response length

    Returns:
        AI response text (real OpenAI or realistic mock)

    Raises:
        HTTPException: If both OpenAI and mock fail
    """
    if openai_client:
        try:
            response = openai_client.chat.completions.create(
                model="grok-beta",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a cybersecurity compliance expert. Provide clear, actionable advice for gap remediation."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=temperature,
                max_tokens=max_tokens,
                presence_penalty=0.1,
                frequency_penalty=0.1
            )

            return response.choices[0].message.content.strip()

        except Exception as e:
            logger.warning(f"OpenAI API failed, using mock response: {str(e)}")
            openai_client = None  # Disable for future calls to avoid repeated failures

    # Fallback to mock response - extract control context from prompt
    logger.info("Using mock AI response for demonstration")
    return "⚠️ MOCK RESPONSE: OpenAI unavailable. Real AI features require proxy resolution."

@router.post("/ai/generate-plan", response_model=RemediationPlanResponse)
async def generate_remediation_plan(request: AIRequest):
    """
    Generate a step-by-step remediation plan for a compliance gap.

    - **request**: Contains job_id and control_id

    Uses GPT-4 to create actionable remediation steps based on control details.
    """
    logger.info(f"Generating remediation plan for control {request.control_id} in job {request.job_id}")

    # Load control data
    control = load_control_data(request.job_id, request.control_id)

    # Create prompt
    control_details = format_control_details(control)
    prompt = f"""
Generate a detailed, step-by-step remediation plan for this compliance gap:

{control_details}

Please provide:
1. Immediate actions (next 30 days)
2. Short-term goals (next 90 days)
3. Long-term objectives (next 6-12 months)
4. Required resources and stakeholders
5. Success metrics and milestones
6. Potential challenges and mitigation strategies

Format the response as a structured plan with clear sections and actionable items.
"""

    # Call OpenAI API
    plan_text = await call_openai_api(prompt, temperature=0.7, max_tokens=1500)

    return RemediationPlanResponse(
        job_id=request.job_id,
        control_id=request.control_id,
        result=plan_text,
        timestamp=datetime.utcnow().isoformat(),
        model_used="grok-beta"
    )

@router.post("/ai/explain-risk", response_model=RiskExplanationResponse)
async def explain_risk(request: AIRequest):
    """
    Explain business risks of a compliance gap in simple language.

    - **request**: Contains job_id and control_id

    Uses GPT-4 to explain risks in business-friendly terms.
    """
    logger.info(f"Explaining risks for control {request.control_id} in job {request.job_id}")

    # Load control data
    control = load_control_data(request.job_id, request.control_id)

    # Create prompt
    control_details = format_control_details(control)
    prompt = f"""
Explain the business risks of this compliance gap in simple, clear language:

{control_details}

Please cover:
1. What could go wrong if this gap isn't addressed
2. Impact on business operations and reputation
3. Financial implications
4. Regulatory consequences
5. Customer and stakeholder trust effects
6. Competitive disadvantages

Use business-friendly language that executives can understand. Avoid technical jargon.
"""

    # Call OpenAI API
    risk_explanation = await call_openai_api(prompt, temperature=0.7, max_tokens=800)

    return RiskExplanationResponse(
        job_id=request.job_id,
        control_id=request.control_id,
        result=risk_explanation,
        timestamp=datetime.utcnow().isoformat(),
        model_used="grok-beta",
        explanation_type="risk_explanation"
    )

@router.post("/ai/suggest-evidence", response_model=EvidenceSuggestionResponse)
async def suggest_evidence(request: AIRequest):
    """
    Suggest required documents and evidence for a control.

    - **request**: Contains job_id and control_id

    Uses GPT-4 to generate comprehensive evidence checklist.
    """
    logger.info(f"Suggesting evidence for control {request.control_id} in job {request.job_id}")

    # Load control data
    control = load_control_data(request.job_id, request.control_id)

    # Create prompt
    control_details = format_control_details(control)
    prompt = f"""
Based on this control, list all required documents and evidence:

{control_details}

Please provide:
1. Primary evidence documents (policies, procedures, standards)
2. Implementation records (logs, reports, meeting minutes)
3. Monitoring and testing evidence (audit reports, test results)
4. Training and awareness records
5. Third-party attestations or certifications
6. Continuous monitoring evidence

Format as a checklist with descriptions of what each evidence item should contain.
"""

    # Call OpenAI API
    evidence_suggestions = await call_openai_api(prompt, temperature=0.6, max_tokens=1000)

    return EvidenceSuggestionResponse(
        job_id=request.job_id,
        control_id=request.control_id,
        result=evidence_suggestions,
        timestamp=datetime.utcnow().isoformat(),
        model_used="grok-beta",
        suggestion_type="evidence_suggestions"
    )
