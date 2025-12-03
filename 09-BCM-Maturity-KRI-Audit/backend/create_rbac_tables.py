"""
Script to create RBAC tables in the database.
"""
from app.db.postgres import Base, engine
import app.schemas.rbac  # Import to ensure models are registered

def create_tables():
    """Create all tables in the database."""
    print("Creating RBAC tables...")
    
    # This will create all tables defined in schemas that import Base
    Base.metadata.create_all(bind=engine)
    
    print("Tables created successfully!")
    
if __name__ == "__main__":
    create_tables()
