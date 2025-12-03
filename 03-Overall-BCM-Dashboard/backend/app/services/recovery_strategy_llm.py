"""
Service for LLM-based recovery strategy generation using external API endpoint.
"""
import aiohttp
import asyncio
from typing import Dict, Any, List
import json
import logging

logger = logging.getLogger(__name__)

class LLMService:
    
    # External LLM API endpoint
    LLM_ENDPOINT = "https://ey-catalyst-rvce-ey-catalyst.hf.space/business-continuity/api/business-continuity/generate-recovery-strategies"
    
    @staticmethod
    async def generate_recovery_strategies(
        department_name: str,
        subdepartment_name: str,
        process_name: str,
        process_description: str,
        impact_analysis: Dict[str, Any],
        minimum_operating_requirements: Dict[str, Any]
    ) -> Dict[str, str]:
        """
        Generate recovery strategies and their reasoning using external LLM API.
        """
        
        # Prepare input data in JSON format as a single object
        input_data = {
            "business_process": {
                "department": department_name,
                "sub_department": subdepartment_name,
                "process_name": process_name,
                "process_description": process_description
            },
            "analysis_data": {
                "impact_analysis": impact_analysis if impact_analysis else {},
                "minimum_operating_requirements": minimum_operating_requirements if minimum_operating_requirements else {}
            }
        }
        
        try:
            logger.info(f"Calling LLM API for process: {process_name}")
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    LLMService.LLM_ENDPOINT,
                    json=input_data,
                    headers={
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    timeout=aiohttp.ClientTimeout(total=60)  # 60 second timeout
                ) as response:
                    
                    if response.status == 200:
                        response_data = await response.json()
                        
                        # Extract the strategy data from response
                        # Assuming the API returns the strategy data directly
                        if isinstance(response_data, list) and len(response_data) > 0:
                            strategies_dict = response_data[0]
                        elif isinstance(response_data, dict):
                            strategies_dict = response_data
                        else:
                            logger.warning(f"Unexpected response format from LLM API for process {process_name}")
                            return LLMService._get_fallback_strategies_with_reasoning()
                        
                        # Validate that all required keys are present
                        required_keys = [
                            "people_unavailability_strategy",
                            "people_reasoning",
                            "technology_data_unavailability_strategy",
                            "technology_reasoning",
                            "site_unavailability_strategy", 
                            "site_reasoning",
                            "third_party_vendors_unavailability_strategy",
                            "vendor_reasoning"
                        ]
                        
                        fallback_data = LLMService._get_fallback_strategies_with_reasoning()
                        for key in required_keys:
                            if key not in strategies_dict or not strategies_dict[key]:
                                logger.warning(f"Missing or empty strategy key '{key}' for process {process_name}")
                                strategies_dict[key] = fallback_data[key]
                        
                        logger.info(f"Successfully generated recovery strategies via API for process: {process_name}")
                        return strategies_dict
                    
                    else:
                        logger.error(f"LLM API returned status {response.status} for process {process_name}")
                        error_text = await response.text()
                        logger.error(f"Error response: {error_text}")
                        return LLMService._get_fallback_strategies_with_reasoning()
                        
        except asyncio.TimeoutError:
            logger.error(f"Timeout calling LLM API for process {process_name}")
            return LLMService._get_fallback_strategies_with_reasoning()
        except aiohttp.ClientError as e:
            logger.error(f"HTTP client error calling LLM API for process {process_name}: {str(e)}")
            return LLMService._get_fallback_strategies_with_reasoning()
        except Exception as e:
            logger.error(f"Unexpected error calling LLM API for process {process_name}: {str(e)}")
            return LLMService._get_fallback_strategies_with_reasoning()
    
    @staticmethod
    def _get_fallback_strategies_with_reasoning() -> Dict[str, str]:
        """
        Fallback strategies with reasoning when LLM API fails.
        """
        logger.warning("LLM call failed. Using fallback strategies.")
        return {
            "people_unavailability_strategy": "Develop cross-training programs for key roles, maintain updated contact lists for temporary staff, and establish clear escalation procedures for critical decision-making.",
            "people_reasoning": "Cross-training ensures business continuity when key personnel are unavailable, reducing single points of failure.",
            
            "technology_data_unavailability_strategy": "Implement regular automated data backups, establish redundant systems and failover procedures, and maintain updated disaster recovery documentation.",
            "technology_reasoning": "Data backups and redundant systems protect against technology failures and ensure rapid recovery of critical business processes.",
            
            "site_unavailability_strategy": "Identify and pre-approve alternative work locations, enable remote work capabilities with necessary tools and access, and establish communication protocols for distributed teams.",
            "site_reasoning": "Alternative work arrangements ensure business operations can continue even when primary facilities are inaccessible due to disasters or emergencies.",
            
            "third_party_vendors_unavailability_strategy": "Maintain relationships with alternate vendors and suppliers, keep emergency contact information updated, and develop contingency contracts for critical services.",
            "vendor_reasoning": "Vendor diversification reduces dependency risks and ensures continuity of critical external services and supplies."
        }
    
    # Keep the old method for backward compatibility
    @staticmethod
    def _get_fallback_strategies() -> Dict[str, str]:
        """
        Fallback strategies when LLM fails (backward compatibility).
        """
        return {
            "people_unavailability_strategy": "Develop cross-training programs for key roles, maintain updated contact lists for temporary staff, and establish clear escalation procedures for critical decision-making.",
            "technology_data_unavailability_strategy": "Implement regular automated data backups, establish redundant systems and failover procedures, and maintain updated disaster recovery documentation.",
            "site_unavailability_strategy": "Identify and pre-approve alternative work locations, enable remote work capabilities with necessary tools and access, and establish communication protocols for distributed teams.",
            "third_party_vendors_unavailability_strategy": "Maintain relationships with alternate vendors and suppliers, keep emergency contact information updated, and develop contingency contracts for critical services."
        }
