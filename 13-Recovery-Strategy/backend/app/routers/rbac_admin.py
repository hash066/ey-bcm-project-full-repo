"""
RBAC Admin API Router
Comprehensive API for managing roles, permissions, and user access control.
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, validator
import logging

from app.db.postgres import get_db
from app.services.rbac_service import RoleService, PermissionService, AuditService
from app.services.rbac_service import get_role_service, get_permission_service, get_audit_service
from app.models.role import Role, Permission, UserRole, AuditLog
from app.models import User
from app.middleware.rbac_middleware import require_admin_access, require_role_management

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/admin/rbac",
    tags=["RBAC Administration"],
    dependencies=[Depends(require_admin_access)]
)


# Pydantic models for API requests/responses
class RoleCreateRequest(BaseModel):
    """Request model for creating a new role."""
    name: str = Field(..., min_length=1, max_length=50, description="Unique role name")
    display_name: str = Field(..., min_length=1, max_length=100, description="Human-readable name")
    description: Optional[str] = Field(None, description="Optional role description")
    hierarchy_level: int = Field(..., ge=1, le=6, description="Hierarchy level (1-6)")

    @validator('name')
    def validate_name(cls, v):
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Role name must contain only letters, numbers, underscores, and hyphens')
        return v.lower().replace(' ', '_')


class RoleUpdateRequest(BaseModel):
    """Request model for updating a role."""
    display_name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None)
    hierarchy_level: Optional[int] = Field(None, ge=1, le=6)


class PermissionCreateRequest(BaseModel):
    """Request model for creating a new permission."""
    name: str = Field(..., min_length=1, max_length=100, description="Unique permission name (resource.action)")
    resource: str = Field(..., min_length=1, max_length=100, description="Resource name")
    action: str = Field(..., min_length=1, max_length=50, description="Action name")
    description: Optional[str] = Field(None, description="Optional permission description")

    @validator('name')
    def validate_permission_name(cls, v):
        if '.' not in v:
            raise ValueError('Permission name must be in format "resource.action"')
        resource, action = v.split('.', 1)
        if not resource or not action:
            raise ValueError('Both resource and action must be non-empty')
        return v.lower().replace(' ', '_')


class UserRoleAssignmentRequest(BaseModel):
    """Request model for assigning a role to a user."""
    user_id: int = Field(..., gt=0, description="User ID to assign role to")
    role_id: int = Field(..., gt=0, description="Role ID to assign")


class PermissionAssignmentRequest(BaseModel):
    """Request model for assigning permissions to a role."""
    role_id: int = Field(..., gt=0, description="Role ID")
    permission_ids: List[int] = Field(..., min_items=1, description="List of permission IDs to assign")


class RoleResponse(BaseModel):
    """Response model for role data."""
    id: int
    name: str
    display_name: str
    description: Optional[str]
    hierarchy_level: int
    is_system_role: bool
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class PermissionResponse(BaseModel):
    """Response model for permission data."""
    id: int
    name: str
    resource: str
    action: str
    description: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


class UserRoleResponse(BaseModel):
    """Response model for user-role assignment data."""
    id: int
    user_id: int
    role_id: int
    assigned_by: Optional[int]
    assigned_at: str
    is_active: bool

    class Config:
        from_attributes = True


class AuditLogResponse(BaseModel):
    """Response model for audit log data."""
    id: int
    user_id: Optional[int]
    action: str
    resource_type: str
    resource_id: Optional[int]
    old_values: Optional[str]
    new_values: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


# Role Management Endpoints
@router.post("/roles/", response_model=RoleResponse, summary="Create a new role")
async def create_role(
    role_data: RoleCreateRequest,
    current_user: User = Depends(require_role_management),
    role_service: RoleService = Depends(get_role_service),
    audit_service: AuditService = Depends(get_audit_service)
):
    """
    Create a new role in the system.

    Requires role management permissions.
    """
    try:
        role = role_service.create_role(
            name=role_data.name,
            display_name=role_data.display_name,
            hierarchy_level=role_data.hierarchy_level,
            description=role_data.description,
            created_by=current_user
        )

        # Log the creation
        await audit_service.log_action(
            user=current_user,
            action="role_created",
            resource_type="role",
            resource_id=role.id,
            new_values=f"Created role {role.name} with level {role.hierarchy_level}"
        )

        return RoleResponse.from_orm(role)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating role: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create role"
        )


@router.get("/roles/", response_model=List[RoleResponse], summary="List all roles")
async def list_roles(
    skip: int = Query(0, ge=0, description="Number of roles to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of roles to return"),
    role_service: RoleService = Depends(get_role_service)
):
    """Get a paginated list of all roles in the system."""
    roles = role_service.get_all_roles()
    return [RoleResponse.from_orm(role) for role in roles[skip:skip + limit]]


@router.get("/roles/{role_id}", response_model=RoleResponse, summary="Get role details")
async def get_role(
    role_id: int = Path(..., gt=0, description="Role ID"),
    role_service: RoleService = Depends(get_role_service)
):
    """Get detailed information about a specific role."""
    role = role_service.db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    return RoleResponse.from_orm(role)


@router.put("/roles/{role_id}", response_model=RoleResponse, summary="Update a role")
async def update_role(
    role_data: RoleUpdateRequest,
    role_id: int = Path(..., gt=0, description="Role ID"),
    current_user: User = Depends(require_role_management),
    role_service: RoleService = Depends(get_role_service),
    audit_service: AuditService = Depends(get_audit_service)
):
    """Update an existing role's information."""
    role = role_service.db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )

    if role.is_system_role and current_user.role != "system_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot modify system roles"
        )

    # Track changes for audit
    old_values = {
        "display_name": role.display_name,
        "description": role.description,
        "hierarchy_level": role.hierarchy_level
    }

    # Update fields
    update_data = role_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(role, field, value)

    role_service.db.commit()
    role_service.db.refresh(role)

    # Log the update
    await audit_service.log_action(
        user=current_user,
        action="role_updated",
        resource_type="role",
        resource_id=role.id,
        old_values=str(old_values),
        new_values=str(update_data)
    )

    return RoleResponse.from_orm(role)


@router.delete("/roles/{role_id}", summary="Delete a role")
async def delete_role(
    role_id: int = Path(..., gt=0, description="Role ID"),
    current_user: User = Depends(require_admin_access),
    role_service: RoleService = Depends(get_role_service),
    audit_service: AuditService = Depends(get_audit_service)
):
    """Delete a role from the system. Only system admins can delete roles."""
    role = role_service.db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )

    if role.is_system_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete system roles"
        )

    # Check if role is assigned to any users
    active_assignments = role_service.db.query(UserRole).filter(
        UserRole.role_id == role_id,
        UserRole.is_active == True
    ).count()

    if active_assignments > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete role that is assigned to {active_assignments} users"
        )

    role_name = role.name
    role_service.db.delete(role)
    role_service.db.commit()

    # Log the deletion
    await audit_service.log_action(
        user=current_user,
        action="role_deleted",
        resource_type="role",
        resource_id=role_id,
        old_values=f"Deleted role {role_name}"
    )

    return {"message": "Role deleted successfully"}


# Permission Management Endpoints
@router.post("/permissions/", response_model=PermissionResponse, summary="Create a new permission")
async def create_permission(
    permission_data: PermissionCreateRequest,
    current_user: User = Depends(require_admin_access),
    db: Session = Depends(get_db),
    audit_service: AuditService = Depends(get_audit_service)
):
    """Create a new permission in the system."""
    try:
        # Check if permission already exists
        existing = db.query(Permission).filter(Permission.name == permission_data.name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Permission '{permission_data.name}' already exists"
            )

        permission = Permission(
            name=permission_data.name,
            resource=permission_data.resource,
            action=permission_data.action,
            description=permission_data.description
        )

        db.add(permission)
        db.commit()
        db.refresh(permission)

        # Log the creation
        await audit_service.log_action(
            user=current_user,
            action="permission_created",
            resource_type="permission",
            resource_id=permission.id,
            new_values=f"Created permission {permission.name}"
        )

        return PermissionResponse.from_orm(permission)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating permission: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create permission"
        )


@router.get("/permissions/", response_model=List[PermissionResponse], summary="List all permissions")
async def list_permissions(
    resource: Optional[str] = Query(None, description="Filter by resource"),
    skip: int = Query(0, ge=0, description="Number of permissions to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of permissions to return"),
    db: Session = Depends(get_db)
):
    """Get a paginated list of all permissions, optionally filtered by resource."""
    query = db.query(Permission)
    if resource:
        query = query.filter(Permission.resource == resource)

    permissions = query.offset(skip).limit(limit).all()
    return [PermissionResponse.from_orm(perm) for perm in permissions]


@router.get("/permissions/{permission_id}", response_model=PermissionResponse, summary="Get permission details")
async def get_permission(
    permission_id: int = Path(..., gt=0, description="Permission ID"),
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific permission."""
    permission = db.query(Permission).filter(Permission.id == permission_id).first()
    if not permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permission not found"
        )
    return PermissionResponse.from_orm(permission)


# Role-Permission Assignment Endpoints
@router.post("/roles/{role_id}/permissions", summary="Assign permissions to a role")
async def assign_permissions_to_role(
    assignment_data: PermissionAssignmentRequest,
    role_id: int = Path(..., gt=0, description="Role ID"),
    current_user: User = Depends(require_role_management),
    db: Session = Depends(get_db),
    audit_service: AuditService = Depends(get_audit_service)
):
    """Assign multiple permissions to a role."""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )

    permissions = db.query(Permission).filter(Permission.id.in_(assignment_data.permission_ids)).all()
    if len(permissions) != len(assignment_data.permission_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more permission IDs are invalid"
        )

    assigned_permissions = []
    for permission in permissions:
        # Check if assignment already exists
        existing = db.query(RolePermission).filter(
            RolePermission.role_id == role_id,
            RolePermission.permission_id == permission.id
        ).first()

        if not existing:
            role_permission = RolePermission(
                role_id=role_id,
                permission_id=permission.id,
                granted_by=current_user.id if current_user else None
            )
            db.add(role_permission)
            assigned_permissions.append(permission.name)

    db.commit()

    if assigned_permissions:
        # Log the assignments
        await audit_service.log_action(
            user=current_user,
            action="permissions_assigned",
            resource_type="role",
            resource_id=role_id,
            new_values=f"Assigned permissions to role {role.name}: {', '.join(assigned_permissions)}"
        )

    return {
        "message": f"Successfully assigned {len(assigned_permissions)} permissions to role {role.name}",
        "assigned_permissions": assigned_permissions
    }


@router.delete("/roles/{role_id}/permissions/{permission_id}", summary="Revoke permission from role")
async def revoke_permission_from_role(
    role_id: int = Path(..., gt=0, description="Role ID"),
    permission_id: int = Path(..., gt=0, description="Permission ID"),
    current_user: User = Depends(require_role_management),
    db: Session = Depends(get_db),
    audit_service: AuditService = Depends(get_audit_service)
):
    """Revoke a specific permission from a role."""
    role_permission = db.query(RolePermission).filter(
        RolePermission.role_id == role_id,
        RolePermission.permission_id == permission_id
    ).first()

    if not role_permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permission assignment not found"
        )

    permission_name = role_permission.permission.name if role_permission.permission else "unknown"
    role_name = role_permission.role.name if role_permission.role else "unknown"

    db.delete(role_permission)
    db.commit()

    # Log the revocation
    await audit_service.log_action(
        user=current_user,
        action="permission_revoked",
        resource_type="role",
        resource_id=role_id,
        old_values=f"Revoked permission {permission_name} from role {role_name}"
    )

    return {"message": "Permission revoked successfully"}


@router.get("/roles/{role_id}/permissions", response_model=List[PermissionResponse], summary="Get role permissions")
async def get_role_permissions(
    role_id: int = Path(..., gt=0, description="Role ID"),
    db: Session = Depends(get_db)
):
    """Get all permissions assigned to a specific role."""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )

    permissions = [rp.permission for rp in role.role_permissions if rp.permission]
    return [PermissionResponse.from_orm(perm) for perm in permissions]


# User-Role Assignment Endpoints
@router.post("/users/roles", response_model=UserRoleResponse, summary="Assign role to user")
async def assign_role_to_user(
    assignment_data: UserRoleAssignmentRequest,
    current_user: User = Depends(require_role_management),
    role_service: RoleService = Depends(get_role_service),
    audit_service: AuditService = Depends(get_audit_service)
):
    """Assign a role to a user."""
    try:
        # Get the user and role objects
        user = role_service.db.query(User).filter(User.id == assignment_data.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        role = role_service.db.query(Role).filter(Role.id == assignment_data.role_id).first()
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found"
            )

        user_role = role_service.assign_role(user, role, current_user)
        return UserRoleResponse.from_orm(user_role)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/users/{user_id}/roles/{role_id}", summary="Revoke role from user")
async def revoke_role_from_user(
    user_id: int = Path(..., gt=0, description="User ID"),
    role_id: int = Path(..., gt=0, description="Role ID"),
    current_user: User = Depends(require_role_management),
    role_service: RoleService = Depends(get_role_service),
    audit_service: AuditService = Depends(get_audit_service)
):
    """Revoke a role from a user."""
    user = role_service.db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    role = role_service.db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )

    success = role_service.revoke_role(user, role, current_user)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role assignment not found"
        )

    return {"message": "Role revoked successfully"}


@router.get("/users/{user_id}/roles", response_model=List[UserRoleResponse], summary="Get user roles")
async def get_user_roles(
    user_id: int = Path(..., gt=0, description="User ID"),
    active_only: bool = Query(True, description="Return only active role assignments"),
    db: Session = Depends(get_db)
):
    """Get all role assignments for a specific user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    query = db.query(UserRole).filter(UserRole.user_id == user_id)
    if active_only:
        query = query.filter(UserRole.is_active == True)

    user_roles = query.all()
    return [UserRoleResponse.from_orm(ur) for ur in user_roles]


# Audit Log Endpoints
@router.get("/audit/", response_model=List[AuditLogResponse], summary="Get audit logs")
async def get_audit_logs(
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    action: Optional[str] = Query(None, description="Filter by action"),
    resource_type: Optional[str] = Query(None, description="Filter by resource type"),
    skip: int = Query(0, ge=0, description="Number of logs to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of logs to return"),
    audit_service: AuditService = Depends(get_audit_service)
):
    """Get audit logs with optional filtering."""
    logs = audit_service.get_audit_logs(
        user_id=user_id,
        resource_type=resource_type,
        action=action,
        limit=limit
    )

    # Apply skip after getting results
    paginated_logs = logs[skip:skip + limit]
    return [AuditLogResponse.from_orm(log) for log in paginated_logs]


@router.get("/audit/stats", summary="Get audit statistics")
async def get_audit_stats(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    audit_service: AuditService = Depends(get_audit_service)
):
    """Get audit statistics for security monitoring."""
    # This would typically involve more complex queries
    # For now, return basic stats
    logs = audit_service.get_audit_logs(limit=1000)

    stats = {
        "total_logs": len(logs),
        "unique_users": len(set(log.user_id for log in logs if log.user_id)),
        "actions_breakdown": {},
        "recent_activity": []
    }

    # Count actions
    for log in logs[:100]:  # Last 100 actions
        action = log.action
        stats["actions_breakdown"][action] = stats["actions_breakdown"].get(action, 0) + 1

        # Add to recent activity
        stats["recent_activity"].append({
            "id": log.id,
            "action": log.action,
            "user_id": log.user_id,
            "timestamp": log.created_at.isoformat() if log.created_at else None
        })

    return stats


# System Health Check
@router.get("/health", summary="RBAC system health check")
async def rbac_health_check(
    db: Session = Depends(get_db),
    permission_service: PermissionService = Depends(get_permission_service)
):
    """Check the health of the RBAC system."""
    health_status = {
        "database": "healthy",
        "permissions": "healthy",
        "roles_count": 0,
        "permissions_count": 0,
        "active_assignments": 0
    }

    try:
        # Check database connectivity
        db.execute("SELECT 1")

        # Count entities
        health_status["roles_count"] = db.query(Role).count()
        health_status["permissions_count"] = db.query(Permission).count()
        health_status["active_assignments"] = db.query(UserRole).filter(UserRole.is_active == True).count()

    except Exception as e:
        health_status["database"] = f"unhealthy: {str(e)}"

    return health_status
