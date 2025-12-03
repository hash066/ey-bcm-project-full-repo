"""
Middleware setup utilities for FastAPI application.
"""
from fastapi import FastAPI, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable
import time
import logging

# No settings import needed here
from app.middleware.cors import setup_cors
from app.middleware.activity_log_middleware import ActivityLogMiddleware

# Configure logging
logger = logging.getLogger(__name__)

class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging requests and responses."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Log request and response details.
        
        Args:
            request: FastAPI request
            call_next: Next middleware in chain
            
        Returns:
            Response: FastAPI response
        """
        start_time = time.time()
        
        # Log request
        logger.info(f"Request: {request.method} {request.url.path}")
        
        try:
            # Process request
            response = await call_next(request)
            
            # Calculate processing time
            process_time = time.time() - start_time
            
            # Log response
            logger.info(f"Response: {request.method} {request.url.path} - Status: {response.status_code} - Time: {process_time:.4f}s")
            
            return response
        except Exception as e:
            # Calculate processing time even for errors
            process_time = time.time() - start_time
            
            # Log error
            logger.error(f"Error: {request.method} {request.url.path} - Error: {str(e)} - Time: {process_time:.4f}s")
            
            # Re-raise the exception to be handled by FastAPI's exception handlers
            raise

class RequestContextMiddleware(BaseHTTPMiddleware):
    """Middleware for adding context to request."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Add context to request.
        
        Args:
            request: FastAPI request
            call_next: Next middleware in chain
            
        Returns:
            Response: FastAPI response
        """
        # Add request ID
        request.state.request_id = str(time.time())
        
        # Process request
        response = await call_next(request)
        
        return response

def setup_middlewares(app: FastAPI) -> None:
    """
    Set up all middlewares for FastAPI application.

    Args:
        app: FastAPI application
    """
    # Set up CORS FIRST - absolutely essential for frontend communication
    setup_cors(app)

    # TEMPORARILY DISABLE problematic middlewares that interfere with CORS
    # app.add_middleware(ActivityLogMiddleware)
    # app.add_middleware(LoggingMiddleware)
    # app.add_middleware(RequestContextMiddleware)

    logger.info("CORS middleware set up - other middlewares temporarily disabled for demo")
