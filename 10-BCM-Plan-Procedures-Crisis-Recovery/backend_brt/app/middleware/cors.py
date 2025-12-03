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
    print("DEBUG: Setting up CORS middleware")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",  # React default
            "http://127.0.0.1:3000",
            "http://localhost:5173",  # Vite default
            "http://127.0.0.1:5173",
            "http://localhost:5174",  # Vite alternate
            "http://127.0.0.1:5174",
            "http://localhost:8080",  # Webpack default
            "http://127.0.0.1:8080",
        ],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=[
            "Authorization",
            "Content-Type",
            "X-CSRF-Token",
            "X-Requested-With",
            "Accept",
            "Accept-Version",
            "Content-Length",
            "Content-MD5",
            "Date",
            "X-Api-Version",
        ],
        expose_headers=["*"],
        max_age=600,  # Cache preflight requests for 10 minutes
    )
    print("DEBUG: CORS middleware setup complete")
