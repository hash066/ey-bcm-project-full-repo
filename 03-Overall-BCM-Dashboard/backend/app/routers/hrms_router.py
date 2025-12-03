"""
HRMS integration router for handling HRMS data synchronization with RBAC.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from app.db.postgres import get_db
from app.middleware.auth import get_current_user, require_permission
from app.services.hrms_service import HRMSIntegrationService

# Create router
router = APIRouter(
    prefix="/hrms",
    tags=["hrms"],
    responses={401: {"description": "Unauthorized"}}
)

@router.post("/sync", response_model=List[Dict[str, Any]])
async def sync_hrms_data(
    hrms_data: List[Dict[str, Any]],
    client_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("hrms", "sync"))
):
    """
    Synchronize HRMS data with RBAC system.
    
    Args:
        hrms_data: List of HRMS data records
        client_id: Client ID for context
        db: Database session
        current_user: Current authenticated user with proper permissions
        
    Returns:
        List[Dict]: Results of synchronization
    """
    try:
        results = HRMSIntegrationService.process_hrms_batch(db, hrms_data, client_id)
        return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error synchronizing HRMS data: {str(e)}"
        )

@router.post("/map-field", response_model=Dict[str, Any])
async def map_hrms_field(
    field_mapping: Dict[str, str],
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("hrms", "configure"))
):
    """
    Configure HRMS field mapping.
    
    Args:
        field_mapping: Mapping of HRMS fields to RBAC fields
        db: Database session
        current_user: Current authenticated user with proper permissions
        
    Returns:
        Dict: Result of field mapping configuration
    """
    # In a real implementation, you would store this mapping in the database
    # For now, we'll just return the mapping as confirmation
    return {
        "status": "success",
        "mapping": field_mapping,
        "message": "Field mapping configured successfully"
    }
