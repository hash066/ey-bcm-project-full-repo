"""
Recovery Strategy Router for handling recovery strategy-related operations.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.db.postgres import get_db
from app.schemas.recovery_strategy_schemas import DepartmentWithStrategies

from app.services.recovery_strategy_service import RecoveryStrategyService

router = APIRouter(
    prefix="/recovery-strategies",
    tags=["recovery_strategies"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[DepartmentWithStrategies])
async def get_all_recovery_strategies(
    db: Session = Depends(get_db),
):
    """
    Get all departments with their sub-departments, functions (processes),
    and associated recovery strategies.
    """
    recovery_service = RecoveryStrategyService()
    return await recovery_service.get_all_departments_with_strategies(db) 