import asyncio
from sqlalchemy.orm import Session, joinedload
from typing import List
import uuid
from datetime import datetime
import logging

from app.models.global_models import GlobalDepartment, GlobalSubdepartment, GlobalProcess
from app.models.bia_models import BIAProcessInfo
from app.models.recovery_strategy_models import RecoveryStrategy
from app.schemas.recovery_strategy_schemas import DepartmentWithStrategies, SubDepartment, Function, RecoveryStrategyInDB
from app.services.recovery_strategy_llm import LLMService

logger = logging.getLogger(__name__)

class RecoveryStrategyService:
    """
    Service for fetching recovery strategy data based on BIA processes.
    """
    
    @staticmethod
    async def get_all_departments_with_strategies(db: Session) -> List[DepartmentWithStrategies]:
        """
        Get all departments with their sub-departments and functions (processes) that exist in BIA,
        along with their associated recovery strategies.
        This method now processes LLM generation in parallel to avoid timeouts.
        """
        
        # Step 1: Identify all BIA processes that need recovery strategies
        all_bia_processes = (
            db.query(BIAProcessInfo)
            .options(
                joinedload(BIAProcessInfo.process).joinedload(GlobalProcess.subdepartment).joinedload(GlobalSubdepartment.department),
                joinedload(BIAProcessInfo.recovery_strategy)
            )
            .all()
        )
        
        processes_to_generate = []
        for bia_process in all_bia_processes:
            if bia_process.recovery_strategy is None:
                processes_to_generate.append(bia_process)
        
        # Step 2: If there are processes that need strategies, generate them in parallel
        if processes_to_generate:
            logger.info(f"Found {len(processes_to_generate)} processes requiring new recovery strategies.")
            
            tasks = []
            for bia_process in processes_to_generate:
                process = bia_process.process
                sub_dept = process.subdepartment
                dept = sub_dept.department
                
                process_description = bia_process.description or f"Business process: {process.name}"
                
                tasks.append(
                    LLMService.generate_recovery_strategies(
                        department_name=dept.name,
                        subdepartment_name=sub_dept.name,
                        process_name=process.name,
                        process_description=process_description,
                        impact_analysis={},
                        minimum_operating_requirements={}
                    )
                )
            
            # Run all LLM generation tasks concurrently
            generated_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Step 3: Save the newly generated strategies to the database
            new_strategies = []
            for i, result in enumerate(generated_results):
                bia_process = processes_to_generate[i]
                
                if isinstance(result, Exception):
                    logger.error(f"Error generating strategy for process {bia_process.process.name}: {result}")
                    # Optionally, create a fallback strategy here if needed
                    continue

                new_strategy = RecoveryStrategy(
                    process_id=bia_process.id,
                    people_unavailability_strategy=result.get("people_unavailability_strategy"),
                    people_reasoning=result.get("people_reasoning"),
                    technology_data_unavailability_strategy=result.get("technology_data_unavailability_strategy"),
                    technology_reasoning=result.get("technology_reasoning"),
                    site_unavailability_strategy=result.get("site_unavailability_strategy"),
                    site_reasoning=result.get("site_reasoning"),
                    third_party_vendors_unavailability_strategy=result.get("third_party_vendors_unavailability_strategy"),
                    vendor_reasoning=result.get("vendor_reasoning")
                )
                new_strategies.append(new_strategy)

            if new_strategies:
                try:
                    db.add_all(new_strategies)
                    db.commit()
                    logger.info(f"Successfully created and saved {len(new_strategies)} new recovery strategies.")
                except Exception as e:
                    logger.error(f"Error saving new recovery strategies to the database: {str(e)}")
                    db.rollback()

        # Step 4: Re-query the database to get the complete and updated data
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

        # Step 5: Assemble the final response structure
        result = []
        for dept in departments:
            department_subdepartments = []
            for sub_dept in dept.subdepartments:
                subdepartment_functions = []
                
                # Filter for processes that have BIA info
                bia_processes_in_subdept = [p.bia_process_info for p in sub_dept.processes if p.bia_process_info]
                
                for bia_process_list in bia_processes_in_subdept:
                    if not bia_process_list:
                        continue
                    
                    bia_process = bia_process_list[0] # Assuming one-to-one
                    process = bia_process.process
                    
                    recovery_strategies = []
                    if bia_process.recovery_strategy:
                        recovery_strategies.append(RecoveryStrategyInDB.from_orm(bia_process.recovery_strategy))
                    
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
