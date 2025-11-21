import os
from typing import Any, List, Optional
from pydantic import validator
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Business Resilience Tool"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database
    # For development, use SQLite by default
    USE_SQLITE: bool = os.getenv("USE_SQLITE", "True").lower() == "true"
    SQLALCHEMY_DATABASE_URI: Optional[str] = os.getenv("SQLALCHEMY_DATABASE_URI")
    DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL")  # NEW: For Alembic
    
    # SQLite path
    SQLITE_PATH: str = os.getenv("SQLITE_PATH", "./sqlite_db.db")
    
    # Individual PostgreSQL connection parameters (used if SQLALCHEMY_DATABASE_URI is not provided)
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "password")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "business_resilience")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")

    # Redis Cache Configuration
    REDIS_URL: str = os.getenv("REDIS_URL", "")
    REDIS_SSL: bool = os.getenv("REDIS_SSL", "True").lower() == "true"
    CACHE_TTL: int = int(os.getenv("CACHE_TTL", "300"))  # Default: 5 minutes

    # Database Pool Configuration
    POOL_SIZE: int = int(os.getenv("POOL_SIZE", "5"))
    MAX_OVERFLOW: int = int(os.getenv("MAX_OVERFLOW", "10"))
    POOL_TIMEOUT: int = int(os.getenv("POOL_TIMEOUT", "30"))
    POOL_RECYCLE: int = int(os.getenv("POOL_RECYCLE", "1800"))

    @validator("SQLALCHEMY_DATABASE_URI", pre=True)
    def assemble_database_connection(cls, v: Optional[str], values) -> Any:
        if isinstance(v, str) and v:
            return v
        
        # Use SQLite for development
        if values.get('USE_SQLITE'):
            sqlite_path = values.get('SQLITE_PATH')
            return f"sqlite:///{sqlite_path}"
            
        # Fall back to PostgreSQL
        port = values.get('POSTGRES_PORT')
        # Ensure port is a valid integer
        if port and port.lower() != 'none':
            port_str = f":{port}"
        else:
            port_str = ""
            
        return f"postgresql://{values.get('POSTGRES_USER')}:{values.get('POSTGRES_PASSWORD')}@{values.get('POSTGRES_SERVER')}{port_str}/{values.get('POSTGRES_DB') or ''}"
    
    @validator("DATABASE_URL", pre=True)
    def set_database_url(cls, v: Optional[str], values) -> Optional[str]:
        """Set DATABASE_URL for Alembic migrations"""
        if v:
            return v
        # Use SQLALCHEMY_DATABASE_URI if DATABASE_URL not set
        sqlalchemy_uri = values.get('SQLALCHEMY_DATABASE_URI')
        if sqlalchemy_uri and sqlalchemy_uri.startswith("postgresql://"):
            # Convert to psycopg2 format for Alembic
            return sqlalchemy_uri.replace("postgresql://", "postgresql+psycopg2://", 1)
        return sqlalchemy_uri
    
    # MongoDB
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017/")
    MONGODB_DB: str = os.getenv("MONGODB_DB", "business_resilience")
    
    # Document types
    DOCUMENT_TYPES: List[str] = [
        "SOP",
        "RISK_REGISTER",
        "ROLE_CHART",
        "PROCESS_MANUAL",
        "ARCHITECTURE_DIAGRAM",
        "INCIDENT_LOG",
        "VENDOR_CONTRACT",
        "POLICY",
        "DR_BCP_PLAN",
        "CHAT_HISTORY",
        "EXTERNAL_DOCUMENT"
    ]
    
    # BRT Modules
    BRT_MODULES: List[str] = [
        "process_mapping",
        "risk_assessment",
        "business_impact",
        "recovery_strategy",
        "plan_development",
        "training",
        "testing",
        "maintenance",
        "incident_response"
    ]
    
    # Active Directory settings
    AD_SERVER_URI: str = os.getenv("AD_SERVER_URI", "")
    AD_BASE_DN: str = os.getenv("AD_BASE_DN", "")
    AD_BIND_USER: Optional[str] = os.getenv("AD_BIND_USER")
    AD_BIND_PASSWORD: Optional[str] = os.getenv("AD_BIND_PASSWORD")
    AD_ADMIN_USER: Optional[str] = os.getenv("AD_ADMIN_USER")
    AD_ADMIN_PASSWORD: Optional[str] = os.getenv("AD_ADMIN_PASSWORD")
    AD_DOMAIN: str = os.getenv("AD_DOMAIN", "")
    AD_SERVER_ALT_URI: Optional[str] = os.getenv("AD_SERVER_ALT_URI")
    
    # AD Group to Role mappings
    AD_GROUP_ADMIN: str = os.getenv("AD_GROUP_ADMIN", "Administrators")
    AD_GROUP_USER: str = os.getenv("AD_GROUP_USER", "Users")
    AD_GROUP_READONLY: str = os.getenv("AD_GROUP_READONLY", "ReadOnly")
    
    # Debug mode
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # App name
    APP_NAME: str = os.getenv("PROJECT_NAME", "Business Resilience Tool")
    
    # Admin credentials
    admin_user: Optional[str] = os.getenv("admin_user")
    admin_password: Optional[str] = os.getenv("admin_password")
    
    # LLM API Keys
    GROQ_API_KEY: Optional[str] = os.getenv("GROQ_API_KEY")
    GROK_API_KEY: Optional[str] = os.getenv("GROK_API_KEY")  # NEW: For recovery strategy LLM
    
    # Supabase Storage Configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://your-project-id.supabase.co")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_STORAGE_BUCKET: str = os.getenv("SUPABASE_STORAGE_BUCKET", "crisis-management")
    
    # Password Management
    PASSWORD_MASTER_KEY: str = os.getenv("PASSWORD_MASTER_KEY", "default_master_key_change_in_production")
    
    class Config:
        case_sensitive = True
        env_file = '.env'
        extra = 'allow'  # NEW: Allow extra fields from .env


settings = Settings()
