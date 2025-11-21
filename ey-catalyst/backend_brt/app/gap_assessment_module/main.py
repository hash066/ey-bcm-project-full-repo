from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
import logging
from datetime import datetime
from pathlib import Path
from ...core.config import settings

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_directories():
    """Create necessary directories on startup."""
    try:
        # Create uploads directory
        uploads_dir = Path("uploads")
        uploads_dir.mkdir(exist_ok=True)
        logger.info(f"Created/verified uploads directory: {uploads_dir.absolute()}")

        # Create data/processed directory
        processed_dir = Path("data/processed")
        processed_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"Created/verified processed data directory: {processed_dir.absolute()}")

    except Exception as e:
        logger.error(f"Failed to create directories: {str(e)}")
        raise

# Create directories on startup
create_directories()

# Initialize FastAPI app
app = FastAPI(
    title="Gap Assessment API",
    version="1.0.0",
    description="API for processing documents and extracting compliance controls",
    debug=settings.debug
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174", "http://localhost:3000"],  # Explicitly allow frontend origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Gap Assessment API is running",
        "version": "1.0.0",
        "environment": settings.environment,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    try:
        # Check if required directories exist
        uploads_exists = Path("uploads").exists()
        processed_exists = Path("data/processed").exists()

        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "directories": {
                "uploads": uploads_exists,
                "data_processed": processed_exists
            },
            "environment": settings.environment
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions."""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "status_code": 500,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

# Include routers
from app.routes.upload import router as upload_router
from app.routes.summary import router as summary_router
from app.routes.controls import router as controls_router
from app.routes.ai import router as ai_router
from app.routes.export import router as export_router

# Import new RBAC and approval routes
from app.routes.auth import router as auth_router
from app.routes.approval import router as approval_router
from app.routes.framework import router as framework_router
from app.routes.training import router as training_router

# Initialize database tables
from app.database import create_tables
create_tables()

# Include route handlers
app.include_router(upload_router, prefix="/api", tags=["upload"])
app.include_router(summary_router, prefix="/api", tags=["summary"])
app.include_router(controls_router, prefix="/api", tags=["controls"])
app.include_router(ai_router, prefix="/api", tags=["ai"])
app.include_router(export_router, prefix="/api", tags=["export"])

# Include new RBAC and approval routes
app.include_router(auth_router, prefix="/api/auth", tags=["authentication"])
app.include_router(approval_router, prefix="/api/approval", tags=["approval"])
app.include_router(framework_router, prefix="/api/framework", tags=["framework"])
app.include_router(training_router, prefix="/api/training", tags=["training"])

if __name__ == "__main__":
    logger.info(f"Starting server in {settings.environment} mode on port {settings.port}")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=settings.is_development(),
        log_level=settings.log_level.lower(),
        factory=False
    )

