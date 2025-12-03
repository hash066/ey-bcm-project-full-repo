"""
LLM Integration Service for Procedures module.
Handles communication with external LLM endpoints for content generation.
"""

import logging
import aiohttp
import asyncio
import os
from typing import Dict, Any, List, Optional
from app.schemas.procedures import LLMContentRequest, LLMContent
from app.services.groq_llm_service import GroqLLMService

logger = logging.getLogger(__name__)

class LLMIntegrationService:
    """Service for integrating with external LLM endpoints."""
    
    def __init__(self):
        self.groq_service = GroqLLMService()
        self.timeout = aiohttp.ClientTimeout(total=60)  # Increased timeout
        self.max_retries = 3
        self.retry_delay = 1  # seconds
    
    async def generate_procedure_content(self, request: LLMContentRequest) -> LLMContent:
        """Generate comprehensive procedure content using LLM endpoints with retries."""
        for attempt in range(self.max_retries):
            try:
                content = LLMContent()
                if not request.content_types:
                    if request.procedure_type == "bia":
                        request.content_types = [
                            "introduction",
                            "scope",
                            "objective",
                            "methodology",
                            "process_flow",
                            "roles_responsibilities",
                            "review_frequency",
                            "impact_parameters",
                            "critical_processes",
                            "peak_periods",
                            "impact_scale_matrix",
                        ]
                    elif request.procedure_type == "risk_assessment":
                        request.content_types = [
                            "introduction",
                            "scope",
                            "objective",
                            "methodology",
                            "process_flow",
                            "roles_responsibilities",
                            "review_frequency",
                        ]
                    elif request.procedure_type == "bcm_plan":
                        request.content_types = [
                            "introduction",
                            "scope",
                            "objective",
                            "methodology",
                            "process_flow",
                            "roles_responsibilities",
                            "review_frequency",
                            "bcm_policy",
                            "bcm_questions",
                        ]
                    else:
                        request.content_types = [
                            "introduction",
                            "scope",
                            "objective",
                            "methodology",
                        ]
                
                # Generate content based on procedure type
                if request.procedure_type == "bia":
                    content = await self._generate_bia_content(request)
                elif request.procedure_type == "risk_assessment":
                    content = await self._generate_risk_assessment_content(request)
                elif request.procedure_type == "bcm_plan":
                    content = await self._generate_bcm_plan_content(request)
                elif request.procedure_type == "crisis_communication":
                    content = await self._generate_crisis_communication_content(request)
                elif request.procedure_type == "nonconformity":
                    content = await self._generate_nonconformity_content(request)
                elif request.procedure_type == "performance_monitoring":
                    content = await self._generate_performance_monitoring_content(request)
                elif request.procedure_type == "training_awareness":
                    content = await self._generate_training_awareness_content(request)
                elif request.procedure_type == "testing_exercising":
                    content = await self._generate_testing_exercising_content(request)
                elif request.procedure_type == "recovery_strategy":
                    content = await self._generate_recovery_strategy_content(request)
                else:
                    # Generate basic content for unknown types
                    content = await self._generate_basic_content(request)
                
                return content
            
            except aiohttp.ClientError as e:
                logger.error(f"Network error on attempt {attempt + 1}: {str(e)}")
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(self.retry_delay * (attempt + 1))  # Exponential backoff
                    continue
                raise
            except Exception as e:
                logger.error(f"Error generating procedure content: {str(e)}")
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(self.retry_delay)
                    continue
                raise
    
    async def _generate_bia_content(self, request: LLMContentRequest) -> LLMContent:
        """Generate BIA-specific content."""
        content = LLMContent()
        
        try:
            # Generate basic descriptions
            if "introduction" in request.content_types:
                content.introduction = await self._get_ai_description("process", f"{request.organization_name} BIA Procedure")
            
            if "scope" in request.content_types:
                content.scope = await self._get_ai_description("process", f"{request.organization_name} Business Impact Analysis Scope")
            
            if "objective" in request.content_types:
                content.objective = await self._get_ai_description("process", f"{request.organization_name} BIA Objective")
            
            if "methodology" in request.content_types:
                content.methodology = await self._get_ai_description("process", f"{request.organization_name} BIA Methodology")
            
            # Generate impact parameters
            if "impact_parameters" in request.content_types:
                content.impact_parameters = [
                    "Financial", "Operational", "Reputational", 
                    "Legal and Regulatory", "Customer", "Wellbeing"
                ]
            
            # Generate critical processes
            if "critical_processes" in request.content_types:
                content.critical_processes = [
                    {"name": "Employee Onboarding", "description": "Critical HR process for new employee integration"},
                    {"name": "Financial Reporting", "description": "Essential financial reporting and compliance process"},
                    {"name": "Customer Service", "description": "Core customer support and service delivery process"},
                    {"name": "IT Infrastructure", "description": "Critical technology infrastructure and support"}
                ]
            
            # Generate peak periods for departments
            if "peak_periods" in request.content_types:
                departments = ["Human Resources", "IT", "Finance", "Operations"]
                content.peak_periods = {}
                for dept in departments:
                    try:
                        period = await self._get_ai_peak_period(dept, "Critical Process", "Technology")
                        content.peak_periods[dept] = period
                    except Exception as e:
                        logger.warning(f"Failed to get peak period for {dept}: {str(e)}")
                        content.peak_periods[dept] = "Peak periods vary based on business cycles"
            
            # Generate impact scale matrix
            if "impact_scale_matrix" in request.content_types:
                impact_types = ["Financial", "Operational", "Reputational"]
                content.impact_scale_matrix = {}
                for impact_type in impact_types:
                    try:
                        matrix = await self._get_impact_scale_matrix("Business Process", impact_type)
                        content.impact_scale_matrix[impact_type] = matrix
                    except Exception as e:
                        logger.warning(f"Failed to get impact scale matrix for {impact_type}: {str(e)}")
                        content.impact_scale_matrix[impact_type] = self._get_default_impact_matrix()
            
        except Exception as e:
            logger.error(f"Error generating BIA content: {str(e)}")
            # Return partial content with fallbacks
        
        return content
    
    async def _generate_risk_assessment_content(self, request: LLMContentRequest) -> LLMContent:
        """Generate Risk Assessment-specific content."""
        content = LLMContent()
        
        try:
            # Generate basic descriptions
            if "introduction" in request.content_types:
                content.introduction = await self._get_ai_description("process", "Risk Assessment Procedure")
            
            if "scope" in request.content_types:
                content.scope = await self._get_ai_description("process", "Risk Assessment Scope")
            
            if "objective" in request.content_types:
                content.objective = await self._get_ai_description("process", "Risk Assessment Objective")
            
            if "methodology" in request.content_types:
                content.methodology = await self._get_ai_description("process", "Risk Assessment Methodology")
            
            # Generate risk parameters
            if "risk_parameters" in request.content_types:
                content.risk_parameters = ["People", "Sites", "Technology", "Third Party"]
            
            # Generate control effectiveness
            if "control_effectiveness" in request.content_types:
                content.control_effectiveness = {
                    "Controls not implemented": 1,
                    "Controls implemented partially": 2,
                    "Controls guaranteed to function": 3
                }
            
            # Generate risk value matrix
            if "risk_value_matrix" in request.content_types:
                risk_types = ["Operational", "Technological", "Security", "Regulatory"]
                content.risk_value_matrix = {}
                for risk_type in risk_types:
                    try:
                        matrix = await self._get_impact_scale_matrix("Risk Assessment", risk_type)
                        content.risk_value_matrix[risk_type] = matrix
                    except Exception as e:
                        logger.warning(f"Failed to get risk value matrix for {risk_type}: {str(e)}")
                        content.risk_value_matrix[risk_type] = self._get_default_risk_matrix()
            
        except Exception as e:
            logger.error(f"Error generating Risk Assessment content: {str(e)}")
        
        return content
    
    async def _generate_bcm_plan_content(self, request: LLMContentRequest) -> LLMContent:
        """Generate BCM Plan-specific content."""
        content = LLMContent()
        
        try:
            # Generate basic descriptions
            if "introduction" in request.content_types:
                content.introduction = await self._get_ai_description("process", "BCM Plan Development")
            
            if "scope" in request.content_types:
                content.scope = await self._get_ai_description("process", "BCM Plan Scope")
            
            if "objective" in request.content_types:
                content.objective = await self._get_ai_description("process", "BCM Plan Objective")
            
            if "methodology" in request.content_types:
                content.methodology = await self._get_ai_description("process", "BCM Plan Methodology")
            
            # Generate BCM policy
            if "bcm_policy" in request.content_types:
                try:
                    content.bcm_policy = await self._generate_bcm_policy(
                        request.organization_name, 
                        ["ISO 22301:2019"], 
                        "BCM Plan Development"
                    )
                except Exception as e:
                    logger.warning(f"Failed to generate BCM policy: {str(e)}")
                    content.bcm_policy = f"{request.organization_name} is committed to maintaining business continuity and ensuring the resilience of critical business operations."
            
            # Generate BCM questions
            if "bcm_questions" in request.content_types:
                try:
                    content.bcm_questions = await self._generate_bcm_questions()
                except Exception as e:
                    logger.warning(f"Failed to generate BCM questions: {str(e)}")
                    content.bcm_questions = [
                        "What are the critical business processes that must be maintained during a disruption?",
                        "What are the maximum acceptable downtime periods for each critical process?",
                        "What resources are required to maintain critical operations during a disruption?",
                        "How will communication be maintained with stakeholders during an incident?",
                        "What are the recovery strategies for each critical business function?",
                        "How will the organization test and validate its business continuity plans?"
                    ]
            
            # Generate critical processes
            if "critical_processes" in request.content_types:
                bcm_processes = ["BCM Plan Development", "Recovery Strategy Development", "Incident Response Planning"]
                content.critical_processes = []
                for process in bcm_processes:
                    try:
                        description = await self._get_ai_description("process", process)
                        content.critical_processes.append({
                            "name": process,
                            "description": description
                        })
                    except Exception as e:
                        logger.warning(f"Failed to get description for {process}: {str(e)}")
                        content.critical_processes.append({
                            "name": process,
                            "description": f"Critical process for {process.lower()}"
                        })
            
            # Generate peak periods
            if "peak_periods" in request.content_types:
                departments = ["IT", "Operations", "Finance", "Human Resources"]
                content.peak_periods = {}
                for dept in departments:
                    try:
                        period = await self._get_ai_peak_period(dept, "BCM Plan Development", "Technology")
                        content.peak_periods[dept] = period
                    except Exception as e:
                        logger.warning(f"Failed to get peak period for {dept}: {str(e)}")
                        content.peak_periods[dept] = "Peak periods vary based on business cycles"
            
        except Exception as e:
            logger.error(f"Error generating BCM Plan content: {str(e)}")
        
        return content
    
    async def _generate_crisis_communication_content(self, request: LLMContentRequest) -> LLMContent:
        """Generate Crisis Communication-specific content."""
        content = LLMContent()
        
        try:
            # Generate basic descriptions
            if "introduction" in request.content_types:
                content.introduction = await self._get_ai_description("process", "Crisis Communication Procedure") or f"This Crisis Communication Procedure establishes {request.organization_name}'s framework for effective communication during crisis situations."
            
            if "scope" in request.content_types:
                content.scope = await self._get_ai_description("process", "Crisis Communication Scope") or f"This procedure applies to all crisis situations that may impact {request.organization_name}, including operational disruptions, security incidents, and reputational threats."
            
            if "objective" in request.content_types:
                content.objective = await self._get_ai_description("process", "Crisis Communication Objective") or "To ensure timely, accurate, and consistent communication during crisis events."
            
            if "methodology" in request.content_types:
                content.methodology = await self._get_ai_description("process", "Crisis Communication Methodology") or "A structured approach to crisis communication management."
            
            # Generate communication channels
            if "communication_channels" in request.content_types:
                content.communication_channels = [
                    "Email notifications",
                    "SMS alerts", 
                    "Internal messaging systems",
                    "Public announcements",
                    "Social media updates",
                    "Press releases",
                    "Website notifications",
                    "Emergency hotlines"
                ]
            
            # Generate stakeholder matrix
            if "stakeholder_matrix" in request.content_types:
                content.stakeholder_matrix = [
                    {"stakeholder": "Employees", "channel": "Email/SMS", "priority": "High", "contact": "HR Department"},
                    {"stakeholder": "Customers", "channel": "Website/Email", "priority": "High", "contact": "Customer Service"},
                    {"stakeholder": "Media", "channel": "Press Release", "priority": "Medium", "contact": "PR Team"},
                    {"stakeholder": "Regulators", "channel": "Official Communication", "priority": "High", "contact": "Compliance Team"},
                    {"stakeholder": "Suppliers", "channel": "Email/Phone", "priority": "Medium", "contact": "Procurement Team"},
                    {"stakeholder": "Shareholders", "channel": "Official Notice", "priority": "High", "contact": "Investor Relations"}
                ]
            
            # Generate message templates
            if "message_templates" in request.content_types:
                content.message_templates = {
                    "Initial Alert": "We are currently experiencing [CRISIS TYPE]. We are working to resolve this situation and will provide updates as they become available.",
                    "Status Update": "Update on [CRISIS TYPE]: [CURRENT STATUS]. We are making progress on resolution. Expected timeline: [TIMELINE].",
                    "Resolution": "The [CRISIS TYPE] situation has been resolved. Normal operations have resumed as of [TIME/DATE].",
                    "Apology/Accountability": "We sincerely apologize for the inconvenience caused by [CRISIS TYPE]. We take full responsibility and are implementing preventive measures."
                }
            
        except Exception as e:
            logger.error(f"Error generating Crisis Communication content: {str(e)}")
        
        return content
    
    async def _generate_nonconformity_content(self, request: LLMContentRequest) -> LLMContent:
        """Generate Nonconformity-specific content."""
        content = LLMContent()
        
        try:
            if "introduction" in request.content_types:
                content.introduction = await self._get_ai_description("process", "Nonconformity and Corrective Actions Procedure")
            
            if "scope" in request.content_types:
                content.scope = await self._get_ai_description("process", "Nonconformity Management Scope")
            
            if "objective" in request.content_types:
                content.objective = await self._get_ai_description("process", "Nonconformity Management Objective")
            
            if "methodology" in request.content_types:
                content.methodology = await self._get_ai_description("process", "Nonconformity Management Methodology")
            
            if "nonconformity_types" in request.content_types:
                content.nonconformity_types = [
                    "Process nonconformities",
                    "Product/service nonconformities", 
                    "Documentation nonconformities",
                    "System nonconformities",
                    "Regulatory nonconformities",
                    "Customer complaint-related nonconformities"
                ]
            
            if "corrective_action_steps" in request.content_types:
                content.corrective_action_steps = [
                    {"step": 1, "action": "Identify and document the nonconformity", "responsible": "Process Owner"},
                    {"step": 2, "action": "Investigate root cause", "responsible": "Quality Team"},
                    {"step": 3, "action": "Develop corrective action plan", "responsible": "Process Owner"},
                    {"step": 4, "action": "Implement corrective actions", "responsible": "Assigned Personnel"},
                    {"step": 5, "action": "Verify effectiveness", "responsible": "Quality Team"},
                    {"step": 6, "action": "Close nonconformity", "responsible": "Quality Manager"}
                ]
            
            if "documentation_requirements" in request.content_types:
                content.documentation_requirements = {
                    "Nonconformity Report": "Document describing the nonconformity, its impact, and immediate actions taken",
                    "Root Cause Analysis": "Analysis identifying the underlying causes of the nonconformity",
                    "Corrective Action Plan": "Plan detailing actions to be taken, responsibilities, and timelines",
                    "Effectiveness Review": "Documentation of the review to verify corrective action effectiveness",
                    "Closure Report": "Final documentation confirming nonconformity resolution"
                }
            
        except Exception as e:
            logger.error(f"Error generating Nonconformity content: {str(e)}")
        
        return content
    
    async def _generate_performance_monitoring_content(self, request: LLMContentRequest) -> LLMContent:
        """Generate Performance Monitoring-specific content."""
        content = LLMContent()
        
        try:
            if "introduction" in request.content_types:
                content.introduction = await self._get_ai_description("process", "Performance Monitoring Procedure")
            
            if "scope" in request.content_types:
                content.scope = await self._get_ai_description("process", "Performance Monitoring Scope")
            
            if "objective" in request.content_types:
                content.objective = await self._get_ai_description("process", "Performance Monitoring Objective")
            
            if "methodology" in request.content_types:
                content.methodology = await self._get_ai_description("process", "Performance Monitoring Methodology")
            
            if "performance_indicators" in request.content_types:
                content.performance_indicators = [
                    {"category": "Financial", "indicators": ["Revenue Growth", "Cost Reduction", "ROI", "Budget Variance"]},
                    {"category": "Operational", "indicators": ["Process Efficiency", "Quality Metrics", "Productivity", "Cycle Time"]},
                    {"category": "Customer", "indicators": ["Customer Satisfaction", "Retention Rate", "Complaint Resolution", "Service Level"]},
                    {"category": "Employee", "indicators": ["Employee Satisfaction", "Training Completion", "Turnover Rate", "Performance Rating"]},
                    {"category": "Strategic", "indicators": ["Goal Achievement", "Project Completion", "Innovation Index", "Market Share"]}
                ]
            
            if "monitoring_frequency" in request.content_types:
                content.monitoring_frequency = {
                    "Daily": "Operational metrics, production output, quality checks",
                    "Weekly": "Process performance, team productivity, customer feedback",
                    "Monthly": "Financial performance, strategic objectives, departmental KPIs",
                    "Quarterly": "Strategic goals, business performance, stakeholder reviews",
                    "Annually": "Overall organizational performance, strategic planning review"
                }
            
            if "reporting_structure" in request.content_types:
                content.reporting_structure = [
                    {"level": "Operational", "frequency": "Daily/Weekly", "audience": "Team Leaders, Supervisors", "content": "Process metrics, quality indicators"},
                    {"level": "Tactical", "frequency": "Monthly", "audience": "Department Heads, Middle Management", "content": "Departmental KPIs, trend analysis"},
                    {"level": "Strategic", "frequency": "Quarterly", "audience": "Senior Management, Board", "content": "Strategic objectives, organizational performance"}
                ]
            
        except Exception as e:
            logger.error(f"Error generating Performance Monitoring content: {str(e)}")
        
        return content
    
    async def _generate_training_awareness_content(self, request: LLMContentRequest) -> LLMContent:
        """Generate Training and Awareness-specific content."""
        content = LLMContent()
        
        try:
            if "introduction" in request.content_types or not request.content_types:
                content.introduction = await self._get_ai_description("process", "Training and Awareness Procedure")
            
            if "scope" in request.content_types or not request.content_types:
                content.scope = await self._get_ai_description("process", "Training and Awareness Scope")
            
            if "objective" in request.content_types or not request.content_types:
                content.objective = await self._get_ai_description("process", "Training and Awareness Objective")
            
            if "methodology" in request.content_types or not request.content_types:
                content.methodology = await self._get_ai_description("process", "Training and Awareness Methodology")
            
            # Generate training programs
            content.training_programs = [
                {"type": "BCM Awareness Training", "audience": "All employees", "frequency": "Annual + Onboarding", "duration": "1-2 hours"},
                {"type": "BCM Plan Training", "audience": "Recovery team members", "frequency": "Semi-annually", "duration": "3-4 hours"},
                {"type": "Crisis Management Training", "audience": "Crisis Management Team", "frequency": "Quarterly", "duration": "4-6 hours"},
                {"type": "BCM Coordinator Certification", "audience": "BCM Team members", "frequency": "Annual + Certification renewal", "duration": "16+ hours"}
            ]
            
            # Generate training content areas
            content.training_content_areas = [
                "BCM Fundamentals - Core concepts, terminology, and organizational framework",
                "Risk and Impact Assessment - Identifying threats, assessing impacts, prioritizing responses",
                "Plan Activation and Execution - Recognizing incidents, activating plans, executing procedures",
                "Roles and Responsibilities - Understanding individual and team responsibilities during disruptions",
                "Communication Protocols - Internal and external communication procedures and escalation paths"
            ]
            
            # Generate awareness activities
            content.awareness_activities = [
                {"activity": "Monthly Email Campaigns", "description": "BCM tips, reminders, best practices, and success stories", "frequency": "Monthly"},
                {"activity": "BCM Awareness Week", "description": "Dedicated week with events, presentations, and activities", "frequency": "Annual"},
                {"activity": "Lunch and Learn Sessions", "description": "Informal educational sessions on specific BCM topics", "frequency": "Quarterly"}
            ]
            
            # Generate competency assessment
            content.competency_assessment = "Training effectiveness and competency are assessed through knowledge tests, practical exercises, exercise participation, and annual competency reviews. Minimum 80% score required on assessments."
            
            # Generate roles and responsibilities
            content.roles_responsibilities = {
                "Training Coordinator": "Overall training program management, scheduling, content development, record keeping",
                "BCM Manager": "Training strategy, competency standards, program oversight, budget management",
                "Department Heads": "Ensure staff participation, provide subject matter expertise, support training initiatives",
                "HR Department": "Integration with onboarding, performance management, training administration"
            }
            
            # Generate training records
            content.training_records = "All training activities documented in Training Management System with participant information, assessment scores, completion certificates. Quarterly reports show completion rates, competency results, and program effectiveness metrics."
            
        except Exception as e:
            logger.error(f"Error generating Training and Awareness content: {str(e)}")
        
        return content
    
    async def _generate_testing_exercising_content(self, request: LLMContentRequest) -> LLMContent:
        """Generate Testing and Exercising-specific content."""
        content = LLMContent()
        
        try:
            content.introduction = await self._get_ai_description("process", "Testing and Exercising Procedure")
            content.scope = await self._get_ai_description("process", "Testing and Exercising Scope")
            content.objective = await self._get_ai_description("process", "Testing and Exercising Objective")
            content.methodology = await self._get_ai_description("process", "Testing and Exercising Methodology")
            
            content.exercise_types = [
                {"type": "Tabletop Exercise", "description": "Discussion-based exercise to test plans and procedures", "frequency": "Quarterly"},
                {"type": "Functional Exercise", "description": "Hands-on exercise testing specific functions", "frequency": "Semi-annually"},
                {"type": "Full-Scale Exercise", "description": "Comprehensive test of entire BCM program", "frequency": "Annually"}
            ]
            
        except Exception as e:
            logger.error(f"Error generating Testing and Exercising content: {str(e)}")
        
        return content
    
    async def _generate_recovery_strategy_content(self, request: LLMContentRequest) -> LLMContent:
        """Generate Recovery Strategy-specific content."""
        content = LLMContent()
        
        try:
            content.introduction = await self._get_ai_description("process", "Recovery Strategy Procedure")
            content.scope = await self._get_ai_description("process", "Recovery Strategy Scope")
            content.objective = await self._get_ai_description("process", "Recovery Strategy Objective")
            content.methodology = await self._get_ai_description("process", "Recovery Strategy Methodology")
            
            content.recovery_strategies = [
                {"strategy": "Alternative Site", "description": "Backup location for critical operations", "rto": "4-8 hours"},
                {"strategy": "Work from Home", "description": "Remote work capabilities for staff", "rto": "2-4 hours"},
                {"strategy": "Manual Processes", "description": "Paper-based backup procedures", "rto": "1-2 hours"}
            ]
            
        except Exception as e:
            logger.error(f"Error generating Recovery Strategy content: {str(e)}")
        
        return content
    
    async def _generate_basic_content(self, request: LLMContentRequest) -> LLMContent:
        """Generate basic content for unknown procedure types."""
        content = LLMContent()
        
        try:
            procedure_name = request.procedure_type.replace('_', ' ').title()
            content.introduction = await self._get_ai_description("process", f"{procedure_name} Procedure")
            content.scope = await self._get_ai_description("process", f"{procedure_name} Scope")
            content.objective = await self._get_ai_description("process", f"{procedure_name} Objective")
            content.methodology = await self._get_ai_description("process", f"{procedure_name} Methodology")
            
        except Exception as e:
            logger.error(f"Error generating basic content: {str(e)}")
        
        return content
    
    async def _get_ai_description(self, query_type: str, query_name: str) -> str:
        """Get AI-generated description using Groq."""
        try:
            result = await self.groq_service.get_description(query_type, query_name)
            return result.get("description", f"Standard {query_name} description")
        except Exception as e:
            logger.error(f"Error getting AI description: {str(e)}")
            return f"Standard {query_name} description"
    
    async def _get_ai_peak_period(self, department: str, process_name: str, sector: str) -> str:
        """Get AI-predicted peak period using Groq."""
        try:
            result = await self.groq_service.get_peak_period(department, process_name, sector)
            return result.get("peak_period", "Peak periods vary based on business cycles")
        except Exception as e:
            logger.error(f"Error getting AI peak period: {str(e)}")
            return "Peak periods vary based on business cycles"
    
    async def _get_impact_scale_matrix(self, process_name: str, impact_name: str) -> Dict[str, Any]:
        """Get impact scale matrix using Groq."""
        try:
            result = await self.groq_service.get_impact_scale_matrix(process_name, impact_name)
            return result.get("impact_scale_matrix", self._get_default_impact_matrix())
        except Exception as e:
            logger.error(f"Error getting impact scale matrix: {str(e)}")
            return self._get_default_impact_matrix()
    
    async def _generate_bcm_policy(self, organization_name: str, standards: List[str], custom_notes: str) -> str:
        """Generate BCM policy using Groq."""
        try:
            result = await self.groq_service.generate_bcm_policy(organization_name, standards, custom_notes)
            return result.get("policy", f"{organization_name} is committed to maintaining business continuity and ensuring the resilience of critical business operations.")
        except Exception as e:
            logger.error(f"Error generating BCM policy: {str(e)}")
            return f"{organization_name} is committed to maintaining business continuity and ensuring the resilience of critical business operations."
    
    async def _generate_bcm_questions(self) -> List[str]:
        """Generate BCM questions using Groq."""
        try:
            result = await self.groq_service.generate_bcm_questions()
            return result.get("questions", [
                "What are the critical business processes that must be maintained during a disruption?",
                "What are the maximum acceptable downtime periods for each critical process?",
                "What resources are required to maintain critical operations during a disruption?",
                "How will communication be maintained with stakeholders during an incident?",
                "What are the recovery strategies for each critical business function?",
                "How will the organization test and validate its business continuity plans?"
            ])
        except Exception as e:
            logger.error(f"Error generating BCM questions: {str(e)}")
            return [
                "What are the critical business processes that must be maintained during a disruption?",
                "What are the maximum acceptable downtime periods for each critical process?",
                "What resources are required to maintain critical operations during a disruption?",
                "How will communication be maintained with stakeholders during an incident?",
                "What are the recovery strategies for each critical business function?",
                "How will the organization test and validate its business continuity plans?"
            ]
    
    def _get_default_impact_matrix(self) -> Dict[str, Any]:
        """Get default impact matrix when LLM fails."""
        return {
            "1 Hour": {"impact_severity": "1", "reason": "Minimal impact on operations"},
            "4 Hours": {"impact_severity": "2", "reason": "Minor disruption to business processes"},
            "8 Hours": {"impact_severity": "3", "reason": "Moderate impact on business operations"},
            "24 Hours": {"impact_severity": "4", "reason": "Significant impact on business continuity"},
            "72 Hours": {"impact_severity": "5", "reason": "Critical impact on organizational objectives"}
        }
    
    def _get_default_risk_matrix(self) -> Dict[str, Any]:
        """Get default risk matrix when LLM fails."""
        return {
            "Low Risk": {"impact_severity": "1", "reason": "Minimal risk to operations"},
            "Medium Risk": {"impact_severity": "2", "reason": "Moderate risk requiring attention"},
            "High Risk": {"impact_severity": "3", "reason": "Significant risk requiring immediate action"},
            "Critical Risk": {"impact_severity": "4", "reason": "Critical risk threatening business continuity"}
        }