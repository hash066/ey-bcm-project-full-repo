from fastapi import FastAPI
from app.routers import (
    procedures_router,
    chat_router,  # Add this import
    # other existing imports
)

def create_app():
    app = FastAPI()

    # Include routers
    app.include_router(procedures_router.router)
    app.include_router(chat_router.router)  # Add this line

    # Other existing configurations

    return app
