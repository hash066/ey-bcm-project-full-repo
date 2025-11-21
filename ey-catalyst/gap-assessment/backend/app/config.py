from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional
import os
from datetime import datetime

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    grok_api_key: str = Field(..., env="GROK_API_KEY", description="Grok API key for AI processing")
    frontend_url: str = Field(default="http://localhost:5174", env="FRONTEND_URL", description="Frontend application URL")
    port: int = Field(default=8000, env="PORT", description="Server port")
    environment: str = Field(default="development", env="ENVIRONMENT", description="Environment mode")
    max_upload_size: int = Field(default=10485760, env="MAX_UPLOAD_SIZE", description="Maximum upload size in bytes")

    # Database settings
    database_url: str = Field(default="sqlite:///./gap_assessment.db", env="DATABASE_URL", description="Database connection URL")
    database_pool_size: int = Field(default=20, env="DATABASE_POOL_SIZE", description="Database connection pool size")
    database_max_overflow: int = Field(default=30, env="DATABASE_MAX_OVERFLOW", description="Database max overflow connections")

    # JWT settings
    jwt_secret_key: str = Field(default="your-secret-key-change-in-production", env="JWT_SECRET_KEY", description="JWT secret key")
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM", description="JWT algorithm")
    jwt_expiration_hours: int = Field(default=24, env="JWT_EXPIRATION_HOURS", description="JWT token expiration in hours")

    # Optional fields with defaults
    debug: bool = Field(default=False, description="Debug mode")
    log_level: str = Field(default="INFO", description="Logging level")

    class Config:
        env_file = "d:/EY/gap-assessment/backend/.env"
        env_file_encoding = "utf-8"
        case_sensitive = False

    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.environment.lower() == "development"

    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.environment.lower() == "production"

# Global settings instance
settings = Settings()
