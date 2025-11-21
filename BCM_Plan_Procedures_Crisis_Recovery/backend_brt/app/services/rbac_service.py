"""
RBAC Service - Provides Role-Based Access Control functionality.
"""
from typing import List, Optional, Union, Dict, Any
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from passlib.context import CryptContext

from app.models.rbac_models import User, Role, Permission, Client, Department, SubDepartment, Process
from app.models.rbac_models import RoleType, user_roles, role_permissions

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class RBACService:
    """Service for handling Role-Based Access Control operations."""
    
    # User Methods
    @staticmethod
    def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        """Get all users with pagination."""
        return db.query(User).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        """Get a user by ID."""
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        """Get a user by username."""
        return db.query(User).filter(User.username == username).first()
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """Get a user by email."""
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def create_user(db: Session, user_data: Dict[str, Any]) -> User:
        """Create a new user."""
        # Check if username or email already exists
        if RBACService.get_user_by_username(db, user_data["username"]):
            raise HTTPException(status_code=400, detail="Username already registered")
        if RBACService.get_user_by_email(db, user_data["email"]):
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash the password
        hashed_password = pwd_context.hash(user_data["password"])
        
        # Create the user
        new_user = User(
            username=user_data["username"],
            email=user_data["email"],
            hashed_password=hashed_password,
            client_id=user_data.get("client_id"),
            is_active=True,
            created_at=datetime.now()
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    
    @staticmethod
    def create_client(db: Session, name: str, description: Optional[str] = None, license_days: int = 365, 
                      sponsor_name: str = None, sponsor_email: str = None, sponsor_phoneno: str = None) -> Client:
        """Create a new client organization (admin only)."""
        now = datetime.now()
        new_client = Client(
            name=name,
            description=description,
            license_start=now,
            license_end=now + timedelta(days=license_days),
            is_active=True,
            sponsor_name=sponsor_name,
            sponsor_email=sponsor_email,
            sponsor_phoneno=sponsor_phoneno
        )
        db.add(new_client)
        db.commit()
        db.refresh(new_client)
        return new_client
    
    @staticmethod
    def update_client(db: Session, client_id: int, client_data: Dict[str, Any]) -> Client:
        """Update an existing client organization."""
        client = db.query(Client).filter(Client.id == client_id).first()
        if not client:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
        
        for key, value in client_data.items():
            if hasattr(client, key):
                setattr(client, key, value)
        
        db.commit()
        db.refresh(client)
        return client
    
    @staticmethod
    def get_clients(db: Session, skip: int = 0, limit: int = 100) -> List[Client]:
        """Get all client organizations."""
        return db.query(Client).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_client(db: Session, client_id: int) -> Optional[Client]:
        """Get a specific client organization."""
        return db.query(Client).filter(Client.id == client_id).first()
    
    @staticmethod
    def assign_role(db: Session, user_id: int, role_id: int, assigned_by: int, 
                   valid_from: datetime = None, valid_until: datetime = None) -> Dict[str, Any]:
        """Assign a role to a user."""
        # Check if user already has this role
        existing = db.query(user_roles).filter(
            user_roles.c.user_id == user_id,
            user_roles.c.role_id == role_id
        ).first()
        
        if existing:
            # Update the existing role assignment
            stmt = user_roles.update().where(
                and_(user_roles.c.user_id == user_id, user_roles.c.role_id == role_id)
            ).values(
                assigned_at=datetime.now(timezone.utc),
                assigned_by=assigned_by,
                is_active=True,
                valid_from=valid_from or datetime.now(timezone.utc),
                valid_until=valid_until
            )
            db.execute(stmt)
        else:
            # Create a new role assignment
            stmt = user_roles.insert().values(
                user_id=user_id,
                role_id=role_id,
                assigned_at=datetime.now(timezone.utc),
                assigned_by=assigned_by,
                is_active=True,
                valid_from=valid_from or datetime.now(timezone.utc),
                valid_until=valid_until
            )
            db.execute(stmt)
        
        db.commit()
        return {
            "user_id": user_id,
            "role_id": role_id,
            "assigned_by": assigned_by,
            "valid_from": valid_from,
            "valid_until": valid_until
        }
    
    @staticmethod
    def revoke_role(db: Session, user_id: int, role_id: int) -> Dict[str, Any]:
        """Revoke a role from a user."""
        stmt = user_roles.update().where(
            and_(user_roles.c.user_id == user_id, user_roles.c.role_id == role_id)
        ).values(
            is_active=False
        )
        result = db.execute(stmt)
        db.commit()
        
        if result.rowcount == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role assignment not found")
        
        return {
            "user_id": user_id,
            "role_id": role_id,
            "is_active": False
        }
    
    @staticmethod
    def get_user_roles(db: Session, user_id: int) -> List[Role]:
        """Get all active roles for a user."""
        current_time = datetime.now(timezone.utc)
        
        # Query for active roles that are currently valid
        return db.query(Role).join(user_roles).filter(
            user_roles.c.user_id == user_id,
            user_roles.c.is_active == True,
            or_(
                user_roles.c.valid_from <= current_time,
                user_roles.c.valid_from is None
            ),
            or_(
                user_roles.c.valid_until >= current_time,
                user_roles.c.valid_until is None
            )
        ).all()
    
    @staticmethod
    def check_permission(db: Session, user_id: int, resource: str, action: str, client_id: Optional[int] = None) -> bool:
        """Check if a user has a specific permission within a client context."""
        current_time = datetime.now(timezone.utc)
        
        # Get the permission IDs that match the resource and action
        permission_ids = db.query(Permission.id).filter(
            Permission.resource == resource,
            Permission.action == action
        ).all()
        permission_ids = [p[0] for p in permission_ids]
        
        if not permission_ids:
            return False
        
        # Base query to check if any of the user's active roles have this permission
        query = db.query(role_permissions).join(
            user_roles, role_permissions.c.role_id == user_roles.c.role_id
        ).filter(
            user_roles.c.user_id == user_id,
            user_roles.c.is_active == True,
            or_(
                user_roles.c.valid_from <= current_time,
                user_roles.c.valid_from.is_(None)
            ),
            or_(
                user_roles.c.valid_until >= current_time,
                user_roles.c.valid_until.is_(None)
            ),
            role_permissions.c.permission_id.in_(permission_ids)
        )
        
        # Add client context filter if provided
        if client_id is not None:
            query = query.join(Role).filter(
                or_(
                    Role.client_id == client_id,
                    Role.client_id is None  # System-wide roles
                )
            )
        
        result = query.first()
        return result is not None
    
    # Department Methods
    @staticmethod
    def create_department(db: Session, client_id: int, department_data: Dict[str, Any]) -> Department:
        """Create a new department within a client organization."""
        # Get user by username if provided
        head_user_id = None
        if head_username := department_data.get("head_username"):
            from app.models.rbac_models import User  # Import here to avoid circular imports
            user = db.query(User).filter(User.username == head_username).first()
            if user:
                head_user_id = user.id
            else:
                raise HTTPException(status_code=404, detail=f"User with username '{head_username}' not found")
                
        new_department = Department(
            name=department_data["name"],
            description=department_data.get("description"),
            client_id=client_id,
            head_user_id=head_user_id
        )
        db.add(new_department)
        db.commit()
        db.refresh(new_department)
        return new_department
    
    # SubDepartment Methods
    @staticmethod
    def create_subdepartment(db: Session, department_id: int, subdept_data: Dict[str, Any]) -> SubDepartment:
        """Create a new subdepartment within a department."""
        # Get user by username if provided
        head_user_id = None
        if head_username := subdept_data.get("head_username"):
            from app.models.rbac_models import User  # Import here to avoid circular imports
            user = db.query(User).filter(User.username == head_username).first()
            if user:
                head_user_id = user.id
            else:
                raise HTTPException(status_code=404, detail=f"User with username '{head_username}' not found")
                
        new_subdept = SubDepartment(
            name=subdept_data["name"],
            description=subdept_data.get("description"),
            department_id=department_id,
            head_user_id=head_user_id
        )
        db.add(new_subdept)
        db.commit()
        db.refresh(new_subdept)
        return new_subdept
    
    # Process Methods
    @staticmethod
    def create_process(db: Session, subdept_id: int, process_data: Dict[str, Any]) -> Process:
        """Create a new process within a subdepartment."""
        new_process = Process(
            name=process_data["name"],
            description=process_data.get("description"),
            subdepartment_id=subdept_id,
            owner_user_id=process_data.get("owner_user_id")
        )
        db.add(new_process)
        db.commit()
        db.refresh(new_process)
        return new_process
    
    # Permission management
    @staticmethod
    def setup_default_permissions(db: Session) -> List[Permission]:
        """Setup default permissions in the system."""
        default_permissions = [
            # Admin permissions
            {"name": "manage_clients", "resource": "client", "action": "manage", 
             "description": "Manage client organizations"},
            {"name": "view_all_clients", "resource": "client", "action": "view_all", 
             "description": "View all client organizations"},
            
            # Client Head permissions
            {"name": "manage_departments", "resource": "department", "action": "manage", 
             "description": "Manage departments within client organization"},
            {"name": "view_all_departments", "resource": "department", "action": "view_all", 
             "description": "View all departments in client organization"},
            
            # Department Head permissions
            {"name": "manage_subdepartments", "resource": "subdepartment", "action": "manage", 
             "description": "Manage subdepartments within department"},
            {"name": "view_all_subdepartments", "resource": "subdepartment", "action": "view_all", 
             "description": "View all subdepartments in department"},
            
            # SubDepartment Head permissions
            {"name": "manage_processes", "resource": "process", "action": "manage", 
             "description": "Manage processes within subdepartment"},
            {"name": "view_all_processes", "resource": "process", "action": "view_all", 
             "description": "View all processes in subdepartment"},
            
            # Process Owner permissions
            {"name": "upload_documents", "resource": "document", "action": "upload", 
             "description": "Upload documents related to process"},
            {"name": "fill_process_form", "resource": "process_form", "action": "fill", 
             "description": "Fill in process-related forms"},
            {"name": "view_process_details", "resource": "process", "action": "view", 
             "description": "View details of assigned processes"}
        ]
        
        permissions = []
        for perm_data in default_permissions:
            # Check if permission already exists
            existing = db.query(Permission).filter(
                Permission.name == perm_data["name"]
            ).first()
            
            if not existing:
                perm = Permission(
                    name=perm_data["name"],
                    description=perm_data["description"],
                    resource=perm_data["resource"],
                    action=perm_data["action"]
                )
                db.add(perm)
                permissions.append(perm)
        
        if permissions:
            db.commit()
            for perm in permissions:
                db.refresh(perm)
        
        # Return all permissions (existing + new)
        return db.query(Permission).all()
    
    @staticmethod
    def setup_default_roles(db: Session) -> List[Role]:
        """Setup default roles in the system."""
        # Get all permissions for assignment
        permissions = db.query(Permission).all()
        perm_dict = {f"{p.resource}:{p.action}": p for p in permissions}
        
        default_roles = [
            {
                "name": "System Admin",
                "type": RoleType.ADMIN,
                "description": "System administrator with full access",
                "permissions": [perm for perm in permissions]  # All permissions
            },
            {
                "name": "Client Head",
                "type": RoleType.CLIENT_HEAD,
                "description": "Head of a client organization",
                "permissions": [
                    perm_dict.get("department:manage"),
                    perm_dict.get("department:view_all"),
                    perm_dict.get("subdepartment:view_all"),
                    perm_dict.get("process:view_all")
                ]
            },
            {
                "name": "Department Head",
                "type": RoleType.DEPARTMENT_HEAD,
                "description": "Head of a department within client",
                "permissions": [
                    perm_dict.get("subdepartment:manage"),
                    perm_dict.get("subdepartment:view_all"),
                    perm_dict.get("process:view_all")
                ]
            },
            {
                "name": "SubDepartment Head",
                "type": RoleType.SUBDEPT_HEAD,
                "description": "Head of a sub-department",
                "permissions": [
                    perm_dict.get("process:manage"),
                    perm_dict.get("process:view_all")
                ]
            },
            {
                "name": "Process Owner",
                "type": RoleType.PROCESS_OWNER,
                "description": "Owner of processes",
                "permissions": [
                    perm_dict.get("document:upload"),
                    perm_dict.get("process_form:fill"),
                    perm_dict.get("process:view")
                ]
            }
        ]
        
        roles = []
        for role_data in default_roles:
            # Check if role already exists
            existing = db.query(Role).filter(
                Role.name == role_data["name"],
                Role.client_id == None  # System-wide roles
            ).first()
            
            if not existing:
                role = Role(
                    name=role_data["name"],
                    type=role_data["type"],
                    description=role_data["description"]
                )
                db.add(role)
                db.flush()  # Get the ID without committing
                
                # Assign permissions to this role
                role_perms = role_data["permissions"]
                if role_perms:
                    for perm in role_perms:
                        if perm:  # Some permissions might be None if not found
                            stmt = role_permissions.insert().values(
                                role_id=role.id,
                                permission_id=perm.id
                            )
                            db.execute(stmt)
                
                roles.append(role)
        
        if roles:
            db.commit()
            for role in roles:
                db.refresh(role)
        
        # Return all roles (existing + new)
        return db.query(Role).filter(Role.client_id == None).all()