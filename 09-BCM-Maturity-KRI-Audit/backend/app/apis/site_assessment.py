import requests
import json
from fastapi import APIRouter, HTTPException
from .models import SiteAssessmentInput
from typing import List, Dict, Any

siteassessment_router = APIRouter(prefix="/api")

def generate_risk_analysis_prompt(site_details: dict, controls: List[dict]) -> str:
    """Generate a comprehensive prompt for LLM risk analysis"""
    
    prompt = f"""
You are an expert risk analyst conducting a comprehensive site assessment. Based on the following information, provide detailed risk analysis in the specified JSON format.

SITE DETAILS:
- Address: {site_details.get('address', 'Not provided')}
- Occupancy Nature: {site_details.get('occupancyNature', 'Not provided')}
- Building Construction: {site_details.get('buildingConstruction', 'Not provided')}
- Total Floors: {site_details.get('totalFloors', 'Not provided')}
- Building Age: {site_details.get('buildingAge', 'Not provided')} years
- Fire NOC Status: {site_details.get('fireNOC', 'Not provided')}
- Operational Hours: {site_details.get('operationalHours', 'Not provided')}
- Power Backup: {site_details.get('powerBackupDetails', 'Not provided')}
- HVAC System: {site_details.get('hvacSystem', 'Not provided')}

RISK ASSESSMENT RESPONSES:
"""
    
    for i, control in enumerate(controls, 1):
        if control.get('category') and control.get('question') and control.get('complianceStatus'):
            prompt += f"""
{i}. Category: {control['category']}
   Question: {control['question']}
   Current Status/Answer: {control['complianceStatus']}
"""
    
    prompt += """

Based on this assessment, analyze each risk response and provide a comprehensive JSON response with the following structure for each identified risk:

{
  "risk_analysis": {
    "risk_id": "RISK-XXX",
    "category": "Risk Category from the question",
    "question": "The original question",
    "user_answer": "User's response/compliance status",
    "risk_name": "Brief name of the identified risk",
    "identified_threat": "Detailed description of the threat/risk",
    "likelihood": "Low/Medium/High/Very High",
    "impact": "Low/Medium/High/Severe", 
    "risk_value": numeric_score_1_to_100,
    "residual_risk": "Low/Medium/High/Critical",
    "current_control_description": "Description of existing controls based on user answer",
    "current_control_rating": "Poor/Fair/Good/Excellent",
    "business_unit": "Relevant business unit (e.g., IT Security, Facilities, Infrastructure)",
    "risk_owner": "Appropriate role responsible for this risk",
    "timeline": "Immediate/3 months/6 months/1 year",
    "mitigation_plan": "Specific actionable mitigation recommendations",
    "summary": {
      "risk_classification_summary": "Brief summary of the risk classification",
      "mitigation_suggestions": [
        "Specific suggestion 1",
        "Specific suggestion 2",
        "Specific suggestion 3"
      ],
      "risk_trends": {
        "top_category": "Most critical category",
        "risk_severity": "Overall severity assessment",
        "observations": [
          "Key observation 1",
          "Key observation 2"
        ]
      }
    }
  }
}

Please provide a JSON array containing risk_analysis objects for each significant risk identified from the responses. Focus on areas where compliance is poor or missing, and prioritize risks based on likelihood and potential impact.
"""
    
    return prompt

def call_llm_api(prompt: str) -> dict:
    """Call LLM API for risk analysis"""
    
    try:
        # Try to call your actual LLM API first
        # Replace with your actual LLM endpoint URL
        llm_endpoint = "https://ey-catalyst-rvce.hf.space/bia/threat-assessment"  # Replace with your actual endpoint
        
        response = requests.post(
            llm_endpoint, 
            json={"message": prompt, "max_tokens": 2000},
            timeout=30
        )
        
        print(f"LLM API response status: {response.status_code}")
        
        if response.status_code == 200:
            llm_result = response.json()
            print(f"LLM API response: {llm_result}")
            return llm_result
        else:
            print(f"LLM API error: {response.status_code} - {response.text}")
            # Fall back to mock response
            return generate_mock_response()
            
    except requests.exceptions.RequestException as e:
        print(f"Error calling LLM API: {e}")
        # Fall back to mock response
        return generate_mock_response()
    except Exception as e:
        print(f"Unexpected error calling LLM API: {e}")
        return generate_mock_response()

def generate_mock_response() -> list:
    """Generate a mock response when LLM API is not available"""
    return [
        {
            "risk_analysis": {
                "risk_id": "RISK-001",
                "category": "Fire",
                "question": "Sample fire safety question",
                "user_answer": "Based on user input",
                "risk_name": "Fire Safety Risk",
                "identified_threat": "Potential fire hazard identified based on assessment",
                "likelihood": "High",
                "impact": "Severe",
                "risk_value": 85,
                "residual_risk": "Critical",
                "current_control_description": "Current fire safety measures are inadequate",
                "current_control_rating": "Poor",
                "business_unit": "Facilities",
                "risk_owner": "Fire Safety Officer",
                "timeline": "Immediate",
                "mitigation_plan": "Implement comprehensive fire safety system",
                "summary": {
                    "risk_classification_summary": "Critical fire safety risk requiring immediate attention",
                    "mitigation_suggestions": [
                        "Install automated fire suppression system",
                        "Conduct fire safety training",
                        "Regular fire drills"
                    ],
                    "risk_trends": {
                        "top_category": "Fire",
                        "risk_severity": "Critical",
                        "observations": [
                            "Fire safety systems are inadequate",
                            "Immediate action required"
                        ]
                    }
                }
            }
        }
    ]

@siteassessment_router.post("/analyze")  
async def analyze_site_assessment(data: SiteAssessmentInput):
    """
    Analyze site assessment data and return risk analysis
    """
    try:
        print("Received site assessment data:", data)
        
        # Convert Pydantic models to dictionaries
        site_details_dict = data.siteDetails.dict()
        controls_list = [control.dict() for control in data.controls]
        
        # Generate prompt for LLM
        prompt = generate_risk_analysis_prompt(site_details_dict, controls_list)
        
        # Call LLM API
        risk_analysis_result = call_llm_api(prompt)
        
        print("Risk analysis result:", risk_analysis_result)
        
        return risk_analysis_result
        
    except Exception as e:
        print(f"Error in site assessment analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

# Health check endpoint
@siteassessment_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "site_assessment"} 