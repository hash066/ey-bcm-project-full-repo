"""
Recovery Strategy Router - Handles all recovery strategy related endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel
from datetime import datetime
import logging

from app.db.postgres import get_db
from app.models.recovery_strategy_models import RecoveryStrategy, DepartmentRecoveryConfig
from app.models.bia_models import BIAProcessInfo
from app.recovery_strategy_backend.recovery_strategy_service import RecoveryStrategyService
from app.services.recovery_strategy_service import RecoveryStrategyService as DBSeedService
from app.db.postgres import SQLALCHEMY_DATABASE_URL
from app.schemas.recovery_strategy_schemas import RecoveryStrategyInDB

# Configure logging
logger = logging.getLogger(__name__)

class StrategyStatusUpdate(BaseModel):
    people_status: Optional[str] = None
    technology_status: Optional[str] = None
    site_status: Optional[str] = None
    vendor_status: Optional[str] = None
    process_vulnerability_status: Optional[str] = None
    technology_unavailability_status: Optional[str] = None
    third_party_unavailability_status: Optional[str] = None

class DepartmentRecoveryConfigUpdate(BaseModel):
    enable_ai_generation: Optional[bool] = None
    ai_generation_frequency: Optional[str] = None
    default_enabled_strategies: Optional[str] = None

router = APIRouter(
    prefix="/api/recovery-strategies",
    tags=["recovery-strategies"],
    responses={
        status.HTTP_404_NOT_FOUND: {"description": "Not found"},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"description": "Internal server error"}
    },
)

@router.get("/test")
async def test_recovery_endpoint():
    """Test endpoint to verify router is working."""
    return {
        "message": "Recovery strategy router is working!",
        "status": "operational",
        "endpoints": [
            "GET /api/recovery-strategies/ - Get all strategies",
            "GET /api/recovery-strategies/test - Test endpoint",
            "GET /api/recovery-strategies/process/{id} - Get single strategy",
            "POST /api/recovery-strategies/init-db - Initialize database",
            "POST /api/recovery-strategies/generate/{process_id} - Generate strategy for process",
            "POST /api/recovery-strategies/generate-missing - Generate missing strategies",
            "PUT /api/recovery-strategies/process/{id}/status - Update status"
        ]
    }

@router.post("/init-db", status_code=status.HTTP_200_OK)
def initialize_database(db: Session = Depends(get_db)):
    """Initialize database with default recovery strategy configurations."""
    try:
        RecoveryStrategyService.initialize_database(db)
        return {"status": "success", "message": "Database initialized with recovery strategies"}
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error initializing database: {str(e)}"
        )

@router.post("/seed-more-data", status_code=status.HTTP_200_OK)
def seed_more_data(db: Session = Depends(get_db)):
    try:
        DBSeedService.seed_more_data(db)
        seeded = DBSeedService.seed_strategies_for_existing_processes(db)
        return {"status": "success", "message": "Additional sample data seeded", "strategies_seeded": seeded}
    except Exception as e:
        logger.error(f"Error seeding data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error seeding data: {str(e)}"
        )

@router.post("/seed-strategies", status_code=status.HTTP_200_OK)
def seed_strategies(db: Session = Depends(get_db)):
    try:
        seeded = DBSeedService.seed_strategies_for_existing_processes(db)
        return {"status": "success", "strategies_seeded": seeded}
    except Exception as e:
        logger.error(f"Error seeding strategies: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error seeding strategies: {str(e)}"
        )

@router.post("/generate/{process_id}")
async def generate_recovery_strategy(
    process_id: UUID,
    db: Session = Depends(get_db)
):
    """Generate recovery strategy for a specific process using LLM."""
    try:
        strategy = await RecoveryStrategyService.generate_recovery_strategy_by_bia(db, process_id)
        return {
            "status": "success",
            "message": "Recovery strategy generated successfully",
            "process_id": str(strategy.process_id),
            "strategy": {
                "people_unavailability_strategy": strategy.people_unavailability_strategy,
                "technology_data_unavailability_strategy": strategy.technology_data_unavailability_strategy,
                "site_unavailability_strategy": strategy.site_unavailability_strategy,
                "third_party_vendors_unavailability_strategy": strategy.third_party_vendors_unavailability_strategy,
                "process_vulnerability_strategy": strategy.process_vulnerability_strategy,
                "people_status": strategy.people_status,
                "technology_status": strategy.technology_status,
                "site_status": strategy.site_status,
                "vendor_status": strategy.vendor_status,
                "process_vulnerability_status": strategy.process_vulnerability_status
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating recovery strategy: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating recovery strategy: {str(e)}"
        )

@router.get("/")
async def get_all_recovery_strategies(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all recovery strategies."""
    try:
        bind = db.get_bind()
        print(f"DB Dialect in /recovery-strategies: {bind.dialect.name}")
    except Exception:
        pass
    strategies = db.query(RecoveryStrategy)\
        .offset(skip)\
        .limit(limit)\
        .all()
    
    return {
        "total": db.query(RecoveryStrategy).count(),
        "skip": skip,
        "limit": limit,
        "strategies": [
            {
                "process_id": str(s.process_id),
                "people_strategy": s.people_unavailability_strategy,
                "technology_strategy": s.technology_data_unavailability_strategy,
                "site_strategy": s.site_unavailability_strategy,
                "vendor_strategy": s.third_party_vendors_unavailability_strategy,
                "vulnerability_strategy": s.process_vulnerability_strategy,
                "technology_unavailability_strategy": s.technology_unavailability_strategy,
                "third_party_unavailability_strategy": s.third_party_unavailability_strategy,
                "people_status": s.people_status,
                "technology_status": s.technology_status,
                "site_status": s.site_status,
                "vendor_status": s.vendor_status,
                "vulnerability_status": s.process_vulnerability_status,
                "technology_unavailability_status": s.technology_unavailability_status,
                "third_party_unavailability_status": s.third_party_unavailability_status,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "updated_at": s.updated_at.isoformat() if s.updated_at else None
            }
            for s in strategies
        ]
    }

@router.get("/process/{process_id}")
async def get_recovery_strategy(
    process_id: UUID,
    db: Session = Depends(get_db)
):
    """Get recovery strategy for a specific process."""
    pid = str(process_id) if SQLALCHEMY_DATABASE_URL.startswith('sqlite') else process_id
    strategy = db.query(RecoveryStrategy)\
        .filter(RecoveryStrategy.process_id == pid)\
        .first()
    
    if not strategy:
        raise HTTPException(status_code=404, detail="Recovery strategy not found")
    
    return {
        "process_id": str(strategy.process_id),
        "people_strategy": strategy.people_unavailability_strategy,
        "people_reasoning": strategy.people_reasoning,
        "people_status": strategy.people_status,
        "technology_strategy": strategy.technology_data_unavailability_strategy,
        "technology_reasoning": strategy.technology_reasoning,
        "technology_status": strategy.technology_status,
        "site_strategy": strategy.site_unavailability_strategy,
        "site_reasoning": strategy.site_reasoning,
        "site_status": strategy.site_status,
        "vendor_strategy": strategy.third_party_vendors_unavailability_strategy,
        "vendor_reasoning": strategy.vendor_reasoning,
        "vendor_status": strategy.vendor_status,
        "vulnerability_strategy": strategy.process_vulnerability_strategy,
        "vulnerability_reasoning": strategy.process_vulnerability_reasoning,
        "vulnerability_status": strategy.process_vulnerability_status,
        "technology_unavailability_strategy": strategy.technology_unavailability_strategy,
        "technology_unavailability_reasoning": strategy.technology_unavailability_reasoning,
        "technology_unavailability_status": strategy.technology_unavailability_status,
        "third_party_unavailability_strategy": strategy.third_party_unavailability_strategy,
        "third_party_unavailability_reasoning": strategy.third_party_unavailability_reasoning,
        "third_party_unavailability_status": strategy.third_party_unavailability_status,
        "enabled_strategies": strategy.enabled_strategies,
        "ai_generated_sections": strategy.ai_generated_sections,
        "ai_last_updated": strategy.ai_last_updated.isoformat() if strategy.ai_last_updated else None,
        "created_at": strategy.created_at.isoformat() if strategy.created_at else None,
        "updated_at": strategy.updated_at.isoformat() if strategy.updated_at else None
    }

@router.post("/generate-missing")
async def generate_missing_strategies(db: Session = Depends(get_db)):
    """Generate strategies for processes that don't have them."""
    try:
        result = await RecoveryStrategyService.generate_missing_strategies_parallel(db)
        return {
            "message": result.get("message", "Generation completed"),
            "generated": result.get("generated_count", 0),
            "total_strategies": db.query(RecoveryStrategy).count()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate strategies: {str(e)}")

@router.put("/process/{process_id}/status")
async def update_strategy_status(
    process_id: UUID,
    status_update: StrategyStatusUpdate,
    db: Session = Depends(get_db)
):
    """Update implementation status of recovery strategies."""
    strategy = db.query(RecoveryStrategy)\
        .filter(RecoveryStrategy.process_id == process_id)\
        .first()
    
    if not strategy:
        raise HTTPException(status_code=404, detail="Recovery strategy not found")
    
    # Update only provided fields
    if status_update.people_status:
        strategy.people_status = status_update.people_status
    if status_update.technology_status:
        strategy.technology_status = status_update.technology_status
    if status_update.site_status:
        strategy.site_status = status_update.site_status
    if status_update.vendor_status:
        strategy.vendor_status = status_update.vendor_status
    if status_update.process_vulnerability_status:
        strategy.process_vulnerability_status = status_update.process_vulnerability_status
    if status_update.technology_unavailability_status:
        strategy.technology_unavailability_status = status_update.technology_unavailability_status
    if status_update.third_party_unavailability_status:
        strategy.third_party_unavailability_status = status_update.third_party_unavailability_status
    
    strategy.updated_at = datetime.now()
    
    try:
        db.commit()
        db.refresh(strategy)
        return {
            "message": "Strategy status updated successfully",
            "process_id": str(process_id)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update status: {str(e)}"
        )

@router.get("/stats/summary")
async def get_recovery_stats(db: Session = Depends(get_db)):
    """Get summary statistics for recovery strategies."""
    
    total_processes = db.query(BIAProcessInfo).count()
    total_strategies = db.query(RecoveryStrategy).count()
    
    coverage_percentage = (total_strategies / total_processes * 100) if total_processes > 0 else 0
    
    return {
        "total_processes": total_processes,
        "total_strategies": total_strategies,
        "coverage_percentage": round(coverage_percentage, 2),
        "missing_strategies": total_processes - total_strategies,
        "status_breakdown": {
            "people": {
                "implemented": db.query(RecoveryStrategy).filter(RecoveryStrategy.people_status == "Implemented").count(),
                "not_implemented": db.query(RecoveryStrategy).filter(RecoveryStrategy.people_status == "Not Implemented").count()
            },
            "technology": {
                "implemented": db.query(RecoveryStrategy).filter(RecoveryStrategy.technology_status == "Implemented").count(),
                "not_implemented": db.query(RecoveryStrategy).filter(RecoveryStrategy.technology_status == "Not Implemented").count()
            },
            "site": {
                "implemented": db.query(RecoveryStrategy).filter(RecoveryStrategy.site_status == "Implemented").count(),
                "not_implemented": db.query(RecoveryStrategy).filter(RecoveryStrategy.site_status == "Not Implemented").count()
            },
            "vendor": {
                "implemented": db.query(RecoveryStrategy).filter(RecoveryStrategy.vendor_status == "Implemented").count(),
                "not_implemented": db.query(RecoveryStrategy).filter(RecoveryStrategy.vendor_status == "Not Implemented").count()
            }
        }
    }

@router.get("/departments/hierarchy")
async def get_departments_hierarchy(db: Session = Depends(get_db)):
    """Get departments with nested subdepartments, functions, and recovery strategies."""
    from sqlalchemy import text
    
    # Get all departments
    departments_result = db.execute(text("SELECT DISTINCT id, name FROM department ORDER BY name"))
    departments = []
    
    for dept_row in departments_result:
        dept_id = dept_row[0]
        dept_name = dept_row[1]
        
        # Get processes for this department (both direct and via subdepartment)
        processes_result = db.execute(text("""
            SELECT DISTINCT p.id, p.name, sd.name as subdept_name
            FROM process p
            LEFT JOIN subdepartment sd ON p.subdepartment_id = sd.id
            WHERE p.department_id = :dept_id OR sd.department_id = :dept_id
            ORDER BY p.name
        """), {"dept_id": str(dept_id)})
        
        # Group by subdepartment
        subdepts_dict = {}
        
        for proc_row in processes_result:
            proc_id = proc_row[0]
            proc_name = proc_row[1]
            subdept_name = proc_row[2] or "General"
            
            # Get recovery strategy for this process
            bia = db.query(BIAProcessInfo).filter(BIAProcessInfo.process_id == proc_id).first()
            strategy = None
            if bia:
                strategy = db.query(RecoveryStrategy).filter(
                    RecoveryStrategy.process_id == bia.id
                ).first()
            
            if strategy:
                strategy_data = {
                    "process_id": str(strategy.process_id),
                    "people_unavailability_strategy": strategy.people_unavailability_strategy,
                    "people_reasoning": strategy.people_reasoning,
                    "technology_data_unavailability_strategy": strategy.technology_data_unavailability_strategy,
                    "technology_reasoning": strategy.technology_reasoning,
                    "site_unavailability_strategy": strategy.site_unavailability_strategy,
                    "site_reasoning": strategy.site_reasoning,
                    "third_party_vendors_unavailability_strategy": strategy.third_party_vendors_unavailability_strategy,
                    "vendor_reasoning": strategy.vendor_reasoning,
                    "process_vulnerability_strategy": strategy.process_vulnerability_strategy,
                    "process_vulnerability_reasoning": strategy.process_vulnerability_reasoning,
                    "technology_unavailability_strategy": strategy.technology_unavailability_strategy,
                    "technology_unavailability_reasoning": strategy.technology_unavailability_reasoning,
                    "third_party_unavailability_strategy": strategy.third_party_unavailability_strategy,
                    "third_party_unavailability_reasoning": strategy.third_party_unavailability_reasoning,
                    "people_status": strategy.people_status,
                    "technology_status": strategy.technology_status,
                    "site_status": strategy.site_status,
                    "vendor_status": strategy.vendor_status,
                    "process_vulnerability_status": strategy.process_vulnerability_status,
                    "technology_unavailability_status": strategy.technology_unavailability_status,
                    "third_party_unavailability_status": strategy.third_party_unavailability_status,
                    "enabled_strategies": strategy.enabled_strategies
                }
                
                function_data = {
                    "id": str(proc_id),
                    "name": proc_name,
                    "recovery_strategies": [strategy_data]
                }
                
                # Add to subdepartment
                if subdept_name not in subdepts_dict:
                    subdepts_dict[subdept_name] = {
                        "id": subdept_name.lower().replace(" ", "-"),
                        "name": subdept_name,
                        "functions": []
                    }
                
                subdepts_dict[subdept_name]["functions"].append(function_data)
        
        if subdepts_dict:
            dept_data = {
                "id": str(dept_id),
                "name": dept_name,
                "sub_departments": list(subdepts_dict.values())
            }
            departments.append(dept_data)
    
    return departments

@router.get("/technology-unavailability")
async def get_all_technology_unavailability_strategies(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all technology unavailability strategies."""
    strategies = db.query(RecoveryStrategy)\
        .filter(RecoveryStrategy.technology_unavailability_strategy.isnot(None))\
        .offset(skip)\
        .limit(limit)\
        .all()
    
    return {
        "total": db.query(RecoveryStrategy).filter(RecoveryStrategy.technology_unavailability_strategy.isnot(None)).count(),
        "skip": skip,
        "limit": limit,
        "strategies": [
            {
                "process_id": str(s.process_id),
                "technology_unavailability_strategy": s.technology_unavailability_strategy,
                "technology_unavailability_reasoning": s.technology_unavailability_reasoning,
                "technology_unavailability_status": s.technology_unavailability_status,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "updated_at": s.updated_at.isoformat() if s.updated_at else None
            }
            for s in strategies
        ]
    }

@router.get("/third-party-unavailability")
async def get_all_third_party_unavailability_strategies(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all third party unavailability strategies."""
    strategies = db.query(RecoveryStrategy)\
        .filter(RecoveryStrategy.third_party_unavailability_strategy.isnot(None))\
        .offset(skip)\
        .limit(limit)\
        .all()
    
    return {
        "total": db.query(RecoveryStrategy).filter(RecoveryStrategy.third_party_unavailability_strategy.isnot(None)).count(),
        "skip": skip,
        "limit": limit,
        "strategies": [
            {
                "process_id": str(s.process_id),
                "third_party_unavailability_strategy": s.third_party_unavailability_strategy,
                "third_party_unavailability_reasoning": s.third_party_unavailability_reasoning,
                "third_party_unavailability_status": s.third_party_unavailability_status,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "updated_at": s.updated_at.isoformat() if s.updated_at else None
            }
            for s in strategies
        ]
    }

@router.post("/generate-technology-unavailability/{process_id}")
async def generate_technology_unavailability_strategy(
    process_id: UUID,
    db: Session = Depends(get_db)
):
    """Generate technology unavailability strategy for a specific process using LLM."""
    try:
        strategy = await RecoveryStrategyService.generate_recovery_strategy(db, process_id)
        return {
            "status": "success",
            "message": "Technology unavailability strategy generated successfully",
            "process_id": str(strategy.process_id),
            "strategy": {
                "technology_unavailability_strategy": strategy.technology_unavailability_strategy,
                "technology_unavailability_reasoning": strategy.technology_unavailability_reasoning,
                "technology_unavailability_status": strategy.technology_unavailability_status
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating technology unavailability strategy: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating technology unavailability strategy: {str(e)}"
        )

@router.post("/generate-third-party-unavailability/{process_id}")
async def generate_third_party_unavailability_strategy(
    process_id: UUID,
    db: Session = Depends(get_db)
):
    """Generate third party unavailability strategy for a specific process using LLM."""
    try:
        strategy = await RecoveryStrategyService.generate_recovery_strategy(db, process_id)
        return {
            "status": "success",
            "message": "Third party unavailability strategy generated successfully",
            "process_id": str(strategy.process_id),
            "strategy": {
                "third_party_unavailability_strategy": strategy.third_party_unavailability_strategy,
                "third_party_unavailability_reasoning": strategy.third_party_unavailability_reasoning,
                "third_party_unavailability_status": strategy.third_party_unavailability_status
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating third party unavailability strategy: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating third party unavailability strategy: {str(e)}"
        )
