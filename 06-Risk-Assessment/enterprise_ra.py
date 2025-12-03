# enterprise_ra.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
# import openai
from groq import Groq  # ✅ Add this
import json
import uuid

# Environment Variables
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if GROQ_API_KEY:
    GROQ_API_KEY = GROQ_API_KEY.strip()

# Model Setup
def generate_response(system_prompt: str, user_message: str):
    if not GROQ_API_KEY:
        raise Exception("GROQ_API_KEY environment variable is not set")
    
    client = Groq(api_key=GROQ_API_KEY)
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.4
        )
        return response.choices[0].message.content
    except Exception as e:
        raise Exception(f"GROQ API connection failed: {str(e)}")

# Request Models
class RiskGenerationRequest(BaseModel):
    category: str
    department: str
    business_context: Optional[str] = ""
    specific_concerns: Optional[str] = ""
    number_of_risks: Optional[int] = 5

class ThreatGenerationRequest(BaseModel):
    risk_name: str
    category: str
    department: str
    number_of_threats: Optional[int] = 3

# Response Models
class Threat(BaseModel):
    name: str
    description: str
    justification: str

class Risk(BaseModel):
    id: str
    category: str
    name: str
    description: str
    likelihood: int
    impact: int
    likelihood_justification: str
    impact_justification: str
    treatment: str
    department: str
    escalated: bool
    threats: List[Threat]

class RiskGenerationResponse(BaseModel):
    success: bool
    risks: List[Risk]
    message: str

class ThreatGenerationResponse(BaseModel):
    success: bool
    threats: List[Threat]
    message: str

# Enterprise RA Router
enterprise_ra_router = APIRouter()

@enterprise_ra_router.post("/api/enterprise-ra/generate-risks", response_model=RiskGenerationResponse)
def generate_enterprise_risks(request: RiskGenerationRequest):
    """
    Generate comprehensive enterprise risks based on category and department
    """
    system_prompt = """You are an expert enterprise risk analyst. Your task is to generate comprehensive risks for organizations based on the provided category, department, and business context.

CRITICAL: You must respond with ONLY a valid JSON object. Do not include any markdown formatting, code blocks, or additional text.

For each risk, you need to:
1. Create a clear, specific risk name
2. Provide a detailed description of the risk
3. Assess likelihood (1-5 scale, where 1=very unlikely, 5=very likely) with justification
4. Assess impact (1-5 scale, where 1=minimal impact, 5=catastrophic impact) with justification
5. Provide appropriate treatment strategies
6. Generate relevant threats associated with each risk with industry-specific justifications

Consider:
- Industry best practices for risk identification
- Department-specific risks and challenges
- Current business environment factors
- Regulatory and compliance considerations
- Technological and operational dependencies
- Industry statistics and common threat patterns
- Regional and sector-specific risk factors

Provide specific justifications that reference:
- Industry trends and statistics
- Regulatory requirements for the sector
- Common attack vectors in similar organizations
- Historical incidents in the industry
- Technology adoption patterns
- Business model vulnerabilities

RESPOND WITH ONLY THIS EXACT JSON FORMAT (no markdown, no code blocks, no additional text):
{
  "risks": [
    {
      "name": "Clear, specific risk name",
      "description": "Detailed description of the risk and its potential impact on the organization",
      "likelihood": 3,
      "likelihood_justification": "Specific reasons for this likelihood score based on industry data, trends, and organizational factors",
      "impact": 4,
      "impact_justification": "Specific reasons for this impact score based on business dependencies, regulatory requirements, and potential consequences",
      "treatment": "Specific treatment strategies to mitigate the risk",
      "threats": [
        {
          "name": "Threat name",
          "description": "Detailed description of the threat",
          "justification": "Industry-specific reasoning for why this threat is relevant, including statistics, trends, or common occurrences in this sector"
        }
      ]
    }
  ]
}"""

    user_message = f"""
Generate {request.number_of_risks} enterprise risks for the following context:

Category: {request.category}
Department: {request.department}
Business Context: {request.business_context}
Specific Concerns: {request.specific_concerns}

Please provide comprehensive risks that are relevant to this department and category, including appropriate likelihood and impact assessments, treatment strategies, and associated threats.
"""

    try:
        result = generate_response(system_prompt, user_message)
        
        # Clean the response - remove markdown code blocks if present
        cleaned_result = result.strip()
        if cleaned_result.startswith('```json'):
            cleaned_result = cleaned_result[7:]  # Remove ```json
        elif cleaned_result.startswith('```'):
            cleaned_result = cleaned_result[3:]   # Remove ```
        if cleaned_result.endswith('```'):
            cleaned_result = cleaned_result[:-3]  # Remove trailing ```
        cleaned_result = cleaned_result.strip()
        
        # Extract JSON from the response
        json_start = cleaned_result.find('{')
        json_end = cleaned_result.rfind('}') + 1
        
        if json_start != -1 and json_end > json_start:
            json_str = cleaned_result[json_start:json_end]
            risks_data = json.loads(json_str)
            
            # Convert to our response format
            risks = []
            for risk_data in risks_data.get("risks", []):
                risk = Risk(
                    id=str(uuid.uuid4())[:8],  # Generate unique ID
                    category=request.category,
                    name=risk_data.get("name", ""),
                    description=risk_data.get("description", ""),
                    likelihood=risk_data.get("likelihood", 3),
                    impact=risk_data.get("impact", 3),
                    likelihood_justification=risk_data.get("likelihood_justification", "Standard industry assessment"),
                    impact_justification=risk_data.get("impact_justification", "Based on business impact analysis"),
                    treatment=risk_data.get("treatment", ""),
                    department=request.department,
                    escalated=False,
                    threats=[Threat(**threat) for threat in risk_data.get("threats", [])]
                )
                risks.append(risk)
            
            return RiskGenerationResponse(
                success=True,
                risks=risks,
                message=f"Successfully generated {len(risks)} enterprise risks"
            )
        else:
            raise ValueError("No valid JSON found in response")
            
    except (json.JSONDecodeError, ValueError) as e:
        # Fallback response with sample risks
        fallback_risks = [
            Risk(
                id=str(uuid.uuid4())[:8],
                category=request.category,
                name=f"{request.category} Risk Assessment",
                description=f"Potential risks related to {request.category} operations in {request.department} department",
                likelihood=3,
                impact=3,
                likelihood_justification=f"Moderate likelihood based on common {request.category} challenges in {request.department} departments",
                impact_justification=f"Moderate impact considering typical {request.department} operational dependencies",
                treatment=f"Implement comprehensive {request.category} risk management framework",
                department=request.department,
                escalated=False,
                threats=[
                    Threat(
                        name="Operational Disruption",
                        description="Potential for operational processes to be disrupted",
                        justification=f"Common threat in {request.department} departments due to process dependencies"
                    ),
                    Threat(
                        name="Compliance Violation",
                        description="Risk of non-compliance with regulatory requirements",
                        justification=f"Regulatory compliance is critical in {request.category} category with increasing oversight"
                    )
                ]
            )
        ]
        
        return RiskGenerationResponse(
            success=True,
            risks=fallback_risks,
            message="Generated fallback risks due to processing error"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating risks: {str(e)}")

@enterprise_ra_router.post("/api/enterprise-ra/generate-threats", response_model=ThreatGenerationResponse)
def generate_threats_for_risk(request: ThreatGenerationRequest):
    """
    Generate specific threats for a given risk
    """
    system_prompt = """You are an expert threat analyst. Your task is to generate specific threats that could lead to or contribute to a given risk.

CRITICAL: You must respond with ONLY a valid JSON object. Do not include any markdown formatting, code blocks, or additional text.

For each threat, provide:
1. A clear, specific threat name
2. A detailed description of how this threat could manifest and impact the organization
3. Industry-specific justification for why this threat is relevant

Consider:
- Direct and indirect threat vectors
- Internal and external threat sources
- Current threat landscape and emerging risks
- Department-specific threat considerations
- Industry-relevant threat patterns
- Statistical data on threat frequency in similar organizations
- Regulatory and compliance threat vectors
- Technology-specific vulnerabilities
- Geographic and sector-specific threat patterns

Provide specific justifications that reference:
- Industry statistics and threat intelligence reports
- Common attack patterns in the sector
- Historical incidents and case studies
- Regulatory requirements and compliance risks
- Technology adoption vulnerabilities
- Supply chain and third-party risks
- Insider threat patterns specific to the department

RESPOND WITH ONLY THIS EXACT JSON FORMAT (no markdown, no code blocks, no additional text):
{
  "threats": [
    {
      "name": "Specific threat name",
      "description": "Detailed description of the threat and how it could impact the organization",
      "justification": "Industry-specific reasoning for why this threat is particularly relevant, including statistics, trends, regulatory factors, or common occurrences in this sector and department"
    }
  ]
}"""

    user_message = f"""
Generate {request.number_of_threats} specific threats for the following risk:

Risk Name: {request.risk_name}
Category: {request.category}
Department: {request.department}

Please provide threats that are directly relevant to this risk and could realistically occur in this department context.
"""

    try:
        result = generate_response(system_prompt, user_message)
        
        # Clean the response - remove markdown code blocks if present
        cleaned_result = result.strip()
        if cleaned_result.startswith('```json'):
            cleaned_result = cleaned_result[7:]  # Remove ```json
        elif cleaned_result.startswith('```'):
            cleaned_result = cleaned_result[3:]   # Remove ```
        if cleaned_result.endswith('```'):
            cleaned_result = cleaned_result[:-3]  # Remove trailing ```
        cleaned_result = cleaned_result.strip()
        
        # Extract JSON from the response
        json_start = cleaned_result.find('{')
        json_end = cleaned_result.rfind('}') + 1
        
        if json_start != -1 and json_end > json_start:
            json_str = cleaned_result[json_start:json_end]
            threats_data = json.loads(json_str)
            
            threats = [Threat(**threat) for threat in threats_data.get("threats", [])]
            
            return ThreatGenerationResponse(
                success=True,
                threats=threats,
                message=f"Successfully generated {len(threats)} threats for risk: {request.risk_name}"
            )
        else:
            raise ValueError("No valid JSON found in response")
            
    except (json.JSONDecodeError, ValueError) as e:
        # Fallback response
        fallback_threats = [
            Threat(
                name="System Failure",
                description="Critical system components may fail leading to operational disruption",
                justification=f"System failures are common in {request.department} departments due to technology dependencies and aging infrastructure"
            ),
            Threat(
                name="Human Error",
                description="Mistakes by personnel could trigger or worsen the risk scenario",
                justification=f"Human error accounts for 80% of security incidents in {request.category} category according to industry reports"
            ),
            Threat(
                name="External Dependencies",
                description="Failure of external services or suppliers could contribute to the risk",
                justification=f"Third-party dependencies are increasing in {request.department} operations, creating additional threat vectors"
            )
        ]
        
        return ThreatGenerationResponse(
            success=True,
            threats=fallback_threats[:request.number_of_threats],
            message="Generated fallback threats due to processing error"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating threats: {str(e)}")
