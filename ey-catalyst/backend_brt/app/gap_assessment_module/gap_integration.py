"""
Gap Assessment Module Router
Integrates gap assessment routes into the main backend
"""

from fastapi import APIRouter

# Import all routers from the gap assessment module
from .routes.upload import router as upload_router

# AI router - import optionally (may require additional packages like openai)
try:
    from .routes.ai import router as ai_router
except ImportError as e:
    print(f"Warning: Failed to import ai_router: {e}")
    ai_router = None
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, Response
from fastapi.responses import JSONResponse
from starlette.responses import Response as StarletteResponse
import logging

logger = logging.getLogger(__name__)

# Custom CORS-aware response class
class CORSResponse(JSONResponse):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def init_headers(self, headers=None):
        super().init_headers(headers)
        # Set CORS headers
        self.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
        self.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        self.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, X-Requested-With"
        self.headers["Access-Control-Allow-Credentials"] = "true"

# Create a general upload router for /api/upload - this forwards to gap assessment
general_upload_router = APIRouter(prefix="/api")

@general_upload_router.post("/upload")
async def unified_upload(background_tasks: BackgroundTasks, files: list[UploadFile] = File(...)):
    """
    Unified upload endpoint that forwards to gap assessment upload

    This endpoint provides a simple /api/upload path that internally
    uses the gap assessment upload functionality.
    """
    try:
        # Import and call the gap assessment upload endpoint logic
        from .routes.upload import upload_files  # Import the actual upload function

        # Use the gap assessment upload function directly with the same signature
        result = await upload_files(background_tasks, files)
        return result
    except Exception as e:
        logger.error(f"Unified upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# Re-enabling disabled routers
try:
    from .routes.approval import router as approval_router
except Exception as e:
    logger.error(f"Failed to import approval_router: {e}")
    approval_router = None

# from .routes.auth import router as auth_router  # SKIP - using main app auth
try:
    from .routes.controls import router as controls_router
except Exception as e:
    logger.error(f"Failed to import controls_router: {e}")
    controls_router = None

try:
    from .routes.export import router as export_router
except Exception as e:
    logger.error(f"Failed to import export_router: {e}")
    export_router = None

try:
    from .routes.framework import router as framework_router
except Exception as e:
    logger.error(f"Failed to import framework_router: {e}")
    framework_router = None

try:
    from .routes.summary import router as summary_router
except Exception as e:
    logger.error(f"Failed to import summary_router: {e}")
    summary_router = None

try:
    from .routes.training import router as training_router
except Exception as e:
    logger.error(f"Failed to import training_router: {e}")
    training_router = None

# Create main gap assessment router with CORS support
gap_router = APIRouter(prefix="/api/gap-assessment", default_response_class=CORSResponse)

# Add OPTIONS handlers for CORS preflight requests
@gap_router.options("/{path:path}")
async def options_handler():
    response = CORSResponse({"message": "OK"})
    return response

# Debug endpoint to test gap_router
@gap_router.get("/test")
async def test_endpoint():
    return {"message": "Gap assessment API is working", "status": "OK"}

# Include all gap assessment routers with appropriate prefixes (upload handled by general_upload_router)
# gap_router.include_router(upload_router, prefix="/upload", tags=["gap-assessment"])
if ai_router:
    gap_router.include_router(ai_router, prefix="/ai", tags=["gap-assessment"])
else:
    logger.warning("Skipping ai_router - failed to import")

# Re-enabling disabled routers with proper RBAC integration
# Include routers only if they imported successfully
if approval_router:
    gap_router.include_router(approval_router, prefix="/approval", tags=["gap-assessment"])
else:
    logger.warning("Skipping approval_router - failed to import")

# gap_router.include_router(auth_router, prefix="/auth", tags=["gap-assessment"])  # SKIP - using main app auth

if controls_router:
    gap_router.include_router(controls_router, prefix="/controls", tags=["gap-assessment"])
else:
    logger.warning("Skipping controls_router - failed to import")

if export_router:
    gap_router.include_router(export_router, prefix="/export", tags=["gap-assessment"])
else:
    logger.warning("Skipping export_router - failed to import")

if framework_router:
    gap_router.include_router(framework_router, prefix="/framework", tags=["gap-assessment"])
else:
    logger.warning("Skipping framework_router - failed to import")

if summary_router:
    gap_router.include_router(summary_router, prefix="/summary", tags=["gap-assessment"])
else:
    logger.warning("Skipping summary_router - failed to import")

if training_router:
    gap_router.include_router(training_router, prefix="/training", tags=["gap-assessment"])
else:
    logger.warning("Skipping training_router - failed to import")

# Export the main routers
__all__ = ["gap_router", "general_upload_router"]
