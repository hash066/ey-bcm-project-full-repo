"""
Middleware for automatically logging organization activities.
"""
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable, Dict, Any, Optional
from sqlalchemy.orm import Session
import json
import asyncio
import logging

from app.db.postgres import get_db_session
from app.middleware.auth import get_current_user_from_request
from app.services.activity_log_service import ActivityLogService

# Configure logging
logger = logging.getLogger(__name__)

class ActivityLogMiddleware(BaseHTTPMiddleware):
    """
    Middleware for automatically logging organization activities.
    """
    
    def __init__(
        self,
        app,
        endpoints_to_log: Dict[str, str] = None,
        exclude_endpoints: list = None
    ):
        """
        Initialize activity log middleware.
        
        Args:
            app: FastAPI application
            endpoints_to_log: Dictionary mapping endpoint paths to action descriptions
            exclude_endpoints: List of endpoint paths to exclude from logging
        """
        super().__init__(app)
        self.endpoints_to_log = endpoints_to_log or {
            # Login is handled directly in the auth_router
            # "/auth/token": "User login",
            "/organizations/{organization_id}/modules": "Update organization modules",
            "/admin/organizations": "Create organization",
            "/admin/organizations/{organization_id}": "Update organization",
            "/admin/organizations/setup": "Setup organization structure",
            "/admin/organizations/setup-from-file": "Setup organization structure from file"
        }
        self.exclude_endpoints = exclude_endpoints or [
            "/docs",
            "/redoc",
            "/openapi.json",
            "/auth/token"  # Exclude login endpoint - handled separately in auth_router
        ]
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process request and log activity if needed.
        
        Args:
            request: FastAPI request
            call_next: Next middleware in chain
            
        Returns:
            Response: FastAPI response
        """
        # Skip logging for excluded endpoints
        path = request.url.path
        if any(path.startswith(excluded) for excluded in self.exclude_endpoints):
            return await call_next(request)
        
        # Check if this endpoint should be logged
        should_log = False
        action_info = None
        
        for endpoint_pattern, action in self.endpoints_to_log.items():
            # Handle path parameters by checking if the pattern matches the path
            if self._match_endpoint_pattern(path, endpoint_pattern):
                should_log = True
                action_info = action
                break
        
        # If not an endpoint to log, just continue the request
        if not should_log:
            return await call_next(request)
        
        # Process the request
        response = await call_next(request)
        
        # Only log successful requests (2xx status codes)
        if 200 <= response.status_code < 300 and should_log:
            # Use a background task for logging to avoid blocking the response
            # and prevent contextlib errors by not using the get_db dependency
            asyncio.create_task(
                self._log_activity_async(request, path, action_info)
            )
        
        return response
    
    async def _log_activity_async(self, request: Request, path: str, action_info: str):
        """
        Log activity asynchronously to avoid blocking the response.
        
        Args:
            request: FastAPI request
            path: Request path
            action_info: Action description
        """
        try:
            # Create a new session directly instead of using the generator
            db = get_db_session()
            
            try:
                # Extract user information from token
                try:
                    user = await get_current_user_from_request(request)
                    username = user.get("sub")
                    organization_id = user.get("organization_id")
                    
                    # Only log if we have an organization ID
                    if organization_id:
                        # Extract path parameters
                        path_params = {}
                        for name, value in request.path_params.items():
                            path_params[name] = str(value)
                        
                        # Get department and subdepartment from token
                        department = None
                        subdepartment = None
                        if user.get("department"):
                            department = user.get("department")
                        if user.get("subdepartment"):
                            subdepartment = user.get("subdepartment")
                        
                        # Log activity directly without creating a task
                        await ActivityLogService.log_activity(
                            db=db,
                            request=request,
                            organization_id=organization_id,
                            username=username,
                            department=department,
                            subdepartment=subdepartment,
                            action_info=f"{action_info} - {request.method} {path}",
                            endpoint=f"{request.method} {path}"
                        )
                except Exception as e:
                    # For login endpoint, we might not have a token yet, so check path parameters
                    if path == "/auth/token" and request.method == "POST":
                        try:
                            # For login, we'll log after successful authentication in the endpoint itself
                            pass
                        except Exception as login_err:
                            logger.error(f"Error logging login activity: {str(login_err)}")
                    else:
                        logger.error(f"Error extracting user from request: {str(e)}")
            finally:
                # Always close the session
                db.close()
        except Exception as e:
            logger.error(f"Error logging activity: {str(e)}")
    
    def _match_endpoint_pattern(self, path: str, pattern: str) -> bool:
        """
        Check if a path matches an endpoint pattern.
        
        Args:
            path: Request path
            pattern: Endpoint pattern with path parameters
            
        Returns:
            bool: True if path matches pattern, False otherwise
        """
        # Split path and pattern into segments
        path_segments = path.strip("/").split("/")
        pattern_segments = pattern.strip("/").split("/")
        
        # If different number of segments, not a match
        if len(path_segments) != len(pattern_segments):
            return False
        
        # Check each segment
        for path_seg, pattern_seg in zip(path_segments, pattern_segments):
            # If pattern segment is a path parameter (enclosed in {}), it matches anything
            if pattern_seg.startswith("{") and pattern_seg.endswith("}"):
                continue
            # Otherwise, segments must match exactly
            elif path_seg != pattern_seg:
                return False
        
        return True
