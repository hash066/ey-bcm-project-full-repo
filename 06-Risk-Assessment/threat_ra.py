# threat_ra.py
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
class ThreatRiskGenerationRequest(BaseModel):
    domain: str
    category: str
    business_context: Optional[str] = ""
    specific_focus: Optional[str] = ""
    number_of_records: Optional[int] = 10

class ThreatRiskAnalysisRequest(BaseModel):
    domain: str
    risk_name: str
    threat: str
    vulnerability: str
    category: str

# Response Models
class ThreatRisk(BaseModel):
    id: str
    domain: str
    department: str
    riskName: str
    threat: str
    vulnerability: str
    category: str
    likelihood: int
    impact: int
    rating: int
    likelihood_justification: str
    impact_justification: str
    threat_justification: str
    vulnerability_justification: str

class ThreatRiskGenerationResponse(BaseModel):
    success: bool
    threatRisks: List[ThreatRisk]
    message: str

class ThreatRiskAnalysisResponse(BaseModel):
    success: bool
    analysis: ThreatRisk
    recommendations: List[str]
    message: str

# Threat RA Router
threat_ra_router = APIRouter()

@threat_ra_router.post("/api/threat-ra/generate-threat-risks", response_model=ThreatRiskGenerationResponse)
def generate_threat_risks(request: ThreatRiskGenerationRequest):
    """
    Generate comprehensive threat risk records for threat risk assessment
    """
    system_prompt = """You are an expert threat risk analyst. Your task is to generate comprehensive threat risk records that include domain-specific risks, threats, vulnerabilities, and their assessments.

CRITICAL: You must respond with ONLY a valid JSON object. Do not include any markdown formatting, code blocks, or additional text.

For each threat risk record, you need to:
1. Create a specific risk name relevant to the domain
2. Identify a credible threat that could exploit vulnerabilities
3. Identify specific vulnerabilities that could be exploited
4. Assess likelihood (1-5 scale, where 1=very unlikely, 5=very likely) with justification
5. Assess impact (1-5 scale, where 1=minimal impact, 5=catastrophic impact) with justification
6. Provide justifications for why this threat and vulnerability are relevant to the domain

Consider:
- Domain-specific threats and vulnerabilities
- Current threat landscape and attack vectors
- Industry-specific risk factors
- Realistic likelihood and impact assessments
- Emerging threats and evolving attack methods
- Statistical data and threat intelligence
- Regulatory and compliance considerations
- Technology and process vulnerabilities

Provide specific justifications that reference:
- Industry threat statistics and reports
- Common attack patterns in the domain
- Vulnerability prevalence in similar organizations
- Historical incidents and case studies
- Regulatory requirements and compliance gaps
- Technology adoption risks
- Operational and process weaknesses

RESPOND WITH ONLY THIS EXACT JSON FORMAT (no markdown, no code blocks, no additional text):
{
  "threatRisks": [
    {
      "riskName": "Specific risk name",
      "threat": "Specific threat vector",
      "department": "Relevant department within the company",
      "threat_justification": "Industry-specific reasoning for why this threat is particularly relevant to this domain",
      "vulnerability": "Specific vulnerability that could be exploited",
      "vulnerability_justification": "Explanation of why this vulnerability is common or likely in this domain",
      "likelihood": 3,
      "likelihood_justification": "Specific reasons for this likelihood score based on domain factors and threat intelligence",
      "impact": 4,
      "impact_justification": "Specific reasons for this impact score based on business dependencies and potential consequences"
    }
  ]
}"""

    user_message = f"""
Generate {request.number_of_records} threat risk records for the following context:

Domain: {request.domain}
Category: {request.category}
Business Context: {request.business_context}
Specific Focus: {request.specific_focus}

Please provide comprehensive threat risk records that include specific risks, threats, and vulnerabilities relevant to this domain and category.
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
            threat_risks = []
            for risk_data in risks_data.get("threatRisks", []):
                likelihood = risk_data.get("likelihood", 3)
                impact = risk_data.get("impact", 3)
                rating = likelihood * impact
                
                threat_risk = ThreatRisk(
                    id=str(uuid.uuid4())[:8],
                    domain=request.domain,
                    department=risk_data.get("department", "General"),  # 👈 Add department
                    riskName=risk_data.get("riskName", ""),
                    threat=risk_data.get("threat", ""),
                    vulnerability=risk_data.get("vulnerability", ""),
                    category=request.category,
                    likelihood=likelihood,
                    impact=impact,
                    rating=rating,
                    likelihood_justification=risk_data.get("likelihood_justification", "Standard domain assessment"),
                    impact_justification=risk_data.get("impact_justification", "Based on business impact analysis"),
                    threat_justification=risk_data.get("threat_justification", "Common threat in this domain"),
                    vulnerability_justification=risk_data.get("vulnerability_justification", "Typical vulnerability for this category")
                )
                threat_risks.append(threat_risk)
            
            return ThreatRiskGenerationResponse(
                success=True,
                threatRisks=threat_risks,
                message=f"Successfully generated {len(threat_risks)} threat risk records"
            )
        else:
            raise ValueError("No valid JSON found in response")
            
    except (json.JSONDecodeError, ValueError) as e:
        # Fallback response with sample threat risks
        fallback_risks = []
        for i in range(min(request.number_of_records, 3)):
            likelihood = 3
            impact = 3
            rating = likelihood * impact
            
            fallback_risk = ThreatRisk(
                id=str(uuid.uuid4())[:8],
                domain=request.domain,
                riskName=f"{request.category} Risk {i+1}",
                threat=f"Generic {request.category} Threat",
                vulnerability=f"System vulnerability in {request.domain}",
                category=request.category,
                likelihood=likelihood,
                impact=impact,
                rating=rating,
                likelihood_justification=f"Moderate likelihood based on typical {request.category} threats in {request.domain} domain",
                impact_justification=f"Moderate impact considering standard {request.domain} operational dependencies",
                threat_justification=f"Common threat vector observed in {request.category} category across similar organizations",
                vulnerability_justification=f"Typical vulnerability found in {request.domain} systems due to legacy infrastructure"
            )
            fallback_risks.append(fallback_risk)
        
        return ThreatRiskGenerationResponse(
            success=True,
            threatRisks=fallback_risks,
            message="Generated fallback threat risks due to processing error"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating threat risks: {str(e)}")

@threat_ra_router.post("/api/threat-ra/analyze-threat-risk", response_model=ThreatRiskAnalysisResponse)
def analyze_threat_risk(request: ThreatRiskAnalysisRequest):
    """
    Provide detailed analysis and recommendations for a specific threat risk scenario
    """
    system_prompt = """You are an expert threat risk analyst. Your task is to provide detailed analysis and recommendations for a specific threat risk scenario.

CRITICAL: You must respond with ONLY a valid JSON object. Do not include any markdown formatting, code blocks, or additional text.

Analyze the provided threat risk scenario and provide:
1. Likelihood assessment (1-5 scale) with detailed justification
2. Impact assessment (1-5 scale) with detailed justification  
3. Overall risk rating (likelihood × impact)
4. Specific recommendations for risk mitigation
5. Detection and prevention strategies
6. Industry-specific context and reasoning

Consider:
- Current threat landscape and attack trends
- Domain-specific vulnerabilities and exposures
- Industry best practices for risk mitigation
- Cost-effective security controls
- Realistic implementation timelines
- Regulatory and compliance requirements
- Historical incident data and case studies
- Technology and operational dependencies

Provide specific justifications that reference:
- Industry threat intelligence and statistics
- Regulatory requirements and compliance standards
- Common vulnerabilities in similar organizations
- Attack patterns and methodologies
- Business impact factors and dependencies
- Technology-specific risk factors
- Geographic and sector-specific considerations

RESPOND WITH ONLY THIS EXACT JSON FORMAT (no markdown, no code blocks, no additional text):
{
  "analysis": {
    "likelihood": 3,
    "likelihood_justification": "Detailed justification for the likelihood assessment based on threat intelligence, industry data, and domain-specific factors",
    "impact": 4,
    "impact_justification": "Detailed justification for the impact assessment based on business dependencies, regulatory requirements, and potential consequences"
  },
  "recommendations": [
    "Specific recommendation 1 with industry context",
    "Specific recommendation 2 with regulatory reference",
    "Specific recommendation 3 with cost-benefit analysis"
  ]
}"""

    user_message = f"""
Analyze the following threat risk scenario:

Domain: {request.domain}
Risk Name: {request.risk_name}
Threat: {request.threat}
Vulnerability: {request.vulnerability}
Category: {request.category}

Please provide a comprehensive analysis including likelihood and impact assessments, and specific recommendations for mitigating this threat risk.
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
            analysis_data = json.loads(json_str)
            
            # Extract analysis data
            analysis_info = analysis_data.get("analysis", {})
            likelihood = analysis_info.get("likelihood", 3)
            impact = analysis_info.get("impact", 3)
            rating = likelihood * impact
            
            # Create analysis response
            analysis = ThreatRisk(
                id=str(uuid.uuid4())[:8],
                domain=request.domain,
                riskName=request.risk_name,
                threat=request.threat,
                vulnerability=request.vulnerability,
                category=request.category,
                likelihood=likelihood,
                impact=impact,
                rating=rating,
                likelihood_justification=analysis_info.get("likelihood_justification", "Standard assessment"),
                impact_justification=analysis_info.get("impact_justification", "Based on business analysis"),
                threat_justification=f"Threat analysis for {request.threat} in {request.domain} domain",
                vulnerability_justification=f"Vulnerability assessment for {request.vulnerability} in {request.category} category"
            )
            
            recommendations = analysis_data.get("recommendations", [])
            
            return ThreatRiskAnalysisResponse(
                success=True,
                analysis=analysis,
                recommendations=recommendations,
                message="Successfully analyzed threat risk scenario"
            )
        else:
            raise ValueError("No valid JSON found in response")
            
    except (json.JSONDecodeError, ValueError) as e:
        # Fallback response
        likelihood = 3
        impact = 3
        rating = likelihood * impact
        
        fallback_analysis = ThreatRisk(
            id=str(uuid.uuid4())[:8],
            domain=request.domain,
            riskName=request.risk_name,
            threat=request.threat,
            vulnerability=request.vulnerability,
            category=request.category,
            likelihood=likelihood,
            impact=impact,
            rating=rating,
            likelihood_justification=f"Moderate likelihood based on common {request.threat} patterns in {request.domain} domain",
            impact_justification=f"Moderate impact considering typical {request.category} business dependencies",
            threat_justification=f"{request.threat} is a recognized threat vector in {request.domain} operations",
            vulnerability_justification=f"{request.vulnerability} is commonly found in {request.category} systems"
        )
        
        fallback_recommendations = [
            f"Implement security controls specific to {request.category}",
            f"Regular assessment and monitoring of {request.domain} systems",
            f"Employee training on {request.threat} prevention",
            f"Establish incident response procedures for {request.risk_name}"
        ]
        
        return ThreatRiskAnalysisResponse(
            success=True,
            analysis=fallback_analysis,
            recommendations=fallback_recommendations,
            message="Generated fallback analysis due to processing error"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing threat risk: {str(e)}")

@threat_ra_router.post("/api/threat-ra/generate-bulk-analysis")
def generate_bulk_threat_analysis(domains: List[str], categories: List[str]):
    """
    Generate bulk threat risk analysis for multiple domains and categories, and under department, mention which department of the company is related to this threat.
    """
    try:
        results = []
        
        for domain in domains:
            for category in categories:
                request = ThreatRiskGenerationRequest(
                    domain=domain,
                    category=category,
                    number_of_records=4
                )
                
                response = generate_threat_risks(request)
                if response.success:
                    results.extend(response.threatRisks)
        
        return {
            "success": True,
            "total_records": len(results),
            "threat_risks": results,
            "message": f"Successfully generated {len(results)} threat risk records across {len(domains)} domains and {len(categories)} categories"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in bulk analysis: {str(e)}")
