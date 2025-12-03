"""
Main application module for the FastAPI backend.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from app.routers import bcm_router, crisis_management_router, auth_router
from app.models import global_models, bia_models, recovery_strategy_models
from app.routers.enhanced_procedure_router import router as enhanced_procedures_router
from app.routers.recovery_strategy_router import router as recovery_strategy_router
from app.routers.procedures_router import router as procedures_router
from app.db.postgres import engine, Base

app = FastAPI(title="Business Resilience Tool API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Include routers IN THIS ORDER
app.include_router(auth_router.router)  # Authentication must be first
app.include_router(bcm_router.router)
app.include_router(crisis_management_router.router)
app.include_router(enhanced_procedures_router)
app.include_router(procedures_router)
app.include_router(recovery_strategy_router)

@app.on_event("startup")
def init_db():
    try:
        print(f"DB URL: {engine.url}")
        print(f"DB Backend: {engine.url.get_backend_name()}")
        Base.metadata.create_all(bind=engine)
        print("Database tables ensured (create_all)")
    except Exception:
        pass

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Business Resilience Tool API",
        "status": "running",
        "endpoints": {
            "GET /recovery-strategies/": "Get all recovery strategies",
            "GET /recovery-strategies/test": "Test recovery strategies endpoint",
            "POST /recovery-strategies/generate-missing": "Generate missing strategies"
        }
    }

# Exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

# Mount static files (keep at the bottom)
import os
frontend_dist = "..\\EY-Catalyst-front-end\\dist"
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=f"{frontend_dist}\\assets"), name="assets")

if __name__ == "__main__":
    import uvicorn
    print("="*60)
    print("Starting Business Resilience Tool API")
    print("Docs: http://localhost:8014/docs")
    print("Recovery Strategy Router: MOUNTED")
    print("="*60)
    uvicorn.run(app, host="0.0.0.0", port=8014, reload=True)
