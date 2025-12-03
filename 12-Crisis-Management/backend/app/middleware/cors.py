"""
CORS middleware configuration.
"""
from fastapi.middleware.cors import CORSMiddleware

def setup_cors(app):
    """
    Setup CORS middleware for the FastAPI application.

    Args:
        app: FastAPI application instance
    """
    # Enable demo mode with proper CORS for frontend communication
    demo_mode = True

    if demo_mode:
        # Allow common development ports for localhost
        app.add_middleware(
            CORSMiddleware,
            allow_origins=[
                "http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "http://localhost:4000", "http://localhost:5000",
                "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://127.0.0.1:3000", "http://127.0.0.1:4000", "http://127.0.0.1:5000"
            ],
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            allow_headers=["*"],
            expose_headers=["*"],
        )
