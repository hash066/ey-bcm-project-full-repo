"""
Groq LLM Service using Groq API
"""
import os
import json
import aiohttp
from typing import Dict, Any, List

class GroqLLMService:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"
        self.model = "llama-3.1-8b-instant"  # Current fast Groq model
        
    async def get_description(self, query_type: str, query_name: str) -> Dict[str, Any]:
        """Generate AI description for a process or department"""
        try:
            prompt = f"""
            Generate a professional, concise description (1-2 sentences) for the following {query_type}: {query_name}
            
            Context: This is for a Business Continuity Management System (BCMS) procedure document.
            
            Requirements:
            - Keep it professional and business-focused
            - 1-2 sentences maximum
            - Focus on the purpose and scope
            - Use business continuity terminology where appropriate
            """
            
            response = await self._make_request([
                {"role": "system", "content": "You are a business continuity expert writing professional procedure documentation."},
                {"role": "user", "content": prompt}
            ], max_tokens=150)
            
            description = response.get("content", "").strip()
            
            return {
                "description": description,
                "query_type": query_type,
                "query_name": query_name
            }
            
        except Exception as e:
            # Fallback to template if API fails
            return {
                "description": f"The {query_name} is a systematic approach designed to support business continuity management objectives.",
                "query_type": query_type,
                "query_name": query_name,
                "fallback": True
            }

    async def get_peak_period(self, department: str, process_name: str, sector: str) -> Dict[str, Any]:
        try:
            prompt = f"""
            Predict peak operational periods for the process "{process_name}" in the department "{department}" for the "{sector}" sector.
            Return a concise sentence describing typical peak periods (e.g., month/quarter/time-of-day).
            """
            response = await self._make_request([
                {"role": "system", "content": "You are a business continuity analyst."},
                {"role": "user", "content": prompt}
            ], max_tokens=80)
            peak_period = response.get("content", "Peak periods vary based on business cycles").strip()
            return {"peak_period": peak_period}
        except Exception:
            return {"peak_period": "Peak periods vary based on business cycles", "fallback": True}

    async def get_impact_scale_matrix(self, process_name: str, impact_name: str) -> Dict[str, Any]:
        try:
            prompt = f"""
            Provide an impact severity matrix for the process "{process_name}" focusing on "{impact_name}".
            Use keys [1 Hour, 4 Hours, 8 Hours, 24 Hours, 72 Hours] each mapping to {{impact_severity: '1-5', reason: '<short>'}}.
            Return valid JSON only.
            """
            response = await self._make_request([
                {"role": "system", "content": "You are a BCMS impact analyst. Respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ], max_tokens=400, temperature=0.3)
            content = response.get("content", "{}")
            try:
                matrix = json.loads(content)
            except Exception:
                matrix = {
                    "1 Hour": {"impact_severity": "1", "reason": "Minimal impact"},
                    "4 Hours": {"impact_severity": "2", "reason": "Minor impact"},
                    "8 Hours": {"impact_severity": "3", "reason": "Moderate impact"},
                    "24 Hours": {"impact_severity": "4", "reason": "Significant impact"},
                    "72 Hours": {"impact_severity": "5", "reason": "Critical impact"}
                }
            return {"impact_scale_matrix": matrix}
        except Exception:
            return {"impact_scale_matrix": {
                "1 Hour": {"impact_severity": "1", "reason": "Minimal impact"},
                "4 Hours": {"impact_severity": "2", "reason": "Minor impact"},
                "8 Hours": {"impact_severity": "3", "reason": "Moderate impact"},
                "24 Hours": {"impact_severity": "4", "reason": "Significant impact"},
                "72 Hours": {"impact_severity": "5", "reason": "Critical impact"}
            }, "fallback": True}
    
    async def get_impact_scale_matrix(self, process_name: str, impact_name: str) -> Dict[str, Any]:
        """Generate AI impact scale matrix"""
        try:
            prompt = f"""
            Generate an impact scale matrix for {impact_name} impact in {process_name}.
            
            Create a JSON object with time durations as keys and impact details as values.
            Use these time periods: "1 Hour", "4 Hours", "8 Hours", "24 Hours", "72 Hours"
            
            For each time period, provide:
            - impact_severity: number from 1-5 (1=minimal, 5=critical)
            - reason: brief explanation of why this severity level
            
            Focus on {impact_name.lower()} impacts specifically.
            
            Return only valid JSON format.
            """
            
            response = await self._make_request([
                {"role": "system", "content": "You are a business impact analysis expert. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ], max_tokens=300)
            
            matrix_text = response.get("content", "").strip()
            
            # Try to parse as JSON
            try:
                matrix_data = json.loads(matrix_text)
            except:
                # Fallback matrix if JSON parsing fails
                matrix_data = {
                    "1 Hour": {"impact_severity": "1", "reason": f"Minimal {impact_name.lower()} impact"},
                    "4 Hours": {"impact_severity": "2", "reason": f"Minor {impact_name.lower()} concerns"},
                    "8 Hours": {"impact_severity": "3", "reason": f"Moderate {impact_name.lower()} impact"},
                    "24 Hours": {"impact_severity": "4", "reason": f"Significant {impact_name.lower()} issues"},
                    "72 Hours": {"impact_severity": "5", "reason": f"Critical {impact_name.lower()} impact"}
                }
            
            return {
                "impact_scale_matrix": matrix_data,
                "process_name": process_name,
                "impact_name": impact_name
            }
            
        except Exception as e:
            # Fallback matrix
            return {
                "impact_scale_matrix": {
                    "1 Hour": {"impact_severity": "1", "reason": f"Minimal {impact_name.lower()} impact"},
                    "4 Hours": {"impact_severity": "2", "reason": f"Minor {impact_name.lower()} concerns"},
                    "8 Hours": {"impact_severity": "3", "reason": f"Moderate {impact_name.lower()} impact"},
                    "24 Hours": {"impact_severity": "4", "reason": f"Significant {impact_name.lower()} issues"},
                    "72 Hours": {"impact_severity": "5", "reason": f"Critical {impact_name.lower()} impact"}
                },
                "process_name": process_name,
                "impact_name": impact_name,
                "fallback": True
            }
    
    async def get_peak_period(self, department: str, process_name: str, sector: str) -> Dict[str, Any]:
        """Generate AI peak period prediction"""
        try:
            prompt = f"""
            Predict the peak operational periods for the {department} department in a {sector} organization, 
            specifically for {process_name}.
            
            Consider:
            - Industry-specific patterns
            - Department-specific workload cycles
            - Business hours and seasonal variations
            
            Provide a concise description of when this department typically experiences peak activity.
            """
            
            response = await self._make_request([
                {"role": "system", "content": "You are a business operations expert analyzing departmental peak periods."},
                {"role": "user", "content": prompt}
            ], max_tokens=100)
            
            peak_period = response.get("content", "").strip()
            
            return {
                "peak_period": peak_period,
                "department": department,
                "process_name": process_name,
                "sector": sector
            }
            
        except Exception as e:
            # Fallback peak period
            return {
                "peak_period": f"Business hours with seasonal variations typical for {department} operations",
                "department": department,
                "process_name": process_name,
                "sector": sector,
                "fallback": True
            }
    
    async def generate_bcm_policy(self, organization_name: str, standards: List[str], custom_notes: str) -> Dict[str, Any]:
        """Generate AI BCM policy"""
        try:
            standards_text = ", ".join(standards) if standards else "industry best practices"
            
            prompt = f"""
            Generate a professional Business Continuity Management (BCM) policy for {organization_name}.
            
            Requirements:
            - Align with {standards_text}
            - Include commitment to business continuity
            - Mention resilience and stakeholder protection
            - Keep it concise (2-3 sentences)
            - Professional tone
            
            Additional context: {custom_notes}
            """
            
            response = await self._make_request([
                {"role": "system", "content": "You are a business continuity policy expert writing executive-level policy statements."},
                {"role": "user", "content": prompt}
            ], max_tokens=200)
            
            policy = response.get("content", "").strip()
            
            return {
                "policy": policy,
                "organization_name": organization_name,
                "standards": standards
            }
            
        except Exception as e:
            # Fallback policy
            return {
                "policy": f"{organization_name} is committed to maintaining business continuity and ensuring the resilience of critical business operations through comprehensive planning and risk management.",
                "organization_name": organization_name,
                "standards": standards,
                "fallback": True
            }
    
    async def generate_bcm_questions(self) -> Dict[str, Any]:
        """Generate AI BCM questions"""
        try:
            prompt = """
            Generate 5-7 essential questions for Business Continuity Management (BCM) planning.
            
            Focus on:
            - Critical process identification
            - Recovery requirements
            - Resource dependencies
            - Communication strategies
            - Testing and validation
            
            Make questions practical and actionable for BCM teams.
            Return as a simple list.
            """
            
            response = await self._make_request([
                {"role": "system", "content": "You are a BCM consultant creating assessment questions."},
                {"role": "user", "content": prompt}
            ], max_tokens=300)
            
            questions_text = response.get("content", "").strip()
            
            # Parse questions from response
            questions = []
            for line in questions_text.split('\n'):
                line = line.strip()
                if line and (line.startswith('-') or line.startswith('•') or line[0].isdigit()):
                    # Clean up formatting
                    question = line.lstrip('-•0123456789. ').strip()
                    if question:
                        questions.append(question)
            
            if not questions:
                # Fallback questions
                questions = [
                    "What are the critical business processes that must be maintained during a disruption?",
                    "What are the maximum acceptable downtime periods for each critical process?",
                    "What resources are required to maintain critical operations during a disruption?",
                    "How will communication be maintained with stakeholders during an incident?",
                    "What are the recovery strategies for each critical business function?"
                ]
            
            return {
                "questions": questions
            }
            
        except Exception as e:
            # Fallback questions
            return {
                "questions": [
                    "What are the critical business processes that must be maintained during a disruption?",
                    "What are the maximum acceptable downtime periods for each critical process?",
                    "What resources are required to maintain critical operations during a disruption?",
                    "How will communication be maintained with stakeholders during an incident?",
                    "What are the recovery strategies for each critical business function?"
                ],
                "fallback": True
            }
    
    async def _make_request(self, messages: List[Dict], max_tokens: int = 150, temperature: float = 0.7) -> Dict[str, Any]:
        """Make request to Groq API"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(self.base_url, headers=headers, json=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    return data["choices"][0]["message"]
                else:
                    raise Exception(f"Groq API error: {response.status}")