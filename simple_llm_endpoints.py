#!/usr/bin/env python3
"""
Simple LLM endpoints implementation for procedures module
Deploy this to your own Hugging Face Space
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn

app = FastAPI(title="Procedures LLM Endpoints", version="1.0.0")

# Request models
class DescriptionRequest(BaseModel):
    query_type: str
    query_name: str

class PeakPeriodRequest(BaseModel):
    department: str
    process_name: str
    sector: str

class ImpactMatrixRequest(BaseModel):
    process_name: str
    impact_name: str

class BCMPolicyRequest(BaseModel):
    organization_name: str
    standards: List[str]
    custom_notes: str
    qa_pairs: Optional[List[Dict]] = []

@app.get("/")
async def root():
    return {"message": "Procedures LLM Endpoints API", "status": "running"}

@app.post("/get-description")
async def get_description(request: DescriptionRequest):
    """Generate description for processes"""
    descriptions = {
        "BIA Procedure": "The Business Impact Analysis (BIA) Procedure is a systematic process used to identify, assess, and prioritize an organization's critical business functions and assets, evaluating the potential impact of disruptions to these functions.",
        "Business Impact Analysis Scope": "A Business Impact Analysis (BIA) Scope is a process used to identify, prioritize, and define the objectives and boundaries of a BIA, ensuring it is comprehensive and focused on critical business processes and information systems.",
        "BIA Objective": "The BIA (Business Impact Analysis) Objective is a critical component of business continuity management. The primary objective of a BIA is to quantify the potential business risks and consequences resulting from disruptions or losses of critical business functions.",
        "BIA Methodology": "The Business Impact Analysis (BIA) Methodology is a framework used to assess potential disruption to business operations in the event of a disruption or disaster.",
        "Risk Assessment Procedure": "Risk Assessment Procedure is a systematic approach to identifying, analyzing, and evaluating potential risks that could impact business operations and continuity.",
        "BCM Plan Development": "BCM Plan Development is the process of creating comprehensive business continuity plans that ensure organizational resilience and rapid recovery from disruptions."
    }
    
    description = descriptions.get(request.query_name, f"Comprehensive procedure for {request.query_name} management and implementation.")
    return {"description": description}

@app.post("/get-peak-period/")
async def get_peak_period(request: PeakPeriodRequest):
    """Get peak periods for departments"""
    peak_periods = {
        "Human Resources": "9am-5pm, Monday to Friday",
        "IT": "24/7 with peak during business hours",
        "Finance": "Month-end and quarter-end periods",
        "Operations": "Business hours with seasonal variations",
        "Customer Service": "9am-6pm, Monday to Saturday",
        "Marketing": "Campaign periods and product launches"
    }
    
    period = peak_periods.get(request.department, "Business hours with periodic peaks")
    return {"peak_period": period}

@app.post("/get-impact-scale-matrix")
async def get_impact_scale_matrix(request: ImpactMatrixRequest):
    """Generate impact scale matrix"""
    matrices = {
        "Financial": {
            "1 Hour": {"impact_severity": "1", "reason": "Minimal financial impact on operations"},
            "4 Hours": {"impact_severity": "2", "reason": "Minor financial losses from delayed transactions"},
            "8 Hours": {"impact_severity": "3", "reason": "Moderate financial impact on daily revenue"},
            "24 Hours": {"impact_severity": "4", "reason": "Significant financial losses and customer impact"},
            "72 Hours": {"impact_severity": "5", "reason": "Critical financial impact threatening business viability"}
        },
        "Operational": {
            "1 Hour": {"impact_severity": "1", "reason": "Minimal disruption to business operations"},
            "4 Hours": {"impact_severity": "2", "reason": "Minor operational delays and inefficiencies"},
            "8 Hours": {"impact_severity": "3", "reason": "Moderate impact on operational capabilities"},
            "24 Hours": {"impact_severity": "4", "reason": "Significant operational disruption"},
            "72 Hours": {"impact_severity": "5", "reason": "Critical operational failure"}
        },
        "Reputational": {
            "1 Hour": {"impact_severity": "1", "reason": "No significant reputational impact"},
            "4 Hours": {"impact_severity": "2", "reason": "Minor customer dissatisfaction"},
            "8 Hours": {"impact_severity": "3", "reason": "Moderate reputational concerns"},
            "24 Hours": {"impact_severity": "4", "reason": "Significant damage to brand reputation"},
            "72 Hours": {"impact_severity": "5", "reason": "Critical reputational damage"}
        },
        "Legal and Regulatory": {
            "1 Hour": {"impact_severity": "1", "reason": "No regulatory compliance issues"},
            "4 Hours": {"impact_severity": "2", "reason": "Minor compliance reporting delays"},
            "8 Hours": {"impact_severity": "3", "reason": "Moderate regulatory compliance concerns"},
            "24 Hours": {"impact_severity": "4", "reason": "Significant regulatory violations possible"},
            "72 Hours": {"impact_severity": "5", "reason": "Critical regulatory non-compliance"}
        },
        "Customer": {
            "1 Hour": {"impact_severity": "1", "reason": "Minimal customer service impact"},
            "4 Hours": {"impact_severity": "2", "reason": "Minor customer inconvenience"},
            "8 Hours": {"impact_severity": "3", "reason": "Moderate customer dissatisfaction"},
            "24 Hours": {"impact_severity": "4", "reason": "Significant customer impact and complaints"},
            "72 Hours": {"impact_severity": "5", "reason": "Critical customer service failure"}
        },
        "Wellbeing": {
            "1 Hour": {"impact_severity": "1", "reason": "No health and safety concerns"},
            "4 Hours": {"impact_severity": "2", "reason": "Minor employee inconvenience"},
            "8 Hours": {"impact_severity": "3", "reason": "Moderate impact on employee wellbeing"},
            "24 Hours": {"impact_severity": "4", "reason": "Significant health and safety concerns"},
            "72 Hours": {"impact_severity": "5", "reason": "Critical health and safety risks"}
        }
    }
    
    matrix = matrices.get(request.impact_name, matrices["Operational"])
    return {"impact_scale_matrix": matrix}

@app.post("/generate-bcm-policy")
async def generate_bcm_policy(request: BCMPolicyRequest):
    """Generate BCM policy"""
    standards_text = ", ".join(request.standards) if request.standards else "ISO 22301:2019"
    
    policy = f"""{request.organization_name} is committed to maintaining business continuity and ensuring the resilience of critical business operations. This policy is established in accordance with {standards_text} and demonstrates our commitment to protecting our stakeholders, employees, customers, and business operations from potential disruptions.

Our organization will:
- Implement appropriate business continuity management systems
- Conduct regular risk assessments and business impact analyses
- Maintain effective response and recovery capabilities
- Ensure regular testing and validation of continuity plans
- Provide appropriate training and awareness programs
- Continuously improve our business continuity capabilities

This policy applies to all employees, contractors, and third-party service providers and is reviewed annually to ensure its continued effectiveness."""
    
    return {"policy": policy}

@app.get("/generate-bcm-questions")
async def generate_bcm_questions():
    """Generate BCM questions"""
    questions = [
        "What are the critical business processes that must be maintained during a disruption?",
        "What are the maximum acceptable downtime periods for each critical process?",
        "What resources are required to maintain critical operations during a disruption?",
        "How will communication be maintained with stakeholders during an incident?",
        "What are the recovery strategies for each critical business function?",
        "How will the organization test and validate its business continuity plans?",
        "What are the key dependencies and interdependencies between business processes?",
        "How will the organization ensure the safety and wellbeing of employees during a crisis?",
        "What are the regulatory and compliance requirements during business disruptions?",
        "How will the organization maintain customer service levels during recovery operations?",
        "What are the backup and data recovery procedures for critical systems?",
        "How will the organization manage supplier and vendor relationships during disruptions?"
    ]
    
    return {"questions": questions}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)  # Port 7860 is standard for HF Spaces