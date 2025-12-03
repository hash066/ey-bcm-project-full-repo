"""
RBAC Router - API endpoints for RBAC operations.
"""
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.postgres import get_db
from app.services.rbac_service import RBACService
from app.models.rbac_models import User, Role, Permission
from app.models.global_models import GlobalOrganization as Client, GlobalDepartment as Department, GlobalSubdepartment as SubDepartment, GlobalProcess as Process
# Import your authentication dependency
# from app.auth.deps import get_current_user

# Pydantic models for request/response
class ClientCreate(BaseModel):
    name: str
    description: Optional[str] = None
    license_days: Optional[int] = 365
    sponsor_name: str
    sponsor_email: str
    sponsor_phoneno: str

class ClientResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    license_start: datetime
    license_end: datetime
    is_active: bool
    created_at: datetime
    updated_at: datetime
    sponsor_name: str
    sponsor_email: str
    sponsor_phoneno: str
    
    class Config:
        from_attributes = True
        
class DepartmentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    head_username: Optional[str] = None
    
class SubdepartmentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    head_username: Optional[str] = None
    
class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    client_id: Optional[int] = None
    
class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool
    client_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Create router
router = APIRouter(prefix="/rbac", tags=["rbac"])

# User endpoints
@router.get("/users/", response_model=List[UserResponse])
async def get_users(
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db)
    # Uncomment when you have auth set up
    # current_user: dict = Depends(require_permission("user", "view_all"))
):
    """Get all users with pagination."""
    users = RBACService.get_users(db, skip=skip, limit=limit)
    return users

@router.post("/users/", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
    # Uncomment when you have auth set up
    # current_user: dict = Depends(require_permission("user", "create"))
):
    """Create a new user."""
    user = RBACService.create_user(db, user_data.dict())
    return user

@router.get("/users/{username}", response_model=UserResponse)
async def get_user_by_username(
    username: str,
    db: Session = Depends(get_db)
    # Uncomment when you have auth set up
    # current_user: dict = Depends(require_permission("user", "view"))
):
    """Get a user by username."""
    user = RBACService.get_user_by_username(db, username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Permission dependency
def require_permission(resource: str, action: str):
    def permission_dependency(
        db: Session = Depends(get_db),
        # Uncomment when you have auth set up
        # current_user = Depends(get_current_user)
    ):
        # For now, just pass - you'll implement this check later
        # if not RBACService.check_permission(db, current_user.id, resource, action):
        #     raise HTTPException(
        #         status_code=status.HTTP_403_FORBIDDEN,
        #         detail=f"Not enough permissions to {action} {resource}"
        #     )
        # return current_user
        pass
    return permission_dependency

# Admin routes for client management

@router.post("/clients/", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
def create_client(
    client_data: ClientCreate,
    db: Session = Depends(get_db),
    # Uncomment when you have auth set up
    # current_user = Depends(require_permission("client", "manage"))
):
    """Create a new client organization (admin only)."""
    return RBACService.create_client(
        db=db,
        name=client_data.name,
        description=client_data.description,
        license_days=client_data.license_days,
        sponsor_name=client_data.sponsor_name,
        sponsor_email=client_data.sponsor_email,
        sponsor_phoneno=client_data.sponsor_phoneno
    )

@router.get("/clients/", response_model=List[ClientResponse])
def get_clients(
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db),
    # Uncomment when you have auth set up
    # current_user = Depends(require_permission("client", "view_all"))
):
    """Get all client organizations (admin only)."""
    return RBACService.get_clients(db, skip=skip, limit=limit)

@router.get("/clients/{client_id}", response_model=ClientResponse)
def get_client(
    client_id: int,
    db: Session = Depends(get_db),
    # Uncomment when you have auth set up
    # current_user = Depends(require_permission("client", "view"))
):
    """Get a specific client organization."""
    client = RBACService.get_client(db, client_id=client_id)
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    return client

# Department endpoints
@router.post("/clients/{client_id}/departments", response_model=dict)
async def create_department(
    client_id: int, 
    department_data: DepartmentCreate,
    db: Session = Depends(get_db)
):
    """Create a new department within a client organization."""
    department = RBACService.create_department(db, client_id, department_data.dict())
    return {"id": department.id, "name": department.name}

@router.get("/clients/{client_id}/departments", response_model=List[dict])
async def get_client_departments(
    client_id: int,
    db: Session = Depends(get_db)
    # Uncomment when you have auth set up
    # current_user: dict = Depends(require_permission("department", "view_all"))
):
    """Get all departments for a specific client."""
    # Check if client exists
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    departments = db.query(Department).filter(Department.client_id == client_id).all()
    return [{
        "id": dept.id,
        "name": dept.name,
        "description": dept.description,
        "client_id": dept.client_id,
        "head_user_id": dept.head_user_id
    } for dept in departments]

@router.get("/departments/headed", response_model=List[dict])
async def get_headed_departments(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission("department", "view"))
):
    """Get departments where the current user is head."""
    departments = db.query(Department).filter(Department.head_user_id == current_user["id"]).all()
    return [{
        "id": dept.id,
        "name": dept.name,
        "description": dept.description,
        "client_id": dept.client_id
    } for dept in departments]

@router.post("/departments/{department_id}/subdepartments", response_model=dict)
async def create_subdepartment(
    department_id: int, 
    subdept_data: SubdepartmentCreate,
    db: Session = Depends(get_db)
    # Uncomment when you have auth set up
    # current_user: dict = Depends(require_permission("subdepartment", "manage"))
):
    """Create a new subdepartment within a department."""
    # Check if department exists
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
        
    subdepartment = RBACService.create_subdepartment(db, department_id, subdept_data.dict())
    return {"id": subdepartment.id, "name": subdepartment.name}

@router.get("/departments/{department_id}/subdepartments", response_model=List[dict])
async def get_department_subdepartments(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission("subdepartment", "view_all"))
):
    """Get all subdepartments in a department."""
    # Check if user is department head or has higher permissions
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
        
    # Check if user is authorized for this department
    is_dept_head = department.head_user_id == current_user["id"]
    has_admin_role = any(role in ["System Admin", "Client Head"] for role in current_user.get("roles", []))
    
    if not (is_dept_head or has_admin_role):
        raise HTTPException(status_code=403, detail="Not authorized to view this department's subdepartments")
    
    subdepartments = db.query(SubDepartment).filter(SubDepartment.department_id == department_id).all()
    return [{
        "id": subdept.id,
        "name": subdept.name,
        "description": subdept.description,
        "department_id": subdept.department_id,
        "head_user_id": subdept.head_user_id
    } for subdept in subdepartments]

# SubDepartment endpoints
@router.get("/subdepartments/headed", response_model=List[dict])
async def get_headed_subdepartments(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission("subdepartment", "view"))
):
    """Get subdepartments where the current user is head."""
    subdepartments = db.query(SubDepartment).filter(SubDepartment.head_user_id == current_user["id"]).all()
    return [{
        "id": subdept.id,
        "name": subdept.name,
        "description": subdept.description,
        "department_id": subdept.department_id
    } for subdept in subdepartments]

@router.get("/subdepartments/{subdept_id}/processes", response_model=List[dict])
async def get_subdepartment_processes(
    subdept_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission("process", "view_all"))
):
    """Get all processes in a subdepartment."""
    # Check if user is subdepartment head or has higher permissions
    subdept = db.query(SubDepartment).filter(SubDepartment.id == subdept_id).first()
    if not subdept:
        raise HTTPException(status_code=404, detail="SubDepartment not found")
        
    # Check if user is authorized for this subdepartment
    is_subdept_head = subdept.head_user_id == current_user["id"]
    
    # Check if user is department head of the parent department
    is_dept_head = False
    if subdept.department_id:
        department = db.query(Department).filter(Department.id == subdept.department_id).first()
        if department and department.head_user_id == current_user["id"]:
            is_dept_head = True
    
    has_admin_role = any(role in ["System Admin", "Client Head", "Department Head"] 
                         for role in current_user.get("roles", []))
    
    if not (is_subdept_head or is_dept_head or has_admin_role):
        raise HTTPException(status_code=403, detail="Not authorized to view this subdepartment's processes")
    
    processes = db.query(Process).filter(Process.subdepartment_id == subdept_id).all()
    return [{
        "id": process.id,
        "name": process.name,
        "description": process.description,
        "subdepartment_id": process.subdepartment_id,
        "owner_user_id": process.owner_user_id
    } for process in processes]

# Process Owner endpoints
@router.get("/processes/owned", response_model=List[dict])
async def get_owned_processes(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission("process", "view"))
):
    """Get processes where the current user is owner."""
    processes = db.query(Process).filter(Process.owner_user_id == current_user["id"]).all()
    return [{
        "id": process.id,
        "name": process.name,
        "description": process.description,
        "subdepartment_id": process.subdepartment_id
    } for process in processes]

# Role endpoints
@router.post("/roles/assign/", status_code=status.HTTP_200_OK)
def assign_role(
    user_id: int, 
    role_id: int, 
    assigned_by: int,
    valid_days: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Assign a role to a user."""
    valid_until = None
    if valid_days:
        valid_until = datetime.now() + timedelta(days=valid_days)
    
    return RBACService.assign_role(
        db=db,
        user_id=user_id,
        role_id=role_id,
        assigned_by=assigned_by,
        valid_until=valid_until
    )

@router.get("/users/{user_id}/roles", status_code=status.HTTP_200_OK)
def get_user_roles(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get all roles assigned to a user."""
    return RBACService.get_user_roles(db, user_id=user_id)

@router.post("/check-permission", status_code=status.HTTP_200_OK)
def check_permission(
    user_id: int, 
    resource: str, 
    action: str,
    db: Session = Depends(get_db)
):
    """Check if a user has permission for an action on a resource."""
    has_permission = RBACService.check_user_permission(
        db=db,
        user_id=user_id,
        resource=resource,
        action=action
    )
    return {"has_permission": has_permission}

# Initialize default RBAC permissions and roles
@router.post("/init", status_code=status.HTTP_201_CREATED)
def initialize_rbac(db: Session = Depends(get_db)):
    """Initialize default permissions and roles."""
    permissions = RBACService.setup_default_permissions(db)
    roles = RBACService.setup_default_roles(db, permissions)
    return {
        "message": "RBAC system initialized",
        "permissions_count": len(permissions),
        "roles_count": len(roles)
    }
