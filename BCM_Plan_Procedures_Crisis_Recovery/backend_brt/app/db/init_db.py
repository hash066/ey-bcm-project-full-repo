"""
Database initialization script for crisis management module.
"""
from sqlalchemy import create_engine
from app.core.config import settings
from app.db.postgres import Base
from app.models.crisis_management_models import CrisisTemplate, CrisisPlan, CrisisPlanSection, CrisisCommunicationPlan
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def drop_tables():
    """
    Drop database tables for crisis management module.
    """
    # Get the database URL from settings
    SQLALCHEMY_DATABASE_URL = settings.SQLALCHEMY_DATABASE_URI

    # Create engine
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

    try:
        # Drop tables
        Base.metadata.drop_all(bind=engine)
        logger.info("Database tables dropped successfully for crisis management module")

    except Exception as e:
        logger.error(f"Error dropping database tables: {str(e)}")
        raise

def create_tables():
    """
    Create database tables for crisis management module if they don't exist.
    """
    # Get the database URL from settings
    SQLALCHEMY_DATABASE_URL = settings.SQLALCHEMY_DATABASE_URI

    # Create engine
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

    try:
        # Create tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully for crisis management module")

        # If using SQLite, we need to add foreign key constraints manually
        if SQLALCHEMY_DATABASE_URL.startswith('sqlite'):
            from sqlalchemy import text

            with engine.connect() as conn:
                # Enable foreign key constraints
                conn.execute(text("PRAGMA foreign_keys = ON"))

                # Create tables for crisis management models
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS crisis_template (
                        id TEXT PRIMARY KEY,
                        organization_id TEXT NOT NULL,
                        name TEXT NOT NULL,
                        file_path TEXT NOT NULL,
                        file_size INTEGER NOT NULL,
                        content_type TEXT NOT NULL,
                        extracted_text TEXT,
                        missing_fields TEXT,
                        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE
                    )
                """))

                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS crisis_plan (
                        id TEXT PRIMARY KEY,
                        template_id TEXT NOT NULL,
                        organization_id TEXT NOT NULL,
                        name TEXT NOT NULL,
                        file_path TEXT,
                        status TEXT NOT NULL DEFAULT 'draft',
                        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (template_id) REFERENCES crisis_template(id) ON DELETE CASCADE,
                        FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE
                    )
                """))

                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS crisis_plan_section (
                        id TEXT PRIMARY KEY,
                        crisis_plan_id TEXT NOT NULL,
                        heading TEXT NOT NULL,
                        content TEXT,
                        order INTEGER NOT NULL,
                        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (crisis_plan_id) REFERENCES crisis_plan(id) ON DELETE CASCADE
                    )
                """))

                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS crisis_communication_plan (
                        id TEXT PRIMARY KEY,
                        crisis_plan_id TEXT NOT NULL,
                        organization_id TEXT NOT NULL,
                        file_path TEXT,
                        media_statement TEXT,
                        faq TEXT,
                        stakeholder_communications TEXT,
                        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (crisis_plan_id) REFERENCES crisis_plan(id) ON DELETE CASCADE,
                        FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE
                    )
                """))

                conn.commit()
                logger.info("SQLite tables created successfully for crisis management module")

    except Exception as e:
        logger.error(f"Error creating database tables: {str(e)}")
        raise

if __name__ == "__main__":
    create_tables()
