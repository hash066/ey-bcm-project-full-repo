"""
Script to check the actual structure of the bia_process_info table in the database.
"""
import os
import sys
import logging
from sqlalchemy import create_engine, text

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Add the backend_brt directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), "backend_brt"))

# Import the database configuration
from backend_brt.app.db.postgres import engine

def check_table_structure():
    """Check the structure of the bia_process_info table."""
    try:
        # Create a connection
        with engine.connect() as connection:
            # Query to get table structure
            query = text("""
                SELECT column_name, data_type, character_maximum_length, is_nullable
                FROM information_schema.columns 
                WHERE table_name = 'bia_process_info'
                ORDER BY ordinal_position;
            """)
            
            # Execute query
            result = connection.execute(query)
            
            # Print table structure
            logger.info("BIA Process Info Table Structure:")
            for row in result:
                logger.info(f"Column: {row.column_name}")
                logger.info(f"  Data Type: {row.data_type}")
                logger.info(f"  Max Length: {row.character_maximum_length}")
                logger.info(f"  Nullable: {row.is_nullable}")
                logger.info("---")
            
            # Query to get a sample of the data
            query = text("""
                SELECT *
                FROM bia_process_info
                LIMIT 5;
            """)
            
            # Execute query
            result = connection.execute(query)
            
            # Print sample data
            logger.info("\nSample Data:")
            for row in result:
                logger.info(f"Row: {dict(row)}")

    except Exception as e:
        logger.error(f"Error checking table structure: {str(e)}")
        raise

if __name__ == "__main__":
    check_table_structure()