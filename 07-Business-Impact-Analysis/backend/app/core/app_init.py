"""
Application initialization and setup.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.core.config import settings
from app.core.supabase_client import init_supabase_clients
from app.middleware.setup import setup_middlewares
from app.routers.rbac_router import router as rbac_router
from app.routers.auth_router import router as auth_router
from app.routers.hrms_router import router as hrms_router
from app.routers.bia_router import router as bia_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

def create_application() -> FastAPI:
    """
    Create and configure the FastAPI application.
    
    Returns:
        FastAPI: Configured application
    """
    # Create FastAPI app
    app = FastAPI(
        title=settings.APP_NAME,
        description="Business Resilience Tool API",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # Add CORS middleware early
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5174",
            "http://localhost:5173",
            "http://127.0.0.1:5174",
            "http://localhost:3000",
            "http://localhost:4000",
            "http://localhost:5000"
        ],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["*"],
    )

    # Set up additional middlewares
    setup_middlewares(app)
    
    # Include routers
    app.include_router(auth_router)
    app.include_router(rbac_router)
    app.include_router(hrms_router)
    app.include_router(bia_router)
    
    # Add startup event
    @app.on_event("startup")
    async def startup_event():
        logger.info(f"Starting {settings.APP_NAME}")
        logger.info(f"Debug mode: {settings.DEBUG}")
        logger.info(f"Active Directory server: {settings.AD_SERVER_URI}")

        # Initialize Supabase clients
        try:
            init_supabase_clients()
        except Exception as e:
            logger.error(f"Failed to initialize Supabase clients: {e}")
            # Continue startup even if Supabase fails - fallback to PostgreSQL
    
    # Add shutdown event
    @app.on_event("shutdown")
    async def shutdown_event():
        logger.info(f"Shutting down {settings.APP_NAME}")
    
    return app
