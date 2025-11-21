"""
Script to verify the connection to the Supabase database.
This script will attempt to connect to the database and run a simple query.
"""
import sys
import logging
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
import re

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Import our database connection
from app.db.postgres import engine, SQLALCHEMY_DATABASE_URL

def verify_database_connection():
    """
    Verify the connection to the database by running a simple query.
    """
    # Print the database URL (with password masked)
    masked_url = re.sub(r':[^@:]*@', ':****@', SQLALCHEMY_DATABASE_URL)
    logger.info(f"Connecting to database: {masked_url}")
    
    try:
        # Try to connect and execute a simple query
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            logger.info("✅ Successfully connected to the database!")
            
            # Get database version
            version_result = connection.execute(text("SELECT version()"))
            version = version_result.scalar()
            logger.info(f"Database version: {version}")
            
            # Try to query a table to verify schema access
            try:
                # Try to list tables
                tables_result = connection.execute(text(
                    "SELECT table_name FROM information_schema.tables "
                    "WHERE table_schema = 'public'"
                ))
                tables = [row[0] for row in tables_result]
                logger.info(f"Available tables: {', '.join(tables) if tables else 'No tables found'}")
                
                # If we have tables, try to query one
                if tables:
                    sample_table = tables[0]
                    row_count = connection.execute(text(f"SELECT COUNT(*) FROM {sample_table}")).scalar()
                    logger.info(f"Table '{sample_table}' has {row_count} rows")
            except SQLAlchemyError as e:
                logger.warning(f"Could not query schema information: {e}")
                
        return True
    except SQLAlchemyError as e:
        logger.error(f"❌ Database connection failed: {e}")
        return False

if __name__ == "__main__":
    logger.info("Attempting to connect to the database...")
    success = verify_database_connection()
    sys.exit(0 if success else 1)
