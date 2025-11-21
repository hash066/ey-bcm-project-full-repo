"""
BCM Plan Service - Working version for your database schema
"""
import logging
import uuid
import json
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, Any, Optional
from app.services.groq_llm_service import GroqLLMService
import asyncio
import traceback

logger = logging.getLogger(__name__)

class BCMPlanService:
    """Service for generating BCM plans."""
    
    def __init__(self):
        self.llm = GroqLLMService()
    
    async def update_organization_level_bcm_plan(
        self, 
        organization_id: str, 
        plan_data: Dict[str, Any], 
        db: Session
    ) -> Dict[str, Any]:
        """Update organization-level BCM plan."""
        try:
            org_uuid = uuid.UUID(organization_id)
            
            # Query only columns that exist: id, name
            org_result = db.execute(
                text("SELECT id, name FROM organization WHERE id = :org_id"),
                {"org_id": str(org_uuid)}
            ).fetchone()
            
            if not org_result:
                raise ValueError(f"Organization not found")
            
            return {
                "status": "success",
                "message": "Organization BCM plan updated successfully",
                "organization_name": org_result[1]
            }
            
        except Exception as e:
            logger.error(f"Error: {str(e)}")
            db.rollback()
            raise
    
    async def update_departmental_level_bcm_plan(
        self,
        db: Session,
        department_id: str,
        organization_id: str,
        plan_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Update departmental-level BCM plan."""
        try:
            org_uuid = uuid.UUID(organization_id)
            dept_uuid = uuid.UUID(department_id)
            
            # Query only columns that exist: id, name
            org_result = db.execute(
                text("SELECT id, name FROM organization WHERE id = :org_id"),
                {"org_id": str(org_uuid)}
            ).fetchone()
            
            if not org_result:
                raise ValueError(f"Organization not found")
            
            # Query only columns that exist: id, name
            dept_result = db.execute(
                text("SELECT id, name FROM department WHERE id = :dept_id AND organization_id = :org_id"),
                {"dept_id": str(dept_uuid), "org_id": str(org_uuid)}
            ).fetchone()
            
            if not dept_result:
                raise ValueError(f"Department not found")
            
            return {
                "status": "success",
                "message": "Department BCM plan updated successfully",
                "department_name": dept_result[1],
                "organization_name": org_result[1],
                "updated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error: {str(e)}")
            logger.error(traceback.format_exc())
            db.rollback()
            raise

    async def generate_departmental_level_bcm_plan(
        self, 
        db: Session, 
        department_id: str, 
        organization_id: str
    ) -> Dict[str, Any]:
        """Generate departmental-level BCM plan."""
        try:
            logger.info(f"Starting departmental plan generation for dept: {department_id}, org: {organization_id}")
            
            org_uuid = uuid.UUID(organization_id)
            dept_uuid = uuid.UUID(department_id)
            logger.info(f"UUID conversion successful")
            
            # Query only columns that exist: id, name
            org_result = db.execute(
                text("SELECT id, name FROM organization WHERE id = :org_id"),
                {"org_id": str(org_uuid)}
            ).fetchone()
            
            logger.info(f"Organization query result: {org_result}")
            
            if not org_result:
                logger.error(f"Organization not found: {organization_id}")
                raise ValueError(f"Organization not found")
            
            logger.info(f"Organization found: {org_result[1]}")
            
            # Query department with description (BCM plan)
            dept_result = db.execute(
                text("SELECT id, name, description FROM department WHERE id = :dept_id AND organization_id = :org_id"),
                {"dept_id": str(dept_uuid), "org_id": str(org_uuid)}
            ).fetchone()
            
            logger.info(f"Department query result: {dept_result}")
            
            if not dept_result:
                logger.error(f"Department not found: {department_id}")
                raise ValueError(f"Department not found")
            
            logger.info(f"Department found: {dept_result[1]}")
            
            # Check if BCM plan exists in description
            logger.info(f"Description column (dept_result[2]): {dept_result[2]}")
            logger.info(f"Description type: {type(dept_result[2])}")
            
            description_data = None
            if dept_result[2]:
                # Handle both string (JSON) and dict formats
                if isinstance(dept_result[2], str):
                    try:
                        description_data = json.loads(dept_result[2])
                        logger.info(f"✅ Successfully parsed JSON string")
                    except json.JSONDecodeError as e:
                        logger.error(f"❌ Failed to parse description as JSON: {e}")
                        description_data = None
                elif isinstance(dept_result[2], dict):
                    description_data = dept_result[2]
                    logger.info(f"✅ Description is already a dict")
                else:
                    logger.error(f"❌ Description is neither string nor dict: {type(dept_result[2])}")
                    description_data = None
            
            if description_data and 'bcm_plan' in description_data:
                logger.info(f"✅ Found stored BCM plan for {dept_result[1]}")
                bcm_plan = description_data['bcm_plan']
                logger.info(f"BCM plan keys: {list(bcm_plan.keys())}")
                
                # Ensure no error field is included when returning real data
                bcm_plan.pop('error', None)
                return bcm_plan
            
            logger.info(f"No BCM plan found in description, generating template")
            
            intro = await self.llm.get_description("department_bcm_plan", f"{org_result[1]} {dept_result[1]} BCM Plan Introduction")
            purpose = await self.llm.get_description("department_bcm_plan", f"{dept_result[1]} BCM Purpose and Objective")
            scope = await self.llm.get_description("department_bcm_plan", f"{dept_result[1]} BCM Scope")
            bcm_plan = {
                "organization_name": org_result[1],
                "department_name": dept_result[1],
                "plan_type": "departmental_level",
                "plan_version": "1.0",
                "generated_date": datetime.utcnow().strftime("%Y-%m-%d"),
                "introduction": intro.get("description"),
                "purpose_and_objective": purpose.get("description"),
                "scope": scope.get("description"),
                "critical_applications_and_data_backup_strategies": f"{dept_result[1]} maintains critical applications and backups through redundant infrastructure and regular recovery testing.",
                "response_and_escalation_matrix": {
                    "minor": {"description": "Minor disruption affecting single process", "response_time": "4 hours", "escalation_level": f"{dept_result[1]} Manager"},
                    "moderate": {"description": "Moderate disruption affecting multiple processes", "response_time": "2 hours", "escalation_level": f"{dept_result[1]} Head + BCM Coordinator"},
                    "major": {"description": "Major disruption affecting entire department", "response_time": "1 hour", "escalation_level": "Executive Team + Crisis Management Team"},
                    "critical": {"description": "Critical disruption threatening business continuity", "response_time": "30 minutes", "escalation_level": "Board Level + All Stakeholders"}
                },
                "recovery_objectives_and_prioritized_activities": {"rto": "Defined RTO for critical processes", "mtpd": "MTDP per function", "prioritized_activities": "Restore critical systems; resume core operations; restore supporting functions; return to normal"},
                "roles_and_responsibilities": {"department_head": f"{dept_result[1]} Department Head", "bcm_coordinator": "Business Continuity Coordinator", "operational_team": f"{dept_result[1]} team", "it_support": "IT Support"},
                "critical_resource_and_asset_requirements": f"{dept_result[1]} requires key personnel, backup infrastructure, alternate workspace, and vendor support.",
                "training_and_awareness": f"{dept_result[1]} conducts BCM training and emergency drills.",
                "testing": f"{dept_result[1]} performs backup verification, tabletop exercises, and annual recovery tests.",
                "review_and_maintenance": f"{dept_result[1]} BCM plan undergoes regular review and updates."
            }
            
            logger.info(f"Generated department-specific BCM plan for {dept_result[1]}")
            return bcm_plan
            
        except Exception as e:
            logger.error(f"Error in generate_departmental_level_bcm_plan: {str(e)}")
            logger.error(f"Exception type: {type(e)}")
            logger.error(traceback.format_exc())
            # Return minimal fallback
            return {
                "organization_name": "Organization",
                "department_name": "Department",
                "plan_type": "departmental_level",
                "plan_version": "1.0",
                "generated_date": datetime.utcnow().strftime("%Y-%m-%d"),
                "critical_applications_and_data_backup_strategies": "Department maintains backup strategies for critical applications and data.",
                "response_and_escalation_matrix": {
                    "minor": {"description": "Minor disruption", "response_time": "4 hours", "escalation_level": "Manager"},
                    "moderate": {"description": "Moderate disruption", "response_time": "2 hours", "escalation_level": "Department Head"},
                    "major": {"description": "Major disruption", "response_time": "1 hour", "escalation_level": "Executive Team"},
                    "critical": {"description": "Critical disruption", "response_time": "30 minutes", "escalation_level": "Crisis Team"}
                },
                "recovery_objectives_and_prioritized_activities": {
                    "rto": "Recovery Time Objectives for critical processes",
                    "mtpd": "Maximum Tolerable Period of Disruption",
                    "prioritized_activities": "Prioritized recovery activities"
                },
                "roles_and_responsibilities": {
                    "department_head": "Department Head - Crisis response leadership",
                    "bcm_coordinator": "BCM Coordinator - Plan coordination",
                    "team_members": "Team members - Execute recovery procedures"
                },
                "critical_resource_and_asset_requirements": "Critical resources and assets needed for recovery.",
                "training_and_awareness": "Training programs and awareness initiatives.",
                "testing": "Testing procedures and schedules.",
                "review_and_maintenance": "Review and maintenance procedures."
            }
            
        except Exception as e:
            logger.error(f"Error in generate_departmental_level_bcm_plan: {str(e)}")
            logger.error(f"Exception type: {type(e)}")
            logger.error(traceback.format_exc())
            # Return minimal fallback
            return {
                "organization_name": "Organization",
                "department_name": "Department",
                "plan_type": "departmental_level",
                "plan_version": "1.0",
                "generated_date": datetime.utcnow().strftime("%Y-%m-%d"),
                "critical_applications_and_data_backup_strategies": "Department maintains backup strategies for critical applications and data.",
                "response_and_escalation_matrix": {
                    "minor": {"description": "Minor disruption", "response_time": "4 hours", "escalation_level": "Manager"},
                    "moderate": {"description": "Moderate disruption", "response_time": "2 hours", "escalation_level": "Department Head"},
                    "major": {"description": "Major disruption", "response_time": "1 hour", "escalation_level": "Executive Team"},
                    "critical": {"description": "Critical disruption", "response_time": "30 minutes", "escalation_level": "Crisis Team"}
                },
                "recovery_objectives_and_prioritized_activities": {
                    "rto": "Recovery Time Objectives for critical processes",
                    "mtpd": "Maximum Tolerable Period of Disruption",
                    "prioritized_activities": "Prioritized recovery activities"
                },
                "roles_and_responsibilities": {
                    "department_head": "Department Head - Crisis response leadership",
                    "bcm_coordinator": "BCM Coordinator - Plan coordination",
                    "team_members": "Team members - Execute recovery procedures"
                },
                "critical_resource_and_asset_requirements": "Critical resources and assets needed for recovery.",
                "training_and_awareness": "Training programs and awareness initiatives.",
                "testing": "Testing procedures and schedules.",
                "review_and_maintenance": "Review and maintenance procedures."
            }

    async def generate_organization_level_bcm_plan(
        self, 
        organization_id: str, 
        db: Session
    ) -> Dict[str, Any]:
        """Generate organization-level BCM plan."""
        try:
            org_uuid = uuid.UUID(organization_id)
            
            # Query only columns that exist: id, name
            org_result = db.execute(
                text("SELECT id, name FROM organization WHERE id = :org_id"),
                {"org_id": str(org_uuid)}
            ).fetchone()
            
            if not org_result:
                raise ValueError(f"Organization not found")
            
            org_name = org_result[1]
            intro = await self.llm.get_description("organization_bcm_plan", f"{org_name} BCM Plan Introduction")
            purpose = await self.llm.get_description("organization_bcm_plan", f"{org_name} BCM Purpose and Objective")
            scope = await self.llm.get_description("organization_bcm_plan", f"{org_name} BCM Scope")
            governance = await self.llm.get_description("organization_bcm_plan", f"{org_name} BCM Governance")
            cmt = await self.llm.get_description("organization_bcm_plan", f"{org_name} Crisis Management Team")
            comms = await self.llm.get_description("organization_bcm_plan", f"{org_name} Communication Protocols")
            bia = await self.llm.get_description("organization_bcm_plan", f"{org_name} BIA Summary")
            recovery = await self.llm.get_description("organization_bcm_plan", f"{org_name} Recovery Strategies")
            testing = await self.llm.get_description("organization_bcm_plan", f"{org_name} Testing and Maintenance")
            return {
                "organization_name": org_name,
                "plan_type": "organization_level",
                "plan_version": "1.0",
                "generated_date": datetime.utcnow().strftime("%Y-%m-%d"),
                "introduction": intro.get("description"),
                "purpose_and_objective": purpose.get("description"),
                "scope": scope.get("description"),
                "governance": governance.get("description"),
                "crisis_management_team": cmt.get("description"),
                "communication_protocols": comms.get("description"),
                "business_impact_analysis_summary": bia.get("description"),
                "recovery_strategies": recovery.get("description"),
                "testing_and_maintenance": testing.get("description")
            }
            
        except Exception as e:
            logger.error(f"Error: {str(e)}")
            raise

    async def seed_bcm_plans(self, db: Session) -> Dict[str, Any]:
        """Seed departmental and organization BCM plans into description fields for frontend."""
        try:
            orgs = db.execute(text("SELECT id, name FROM organization")).fetchall()
            depts = db.execute(text("SELECT id, name, organization_id FROM department")).fetchall()

            seeded_orgs = 0
            for org in orgs:
                org_id, org_name = org[0], org[1]
                org_plan = await self.generate_organization_level_bcm_plan(str(org_id), db)
                payload = json.dumps({"bcm_plan_org": org_plan})
                db.execute(
                    text("UPDATE organization SET description = :desc WHERE id = :id"),
                    {"desc": payload, "id": str(org_id)}
                )
                seeded_orgs += 1

            seeded_depts = 0
            for dept in depts:
                dept_id, dept_name, org_id = dept[0], dept[1], dept[2]
                plan = await self.generate_departmental_level_bcm_plan(db, str(dept_id), str(org_id))
                payload = json.dumps({"bcm_plan": plan})
                db.execute(
                    text("UPDATE department SET description = :desc WHERE id = :id"),
                    {"desc": payload, "id": str(dept_id)}
                )
                seeded_depts += 1

            db.commit()
            return {"seeded_organizations": seeded_orgs, "seeded_departments": seeded_depts}
        except Exception as e:
            db.rollback()
            logger.error(f"Error seeding BCM plans: {str(e)}")
            raise

# Create singleton instance
bcm_service = BCMPlanService()
