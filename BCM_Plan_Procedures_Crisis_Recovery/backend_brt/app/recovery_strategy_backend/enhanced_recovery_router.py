"""
Enhanced Recovery Strategy Router with dynamic configuration and AI generation.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import uuid

from app.db.postgres import get_db
from app.schemas.recovery_strategy_schemas import DepartmentWithStrategies
from app.recovery_strategy_backend.recovery_strategy_schemas import (
    DepartmentRecoveryConfigResponse, AIGenerationRequest, AIGenerationResponse
)
from app.recovery_strategy_backend.enhanced_recovery_service import EnhancedRecoveryStrategyService

router = APIRouter(
    prefix="/enhanced-recovery-strategies",
    tags=["enhanced_recovery_strategies"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[DepartmentWithStrategies])
async def get_dynamic_recovery_strategies(
    db: Session = Depends(get_db),
):
    """
    Get all departments with dynamic recovery strategies based on department configuration.
    """
    return await EnhancedRecoveryStrategyService.get_dynamic_recovery_strategies(db)

@router.get("/department/{department_id}/config", response_model=DepartmentRecoveryConfigResponse)
async def get_department_config(
    department_id: str,
    db: Session = Depends(get_db)
):
    """
    Get recovery configuration for a specific department.
    """
    try:
        dept_uuid = uuid.UUID(department_id)
        config = await EnhancedRecoveryStrategyService.get_department_recovery_config(db, dept_uuid)
        if not config:
            raise HTTPException(status_code=404, detail="Department configuration not found")
        return config
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid department ID format")

@router.put("/department/{department_id}/config", response_model=DepartmentRecoveryConfigResponse)
async def update_department_config(
    department_id: str,
    config_data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """
    Update recovery configuration for a department.
    Changes will cascade to all processes in the department.
    """
    try:
        dept_uuid = uuid.UUID(department_id)
        return await EnhancedRecoveryStrategyService.update_department_recovery_config(db, dept_uuid, config_data)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid department ID format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-ai-content", response_model=AIGenerationResponse)
async def generate_ai_content(
    request: AIGenerationRequest,
    db: Session = Depends(get_db)
):
    """
    Generate AI content for recovery strategies.
    Can target a specific process or all processes in a department.
    """
    return await EnhancedRecoveryStrategyService.generate_ai_content(db, request)

@router.post("/process/{process_id}/generate-ai", response_model=AIGenerationResponse)
async def generate_process_ai_content(
    process_id: str,
    content_types: List[str] = ["all"],
    force_regenerate: bool = False,
    db: Session = Depends(get_db)
):
    """
    Generate AI content for a specific process.
    """
    try:
        proc_uuid = uuid.UUID(process_id)
        request = AIGenerationRequest(
            process_id=proc_uuid,
            content_types=content_types,
            force_regenerate=force_regenerate
        )
        return await EnhancedRecoveryStrategyService.generate_ai_content(db, request)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid process ID format")

@router.post("/department/{department_id}/generate-ai", response_model=AIGenerationResponse)
async def generate_department_ai_content(
    department_id: str,
    content_types: List[str] = ["all"],
    force_regenerate: bool = False,
    db: Session = Depends(get_db)
):
    """
    Generate AI content for all processes in a department.
    """
    try:
        dept_uuid = uuid.UUID(department_id)
        request = AIGenerationRequest(
            department_id=dept_uuid,
            content_types=content_types,
            force_regenerate=force_regenerate
        )
        return await EnhancedRecoveryStrategyService.generate_ai_content(db, request)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid department ID format")