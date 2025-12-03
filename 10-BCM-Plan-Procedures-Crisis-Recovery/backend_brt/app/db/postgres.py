"""
Database configuration for both PostgreSQL and SQLite.
"""
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
import os
import time
import logging
import traceback
import random
import socket
from contextlib import contextmanager

from app.core.config import settings

# Configure logging
logger = logging.getLogger(__name__)

# Create SQLAlchemy engine
# Use the configured URI from settings
SQLALCHEMY_DATABASE_URL = settings.SQLALCHEMY_DATABASE_URI

# Configure SQLite for foreign key support if using SQLite
if SQLALCHEMY_DATABASE_URL.startswith('sqlite'):
    # Make sure the SQLite directory exists
    sqlite_path = SQLALCHEMY_DATABASE_URL.replace('sqlite:///', '')
    os.makedirs(os.path.dirname(os.path.abspath(sqlite_path)), exist_ok=True)
    
    # Create engine with special settings for SQLite
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, 
        connect_args={"check_same_thread": False}
    )
    
    # Enable foreign key support in SQLite
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
else:
    # PostgreSQL engine with connection pooling
    # Use QueuePool with reduced pool size to avoid hitting Supabase limits
    try:
        # Set socket timeout to prevent hanging connections
        socket.setdefaulttimeout(60)  # 60 second global socket timeout
        
        engine = create_engine(
            SQLALCHEMY_DATABASE_URL,
            poolclass=QueuePool,
            pool_size=10,          # Minimal pool size
            max_overflow=20,       # Minimal overflow
            pool_timeout=30,      # Pool timeout
            pool_recycle=300,     # Recycle connections after 5 minutes
            pool_pre_ping=True,   # Enable connection health checks
            connect_args={
                "connect_timeout": 60,    # Increased connection timeout
                "keepalives": 1,
                "keepalives_idle": 30,
                "keepalives_interval": 10,
                "keepalives_count": 5,
                "application_name": "brt_backend",
                "options": "-c statement_timeout=60000"  # 60 second statement timeout
            }
        )
        logger.info("PostgreSQL engine created successfully")
    except Exception as e:
        logger.error(f"Error creating PostgreSQL engine: {str(e)}")
        logger.error(traceback.format_exc())
        # If we can't connect to PostgreSQL, fall back to SQLite
        logger.warning("Falling back to SQLite database")
        sqlite_path = "./fallback_sqlite_db.db"
        os.makedirs(os.path.dirname(os.path.abspath(sqlite_path)), exist_ok=True)
        engine = create_engine(
            f"sqlite:///{sqlite_path}",
            connect_args={"check_same_thread": False}
        )
        
        @event.listens_for(engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

# Create session factory with aggressive connection cleanup
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, expire_on_commit=False)

# Base class for models
Base = declarative_base()

# Create a synchronous context manager for database sessions
@contextmanager
def get_db_context():
    """Synchronous context manager for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Dependency for FastAPI to get a database session
def get_db():
    """
    Dependency to get DB session.
    This is a generator function that yields a database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Function to get a database session for non-FastAPI contexts
def get_db_session():
    """Get a database session for use outside of FastAPI dependencies."""
    return SessionLocal()
