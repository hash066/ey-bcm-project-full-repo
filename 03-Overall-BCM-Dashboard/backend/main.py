"""
Main application entry point for the Business Resilience Tool API.
This file integrates the unified server functionality with the new RBAC middleware.
"""
import uvicorn
from fastapi import FastAPI
import logging
import time
import random
import traceback
from sqlalchemy.exc import OperationalError

from app.core.app_init import create_application
from app.core.config import settings
from app.core.supabase_client import init_supabase_clients
from app.db.postgres import Base, engine
from app.routers.rbac_router import router as rbac_router
from app.routers.auth_router import router as auth_router, login, admin_login
from app.routers.hrms_router import router as hrms_router
from app.routers.document_storage_router import router as document_storage_router
from app.routers.bia_router import router as bia_router
from app.routers.organization_router import router as organization_router
from app.routers.organization_approvals_router import router as organization_approvals_router
from app.routers.admin_router import router as admin_router
from app.routers.activity_log_router import router as activity_log_router
from app.routers.process_service_mapping import router as process_service_mapping_router
from app.routers.crisis_management_router import router as crisis_management_router
from app.routers.module_request_router import router as module_request_router
from app.routers.password_router import router as password_router
from app.routers.chat_router import router as chat_router
from app.routers.user_role_management import router as user_role_router
from app.gap_assessment_module.gap_integration import gap_router, general_upload_router
# Import the Risk Assessment module router (commented out - module not implemented)
# from app.RiskAssessment import get_router as get_risk_assessment_router

# Include the original unified_server endpoints
# This imports the unified_server as a module and adds its routes to our app
from unified_server import (
    app as unified_app,
    transform_llm_output,
    process_pdf,
    retrieve_pdf,
    send_to_llm,
    list_all_organizations,
    create_organization,
    get_organization,
    get_module_data,
    update_module_data,
    get_process_mapping,
    update_process_mapping,
    process_mapping_from_llm,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Initialize Supabase clients on startup
init_supabase_clients()

# Create FastAPI app using our application factory
app = create_application()

# Include the document storage, BIA, organization, admin, and activity log routers
app.include_router(document_storage_router)
app.include_router(bia_router)
app.include_router(organization_router)
app.include_router(organization_approvals_router)
app.include_router(admin_router)
app.include_router(activity_log_router)
app.include_router(process_service_mapping_router)
app.include_router(crisis_management_router)
app.include_router(module_request_router)
app.include_router(password_router)
app.include_router(chat_router)
app.include_router(user_role_router)
app.include_router(gap_router)
app.include_router(general_upload_router)

# Add simple login routes for development bypass
app.add_route("/login", login, methods=["POST"])
app.add_route("/admin/login", admin_login, methods=["POST"])

# Include the Risk Assessment module router (commented out - module not implemented)
# risk_assessment_router = get_risk_assessment_router()
# app.include_router(risk_assessment_router)

# Add all the routes from unified_server to our app
# Note: We're not adding the app.include_router(rbac_router) since we already have that in create_application()
for route in unified_app.routes:
    if route not in app.routes:
        app.routes.append(route)

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Business Resilience Tool API with RBAC and AD DS integration",
        "docs": "/docs",
        "version": "1.0.0"
    }

def create_database_tables_with_retry():
    """Create database tables with Alembic migrations to handle different database types."""
    import subprocess
    import sys
    import os

    max_retries = 5
    retry_count = 0

    while retry_count < max_retries:
        try:
            # Run alembic upgrade to head
            # Set PYTHONPATH to current directory
            env = os.environ.copy()
            env['PYTHONPATH'] = os.getcwd()

            # Run alembic command
            result = subprocess.run([
                sys.executable, '-m', 'alembic', 'upgrade', 'head'
            ], cwd=os.getcwd(), env=env, capture_output=True, text=True)

            if result.returncode == 0:
                logger.info("Database tables created successfully using Alembic")
                return True
            else:
                logger.error(f"Alembic upgrade failed: {result.stderr}")
                # If alembic fails, fall back to create_all for SQLite
                if settings.USE_SQLITE:
                    logger.info("Falling back to create_all for SQLite")
                    try:
                        # Import models for SQLAlchemy to discover them
                        # from app.models.rbac_models import User, Role, Permission, user_roles, role_permissions  # noqa: F401
                        from app.models.global_models import GlobalOrganization, GlobalDepartment, GlobalSubdepartment, GlobalProcess, ModuleRequest, UserPassword  # noqa: F401
                        from app.models.bia_models import BIADepartmentInfo, BIASubdepartmentInfo, BIAProcessInfo, ProcessImpactAnalysis  # noqa: F401
                        from app.models.activity_log_models import OrganizationActivityLog  # noqa: F401
                        # Import Risk Assessment models (commented out - module not implemented)
                        # from app.RiskAssessment.apis.tables import EntRisk, EntThreat, ThreatRisk  # noqa: F401

                        Base.metadata.create_all(bind=engine)
                        logger.info("Database tables created successfully with create_all")
                        return True
                    except Exception as e:
                        logger.error(f"create_all also failed: {e}")
                        raise
                else:
                    raise Exception(f"Alembic failed: {result.stderr}")

        except OperationalError as e:
            retry_count += 1
            backoff = min(60, (2 ** retry_count) + random.uniform(0, 1))

            if "max clients reached" in str(e).lower():
                logger.warning(f"Max clients reached in database pool (attempt {retry_count}/{max_retries}). "
                              f"Retrying in {backoff:.2f} seconds...")
            else:
                logger.warning(f"Database connection error (attempt {retry_count}/{max_retries}): {str(e)}. "
                              f"Retrying in {backoff:.2f} seconds...")

            if retry_count >= max_retries:
                logger.error(f"Failed to create database tables after {max_retries} attempts")
                logger.error(f"Error details: {traceback.format_exc()}")
                return False

            time.sleep(backoff)
        except Exception as e:
            logger.error(f"Unexpected error creating database tables: {e}")
            return False

    return False

# Create database tables if using SQLite or PostgreSQL
if settings.USE_SQLITE:
    print("Using SQLite database, creating tables if they don't exist...")
    create_database_tables_with_retry()
else:
    print("Using PostgreSQL database, ensuring RiskAssessment tables exist...")
    create_database_tables_with_retry()

if __name__ == "__main__":
    print(f"Starting {settings.APP_NAME} API server on port {settings.PORT}...")
    print(f"Visit http://localhost:{settings.PORT}/docs for API documentation")
    print(f"Active Directory integration enabled: {settings.AD_SERVER_URI}")
    print(f"Database: {'SQLite' if settings.USE_SQLITE else 'PostgreSQL'}")
    print("Risk Assessment module integrated")
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
