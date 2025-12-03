"""
Router for organization activity logs.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from uuid import UUID

from app.db.postgres import get_db
from app.middleware.auth import get_current_user, require_permission
from app.schemas.activity_log import ActivityLog, ActivityLogList
from app.services.activity_log_service import ActivityLogService


router = APIRouter(
    prefix="/organizations",
    tags=["activity-logs"],
)


@router.get(
    "/{organization_id}/activity-logs",
    response_model=ActivityLogList,
    summary="Get organization activity logs",
    description="Get activity logs for an organization. Requires client_head or admin role."
)
async def get_organization_activity_logs(
    organization_id: UUID,
    request: Request,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission(["client_head", "admin"], "read"))
):
    """
    Get activity logs for an organization.
    
    Args:
        organization_id: Organization ID
        request: FastAPI request object
        limit: Maximum number of logs to return (default: 100)
        offset: Number of logs to skip (default: 0)
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        ActivityLogList: List of activity logs
    """
    # Check if user has access to this organization
    if current_user.get("role") != "admin" and str(organization_id) != current_user.get("organization_id"):
        raise HTTPException(status_code=403, detail="You don't have permission to access this organization's logs")
    
    # Get activity logs
    activities = await ActivityLogService.get_organization_activities(
        db=db,
        organization_id=str(organization_id),
        limit=limit,
        offset=offset
    )
    
    # Get total count
    total = db.query(ActivityLogService.OrganizationActivityLog).filter(
        ActivityLogService.OrganizationActivityLog.organization_id == organization_id
    ).count()
    
    return ActivityLogList(
        items=activities,
        total=total,
        limit=limit,
        offset=offset
    )
