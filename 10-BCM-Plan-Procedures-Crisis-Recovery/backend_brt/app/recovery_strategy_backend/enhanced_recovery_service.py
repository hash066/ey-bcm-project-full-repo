import asyncio
import json
from sqlalchemy.orm import Session, joinedload
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timedelta
import logging

from app.models.global_models import GlobalDepartment, GlobalSubdepartment, GlobalProcess
from app.models.bia_models import BIAProcessInfo
from app.models.recovery_strategy_models import RecoveryStrategy, DepartmentRecoveryConfig
from app.schemas.recovery_strategy_schemas import (
    DepartmentWithStrategies, SubDepartment, Function, RecoveryStrategyInDB
)
from app.recovery_strategy_backend.recovery_strategy_schemas import (
    DepartmentRecoveryConfigResponse, AIGenerationRequest, AIGenerationResponse,
    ProcessVulnerabilityAnalysis
)
from app.services.recovery_strategy_llm import LLMService

logger = logging.getLogger(__name__)

class EnhancedRecoveryStrategyService:
    """
    Enhanced service for recovery strategies with dynamic configuration,
    AI generation, and vulnerability analysis.
    """
    
    @staticmethod
    async def get_department_recovery_config(db: Session, department_id: uuid.UUID) -> Optional[DepartmentRecoveryConfigResponse]:
        """
        Get recovery configuration for a department.
        """
        config = db.query(DepartmentRecoveryConfig).filter(
            DepartmentRecoveryConfig.department_id == department_id
        ).first()
        
        if not config:
            return None
            
        return DepartmentRecoveryConfigResponse.from_orm(config)
    
    @staticmethod
    async def update_department_recovery_config(
        db: Session, 
        department_id: uuid.UUID, 
        config_data: Dict[str, Any]
    ) -> DepartmentRecoveryConfigResponse:
        """
        Update or create department recovery configuration.
        Changes cascade to all processes in the department.
        """
        config = db.query(DepartmentRecoveryConfig).filter(
            DepartmentRecoveryConfig.department_id == department_id
        ).first()
        
        if config:
            # Update existing config
            for key, value in config_data.items():
                if hasattr(config, key):
                    setattr(config, key, value)
        else:
            # Create new config
            config = DepartmentRecoveryConfig(
                department_id=department_id,
                **config_data
            )
            db.add(config)
        
        db.commit()
        db.refresh(config)
        
        # Cascade changes to all processes in department
        await EnhancedRecoveryStrategyService._cascade_department_changes(db, department_id, config)
        
        return DepartmentRecoveryConfigResponse.from_orm(config)
    
    @staticmethod
    async def _cascade_department_changes(db: Session, department_id: uuid.UUID, config: DepartmentRecoveryConfig):
        """
        Apply department-level changes to all processes in the department.
        """
        # Get all processes in the department
        processes = db.query(GlobalProcess).join(GlobalSubdepartment).filter(
            GlobalSubdepartment.department_id == department_id
        ).all()
        
        for process in processes:
            if process.bia_process_info:
                bia_process = process.bia_process_info[0] if isinstance(process.bia_process_info, list) else process.bia_process_info
                
                # Update or create recovery strategy
                strategy = db.query(RecoveryStrategy).filter(
                    RecoveryStrategy.process_id == bia_process.id
                ).first()
                
                if strategy:
                    strategy.enabled_strategies = config.default_enabled_strategies
                    # Apply templates if strategy content is empty
                    if not strategy.people_unavailability_strategy and config.people_strategy_template:
                        strategy.people_unavailability_strategy = config.people_strategy_template
                    if not strategy.technology_data_unavailability_strategy and config.technology_strategy_template:
                        strategy.technology_data_unavailability_strategy = config.technology_strategy_template
                    if not strategy.site_unavailability_strategy and config.site_strategy_template:
                        strategy.site_unavailability_strategy = config.site_strategy_template
                    if not strategy.third_party_vendors_unavailability_strategy and config.vendor_strategy_template:
                        strategy.third_party_vendors_unavailability_strategy = config.vendor_strategy_template
                    if not strategy.process_vulnerability_strategy and config.process_vulnerability_strategy_template:
                        strategy.process_vulnerability_strategy = config.process_vulnerability_strategy_template
        
        db.commit()
    
    @staticmethod
    async def generate_ai_content(db: Session, request: AIGenerationRequest) -> AIGenerationResponse:
        """
        Generate AI content for recovery strategies.
        """
        try:
            if request.process_id:
                return await EnhancedRecoveryStrategyService._generate_process_ai_content(db, request.process_id, request)
            elif request.department_id:
                return await EnhancedRecoveryStrategyService._generate_department_ai_content(db, request.department_id, request)
            else:
                return AIGenerationResponse(
                    success=False,
                    errors=["Either process_id or department_id must be provided"]
                )
        except Exception as e:
            logger.error(f"Error generating AI content: {str(e)}")
            return AIGenerationResponse(
                success=False,
                errors=[str(e)]
            )
    
    @staticmethod
    async def _generate_process_ai_content(db: Session, process_id: uuid.UUID, request: AIGenerationRequest) -> AIGenerationResponse:
        """
        Generate AI content for a specific process.
        """
        strategy = db.query(RecoveryStrategy).filter(
            RecoveryStrategy.process_id == process_id
        ).first()
        
        if not strategy:
            return AIGenerationResponse(
                success=False,
                errors=["Recovery strategy not found for process"]
            )
        
        # Check if we should use cached content
        if not request.force_regenerate and strategy.ai_generated_sections and strategy.ai_last_updated:
            if datetime.utcnow() - strategy.ai_last_updated < timedelta(hours=24):
                return AIGenerationResponse(
                    success=True,
                    generated_content=json.loads(strategy.ai_generated_sections),
                    cached=True
                )
        
        # Generate new AI content
        bia_process = db.query(BIAProcessInfo).filter(BIAProcessInfo.id == process_id).first()
        if not bia_process:
            return AIGenerationResponse(
                success=False,
                errors=["BIA process info not found"]
            )
        
        process = bia_process.process
        dept = process.subdepartment.department
        
        # Generate content using LLM service
        generated_content = await LLMService.generate_enhanced_recovery_strategies(
            department_name=dept.name,
            subdepartment_name=process.subdepartment.name,
            process_name=process.name,
            process_description=bia_process.description or f"Business process: {process.name}",
            content_types=request.content_types,
            include_vulnerability_analysis=True
        )
        
        # Update strategy with AI content
        strategy.ai_generated_sections = json.dumps(generated_content)
        strategy.ai_last_updated = datetime.utcnow()
        
        # Update strategy fields if requested
        if "people" in request.content_types or "all" in request.content_types:
            if generated_content.get("people_unavailability_strategy"):
                strategy.people_unavailability_strategy = generated_content["people_unavailability_strategy"]
                strategy.people_reasoning = generated_content.get("people_reasoning")
        
        if "technology" in request.content_types or "all" in request.content_types:
            if generated_content.get("technology_data_unavailability_strategy"):
                strategy.technology_data_unavailability_strategy = generated_content["technology_data_unavailability_strategy"]
                strategy.technology_reasoning = generated_content.get("technology_reasoning")
        
        if "site" in request.content_types or "all" in request.content_types:
            if generated_content.get("site_unavailability_strategy"):
                strategy.site_unavailability_strategy = generated_content["site_unavailability_strategy"]
                strategy.site_reasoning = generated_content.get("site_reasoning")
        
        if "vendor" in request.content_types or "all" in request.content_types:
            if generated_content.get("third_party_vendors_unavailability_strategy"):
                strategy.third_party_vendors_unavailability_strategy = generated_content["third_party_vendors_unavailability_strategy"]
                strategy.vendor_reasoning = generated_content.get("vendor_reasoning")
        
        if "process_vulnerability" in request.content_types or "all" in request.content_types:
            if generated_content.get("process_vulnerability_strategy"):
                strategy.process_vulnerability_strategy = generated_content["process_vulnerability_strategy"]
                strategy.process_vulnerability_reasoning = generated_content.get("process_vulnerability_reasoning")
        
        db.commit()
        
        return AIGenerationResponse(
            success=True,
            generated_content=generated_content,
            cached=False
        )
    
    @staticmethod
    async def _generate_department_ai_content(db: Session, department_id: uuid.UUID, request: AIGenerationRequest) -> AIGenerationResponse:
        """
        Generate AI content for all processes in a department.
        """
        processes = db.query(GlobalProcess).join(GlobalSubdepartment).filter(
            GlobalSubdepartment.department_id == department_id
        ).all()
        
        results = []
        errors = []
        
        for process in processes:
            if process.bia_process_info:
                bia_process = process.bia_process_info[0] if isinstance(process.bia_process_info, list) else process.bia_process_info
                process_request = AIGenerationRequest(
                    process_id=bia_process.id,
                    content_types=request.content_types,
                    force_regenerate=request.force_regenerate
                )
                
                result = await EnhancedRecoveryStrategyService._generate_process_ai_content(db, bia_process.id, process_request)
                if result.success:
                    results.append({
                        "process_id": str(bia_process.id),
                        "process_name": process.name,
                        "content": result.generated_content
                    })
                else:
                    errors.extend(result.errors or [])
        
        return AIGenerationResponse(
            success=len(errors) == 0,
            generated_content={"processes": results},
            errors=errors if errors else None,
            cached=False
        )
    
    @staticmethod
    async def get_dynamic_recovery_strategies(db: Session) -> List[DepartmentWithStrategies]:
        """
        Get recovery strategies with dynamic configuration based on department settings.
        """
        departments = (
            db.query(GlobalDepartment)
            .options(
                joinedload(GlobalDepartment.subdepartments)
                .joinedload(GlobalSubdepartment.processes)
                .joinedload(GlobalProcess.bia_process_info)
                .joinedload(BIAProcessInfo.recovery_strategy)
            )
            .all()
        )

        result = []
        for dept in departments:
            # Get department configuration
            dept_config = await EnhancedRecoveryStrategyService.get_department_recovery_config(db, dept.id)
            
            department_subdepartments = []
            for sub_dept in dept.subdepartments:
                subdepartment_functions = []
                
                # Filter for processes that have BIA info
                bia_processes_in_subdept = [p.bia_process_info for p in sub_dept.processes if p.bia_process_info]
                
                for bia_process_list in bia_processes_in_subdept:
                    if not bia_process_list:
                        continue
                    
                    bia_process = bia_process_list[0] if isinstance(bia_process_list, list) else bia_process_list
                    process = bia_process.process
                    
                    recovery_strategies = []
                    if bia_process.recovery_strategy:
                        strategy_data = RecoveryStrategyInDB.from_orm(bia_process.recovery_strategy)
                        
                        # Apply dynamic configuration
                        if dept_config:
                            enabled_strategies = dept_config.default_enabled_strategies.split(',')
                            # Filter strategies based on department configuration
                            strategy_data.enabled_strategies = ','.join(enabled_strategies)
                        
                        recovery_strategies.append(strategy_data)
                    
                    subdepartment_functions.append(
                        Function(
                            id=process.id,
                            name=process.name,
                            recovery_strategies=recovery_strategies
                        )
                    )
                
                if subdepartment_functions:
                    department_subdepartments.append(
                        SubDepartment(
                            id=sub_dept.id,
                            name=sub_dept.name,
                            functions=subdepartment_functions
                        )
                    )

            if department_subdepartments:
                result.append(
                    DepartmentWithStrategies(
                        id=dept.id,
                        name=dept.name,
                        sub_departments=department_subdepartments
                    )
                )
        
        return result