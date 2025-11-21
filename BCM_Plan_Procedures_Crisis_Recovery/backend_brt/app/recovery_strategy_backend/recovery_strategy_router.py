"""
Recovery Strategy Router - Unified version with all endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from uuid import UUID
from pydantic import BaseModel

from app.db.postgres import get_db
from app.schemas.recovery_strategy_schemas import (
    DepartmentWithStrategies,
    RecoveryStrategyInDB,
    RecoveryStrategyCreate,
    RecoveryStrategyUpdate
)
from app.models.recovery_strategy_models import RecoveryStrategy
from app.services.recovery_strategy_service import RecoveryStrategyService

# Pydantic models for request/response
class StrategyStatusUpdate(BaseModel):
    """Model for updating strategy implementation status"""
    people_status: Optional[str] = None
    technology_status: Optional[str] = None
    site_status: Optional[str] = None
    vendor_status: Optional[str] = None
    vulnerability_status: Optional[str] = None

class GenerateMissingResponse(BaseModel):
    """Response for generate missing strategies"""
    status: str
    message: str
    generated_count: int
    failed_count: Optional[int] = 0

class RegenerateRequest(BaseModel):
    """Request for regenerating strategy"""
    force: bool = False

router = APIRouter(
    prefix="/recovery-strategies",
    tags=["recovery_strategies"],
    responses={404: {"description": "Not found"}},
)


# ============================================================================
# BASIC ENDPOINTS
# ============================================================================

@router.get("/test")
async def test_recovery_endpoint():
    """
    Test endpoint to verify router is working.
    """
    return {
        "message": "Recovery strategy router is working!",
        "endpoints": [
            "GET /recovery-strategies/",
            "GET /recovery-strategies/test",
            "POST /recovery-strategies/generate-missing",
            "PUT /recovery-strategies/process/{process_id}/status",
            "POST /recovery-strategies/process/{process_id}/regenerate",
            "GET /recovery-strategies/process/{process_id}"
        ]
    }


@router.get("/", response_model=List[DepartmentWithStrategies])
async def get_all_recovery_strategies(
    db: Session = Depends(get_db),
):
    """
    Get all departments with their sub-departments, functions (processes),
    and associated recovery strategies.
    
    Returns:
        List of departments with nested structure containing strategies
    """
    try:
        result = await RecoveryStrategyService.get_all_departments_with_strategies(db)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching recovery strategies: {str(e)}")


# ============================================================================
# GENERATION ENDPOINTS
# ============================================================================

@router.post("/generate-missing", response_model=GenerateMissingResponse)
async def generate_missing_strategies(
    db: Session = Depends(get_db),
):
    """
    Generate recovery strategies for all processes that don't have them yet.
    Uses parallel processing for efficiency.
    
    Returns:
        Status and count of generated strategies
    """
    try:
        result = await RecoveryStrategyService.generate_missing_strategies_parallel(db)
        return GenerateMissingResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating strategies: {str(e)}")


@router.post("/process/{process_id}/regenerate", response_model=RecoveryStrategyInDB)
async def regenerate_strategy_for_process(
    process_id: UUID,
    request: Optional[RegenerateRequest] = None,
    db: Session = Depends(get_db),
):
    """
    Regenerate recovery strategy for a specific process using AI.
    
    Args:
        process_id: UUID of the process
        request: Optional request body with force flag
        
    Returns:
        Updated recovery strategy
    """
    try:
        force = request.force if request else False
        
        strategy = await RecoveryStrategyService.regenerate_strategy_for_process(
            db=db,
            process_id=str(process_id),
            force=force
        )
        
        if not strategy:
            raise HTTPException(status_code=404, detail=f"Process not found: {process_id}")
        
        # Convert to response model
        return RecoveryStrategyInDB(
            process_id=strategy.process_id,
            people_unavailability_strategy=strategy.people_unavailability_strategy,
            people_reasoning=strategy.people_reasoning,
            technology_data_unavailability_strategy=strategy.technology_data_unavailability_strategy,
            technology_reasoning=strategy.technology_reasoning,
            site_unavailability_strategy=strategy.site_unavailability_strategy,
            site_reasoning=strategy.site_reasoning,
            third_party_vendors_unavailability_strategy=strategy.third_party_vendors_unavailability_strategy,
            vendor_reasoning=strategy.vendor_reasoning,
            process_vulnerability_strategy=strategy.process_vulnerability_strategy,
            process_vulnerability_reasoning=strategy.process_vulnerability_reasoning,
            people_status=strategy.people_status,
            technology_status=strategy.technology_status,
            site_status=strategy.site_status,
            vendor_status=strategy.vendor_status,
            process_vulnerability_status=strategy.process_vulnerability_status,
            enabled_strategies=strategy.enabled_strategies,
            ai_generated_sections=strategy.ai_generated_sections,
            ai_last_updated=strategy.ai_last_updated,
            created_at=strategy.created_at,
            updated_at=strategy.updated_at
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error regenerating strategy: {str(e)}")


# ============================================================================
# STATUS MANAGEMENT ENDPOINTS
# ============================================================================

@router.put("/process/{process_id}/status", response_model=RecoveryStrategyInDB)
async def update_strategy_status(
    process_id: UUID,
    status_update: StrategyStatusUpdate,
    db: Session = Depends(get_db),
):
    """
    Update the implementation status of recovery strategies for a process.
    
    Args:
        process_id: UUID of the process
        status_update: Status updates for different strategy types
        
    Returns:
        Updated recovery strategy
    """
    try:
        strategy = await RecoveryStrategyService.update_strategy_status(
            db=db,
            process_id=str(process_id),
            people_status=status_update.people_status,
            technology_status=status_update.technology_status,
            site_status=status_update.site_status,
            vendor_status=status_update.vendor_status,
            vulnerability_status=status_update.vulnerability_status
        )
        
        if not strategy:
            raise HTTPException(status_code=404, detail=f"Strategy not found for process: {process_id}")
        
        # Convert to response model
        return RecoveryStrategyInDB(
            process_id=strategy.process_id,
            people_unavailability_strategy=strategy.people_unavailability_strategy,
            people_reasoning=strategy.people_reasoning,
            technology_data_unavailability_strategy=strategy.technology_data_unavailability_strategy,
            technology_reasoning=strategy.technology_reasoning,
            site_unavailability_strategy=strategy.site_unavailability_strategy,
            site_reasoning=strategy.site_reasoning,
            third_party_vendors_unavailability_strategy=strategy.third_party_vendors_unavailability_strategy,
            vendor_reasoning=strategy.vendor_reasoning,
            process_vulnerability_strategy=strategy.process_vulnerability_strategy,
            process_vulnerability_reasoning=strategy.process_vulnerability_reasoning,
            people_status=strategy.people_status,
            technology_status=strategy.technology_status,
            site_status=strategy.site_status,
            vendor_status=strategy.vendor_status,
            process_vulnerability_status=strategy.process_vulnerability_status,
            enabled_strategies=strategy.enabled_strategies,
            ai_generated_sections=strategy.ai_generated_sections,
            ai_last_updated=strategy.ai_last_updated,
            created_at=strategy.created_at,
            updated_at=strategy.updated_at
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating strategy status: {str(e)}")


# ============================================================================
# QUERY ENDPOINTS
# ============================================================================

@router.get("/process/{process_id}", response_model=RecoveryStrategyInDB)
async def get_strategy_by_process(
    process_id: UUID,
    db: Session = Depends(get_db),
):
    """
    Get recovery strategy for a specific process.
    
    Args:
        process_id: UUID of the process
        
    Returns:
        Recovery strategy for the process
    """
    try:
        strategy = db.query(RecoveryStrategy).filter(
            RecoveryStrategy.process_id == process_id
        ).first()
        
        if not strategy:
            raise HTTPException(status_code=404, detail=f"Strategy not found for process: {process_id}")
        
        return RecoveryStrategyInDB(
            process_id=strategy.process_id,
            people_unavailability_strategy=strategy.people_unavailability_strategy,
            people_reasoning=strategy.people_reasoning,
            technology_data_unavailability_strategy=strategy.technology_data_unavailability_strategy,
            technology_reasoning=strategy.technology_reasoning,
            site_unavailability_strategy=strategy.site_unavailability_strategy,
            site_reasoning=strategy.site_reasoning,
            third_party_vendors_unavailability_strategy=strategy.third_party_vendors_unavailability_strategy,
            vendor_reasoning=strategy.vendor_reasoning,
            process_vulnerability_strategy=strategy.process_vulnerability_strategy,
            process_vulnerability_reasoning=strategy.process_vulnerability_reasoning,
            people_status=strategy.people_status,
            technology_status=strategy.technology_status,
            site_status=strategy.site_status,
            vendor_status=strategy.vendor_status,
            process_vulnerability_status=strategy.process_vulnerability_status,
            enabled_strategies=strategy.enabled_strategies,
            ai_generated_sections=strategy.ai_generated_sections,
            ai_last_updated=strategy.ai_last_updated,
            created_at=strategy.created_at,
            updated_at=strategy.updated_at
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching strategy: {str(e)}")


# ============================================================================
# STATISTICS ENDPOINTS
# ============================================================================

@router.get("/stats/summary")
async def get_recovery_strategy_stats(
    db: Session = Depends(get_db),
):
    """
    Get summary statistics for recovery strategies.
    
    Returns:
        Statistics about strategy coverage and status
    """
    try:
        from app.models.bia_models import BIAProcessInfo
        
        # Total processes with BIA
        total_processes = db.query(BIAProcessInfo).count()
        
        # Processes with strategies
        processes_with_strategies = db.query(RecoveryStrategy).count()
        
        # Status breakdown
        implemented_people = db.query(RecoveryStrategy).filter(
            RecoveryStrategy.people_status == "Implemented"
        ).count()
        
        implemented_technology = db.query(RecoveryStrategy).filter(
            RecoveryStrategy.technology_status == "Implemented"
        ).count()
        
        implemented_site = db.query(RecoveryStrategy).filter(
            RecoveryStrategy.site_status == "Implemented"
        ).count()
        
        implemented_vendor = db.query(RecoveryStrategy).filter(
            RecoveryStrategy.vendor_status == "Implemented"
        ).count()
        
        implemented_vulnerability = db.query(RecoveryStrategy).filter(
            RecoveryStrategy.process_vulnerability_status == "Implemented"
        ).count()
        
        # AI-generated count
        ai_generated = db.query(RecoveryStrategy).filter(
            RecoveryStrategy.ai_generated_sections.isnot(None)
        ).count()
        
        return {
            "total_processes": total_processes,
            "strategies_created": processes_with_strategies,
            "coverage_percentage": round((processes_with_strategies / total_processes * 100) if total_processes > 0 else 0, 2),
            "implementation_status": {
                "people": implemented_people,
                "technology": implemented_technology,
                "site": implemented_site,
                "vendor": implemented_vendor,
                "vulnerability": implemented_vulnerability
            },
            "ai_generated_count": ai_generated
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching statistics: {str(e)}")
