"""
Enhanced Procedure Generation Service
Generates complete procedures using organization data and Groq LLM
"""
import os
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from .groq_llm_service import GroqLLMService
from ..models.global_models import GlobalOrganization as Organization
from ..models.bia_models import BIAProcessInfo as BIAProcess

class EnhancedProcedureService:
    def __init__(self, db: Session):
        self.db = db
        self.groq_service = GroqLLMService()
    
    async def generate_complete_procedure(
        self, 
        organization_id: int, 
        procedure_type: str,
        options: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Generate complete procedure document"""
        
        # Get organization data
        org_data = await self._get_organization_data(organization_id)
        
        # Get procedure-specific data
        procedure_data = await self._get_procedure_data(organization_id, procedure_type)
        
        # Generate content based on type
        if procedure_type == "bia":
            content = await self._generate_bia_procedure(org_data, procedure_data, options)
        elif procedure_type == "bcm_plan":
            content = await self._generate_bcm_procedure(org_data, procedure_data, options)
        elif procedure_type == "risk_assessment":
            content = await self._generate_risk_procedure(org_data, procedure_data, options)
        else:
            raise ValueError(f"Unknown procedure type: {procedure_type}")
        
        # Save version
        version_info = await self._save_procedure_version(organization_id, procedure_type, content)
        
        return {
            "content": content,
            "version": version_info,
            "organization": org_data,
            "generated_at": datetime.now().isoformat()
        }
    
    async def regenerate_procedure(
        self, 
        organization_id: int, 
        procedure_type: str,
        version_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Regenerate procedure with fresh AI content"""
        return await self.generate_complete_procedure(
            organization_id, 
            procedure_type, 
            {"regenerate": True, "version_id": version_id}
        )
    
    async def refine_procedure(
        self, 
        organization_id: int, 
        procedure_type: str,
        refinement_instructions: str,
        current_content: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Refine existing procedure based on instructions"""
        
        refined_content = await self._refine_content(
            current_content, 
            refinement_instructions, 
            procedure_type
        )
        
        version_info = await self._save_procedure_version(
            organization_id, 
            procedure_type, 
            refined_content,
            is_refinement=True
        )
        
        return {
            "content": refined_content,
            "version": version_info,
            "refinement_applied": refinement_instructions
        }
    
    async def analyze_existing_procedure(
        self, 
        organization_id: int,
        procedure_type: str,
        existing_content: str
    ) -> Dict[str, Any]:
        """Analyze existing procedure and suggest gaps"""
        
        org_data = await self._get_organization_data(organization_id)
        
        analysis_prompt = f"""
        Analyze this existing {procedure_type} procedure for {org_data['name']} and identify gaps:
        
        EXISTING PROCEDURE:
        {existing_content}
        
        Compare against ISO 22301:2019 standards and best practices.
        Identify:
        1. Missing sections
        2. Incomplete content areas
        3. Compliance gaps
        4. Improvement suggestions
        
        Return analysis in JSON format with sections: gaps, missing_sections, recommendations, compliance_score (1-10).
        """
        
        response = await self.groq_service._make_request([
            {"role": "system", "content": "You are a business continuity expert analyzing procedures for compliance and completeness."},
            {"role": "user", "content": analysis_prompt}
        ], max_tokens=800)
        
        try:
            analysis = json.loads(response.get("content", "{}"))
        except:
            analysis = {
                "gaps": ["Unable to parse detailed analysis"],
                "missing_sections": [],
                "recommendations": ["Consider regenerating procedure with AI assistance"],
                "compliance_score": 5
            }
        
        return {
            "analysis": analysis,
            "suggested_improvements": await self._generate_improvement_suggestions(
                existing_content, procedure_type, org_data
            )
        }
    
    async def _get_organization_data(self, organization_id: int) -> Dict[str, Any]:
        """Get organization data - simplified without database"""
        return {
            "id": organization_id,
            "name": "Sample Organization",
            "criticality_threshold": 12,
            "sector": "Technology",
            "size": "Medium"
        }
    
    async def _get_procedure_data(self, organization_id: int, procedure_type: str) -> Dict[str, Any]:
        """Get procedure-specific data - simplified without database"""
        return {
            "processes": [
                {"name": "HR Process", "department": "HR", "rto": 8, "criticality": "Critical"},
                {"name": "IT Process", "department": "IT", "rto": 4, "criticality": "Critical"}
            ],
            "impact_matrix": {"financial": {}, "operational": {}, "reputational": {}},
            "departments": ["HR", "IT", "Finance"]
        }
    
    async def _generate_bia_procedure(
        self, 
        org_data: Dict[str, Any], 
        procedure_data: Dict[str, Any],
        options: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Generate complete BIA procedure"""
        
        context = f"""
        Organization: {org_data['name']}
        Sector: {org_data['sector']}
        Criticality Threshold: {org_data['criticality_threshold']} hours
        Critical Processes: {len([p for p in procedure_data['processes'] if p['criticality'] == 'Critical'])}
        Total Processes: {len(procedure_data['processes'])}
        """
        
        sections = {}
        
        # Generate each section
        sections["introduction"] = await self._generate_section(
            "BIA Procedure Introduction", context, 
            "Provide a comprehensive introduction to the Business Impact Analysis procedure"
        )
        
        sections["scope"] = await self._generate_section(
            "BIA Scope", context,
            "Define the scope of the BIA procedure including all applicable areas"
        )
        
        sections["objective"] = await self._generate_section(
            "BIA Objectives", context,
            "List the key objectives of conducting Business Impact Analysis"
        )
        
        sections["methodology"] = await self._generate_section(
            "BIA Methodology", context,
            f"Explain the BIA methodology using {org_data['criticality_threshold']} hours as criticality threshold"
        )
        
        sections["process_flow"] = await self._generate_process_flow("BIA", context)
        
        sections["roles_responsibilities"] = await self._generate_roles_responsibilities("BIA", context)
        
        sections["impact_parameters"] = [
            "Financial", "Operational", "Reputational", 
            "Legal and Regulatory", "Customer", "Wellbeing"
        ]
        
        sections["critical_processes"] = procedure_data["processes"]
        
        sections["peak_periods"] = await self._generate_peak_periods(
            ["HR", "IT", "Finance", "Operations"], org_data
        )
        
        sections["impact_matrices"] = await self._generate_impact_matrices(
            sections["impact_parameters"], org_data
        )
        
        return sections
    
    async def _generate_bcm_procedure(
        self, 
        org_data: Dict[str, Any], 
        procedure_data: Dict[str, Any],
        options: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Generate complete BCM Plan procedure"""
        
        context = f"""
        Organization: {org_data['name']}
        Sector: {org_data['sector']}
        Critical Processes: {len([p for p in procedure_data['processes'] if p['criticality'] == 'Critical'])}
        """
        
        sections = {}
        
        sections["introduction"] = await self._generate_section(
            "BCM Plan Development Introduction", context,
            "Provide comprehensive introduction to BCM plan development"
        )
        
        sections["scope"] = await self._generate_section(
            "BCM Plan Scope", context,
            "Define the scope of BCM plan development"
        )
        
        sections["objective"] = await self._generate_section(
            "BCM Plan Objectives", context,
            "List key objectives of BCM plan development"
        )
        
        sections["methodology"] = await self._generate_section(
            "BCM Plan Methodology", context,
            "Explain the BCM plan development methodology"
        )
        
        sections["bcm_policy"] = await self._generate_bcm_policy(org_data)
        
        sections["bcm_questions"] = await self._generate_bcm_questions()
        
        sections["recovery_strategies"] = await self._generate_recovery_strategies(
            procedure_data["processes"], org_data
        )
        
        return sections
    
    async def _generate_risk_procedure(
        self, 
        org_data: Dict[str, Any], 
        procedure_data: Dict[str, Any],
        options: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Generate complete Risk Assessment procedure"""
        
        context = f"""
        Organization: {org_data['name']}
        Sector: {org_data['sector']}
        Size: {org_data['size']}
        """
        
        sections = {}
        
        sections["introduction"] = await self._generate_section(
            "Risk Assessment Introduction", context,
            "Provide comprehensive introduction to risk assessment"
        )
        
        sections["scope"] = await self._generate_section(
            "Risk Assessment Scope", context,
            "Define the scope of risk assessment"
        )
        
        sections["methodology"] = await self._generate_section(
            "Risk Assessment Methodology", context,
            "Explain detailed risk assessment methodology"
        )
        
        sections["risk_categories"] = [
            "Operational Risk", "Technology Risk", "Security Risk", 
            "Regulatory Risk", "Third Party Risk"
        ]
        
        sections["risk_matrices"] = await self._generate_risk_matrices(
            sections["risk_categories"], org_data
        )
        
        return sections
    
    async def _generate_section(self, section_name: str, context: str, instruction: str) -> str:
        """Generate a specific section"""
        prompt = f"""
        {instruction} for {section_name}.
        
        Context: {context}
        
        Requirements:
        - Professional business language
        - Align with ISO 22301:2019 standards
        - 2-3 comprehensive paragraphs
        - Include specific details relevant to the organization
        """
        
        response = await self.groq_service._make_request([
            {"role": "system", "content": "You are a business continuity expert writing professional procedure documentation."},
            {"role": "user", "content": prompt}
        ], max_tokens=300)
        
        return response.get("content", f"Standard {section_name} content")
    
    async def _generate_bcm_policy(self, org_data: Dict[str, Any]) -> str:
        """Generate BCM policy"""
        return await self.groq_service.generate_bcm_policy(
            org_data["name"], 
            ["ISO 22301:2019"], 
            f"BCM policy for {org_data['sector']} organization"
        )
    
    async def _generate_bcm_questions(self) -> List[str]:
        """Generate BCM questions"""
        result = await self.groq_service.generate_bcm_questions()
        return result.get("questions", [])
    
    async def _save_procedure_version(
        self, 
        organization_id: int, 
        procedure_type: str, 
        content: Dict[str, Any],
        is_refinement: bool = False
    ) -> Dict[str, Any]:
        """Save procedure version - simplified without file system"""
        
        version_id = f"v{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        if is_refinement:
            version_id += "_refined"
        
        # Skip file system operations that cause Windows path issues
        # Just return version info for now
        return {
            "version_id": version_id,
            "file_path": f"procedures/{organization_id}/{procedure_type}/{version_id}.json",
            "created_at": datetime.now().isoformat()
        }
    
    async def _refine_content(
        self, 
        current_content: Dict[str, Any], 
        instructions: str, 
        procedure_type: str
    ) -> Dict[str, Any]:
        """Refine existing content based on instructions"""
        
        refined_content = current_content.copy()
        
        for section_key, section_content in current_content.items():
            if isinstance(section_content, str) and len(section_content) > 50:
                prompt = f"""
                Refine this {section_key} section based on these instructions: {instructions}
                
                Current content: {section_content}
                
                Provide improved version maintaining professional tone and structure.
                """
                
                response = await self.groq_service._make_request([
                    {"role": "system", "content": "You are refining business procedure documentation."},
                    {"role": "user", "content": prompt}
                ], max_tokens=400)
                
                refined_content[section_key] = response.get("content", section_content)
        
        return refined_content
    
    async def _generate_improvement_suggestions(
        self, 
        existing_content: str, 
        procedure_type: str, 
        org_data: Dict[str, Any]
    ) -> List[str]:
        """Generate improvement suggestions"""
        
        prompt = f"""
        Suggest 5 specific improvements for this {procedure_type} procedure:
        
        {existing_content[:1000]}...
        
        Focus on:
        - ISO 22301:2019 compliance
        - Missing best practices
        - Organization-specific enhancements for {org_data['name']}
        
        Return as numbered list.
        """
        
        response = await self.groq_service._make_request([
            {"role": "system", "content": "You are a business continuity consultant providing improvement suggestions."},
            {"role": "user", "content": prompt}
        ], max_tokens=300)
        
        content = response.get("content", "")
        suggestions = [line.strip() for line in content.split('\n') if line.strip() and any(char.isdigit() for char in line[:3])]
        
        return suggestions[:5] if suggestions else ["Consider updating procedure to align with current standards"]
    
    async def _generate_peak_periods(self, departments: List[str], org_data: Dict[str, Any]) -> Dict[str, str]:
        """Generate peak periods for departments"""
        periods = {}
        for dept in departments:
            result = await self.groq_service.get_peak_period(dept, "Business Operations", org_data["sector"])
            periods[dept] = result.get("peak_period", f"Standard business hours for {dept}")
        return periods
    
    async def _generate_impact_matrices(self, impact_types: List[str], org_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate impact matrices"""
        matrices = {}
        for impact_type in impact_types:
            result = await self.groq_service.get_impact_scale_matrix("Business Process", impact_type)
            matrices[impact_type] = result.get("impact_scale_matrix", {})
        return matrices
    
    async def _generate_risk_matrices(self, risk_types: List[str], org_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate risk matrices"""
        matrices = {}
        for risk_type in risk_types:
            result = await self.groq_service.get_impact_scale_matrix("Risk Assessment", risk_type)
            matrices[risk_type] = result.get("impact_scale_matrix", {})
        return matrices
    
    async def _generate_process_flow(self, procedure_type: str, context: str) -> List[Dict[str, str]]:
        """Generate process flow steps"""
        return [
            {"step": 1, "activity": "Initiate procedure", "owner": "BCM Team"},
            {"step": 2, "activity": "Gather data", "owner": "Department Teams"},
            {"step": 3, "activity": "Analyze and assess", "owner": "BCM Team"},
            {"step": 4, "activity": "Document findings", "owner": "BCM Team"},
            {"step": 5, "activity": "Review and approve", "owner": "Management"}
        ]
    
    async def _generate_roles_responsibilities(self, procedure_type: str, context: str) -> List[Dict[str, str]]:
        """Generate roles and responsibilities"""
        return [
            {"role": "BCM Team", "responsibility": "Overall procedure coordination and execution"},
            {"role": "Department Heads", "responsibility": "Provide departmental input and validation"},
            {"role": "Process Owners", "responsibility": "Supply process-specific information"},
            {"role": "Management", "responsibility": "Review, approve, and support implementation"}
        ]
    
    async def _generate_recovery_strategies(self, processes: List[Dict], org_data: Dict[str, Any]) -> List[Dict[str, str]]:
        """Generate recovery strategies"""
        strategies = []
        for process in processes[:5]:  # Top 5 processes
            strategies.append({
                "process": process["name"],
                "strategy": f"Implement backup procedures and alternative resources for {process['name']}",
                "rto": f"{process['rto']} hours",
                "priority": process["criticality"]
            })
        return strategies