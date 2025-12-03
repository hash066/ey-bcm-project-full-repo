"""HRMS Integration Service for mapping HRMS data to RBAC structure."""

from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app.services.rbac_service import RBACService
from app.models.rbac_models import User, Role


class HRMSIntegrationService:
    """Service for integrating HRMS data with RBAC structure."""
    
    @staticmethod
    def map_hrms_data_to_user(hrms_data: Dict[str, Any]) -> Dict[str, Any]:
        """Map HRMS data to user attributes."""
        return {
            "username": hrms_data.get("employee_id"),
            "email": hrms_data.get("email"),
            "display_name": f"{hrms_data.get('first_name')} {hrms_data.get('last_name')}",
            "department": hrms_data.get("department"),
            "position": hrms_data.get("position")
        }
    
    @staticmethod
    def determine_roles_from_hrms(hrms_data: Dict[str, Any], client_id: int) -> List[str]:
        """Determine roles based on HRMS position data and client context."""
        position = hrms_data.get("position", "").lower()
        department = hrms_data.get("department", "").lower()
        
        roles = []
        
        # Map positions to roles
        if "head" in position and "client" in position:
            roles.append("Client Head")
        elif "head" in position and "department" in position:
            roles.append("Department Head")
        elif "head" in position and "subdepartment" in position:
            roles.append("SubDepartment Head")
        elif "owner" in position and "process" in position:
            roles.append("Process Owner")
        else:
            roles.append("Employee")  # Default role
        
        # Add department-specific roles
        if "hr" in department:
            roles.append("HR Staff")
        elif "finance" in department:
            roles.append("Finance Staff")
        elif "it" in department:
            roles.append("IT Staff")
        
        return roles
    
    @staticmethod
    def sync_hrms_user_to_rbac(db: Session, hrms_data: Dict[str, Any], client_id: int) -> User:
        """Synchronize HRMS user data with RBAC system."""
        # Map HRMS data to user attributes
        user_data = HRMSIntegrationService.map_hrms_data_to_user(hrms_data)
        
        # Check if user exists
        user = db.query(User).filter(User.username == user_data["username"]).first()
        
        if user:
            # Update existing user
            user.email = user_data["email"] or user.email
            db.commit()
            db.refresh(user)
        else:
            # Create new user
            user = User(
                username=user_data["username"],
                email=user_data["email"] or f"{user_data['username']}@example.com",
                hashed_password="HRMS_INTEGRATED"  # Placeholder, as auth is done via AD
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Determine roles based on HRMS data
        role_names = HRMSIntegrationService.determine_roles_from_hrms(hrms_data, client_id)
        
        # Get role objects
        roles = db.query(Role).filter(Role.name.in_(role_names)).all()
        
        # Assign roles to user
        for role in roles:
            RBACService.assign_role(
                db=db,
                user_id=user.id,
                role_id=role.id,
                assigned_by=1  # System user ID
            )
        
        return user
    
    @staticmethod
    def process_hrms_batch(db: Session, hrms_batch_data: List[Dict[str, Any]], client_id: int) -> List[Dict[str, Any]]:
        """Process a batch of HRMS data for multiple users."""
        results = []
        
        for hrms_data in hrms_batch_data:
            try:
                user = HRMSIntegrationService.sync_hrms_user_to_rbac(db, hrms_data, client_id)
                results.append({
                    "status": "success",
                    "username": user.username,
                    "user_id": user.id
                })
            except Exception as e:
                results.append({
                    "status": "error",
                    "username": hrms_data.get("employee_id"),
                    "error": str(e)
                })

        return results