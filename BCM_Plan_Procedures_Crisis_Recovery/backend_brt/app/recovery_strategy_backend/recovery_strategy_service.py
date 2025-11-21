"""
Service for fetching and managing recovery strategy data.
"""
import asyncio
import json
from sqlalchemy.orm import Session, joinedload
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timedelta
import logging
from fastapi import HTTPException

from app.models.global_models import GlobalDepartment, GlobalSubdepartment, GlobalProcess
from app.models.bia_models import BIAProcessInfo
from app.models.recovery_strategy_models import RecoveryStrategy, DepartmentRecoveryConfig
from app.schemas.recovery_strategy_schemas import (
    DepartmentWithStrategies, SubDepartment, Function, RecoveryStrategyInDB,
    DepartmentRecoveryConfigResponse, AIGenerationRequest, AIGenerationResponse,
    ProcessVulnerabilityAnalysis
)
from app.services.grok_llm_service import GrokLLMService
from app.recovery_strategy_backend.recovery_strategy_llm import LLMService
from sqlalchemy import or_
from app.db.postgres import SQLALCHEMY_DATABASE_URL

logger = logging.getLogger(__name__)

class RecoveryStrategyService:
    """
    Service for managing recovery strategy data and LLM integration.
    """
    
    @staticmethod
    def initialize_database(db: Session) -> None:
        """
        Initialize database with default recovery strategy configurations.
        Creates department recovery configs if they don't exist.
        """
        try:
            # Get all departments - only select id and name to avoid column issues
            departments = db.query(GlobalDepartment.id, GlobalDepartment.name).all()
            
            for dept in departments:
                # Check if config exists
                config = db.query(DepartmentRecoveryConfig).filter(
                    DepartmentRecoveryConfig.department_id == dept.id
                ).first()
                
                if not config:
                    # Create default config
                    config = DepartmentRecoveryConfig(
                        department_id=dept.id,
                        default_enabled_strategies="people,technology,site,vendor,process_vulnerability",
                        enable_ai_generation=True,
                        ai_generation_frequency="weekly"
                    )
                    db.add(config)
            
            db.commit()
            logger.info(f"Initialized recovery strategy configurations for {len(departments)} departments")
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error initializing recovery strategy database: {str(e)}")
            raise
    
    @staticmethod
    async def generate_recovery_strategy(
        db: Session, 
        process_id: uuid.UUID
    ) -> RecoveryStrategy:
        """
        Generate recovery strategy for a process using LLM.
        """
        try:
            # Get process with related data - only select needed columns to avoid schema issues
            from sqlalchemy import select
            
            # Query process table directly via SQL to avoid column issues
            from sqlalchemy import text
            pid_param = str(process_id)
            result = db.execute(text("SELECT id, name, subdepartment_id, department_id FROM process WHERE id = :pid"), {"pid": pid_param})
            process_row = result.fetchone()

            if not process_row:
                # Try interpreting the given ID as a BIAProcessInfo.id
                bia_lookup = db.query(BIAProcessInfo).filter(BIAProcessInfo.id == pid_param).first()
                if not bia_lookup:
                    raise HTTPException(status_code=404, detail="Process not found")
                # Use the actual process_id from BIA
                pid_param = str(bia_lookup.process_id)
                result = db.execute(text("SELECT id, name, subdepartment_id, department_id FROM process WHERE id = :pid"), {"pid": pid_param})
                process_row = result.fetchone()
                if not process_row:
                    raise HTTPException(status_code=404, detail="Process not found")

            process_name = process_row[1]
            subdept_id = process_row[2]
            dept_id = process_row[3]
            
            # Get department info (processes may have direct department_id or via subdepartment)
            if dept_id:
                # Direct department relationship
                dept = db.query(GlobalDepartment.id, GlobalDepartment.name).filter(
                    GlobalDepartment.id == dept_id
                ).first()
                subdept_name = "N/A"
            elif subdept_id:
                # Via subdepartment
                subdept = db.query(GlobalSubdepartment.id, GlobalSubdepartment.name, GlobalSubdepartment.department_id).filter(
                    GlobalSubdepartment.id == subdept_id
                ).first()
                
                if not subdept:
                    raise HTTPException(status_code=404, detail="Subdepartment not found for this process")
                
                subdept_name = subdept.name
                dept = db.query(GlobalDepartment.id, GlobalDepartment.name).filter(
                    GlobalDepartment.id == subdept.department_id
                ).first()
            else:
                raise HTTPException(status_code=404, detail="Process has no department or subdepartment relationship")
            
            if not dept:
                raise HTTPException(status_code=404, detail="Department not found for this process")
            
            # Get BIA info if it exists
            pid_lookup = str(process_id) if SQLALCHEMY_DATABASE_URL.startswith('sqlite') else process_id
            bia_info = db.query(BIAProcessInfo).filter(
                BIAProcessInfo.process_id == pid_lookup
            ).first()
            
            # Check if strategy exists
            pid_to_save = bia_info.id if bia_info else None
            if pid_to_save is None:
                raise HTTPException(status_code=404, detail="BIA info not found for this process")
            if SQLALCHEMY_DATABASE_URL.startswith('sqlite'):
                pid_to_save = str(pid_to_save)
            strategy = db.query(RecoveryStrategy).filter(
                RecoveryStrategy.process_id == pid_to_save
            ).first()
            
            if not strategy:
                strategy = RecoveryStrategy(process_id=pid_to_save)
                db.add(strategy)
            
            # Get department config
            config = db.query(DepartmentRecoveryConfig).filter(
                DepartmentRecoveryConfig.department_id == dept.id
            ).first()
            
            if not config:
                # Create default config if not exists
                RecoveryStrategyService.initialize_database(db)
                config = db.query(DepartmentRecoveryConfig).filter(
                    DepartmentRecoveryConfig.department_id == dept.id
                ).first()
            
            # Generate strategies using LLM if enabled
            if config and config.enable_ai_generation and bia_info:
                llm_service = GrokLLMService()
                
                # Call LLM to generate strategies
                # Note: BIAProcessInfo doesn't have impact_analysis or minimum_operating_requirements
                # Pass empty dicts for now
                llm_response = await llm_service.generate_recovery_strategies(
                    department_name=dept.name,
                    subdepartment_name=subdept_name,
                    process_name=process_name,
                    process_description=bia_info.description or "No description available",
                    impact_analysis={},
                    minimum_operating_requirements={}
                )
                
                # Update strategy with LLM response
                for field, value in llm_response.items():
                    if hasattr(strategy, field):
                        setattr(strategy, field, value)
                
                strategy.ai_last_updated = datetime.utcnow()
            
            # Set default status for enabled strategies
            enabled_strategies = config.default_enabled_strategies.split(",") if config else []
            for strategy_type in ["people", "technology", "site", "vendor", "process_vulnerability"]:
                status_field = f"{strategy_type}_status"
                if hasattr(strategy, status_field) and not getattr(strategy, status_field):
                    setattr(strategy, status_field, "Not Implemented")
            
            db.commit()
            db.refresh(strategy)
            return strategy
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error generating recovery strategy: {str(e)}")
            raise

    @staticmethod
    async def generate_recovery_strategy_by_bia(
        db: Session,
        bia_id: uuid.UUID
    ) -> RecoveryStrategy:
        try:
            from sqlalchemy import text
            bia_str = str(bia_id)
            bia_info = db.query(BIAProcessInfo).filter(BIAProcessInfo.id == bia_str).first()
            if not bia_info:
                raise HTTPException(status_code=404, detail="BIA not found")

            pid_param = str(bia_info.process_id)
            result = db.execute(text("SELECT id, name, subdepartment_id, department_id FROM process WHERE id = :pid"), {"pid": pid_param})
            process_row = result.fetchone()
            if not process_row:
                raise HTTPException(status_code=404, detail="Process not found for BIA")

            process_name = process_row[1]
            subdept_id = process_row[2]
            dept_id = process_row[3]

            if dept_id:
                dept = db.query(GlobalDepartment.id, GlobalDepartment.name).filter(GlobalDepartment.id == dept_id).first()
                subdept_name = "N/A"
            elif subdept_id:
                subdept = db.query(GlobalSubdepartment.id, GlobalSubdepartment.name, GlobalSubdepartment.department_id).filter(GlobalSubdepartment.id == subdept_id).first()
                if not subdept:
                    raise HTTPException(status_code=404, detail="Subdepartment not found for this process")
                subdept_name = subdept.name
                dept = db.query(GlobalDepartment.id, GlobalDepartment.name).filter(GlobalDepartment.id == subdept.department_id).first()
            else:
                raise HTTPException(status_code=404, detail="Process has no department or subdepartment relationship")

            if not dept:
                raise HTTPException(status_code=404, detail="Department not found for this process")

            pid_to_save = bia_info.id
            if SQLALCHEMY_DATABASE_URL.startswith('sqlite'):
                pid_to_save = str(pid_to_save)

            strategy = db.query(RecoveryStrategy).filter(RecoveryStrategy.process_id == pid_to_save).first()
            if not strategy:
                strategy = RecoveryStrategy(process_id=pid_to_save)
                db.add(strategy)

            config = db.query(DepartmentRecoveryConfig).filter(DepartmentRecoveryConfig.department_id == dept.id).first()
            if not config:
                RecoveryStrategyService.initialize_database(db)
                config = db.query(DepartmentRecoveryConfig).filter(DepartmentRecoveryConfig.department_id == dept.id).first()

            if config and config.enable_ai_generation:
                llm_service = GrokLLMService()
                llm_response = await llm_service.generate_recovery_strategies(
                    department_name=dept.name,
                    subdepartment_name=subdept_name,
                    process_name=process_name,
                    process_description=bia_info.description or "No description available",
                    impact_analysis={},
                    minimum_operating_requirements={}
                )
                for field, value in llm_response.items():
                    if hasattr(strategy, field):
                        setattr(strategy, field, value)
                strategy.ai_last_updated = datetime.utcnow()

            enabled_strategies = config.default_enabled_strategies.split(",") if config else []
            for strategy_type in ["people", "technology", "site", "vendor", "process_vulnerability"]:
                status_field = f"{strategy_type}_status"
                if hasattr(strategy, status_field) and not getattr(strategy, status_field):
                    setattr(strategy, status_field, "Not Implemented")

            db.commit()
            db.refresh(strategy)
            return strategy

        except Exception as e:
            db.rollback()
            logger.error(f"Error generating recovery strategy by BIA: {str(e)}")
            raise
    
    @staticmethod
    async def get_all_departments_with_strategies(db: Session) -> List[DepartmentWithStrategies]:
        """
        Get all departments with their recovery strategies.
        
        Args:
            db: Database session
            
        Returns:
            List of departments with nested structure
        """
        try:
            # Query all departments with eager loading
            departments = db.query(GlobalDepartment).options(
                joinedload(GlobalDepartment.subdepartments).joinedload(GlobalSubdepartment.processes).joinedload(GlobalProcess.bia_process_info)
            ).all()
            
            result = []
            
            for dept in departments:
                subdepartments_data = []
                
                for subdept in dept.subdepartments:
                    functions_data = []
                    
                    for process in subdept.processes:
                        # Get BIA info (it's a list relationship)
                        bia_info = process.bia_process_info[0] if process.bia_process_info else None
                        if bia_info:
                            # Get recovery strategy if exists
                            strategy = None
                            rs = db.query(RecoveryStrategy).filter(RecoveryStrategy.process_id == bia_info.id).first()
                            if rs:
                                strategy = RecoveryStrategyInDB(
                                    process_id=rs.process_id,
                                    people_unavailability_strategy=rs.people_unavailability_strategy,
                                    people_reasoning=rs.people_reasoning,
                                    technology_data_unavailability_strategy=rs.technology_data_unavailability_strategy,
                                    technology_reasoning=rs.technology_reasoning,
                                    site_unavailability_strategy=rs.site_unavailability_strategy,
                                    site_reasoning=rs.site_reasoning,
                                    third_party_vendors_unavailability_strategy=rs.third_party_vendors_unavailability_strategy,
                                    vendor_reasoning=rs.vendor_reasoning,
                                    process_vulnerability_strategy=rs.process_vulnerability_strategy,
                                    process_vulnerability_reasoning=rs.process_vulnerability_reasoning,
                                    people_status=rs.people_status,
                                    technology_status=rs.technology_status,
                                    site_status=rs.site_status,
                                    vendor_status=rs.vendor_status,
                                    process_vulnerability_status=rs.process_vulnerability_status,
                                    enabled_strategies=rs.enabled_strategies,
                                    ai_generated_sections=rs.ai_generated_sections,
                                    ai_last_updated=rs.ai_last_updated,
                                    created_at=rs.created_at,
                                    updated_at=rs.updated_at
                                )
                            
                            function = Function(
                                id=str(process.id),
                                name=process.name,
                                description=bia_info.description if bia_info else None,
                                recovery_strategy=strategy
                            )
                            functions_data.append(function)
                    
                    if functions_data:
                        subdept_data = SubDepartment(
                            id=str(subdept.id),
                            name=subdept.name,
                            functions=functions_data
                        )
                        subdepartments_data.append(subdept_data)
                
                if subdepartments_data:
                    dept_data = DepartmentWithStrategies(
                        id=str(dept.id),
                        name=dept.name,
                        subdepartments=subdepartments_data
                    )
                    result.append(dept_data)
            
            logger.info(f"Retrieved {len(result)} departments with strategies")
            return result
            
        except Exception as e:
            logger.error(f"Error fetching departments with strategies: {str(e)}")
            raise
    
    @staticmethod
    async def generate_missing_strategies_parallel(db: Session) -> Dict[str, Any]:
        """
        Generate recovery strategies for all processes that don't have them.
        Uses parallel processing to handle multiple processes concurrently.
        
        Args:
            db: Database session
            
        Returns:
            Dictionary with generation results
        """
        try:
            logger.info("Starting parallel recovery strategy generation")
            
            # Find all BIA processes without recovery strategies
            processes_without_strategies = db.query(BIAProcessInfo).outerjoin(
                RecoveryStrategy, 
                BIAProcessInfo.id == RecoveryStrategy.process_id
            ).filter(
                RecoveryStrategy.process_id.is_(None)
            ).options(
                joinedload(BIAProcessInfo.process).joinedload(GlobalProcess.subdepartment).joinedload(GlobalSubdepartment.department)
            ).all()
            
            if not processes_without_strategies:
                logger.info("No processes found without strategies")
                return {
                    "status": "success",
                    "message": "All processes already have recovery strategies",
                    "generated_count": 0
                }
            
            logger.info(f"Found {len(processes_without_strategies)} processes without strategies")
            
            # Generate strategies in parallel
            tasks = []
            for bia_process in processes_without_strategies:
                task = RecoveryStrategyService._generate_strategy_for_process(
                    bia_process, db
                )
                tasks.append(task)
            
            # Wait for all generations to complete
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Count successes and failures
            success_count = sum(1 for r in results if r and not isinstance(r, Exception))
            failure_count = len(results) - success_count
            
            # Commit all changes
            try:
                db.commit()
                logger.info(f"Successfully generated {success_count} strategies")
            except Exception as e:
                db.rollback()
                logger.error(f"Error committing strategies: {str(e)}")
                raise
            
            return {
                "status": "success",
                "message": f"Generated {success_count} strategies, {failure_count} failures",
                "generated_count": success_count,
                "failed_count": failure_count
            }
            
        except Exception as e:
            logger.error(f"Error in parallel strategy generation: {str(e)}")
            db.rollback()
            raise
    
    @staticmethod
    async def _generate_strategy_for_process(bia_process: BIAProcessInfo, db: Session) -> Optional[RecoveryStrategy]:
        """
        Generate strategy for a single process.
        
        Args:
            bia_process: BIA process info
            db: Database session
            
        Returns:
            RecoveryStrategy object or None
        """
        try:
            process = bia_process.process
            subdepartment = process.subdepartment
            department = subdepartment.department
            
            logger.info(f"Generating strategy for: {department.name} > {subdepartment.name} > {process.name}")
            
            # Call LLM service
            strategies = await LLMService.generate_recovery_strategies(
                department_name=department.name,
                subdepartment_name=subdepartment.name,
                process_name=process.name,
                process_description=bia_process.description or "No description provided"
            )
            
            # Create recovery strategy
            pid_save = bia_process.process_id
            if SQLALCHEMY_DATABASE_URL.startswith('sqlite'):
                pid_save = str(pid_save)
            recovery_strategy = RecoveryStrategy(
                process_id=pid_save,
                people_unavailability_strategy=strategies.get("people_unavailability_strategy"),
                people_reasoning=strategies.get("people_reasoning"),
                technology_data_unavailability_strategy=strategies.get("technology_data_unavailability_strategy"),
                technology_reasoning=strategies.get("technology_reasoning"),
                site_unavailability_strategy=strategies.get("site_unavailability_strategy"),
                site_reasoning=strategies.get("site_reasoning"),
                third_party_vendors_unavailability_strategy=strategies.get("third_party_vendors_unavailability_strategy"),
                vendor_reasoning=strategies.get("vendor_reasoning"),
                process_vulnerability_strategy=strategies.get("process_vulnerability_strategy"),
                process_vulnerability_reasoning=strategies.get("process_vulnerability_reasoning"),
                people_status="Not Implemented",
                technology_status="Not Implemented",
                site_status="Not Implemented",
                vendor_status="Not Implemented",
                process_vulnerability_status="Not Implemented",
                enabled_strategies="people,technology,site,vendor,vulnerability",
                ai_generated_sections=json.dumps(["people", "technology", "site", "vendor", "vulnerability"]),
                ai_last_updated=datetime.utcnow()
            )
            
            db.add(recovery_strategy)
            logger.info(f"Successfully created strategy for process: {process.name}")
            
            return recovery_strategy
            
        except Exception as e:
            logger.error(f"Error generating strategy for process {bia_process.id}: {str(e)}")
            return None
    
    @staticmethod
    async def update_strategy_status(
        db: Session,
        process_id: str,
        people_status: Optional[str] = None,
        technology_status: Optional[str] = None,
        site_status: Optional[str] = None,
        vendor_status: Optional[str] = None,
        vulnerability_status: Optional[str] = None
    ) -> Optional[RecoveryStrategy]:
        """
        Update the implementation status of a recovery strategy.
        
        Args:
            db: Database session
            process_id: Process ID
            people_status: Status for people strategy
            technology_status: Status for technology strategy
            site_status: Status for site strategy
            vendor_status: Status for vendor strategy
            vulnerability_status: Status for vulnerability strategy
            
        Returns:
            Updated RecoveryStrategy or None
        """
        try:
            strategy = db.query(RecoveryStrategy).filter(
                RecoveryStrategy.process_id == uuid.UUID(process_id)
            ).first()
            
            if not strategy:
                logger.warning(f"Strategy not found for process: {process_id}")
                return None
            
            # Update statuses if provided
            if people_status:
                strategy.people_status = people_status
            if technology_status:
                strategy.technology_status = technology_status
            if site_status:
                strategy.site_status = site_status
            if vendor_status:
                strategy.vendor_status = vendor_status
            if vulnerability_status:
                strategy.process_vulnerability_status = vulnerability_status
            
            strategy.updated_at = datetime.utcnow()
            
            db.commit()
            db.refresh(strategy)
            
            logger.info(f"Updated strategy status for process: {process_id}")
            return strategy
            
        except Exception as e:
            logger.error(f"Error updating strategy status: {str(e)}")
            db.rollback()
            raise
    
    @staticmethod
    async def regenerate_strategy_for_process(
        db: Session,
        process_id: str,
        force: bool = False
    ) -> Optional[RecoveryStrategy]:
        """
        Regenerate recovery strategy for a specific process.
        
        Args:
            db: Database session
            process_id: Process ID
            force: Force regeneration even if recently updated
            
        Returns:
            Updated RecoveryStrategy or None
        """
        try:
            # Get the process
            bia_process = db.query(BIAProcessInfo).filter(
                BIAProcessInfo.id == uuid.UUID(process_id)
            ).options(
                joinedload(BIAProcessInfo.process).joinedload(GlobalProcess.subdepartment).joinedload(GlobalSubdepartment.department)
            ).first()
            
            if not bia_process:
                logger.warning(f"Process not found: {process_id}")
                return None
            
            # Check if strategy exists
            existing_strategy = db.query(RecoveryStrategy).filter(
                RecoveryStrategy.process_id == uuid.UUID(process_id)
            ).first()
            
            # Check if recently updated (unless force)
            if existing_strategy and not force:
                if existing_strategy.ai_last_updated:
                    time_since_update = datetime.utcnow() - existing_strategy.ai_last_updated
                    if time_since_update < timedelta(hours=24):
                        logger.info(f"Strategy recently updated, skipping regeneration")
                        return existing_strategy
            
            # Generate new strategy
            process = bia_process.process
            subdepartment = process.subdepartment
            department = subdepartment.department
            
            strategies = await LLMService.generate_recovery_strategies(
                department_name=department.name,
                subdepartment_name=subdepartment.name,
                process_name=process.name,
                process_description=bia_process.description or "No description provided"
            )
            
            if existing_strategy:
                # Update existing
                existing_strategy.people_unavailability_strategy = strategies.get("people_unavailability_strategy")
                existing_strategy.people_reasoning = strategies.get("people_reasoning")
                existing_strategy.technology_data_unavailability_strategy = strategies.get("technology_data_unavailability_strategy")
                existing_strategy.technology_reasoning = strategies.get("technology_reasoning")
                existing_strategy.site_unavailability_strategy = strategies.get("site_unavailability_strategy")
                existing_strategy.site_reasoning = strategies.get("site_reasoning")
                existing_strategy.third_party_vendors_unavailability_strategy = strategies.get("third_party_vendors_unavailability_strategy")
                existing_strategy.vendor_reasoning = strategies.get("vendor_reasoning")
                existing_strategy.process_vulnerability_strategy = strategies.get("process_vulnerability_strategy")
                existing_strategy.process_vulnerability_reasoning = strategies.get("process_vulnerability_reasoning")
                existing_strategy.ai_generated_sections = json.dumps(["people", "technology", "site", "vendor", "vulnerability"])
                existing_strategy.ai_last_updated = datetime.utcnow()
                existing_strategy.updated_at = datetime.utcnow()
                
                result = existing_strategy
            else:
                # Create new
                result = await RecoveryStrategyService._generate_strategy_for_process(bia_process, db)
            
            db.commit()
            logger.info(f"Regenerated strategy for process: {process_id}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error regenerating strategy: {str(e)}")
            db.rollback()
            raise
