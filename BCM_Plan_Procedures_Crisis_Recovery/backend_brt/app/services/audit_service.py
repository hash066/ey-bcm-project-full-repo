"""
Audit Service for logging user activities in the BCM system.
"""
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class AuditService:
    """Service for logging audit activities."""
    
    @staticmethod
    def log_activity(db: Session, module: str, action: str, username: str, details: str = None):
        """Log an audit activity."""
        try:
            # Try to insert into audit_log table
            insert_query = text("""
                INSERT INTO audit_log (id, module, action_type, username, details, created_at)
                VALUES (gen_random_uuid(), :module, :action, :username, :details, :created_at)
            """)
            
            db.execute(insert_query, {
                "module": module,
                "action": action,
                "username": username,
                "details": details,
                "created_at": datetime.utcnow()
            })
            db.commit()
            
            logger.info(f"Audit log created: {module} - {action} by {username}")
            
        except Exception as e:
            logger.error(f"Failed to log audit activity: {str(e)}")
            # Don't raise exception to avoid breaking main functionality
            pass
    
    @staticmethod
    def log_bcm_activity(db: Session, action: str, username: str, details: str = None):
        """Log a BCM-specific activity."""
        AuditService.log_activity(db, "BCM", action, username, details)
    
    @staticmethod
    def log_bia_activity(db: Session, action: str, username: str, details: str = None):
        """Log a BIA-specific activity."""
        AuditService.log_activity(db, "BIA", action, username, details)