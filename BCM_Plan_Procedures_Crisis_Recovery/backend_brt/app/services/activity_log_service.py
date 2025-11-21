"""
Service for logging organization activities.
"""
from sqlalchemy.orm import Session
from fastapi import Request, HTTPException
from typing import Optional, Dict, Any

from app.models.activity_log_models import OrganizationActivityLog
from app.middleware.auth import get_current_user_from_request


class ActivityLogService:
    """
    Service for logging organization activities.
    """
    
    @staticmethod
    async def log_activity(
        db: Session,
        request: Request,
        organization_id: str,
        action_info: str,
        username: Optional[str] = None,
        department: Optional[str] = None,
        subdepartment: Optional[str] = None,
        endpoint: Optional[str] = None
    ) -> OrganizationActivityLog:
        """
        Log an organization activity.
        
        Args:
            db: Database session
            request: FastAPI request object
            organization_id: Organization ID
            action_info: Description of the action performed
            username: Username of the user who performed the action (optional, will be extracted from token if not provided)
            department: Department name (optional)
            subdepartment: Subdepartment name (optional)
            endpoint: API endpoint that was called (optional, will be extracted from request if not provided)
            
        Returns:
            OrganizationActivityLog: Created activity log entry
        """
        # If username is not provided, extract it from the token
        if not username:
            try:
                # Get user from token
                user = await get_current_user_from_request(request)
                username = user.get("sub")
                
                # If department/subdepartment not provided, try to get from token
                if not department and user.get("department"):
                    department = user.get("department")
                if not subdepartment and user.get("subdepartment"):
                    subdepartment = user.get("subdepartment")
            except HTTPException:
                # If token is invalid or missing, use anonymous
                username = "anonymous"
            except Exception as e:
                # Log error but continue with anonymous user
                print(f"Error extracting user from request: {str(e)}")
                username = "anonymous"
        
        # If endpoint is not provided, extract it from the request
        if not endpoint and request:
            endpoint = f"{request.method} {request.url.path}"
        
        # Create activity log entry
        activity_log = OrganizationActivityLog(
            organization_id=organization_id,
            username=username,
            department=department,
            subdepartment=subdepartment,
            action_info=action_info,
            endpoint=endpoint
        )
        
        # Add to database
        db.add(activity_log)
        db.commit()
        db.refresh(activity_log)
        
        return activity_log
    
    @staticmethod
    async def get_organization_activities(
        db: Session,
        organization_id: str,
        limit: int = 100,
        offset: int = 0
    ) -> list:
        """
        Get activities for an organization.
        
        Args:
            db: Database session
            organization_id: Organization ID
            limit: Maximum number of activities to return
            offset: Number of activities to skip
            
        Returns:
            list: List of activity log entries
        """
        activities = db.query(OrganizationActivityLog).filter(
            OrganizationActivityLog.organization_id == organization_id
        ).order_by(
            OrganizationActivityLog.timestamp.desc()
        ).offset(offset).limit(limit).all()
        
        return activities
