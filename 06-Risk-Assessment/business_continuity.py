# business_continuity.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import os
# import openai
from groq import Groq  # ✅ Add this
import json
import uuid
import logging
import traceback
import re
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# Environment Variables
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if GROQ_API_KEY:
    GROQ_API_KEY = GROQ_API_KEY.strip()

logger.info(f"GROQ_API_KEY loaded: {'Yes' if GROQ_API_KEY else 'No'}")

# Request Models
class BusinessProcess(BaseModel):
    department: str = Field(..., min_length=1, max_length=100)
    sub_department: Optional[str] = Field(default="", max_length=100)
    process_name: str = Field(..., min_length=1, max_length=200)
    process_description: str = Field(..., min_length=1, max_length=1000)

class AnalysisData(BaseModel):
    impact_analysis: Optional[Dict[str, Any]] = Field(default_factory=dict)
    minimum_operating_requirements: Optional[Dict[str, Any]] = Field(default_factory=dict)

class BusinessContinuityRequest(BaseModel):
    business_process: BusinessProcess
    analysis_data: AnalysisData = Field(default_factory=lambda: AnalysisData())

# Response Model
class RecoveryStrategiesResponse(BaseModel):
    success: bool
    people_unavailability_strategy: str
    people_reasoning: str
    technology_data_unavailability_strategy: str
    technology_reasoning: str
    site_unavailability_strategy: str
    site_reasoning: str
    third_party_vendors_unavailability_strategy: str
    vendor_reasoning: str

# Create router
business_continuity_router = APIRouter()

def call_groq_api(prompt: str, user_message: str):
    """Simple function to call GROQ API"""
    if not GROQ_API_KEY:
        logger.error("GROQ_API_KEY environment variable is not set")
        raise Exception("GROQ_API_KEY not configured")
    
    try:
        client = Groq(api_key=GROQ_API_KEY)
        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.1,
            max_tokens=1500
        )
        
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"API call failed: {str(e)}")
        raise Exception(f"API call failed: {str(e)}")

@business_continuity_router.post("/api/business-continuity/generate-recovery-strategies", response_model=RecoveryStrategiesResponse)
def generate_recovery_strategies(request: BusinessContinuityRequest):
    """Generate business continuity recovery strategies"""
    request_id = str(uuid.uuid4())
    logger.info(f"Request {request_id}: Starting for {request.business_process.process_name}")
    
    # Basic input validation
    if not request.business_process.process_name.strip():
        raise HTTPException(status_code=400, detail="Process name cannot be empty")
    if not request.business_process.department.strip():
        raise HTTPException(status_code=400, detail="Department cannot be empty")
    
    try:
        # Create system prompt with strong emphasis on valid JSON output
        system_prompt = """You are a business continuity expert. CRITICAL: You must ONLY output a valid, parsable JSON object and nothing else. No explanations, no formatting, just pure JSON.

Your output MUST be in this EXACT format with NO DEVIATIONS:

{
  "people_unavailability_strategy": "Strategy for when key staff are unavailable (2-3 sentences).",
  "people_reasoning": "Why this strategy works for this process (1 sentence).",
  "technology_data_unavailability_strategy": "Strategy for system failures (2-3 sentences).",
  "technology_reasoning": "Why this technology strategy works (1 sentence).",
  "site_unavailability_strategy": "Strategy for site unavailability (2-3 sentences).",
  "site_reasoning": "Why this site strategy works (1 sentence).",
  "third_party_vendors_unavailability_strategy": "Strategy for supplier disruptions (2-3 sentences).",
  "vendor_reasoning": "Why this vendor strategy works (1 sentence)."
}

CRITICAL: Your output MUST be a valid JSON object with the above structure. If you cannot generate this, return an error message in the same JSON format with a "message" field indicating the error.
GIVE ONLY this JSON output. DO NOT include any other text, explanations, or formatting.
THE ENTIRE CODE DEPENDS ON THIS JSON STRUCTURE BEING CORRECT. PLEASE ensure the JSON is valid and parsable.
DO NOT add markdown code blocks, explanations, or any text before or after the JSON. ONLY output the raw JSON object."""

        # Create user message - simplified
        user_message = f"""Generate business continuity strategies for:
Process: {request.business_process.process_name}
Department: {request.business_process.department}
Description: {request.business_process.process_description}"""


        api_response = call_groq_api(system_prompt, user_message)
        logger.info(f"Request {request_id}: Received API response")
        
        # Parse JSON response directly
        try:
            # Simple direct parsing - trust the LLM to format correctly
            if not api_response.strip().endswith('}'):
                api_response += '}'
            strategies_data = json.loads(api_response)
            logger.info(f"Request {request_id}: Successfully parsed JSON")
        except json.JSONDecodeError as e:
            # If parsing fails, just return the error
            logger.error(f"Request {request_id}: JSON parsing failed - {str(e)}")
            logger.error(f"Request {request_id}: Raw response preview: {api_response}")
        
        # Safely get fields with fallbacks
        return RecoveryStrategiesResponse(
            success=True,
            people_unavailability_strategy=strategies_data.get("people_unavailability_strategy", "Strategy not generated"),
            people_reasoning=strategies_data.get("people_reasoning", "Reasoning not generated"),
            technology_data_unavailability_strategy=strategies_data.get("technology_data_unavailability_strategy", "Strategy not generated"),
            technology_reasoning=strategies_data.get("technology_reasoning", "Reasoning not generated"),
            site_unavailability_strategy=strategies_data.get("site_unavailability_strategy", "Strategy not generated"),
            site_reasoning=strategies_data.get("site_reasoning", "Reasoning not generated"),
            third_party_vendors_unavailability_strategy=strategies_data.get("third_party_vendors_unavailability_strategy", "Strategy not generated"),
            vendor_reasoning=strategies_data.get("vendor_reasoning", "Reasoning not generated"),
            message="Successfully generated recovery strategies",
            request_id=request_id
        )
            
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Request {request_id}: Unexpected error - {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")

@business_continuity_router.get("/api/business-continuity/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "groq_api_configured": bool(GROQ_API_KEY),
        "timestamp": uuid.uuid4().hex
    }