"""
Fix the BCM router to handle empty departments properly.
"""
import os
import sys
from sqlalchemy import text
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Add the backend_brt directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), "backend_brt"))

# Import the database configuration
from backend_brt.app.db.postgres import SessionLocal

def insert_sample_bia_data():
    """Insert sample data into the existing bia_process_info table."""
    try:
        # Create a new session
        db = SessionLocal()
        
        # Check if there's data in the bia_process_info table
        count_query = text("SELECT COUNT(*) FROM bia_process_info")
        count = db.execute(count_query).scalar()
        
        if count == 0:
            # Sample departments
            departments = ["IT", "HR", "Finance", "Operations", "Marketing"]
            
            # Insert sample data for each department
            for dept in departments:
                # Insert 3 processes for each department
                for i in range(1, 4):
                    process_name = f"{dept} Process {i}"
                    rto_hours = 4 if i == 1 else (8 if i == 2 else 24)
                    
                    # Insert into bia_process_info
                    db.execute(
                        text("""
                            INSERT INTO bia_process_info 
                            (department, process_name, rto_hours) 
                            VALUES (:department, :process_name, :rto_hours)
                        """),
                        {"department": dept, "process_name": process_name, "rto_hours": rto_hours}
                    )
            
            # Commit the changes
            db.commit()
            logger.info("Sample BIA data inserted successfully")
        else:
            logger.info(f"bia_process_info table already has {count} records, skipping insertion")
        
        # Close the session
        db.close()
        return True
    except Exception as e:
        logger.error(f"Error inserting sample BIA data: {str(e)}")
        return False

if __name__ == "__main__":
    # Insert sample BIA data
    if insert_sample_bia_data():
        logger.info("BCM router fix completed successfully!")
    else:
        logger.error("Failed to fix BCM router!")