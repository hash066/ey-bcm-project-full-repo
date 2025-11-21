"""
Service for LLM-based recovery strategy generation using Grok API.
"""
import aiohttp
import asyncio
from typing import Dict, Any, List, Optional
import json
import logging
import os
from datetime import datetime

logger = logging.getLogger(__name__)

class LLMService:
    """Service for generating recovery strategies using Grok API"""
    
    GROK_API_URL = "https://api.x.ai/v1/chat/completions"
    GROK_API_KEY = os.getenv("GROK_API_KEY", "")
    
    @staticmethod
    async def generate_recovery_strategies(
        department_name: str,
        subdepartment_name: str,
        process_name: str,
        process_description: str,
        content_types: List[str] = ["all"]
    ) -> Dict[str, Any]:
        """
        Generate recovery strategies using Grok API.
        
        Args:
            department_name: Name of the department
            subdepartment_name: Name of the subdepartment
            process_name: Name of the process
            process_description: Description of the process
            content_types: List of strategy types to generate
            
        Returns:
            Dictionary containing generated strategies
        """
        try:
            logger.info(f"Generating recovery strategies for process: {process_name}")
            
            # Construct the prompt
            prompt = LLMService._construct_prompt(
                department_name, subdepartment_name, process_name, process_description, content_types
            )
            
            # Call Grok API
            headers = {
                "Authorization": f"Bearer {LLMService.GROK_API_KEY}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": "grok-beta",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are an expert business continuity planner specializing in recovery strategy development. Generate comprehensive, actionable recovery strategies in valid JSON format."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.7,
                "max_tokens": 2500
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    LLMService.GROK_API_URL,
                    headers=headers,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=60)
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        content = result["choices"][0]["message"]["content"]
                        
                        # Parse the response
                        parsed_strategies = LLMService._parse_llm_response(content)
                        
                        logger.info(f"Successfully generated strategies for process: {process_name}")
                        return parsed_strategies
                    else:
                        error_text = await response.text()
                        logger.error(f"Grok API error: {response.status} - {error_text}")
                        return LLMService._get_fallback_strategies()
                        
        except Exception as e:
            logger.error(f"Error generating strategies with Grok: {str(e)}")
            return LLMService._get_fallback_strategies()
    
    @staticmethod
    def _construct_prompt(
        department_name: str,
        subdepartment_name: str,
        process_name: str,
        process_description: str,
        content_types: List[str]
    ) -> str:
        """Construct the prompt for Grok API"""
        
        prompt = f"""Generate comprehensive business continuity recovery strategies for the following process:

**Department:** {department_name}
**Sub-department:** {subdepartment_name}
**Process:** {process_name}
**Description:** {process_description}

Generate strategies and reasoning for the following scenarios:

1. **People Unavailability**: Strategy to handle unavailability of key personnel
2. **Technology/Data Unavailability**: Strategy for technology and data loss
3. **Site Unavailability**: Strategy for facility/location unavailability
4. **Third-Party Vendor Unavailability**: Strategy for vendor/supplier disruptions
5. **Process Vulnerability**: Identify and mitigate process vulnerabilities

For each scenario, provide:
- A detailed, actionable strategy (2-4 sentences)
- Clear reasoning explaining why this strategy is effective (1-2 sentences)

**IMPORTANT:** Return ONLY valid JSON in this exact format (no markdown, no code blocks):

{{
    "people_unavailability_strategy": "detailed strategy here",
    "people_reasoning": "reasoning here",
    "technology_data_unavailability_strategy": "detailed strategy here",
    "technology_reasoning": "reasoning here",
    "site_unavailability_strategy": "detailed strategy here",
    "site_reasoning": "reasoning here",
    "third_party_vendors_unavailability_strategy": "detailed strategy here",
    "vendor_reasoning": "reasoning here",
    "process_vulnerability_strategy": "detailed strategy here",
    "process_vulnerability_reasoning": "reasoning here"
}}
"""
        return prompt
    
    @staticmethod
    def _parse_llm_response(content: str) -> Dict[str, Any]:
        """Parse the LLM response into structured data"""
        try:
            # Remove markdown code blocks if present
            content = content.strip()
            if content.startswith("```json"):
                content = content[7:]
            elif content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
            
            # Try to extract JSON from the response
            start_idx = content.find('{')
            end_idx = content.rfind('}') + 1
            
            if start_idx != -1 and end_idx > start_idx:
                json_str = content[start_idx:end_idx]
                parsed = json.loads(json_str)
                
                # Ensure all required fields are present
                required_fields = [
                    "people_unavailability_strategy", "people_reasoning",
                    "technology_data_unavailability_strategy", "technology_reasoning",
                    "site_unavailability_strategy", "site_reasoning",
                    "third_party_vendors_unavailability_strategy", "vendor_reasoning",
                    "process_vulnerability_strategy", "process_vulnerability_reasoning"
                ]
                
                for field in required_fields:
                    if field not in parsed or not parsed[field]:
                        logger.warning(f"Missing field {field}, using fallback")
                        fallback = LLMService._get_fallback_strategies()
                        parsed[field] = fallback.get(field, "Strategy to be defined")
                
                return parsed
            else:
                logger.warning("Could not find JSON in response, using fallback")
                return LLMService._get_fallback_strategies()
                
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error: {str(e)}")
            return LLMService._get_fallback_strategies()
        except Exception as e:
            logger.error(f"Error parsing LLM response: {str(e)}")
            return LLMService._get_fallback_strategies()
    
    @staticmethod
    def _get_fallback_strategies() -> Dict[str, Any]:
        """Return fallback strategies when API fails"""
        return {
            "people_unavailability_strategy": "Implement cross-training programs and maintain updated succession plans. Establish backup personnel for critical roles with documented handover procedures.",
            "people_reasoning": "Cross-training ensures business continuity even when key personnel are unavailable, reducing single points of failure.",
            "technology_data_unavailability_strategy": "Implement regular data backups with 3-2-1 backup strategy and maintain redundant systems. Use cloud-based disaster recovery solutions with automated failover.",
            "technology_reasoning": "Redundant systems and geographically distributed backups minimize downtime and data loss during technology failures.",
            "site_unavailability_strategy": "Establish remote work capabilities and identify alternate work locations. Ensure critical infrastructure is available at backup sites with necessary equipment and connectivity.",
            "site_reasoning": "Multiple work locations and remote capabilities ensure operations continue during site disruptions without significant delays.",
            "third_party_vendors_unavailability_strategy": "Maintain relationships with alternate vendors and keep inventory buffers. Conduct regular vendor risk assessments and document contingency contacts.",
            "vendor_reasoning": "Multiple vendor options and inventory buffers reduce dependency on single suppliers and provide flexibility during disruptions.",
            "process_vulnerability_strategy": "Conduct regular process reviews and implement redundancy in critical steps. Establish monitoring and early warning systems with defined escalation procedures.",
            "process_vulnerability_reasoning": "Proactive identification and mitigation of vulnerabilities prevents disruptions before they occur and enables faster response."
        }
    
    @staticmethod
    async def generate_enhanced_recovery_strategies(
        department_name: str,
        subdepartment_name: str,
        process_name: str,
        process_description: str,
        content_types: List[str] = ["all"],
        include_vulnerability_analysis: bool = True
    ) -> Dict[str, Any]:
        """
        Generate enhanced recovery strategies with vulnerability analysis.
        
        Args:
            department_name: Name of the department
            subdepartment_name: Name of the subdepartment
            process_name: Name of the process
            process_description: Description of the process
            content_types: List of strategy types to generate
            include_vulnerability_analysis: Whether to include vulnerability analysis
            
        Returns:
            Dictionary containing strategies and optional vulnerability analysis
        """
        # Get basic strategies
        basic_strategies = await LLMService.generate_recovery_strategies(
            department_name, subdepartment_name, process_name, process_description, content_types
        )
        
        if include_vulnerability_analysis:
            vulnerability_analysis = await LLMService._generate_vulnerability_analysis(
                department_name, subdepartment_name, process_name, process_description
            )
            basic_strategies["vulnerability_analysis"] = vulnerability_analysis
            
            # Add AI insights
            ai_insights = {
                "generated_at": datetime.utcnow().isoformat(),
                "model": "grok-beta",
                "confidence": "high"
            }
            basic_strategies["ai_insights"] = ai_insights
        
        return basic_strategies
    
    @staticmethod
    async def _generate_vulnerability_analysis(
        department_name: str,
        subdepartment_name: str,
        process_name: str,
        process_description: str
    ) -> Dict[str, Any]:
        """Generate vulnerability analysis for a process"""
        
        prompt = f"""Analyze vulnerabilities for this business process:

**Department:** {department_name}
**Sub-department:** {subdepartment_name}
**Process:** {process_name}
**Description:** {process_description}

Provide a comprehensive vulnerability analysis covering:
1. Operational risks and their impact
2. Technical risks and system dependencies
3. Compliance and regulatory risks
4. Security vulnerabilities and threats

For each risk category, assess the risk level (Critical/High/Medium/Low) and provide specific mitigation steps.

**IMPORTANT:** Return ONLY valid JSON in this exact format (no markdown, no code blocks):

{{
    "operational_risk": {{
        "level": "High",
        "description": "specific operational risks",
        "mitigation": "specific mitigation steps"
    }},
    "technical_risk": {{
        "level": "Medium",
        "description": "specific technical risks",
        "mitigation": "specific mitigation steps"
    }},
    "compliance_risk": {{
        "level": "Low",
        "description": "specific compliance risks",
        "mitigation": "specific mitigation steps"
    }},
    "security_risk": {{
        "level": "Medium",
        "description": "specific security risks",
        "mitigation": "specific mitigation steps"
    }},
    "overall_criticality": "High",
    "recommended_rto": "4 hours",
    "recommended_rpo": "1 hour",
    "priority_actions": ["action 1", "action 2", "action 3"]
}}
"""
        
        try:
            headers = {
                "Authorization": f"Bearer {LLMService.GROK_API_KEY}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": "grok-beta",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a business continuity risk analyst with expertise in vulnerability assessment. Provide detailed, actionable risk analysis in valid JSON format."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.6,
                "max_tokens": 2000
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    LLMService.GROK_API_URL,
                    headers=headers,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=60)
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        content = result["choices"]["message"]["content"]
                        
                        # Parse JSON from content
                        content = content.strip()
                        if content.startswith("```json"):
                            content = content[7:]
                        elif content.startswith("```"):
                            content = content[3:]
                        if content.endswith("```"):
                            content = content[:-3]
                        content = content.strip()
                        
                        start_idx = content.find('{')
                        end_idx = content.rfind('}') + 1
                        
                        if start_idx != -1 and end_idx > start_idx:
                            json_str = content[start_idx:end_idx]
                            parsed = json.loads(json_str)
                            return parsed
                        else:
                            return LLMService._get_fallback_vulnerability_analysis()
                    else:
                        logger.error(f"Vulnerability analysis API error: {response.status}")
                        return LLMService._get_fallback_vulnerability_analysis()
                        
        except Exception as e:
            logger.error(f"Error generating vulnerability analysis: {str(e)}")
            return LLMService._get_fallback_vulnerability_analysis()
    
    @staticmethod
    def _get_fallback_vulnerability_analysis() -> Dict[str, Any]:
        """Return fallback vulnerability analysis"""
        return {
            "operational_risk": {
                "level": "Medium",
                "description": "Process may experience disruptions due to resource dependencies and workflow complexities.",
                "mitigation": "Implement process redundancy, cross-training, and regular process reviews to identify bottlenecks."
            },
            "technical_risk": {
                "level": "Medium",
                "description": "Dependencies on technology systems and data availability may cause service interruptions.",
                "mitigation": "Establish backup systems, implement redundant data storage, and maintain system documentation."
            },
            "compliance_risk": {
                "level": "Low",
                "description": "Standard compliance requirements apply based on industry regulations.",
                "mitigation": "Regular compliance audits, documentation updates, and staff training on regulatory requirements."
            },
            "security_risk": {
                "level": "Medium",
                "description": "Standard security vulnerabilities related to data access and system security.",
                "mitigation": "Implement access controls, regular security assessments, and incident response procedures."
            },
            "overall_criticality": "Medium",
            "recommended_rto": "24 hours",
            "recommended_rpo": "4 hours",
            "priority_actions": [
                "Establish backup procedures",
                "Document critical workflows",
                "Conduct regular risk assessments"
            ]
        }
