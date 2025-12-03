"""
Database configuration for Supabase (primary) with PostgreSQL/SQLite fallback.
Supabase is now the PRIMARY database, with PostgreSQL as fallback.
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
from typing import Optional, Any, Generator

from app.core.config import settings
from app.core.supabase_client import supabase

# Configure logging
logger = logging.getLogger(__name__)

# Create SQLAlchemy engine
# Use the configured URI from settings
SQLALCHEMY_DATABASE_URL = settings.SQLALCHEMY_DATABASE_URI or "sqlite:///./fallback_sqlite_db.db"

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
    Dependency to get DB session with robust retry logic.
    This is a generator function that yields a database session.
    """
    max_retries = 5
    retry_count = 0
    db = None
    
    while retry_count < max_retries:
        try:
            if db is not None:
                try:
                    db.close()  # Close any previous failed connection attempt
                except Exception:
                    pass  # Ignore errors when closing already failed connection
            
            db = SessionLocal()
            # Test the connection with proper text() wrapper
            from sqlalchemy import text
            db.execute(text("SELECT 1"))
            # Connection successful
            yield db
            # After the request is processed, close the session
            break
        except Exception as e:
            retry_count += 1
            # Calculate backoff time with jitter to prevent thundering herd
            backoff = min(30, (2 ** retry_count) + random.uniform(0, 1))
            
            # Log the error with different severity based on retry count
            if retry_count < max_retries:
                logger.warning(
                    f"Database connection error (attempt {retry_count}/{max_retries}): {str(e)}. "
                    f"Retrying in {backoff:.2f} seconds..."
                )
            else:
                logger.error(f"Database connection failed after {max_retries} attempts: {str(e)}")
                logger.error(f"Error details: {traceback.format_exc()}")
            
            time.sleep(backoff)
        finally:
            if db is not None:
                db.close()
    
    # Make sure to close the session if we exit the loop without yielding
    if db is not None:
        try:
            db.close()
        except Exception:
            pass

# Function to get a database session for non-FastAPI contexts
def get_db_session():
    """Get a database session for use outside of FastAPI dependencies."""
    return SessionLocal()

# Unified database dependency that tries Supabase first, then falls back to PostgreSQL
def get_unified_db():
    """
    Unified database dependency that prioritizes Supabase but falls back to PostgreSQL.
    This ensures Supabase is used as primary database with PostgreSQL as fallback.
    """
    # Try Supabase first (primary database)
    if supabase is not None:
        # For Supabase, we don't need to yield a session since it's handled by the client
        # The routers handle Supabase operations directly
        yield None  # Yield None to indicate Supabase is being used
        return

    # Fallback to PostgreSQL/SQLAlchemy
    logger.info("🔄 Supabase not available, using PostgreSQL fallback")
    yield from get_db()

# Context manager for unified database access
@contextmanager
def get_unified_db_context():
    """
    Context manager that provides unified database access.
    Returns Supabase client if available, otherwise PostgreSQL session.
    """
    if supabase is not None:
        # Supabase is available - no context management needed
        yield None
    else:
        # Use PostgreSQL fallback
        with get_db_context() as db:
            yield db
