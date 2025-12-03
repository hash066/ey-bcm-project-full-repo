"""
Simple User-Role Management API
Allows assigning multiple users to the existing 5 roles.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.db.postgres import get_db
from app.models.unified_rbac import (
    UserRole, UnifiedRBACService, assign_user_role, revoke_user_role,
    get_user_roles, get_users_with_role, user_has_role, user_can_approve
)
from app.gap_assessment_module.models import ROLE_HIERARCHY

router = APIRouter(
    prefix="/api/user-roles",
    tags=["User Role Management"],
    responses={404: {"description": "Not found"}},
)


# Pydantic models
class RoleAssignmentRequest(BaseModel):
    user_id: int
    role_name: str

    class Config:
        schema_extra = {
            "example": {
                "user_id": 1,
                "role_name": "department_head"
            }
        }


class UserRoleResponse(BaseModel):
    id: int
    user_id: int
    role_name: str
    assigned_by: Optional[int]
    is_active: bool
    assigned_at: str

    class Config:
        from_attributes = True


class RoleInfo(BaseModel):
    name: str
    level: int
    description: str


# Routes
@router.post("/assign", response_model=UserRoleResponse)
async def assign_role_to_user(
    assignment: RoleAssignmentRequest,
    db: Session = Depends(get_db)
):
    """Assign a role to a user."""
    try:
        user_role = assign_user_role(
            db=db,
            user_id=assignment.user_id,
            role_name=assignment.role_name
        )
        return UserRoleResponse.from_orm(user_role)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/users/{user_id}/roles/{role_name}")
async def revoke_role_from_user(
    user_id: int,
    role_name: str,
    db: Session = Depends(get_db)
):
    """Revoke a role from a user."""
    success = revoke_user_role(db, user_id, role_name)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role assignment not found"
        )
    return {"message": "Role revoked successfully"}


@router.get("/users/{user_id}/roles", response_model=List[UserRoleResponse])
async def get_user_role_assignments(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get all roles assigned to a user."""
    roles = get_user_roles(db, user_id)
    return [UserRoleResponse.from_orm(role) for role in roles]


@router.get("/roles/{role_name}/users", response_model=List[UserRoleResponse])
async def get_users_with_specific_role(
    role_name: str,
    db: Session = Depends(get_db)
):
    """Get all users who have a specific role."""
    if role_name not in ROLE_HIERARCHY:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role: {role_name}"
        )

    users = get_users_with_role(db, role_name)
    return [UserRoleResponse.from_orm(user) for user in users]


@router.get("/roles")
async def get_available_roles():
    """Get all available roles with their hierarchy levels."""
    roles = []
    for role_name, level in ROLE_HIERARCHY.items():
        description = f"Level {level} role"
        if role_name == "process_owner":
            description = "Can submit and manage process-level requests"
        elif role_name == "department_head":
            description = "Can approve department-level requests"
        elif role_name == "organization_head":
            description = "Can approve organization-level requests"
        elif role_name == "bcm_coordinator":
            description = "Coordinates business continuity management"
        elif role_name == "ey_admin":
            description = "Full system administration access"

        roles.append({
            "name": role_name,
            "level": level,
            "description": description
        })

    return {"roles": roles}


@router.get("/check/{user_id}/{role_name}")
async def check_user_role(
    user_id: int,
    role_name: str,
    db: Session = Depends(get_db)
):
    """Check if a user has a specific role."""
    has_role = user_has_role(db, user_id, role_name)
    return {"user_id": user_id, "role_name": role_name, "has_role": has_role}


@router.get("/can-approve/{user_id}/{target_role}")
async def check_approval_permission(
    user_id: int,
    target_role: str,
    db: Session = Depends(get_db)
):
    """Check if a user can approve requests for a target role."""
    if target_role not in ROLE_HIERARCHY:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid target role: {target_role}"
        )

    can_approve = user_can_approve(db, user_id, target_role)
    return {
        "user_id": user_id,
        "target_role": target_role,
        "can_approve": can_approve
    }


@router.get("/hierarchy")
async def get_role_hierarchy():
    """Get the complete role hierarchy."""
    return {
        "hierarchy": ROLE_HIERARCHY,
        "levels": {
            1: ["process_owner"],
            2: ["department_head"],
            3: ["organization_head", "bcm_coordinator"],
            4: ["ey_admin"]
        }
    }


# Bulk operations
@router.post("/bulk-assign")
async def bulk_assign_roles(
    assignments: List[RoleAssignmentRequest],
    db: Session = Depends(get_db)
):
    """Bulk assign roles to multiple users."""
    results = []
    for assignment in assignments:
        try:
            user_role = assign_user_role(
                db=db,
                user_id=assignment.user_id,
                role_name=assignment.role_name
            )
            results.append({
                "user_id": assignment.user_id,
                "role_name": assignment.role_name,
                "status": "success",
                "assignment_id": user_role.id
            })
        except ValueError as e:
            results.append({
                "user_id": assignment.user_id,
                "role_name": assignment.role_name,
                "status": "error",
                "error": str(e)
            })

    return {"results": results}


@router.get("/stats")
async def get_role_assignment_stats(db: Session = Depends(get_db)):
    """Get statistics about role assignments."""
    from sqlalchemy import func

    stats = {}
    for role_name in ROLE_HIERARCHY.keys():
        count = db.query(func.count(UserRole.id)).filter(
            UserRole.role_name == role_name,
            UserRole.is_active == True
        ).scalar()
        stats[role_name] = count

    total_assignments = sum(stats.values())

    return {
        "total_assignments": total_assignments,
        "role_breakdown": stats,
        "available_roles": len(ROLE_HIERARCHY)
    }
