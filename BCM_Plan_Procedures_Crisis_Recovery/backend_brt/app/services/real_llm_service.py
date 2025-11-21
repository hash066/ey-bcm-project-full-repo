"""
Real LLM Service using Groq API
"""
from .groq_llm_service import GroqLLMService
from typing import Dict, Any, List
import json

class RealLLMService:
    def __init__(self):
        self.groq_service = GroqLLMService()
    
    async def get_description(self, query_type: str, query_name: str) -> Dict[str, Any]:
        """Generate AI description for a process or department"""
        return await self.groq_service.get_description(query_type, query_name)
    
    async def get_impact_scale_matrix(self, process_name: str, impact_name: str) -> Dict[str, Any]:
        """Generate AI impact scale matrix"""
        return await self.groq_service.get_impact_scale_matrix(process_name, impact_name)
    
    async def get_peak_period(self, department: str, process_name: str, sector: str) -> Dict[str, Any]:
        """Generate AI peak period prediction"""
        return await self.groq_service.get_peak_period(department, process_name, sector)
    
    async def generate_bcm_policy(self, organization_name: str, standards: List[str], custom_notes: str) -> Dict[str, Any]:
        """Generate AI BCM policy"""
        return await self.groq_service.generate_bcm_policy(organization_name, standards, custom_notes)
    
    async def generate_bcm_questions(self) -> Dict[str, Any]:
        """Generate AI BCM questions"""
        return await self.groq_service.generate_bcm_questions()