"""
Database connection manager with fallback support.
"""
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self):
        self.primary_url = settings.SQLALCHEMY_DATABASE_URI
        self.fallback_url = f"sqlite:///{settings.SQLITE_PATH}"
        self.engine = None
        self.SessionLocal = None
        self._setup_engine()

    def _create_engine(self, url):
        """Create SQLAlchemy engine with proper configuration."""
        if 'sqlite' in url:
            return create_engine(
                url,
                connect_args={"check_same_thread": False}
            )
        else:
            return create_engine(
                url,
                pool_size=getattr(settings, 'POOL_SIZE', 5),
                max_overflow=getattr(settings, 'MAX_OVERFLOW', 10),
                pool_timeout=getattr(settings, 'POOL_TIMEOUT', 30),
                pool_recycle=getattr(settings, 'POOL_RECYCLE', 1800)
            )

    def _test_connection(self, engine):
        """Test database connection."""
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return True
        except Exception as e:
            logger.error(f"Connection test failed: {str(e)}")
            return False

    def _setup_engine(self):
        """Set up the database engine with fallback support."""
        try:
            logger.info("Attempting to connect to primary database...")
            self.engine = self._create_engine(self.primary_url)
            
            if self._test_connection(self.engine):
                logger.info("Successfully connected to primary database")
                self.SessionLocal = sessionmaker(
                    autocommit=False,
                    autoflush=False,
                    bind=self.engine
                )
                return
            
            raise SQLAlchemyError("Failed primary database connection test")
            
        except SQLAlchemyError as e:
            logger.warning(f"Primary database connection failed: {str(e)}")
            logger.info("Falling back to SQLite database")
            
            self.engine = self._create_engine(self.fallback_url)
            if self._test_connection(self.engine):
                logger.info("Successfully connected to fallback database")
                self.SessionLocal = sessionmaker(
                    autocommit=False,
                    autoflush=False,
                    bind=self.engine
                )
            else:
                raise RuntimeError("Both primary and fallback database connections failed")

    def get_engine(self):
        """Get the current database engine."""
        return self.engine

    def get_db(self):
        """Get database session with automatic fallback."""
        if not self.SessionLocal:
            self._setup_engine()
            
        db = self.SessionLocal()
        try:
            yield db
        finally:
            db.close()

    def check_connection(self):
        """Check current database connection status."""
        return {
            'status': 'connected' if self._test_connection(self.engine) else 'disconnected',
            'using_primary': 'postgresql' in str(self.engine.url),
            'database_url': str(self.engine.url).split('@')[1] if '@' in str(self.engine.url) else str(self.engine.url)
        }

# Global instance
db_manager = DatabaseManager()