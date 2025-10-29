"""
Create the missing departments table in the database.
"""
import os
import sys
from sqlalchemy import create_engine, text
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Add the backend_brt directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), "backend_brt"))

# Import the database configuration
from backend_brt.app.db.postgres import engine, SessionLocal

# SQL to create the departments table
CREATE_DEPARTMENTS_TABLE = """
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    organization_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

def create_tables():
    """Create the missing tables."""
    try:
        # Create a new session
        db = SessionLocal()
        
        # Create the departments table
        db.execute(text(CREATE_DEPARTMENTS_TABLE))
        db.commit()
        logger.info("Departments table created successfully")
        
        # Close the session
        db.close()
        return True
    except Exception as e:
        logger.error(f"Error creating tables: {str(e)}")
        return False

if __name__ == "__main__":
    # Create the tables
    if create_tables():
        logger.info("Tables created successfully!")
    else:
        logger.error("Failed to create tables!")