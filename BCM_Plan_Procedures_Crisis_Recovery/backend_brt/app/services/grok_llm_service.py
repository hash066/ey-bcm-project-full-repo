"""
Grok LLM Service for generating recovery strategies using Grok API.
"""
import aiohttp
import asyncio
from typing import Dict, Any
import json
import logging
import os
from app.core.config import settings

logger = logging.getLogger(__name__)

class GrokLLMService:
    """Service for generating recovery strategies using Grok API."""
    
    GROK_API_URL = "https://api.groq.com/openai/v1/chat/completions"
    MODEL = "llama-3.3-70b-versatile"  # Latest Groq model (Dec 2024)
    
    @staticmethod
    async def generate_recovery_strategies(
        department_name: str,
        subdepartment_name: str,
        process_name: str,
        process_description: str,
        impact_analysis: Dict[str, Any] = None,
        minimum_operating_requirements: Dict[str, Any] = None
    ) -> Dict[str, str]:
        """
        Generate recovery strategies using Grok API.
        
        Returns dict with strategy fields and reasoning.
        """
        
        # Get API key from environment
        api_key = os.getenv('GROQ_API_KEY') or os.getenv('GROK_API_KEY')
        
        if not api_key:
            logger.error("No Grok API key found in environment")
            return GrokLLMService._generate_fallback_strategies(process_name)
        
        # Prepare the prompt
        prompt = f"""You are a Business Continuity expert. Generate comprehensive recovery strategies for the following business process:

Department: {department_name}
Subdepartment: {subdepartment_name}
Process: {process_name}
Description: {process_description}

Generate recovery strategies for the following categories:

1. PEOPLE UNAVAILABILITY STRATEGY: How to handle key staff being unavailable
2. TECHNOLOGY/DATA UNAVAILABILITY STRATEGY: How to handle system failures or data loss
3. SITE UNAVAILABILITY STRATEGY: How to handle facility/location being inaccessible
4. VENDOR UNAVAILABILITY STRATEGY: How to handle third-party supplier disruptions
5. PROCESS VULNERABILITY STRATEGY: How to address inherent vulnerabilities in this process
6. TECHNOLOGY UNAVAILABILITY STRATEGY: How to handle technology infrastructure failures (servers, networks, hardware)
7. THIRD PARTY UNAVAILABILITY STRATEGY: How to handle external service provider or partner unavailability

For each strategy, provide:
- A clear, actionable strategy (2-3 sentences)
- Brief reasoning explaining why this strategy is important (1-2 sentences)

Format your response as JSON with these exact keys:
{{
  "people_unavailability_strategy": "strategy text",
  "people_reasoning": "reasoning text",
  "technology_data_unavailability_strategy": "strategy text",
  "technology_reasoning": "reasoning text",
  "site_unavailability_strategy": "strategy text",
  "site_reasoning": "reasoning text",
  "third_party_vendors_unavailability_strategy": "strategy text",
  "vendor_reasoning": "reasoning text",
  "process_vulnerability_strategy": "strategy text",
  "process_vulnerability_reasoning": "reasoning text",
  "technology_unavailability_strategy": "strategy text",
  "technology_unavailability_reasoning": "reasoning text",
  "third_party_unavailability_strategy": "strategy text",
  "third_party_unavailability_reasoning": "reasoning text"
}}

Respond ONLY with the JSON object, no additional text."""

        try:
            logger.info(f"Calling Grok API for process: {process_name}")
            
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": GrokLLMService.MODEL,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a Business Continuity Management expert. Provide responses in valid JSON format only."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.7,
                "max_tokens": 2000
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    GrokLLMService.GROK_API_URL,
                    headers=headers,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=60)
                ) as response:
                    
                    if response.status == 200:
                        result = await response.json()
                        content = result['choices'][0]['message']['content']
                        
                        # Parse JSON response
                        try:
                            # Try to extract JSON from markdown code blocks if present
                            if '```json' in content:
                                content = content.split('```json')[1].split('```')[0].strip()
                            elif '```' in content:
                                content = content.split('```')[1].split('```')[0].strip()
                            
                            strategies = json.loads(content)
                            logger.info(f"Successfully generated strategies for {process_name}")
                            return strategies
                            
                        except json.JSONDecodeError as e:
                            logger.error(f"Failed to parse JSON response: {e}")
                            logger.error(f"Content: {content}")
                            return GrokLLMService._generate_fallback_strategies(process_name)
                    
                    else:
                        error_text = await response.text()
                        logger.error(f"Grok API error {response.status}: {error_text}")
                        return GrokLLMService._generate_fallback_strategies(process_name)
        
        except asyncio.TimeoutError:
            logger.error(f"Timeout calling Grok API for {process_name}")
            return GrokLLMService._generate_fallback_strategies(process_name)
        
        except Exception as e:
            logger.error(f"Error calling Grok API: {str(e)}")
            return GrokLLMService._generate_fallback_strategies(process_name)
    
    @staticmethod
    def _generate_fallback_strategies(process_name: str) -> Dict[str, str]:
        """Generate basic fallback strategies when API fails."""
        return {
            "people_unavailability_strategy": f"Implement cross-training programs for {process_name} staff, maintain updated contact lists for backup personnel, and establish clear escalation procedures.",
            "people_reasoning": "Cross-training ensures business continuity when key personnel are unavailable, reducing single points of failure.",
            "technology_data_unavailability_strategy": f"Implement regular automated backups for {process_name} systems, establish redundant infrastructure, and maintain disaster recovery documentation.",
            "technology_reasoning": "Data backups and redundant systems protect against technology failures and ensure rapid recovery.",
            "site_unavailability_strategy": f"Enable remote work capabilities for {process_name}, identify alternative work locations, and establish communication protocols for distributed teams.",
            "site_reasoning": "Alternative work arrangements ensure operations continue when primary facilities are inaccessible.",
            "third_party_vendors_unavailability_strategy": f"Maintain relationships with alternate vendors for {process_name}, keep emergency contacts updated, and develop contingency contracts.",
            "vendor_reasoning": "Vendor diversification reduces dependency risks and ensures continuity of critical services.",
            "process_vulnerability_strategy": f"Conduct regular risk assessments for {process_name}, implement security controls, and establish monitoring procedures.",
            "process_vulnerability_reasoning": "Proactive vulnerability management reduces the likelihood and impact of process disruptions.",
            "technology_unavailability_strategy": f"Establish redundant technology infrastructure for {process_name}, implement failover systems, maintain spare hardware inventory, and ensure network redundancy with multiple ISPs.",
            "technology_unavailability_reasoning": "Technology infrastructure redundancy prevents single points of failure and ensures continuous operations during hardware or network outages.",
            "third_party_unavailability_strategy": f"Identify and qualify alternative service providers for {process_name}, establish SLAs with clear performance metrics, maintain emergency contact protocols, and develop contingency plans for critical dependencies.",
            "third_party_unavailability_reasoning": "Diversified service provider relationships and contingency planning mitigate risks from external partner failures and ensure service continuity."
        }
