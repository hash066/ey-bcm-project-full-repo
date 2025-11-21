"""
RBAC (Role-Based Access Control) for BCM Plan Module
Handles permissions for organization-level and departmental-level BCM plans
"""
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID

from app.db.postgres import get_db
from app.middleware.auth import get_current_user

class BCMPlanPermissions:
    """Permission definitions for BCM Plan module"""
    
    # Organization-level permissions
    VIEW_ORG_PLAN = "view_organization_bcm_plan"
    EDIT_ORG_PLAN = "edit_organization_bcm_plan"
    APPROVE_ORG_PLAN = "approve_organization_bcm_plan"
    
    # Departmental-level permissions
    VIEW_DEPT_PLAN = "view_departmental_bcm_plan"
    EDIT_DEPT_PLAN = "edit_departmental_bcm_plan"
    APPROVE_DEPT_PLAN = "approve_departmental_bcm_plan"
    
    # Export permissions
    EXPORT_BCM_PLAN = "export_bcm_plan"
    
    # Role-based permission mapping
    ROLE_PERMISSIONS = {
        "System Admin": [
            VIEW_ORG_PLAN, EDIT_ORG_PLAN, APPROVE_ORG_PLAN,
            VIEW_DEPT_PLAN, EDIT_DEPT_PLAN, APPROVE_DEPT_PLAN,
            EXPORT_BCM_PLAN
        ],
        "CEO": [
            VIEW_ORG_PLAN, EDIT_ORG_PLAN, APPROVE_ORG_PLAN,
            VIEW_DEPT_PLAN, EXPORT_BCM_PLAN
        ],
        "CXO": [
            VIEW_ORG_PLAN, EDIT_ORG_PLAN,
            VIEW_DEPT_PLAN, EXPORT_BCM_PLAN
        ],
        "Client Head": [
            VIEW_ORG_PLAN, EDIT_ORG_PLAN,
            VIEW_DEPT_PLAN, EXPORT_BCM_PLAN
        ],
        "BCM Coordinator": [
            VIEW_ORG_PLAN, EDIT_ORG_PLAN,
            VIEW_DEPT_PLAN, EDIT_DEPT_PLAN,
            EXPORT_BCM_PLAN
        ],
        "Department Head": [
            VIEW_ORG_PLAN,
            VIEW_DEPT_PLAN, EDIT_DEPT_PLAN, APPROVE_DEPT_PLAN,
            EXPORT_BCM_PLAN
        ],
        "SubDepartment Head": [
            VIEW_ORG_PLAN,
            VIEW_DEPT_PLAN, EDIT_DEPT_PLAN,
            EXPORT_BCM_PLAN
        ],
        "Process Owner": [
            VIEW_ORG_PLAN,
            VIEW_DEPT_PLAN
        ],
        "Sub Process Owner": [
            VIEW_ORG_PLAN,
            VIEW_DEPT_PLAN
        ]
    }

class BCMRBACService:
    """Service for BCM Plan RBAC operations"""
    
    @staticmethod
    def get_user_roles(user, db: Session) -> list:
        """Get all roles for a user"""
        from sqlalchemy import text
        
        try:
            result = db.execute(
                text("""
                    SELECT r.name 
                    FROM roles r
                    JOIN user_roles ur ON r.id = ur.role_id
                    WHERE ur.user_id = :user_id AND ur.is_active = true
                """),
                {"user_id": user.id}
            )
            return [row[0] for row in result.fetchall()]
        except Exception as e:
            print(f"Error getting user roles: {str(e)}")
            return []
    
    @staticmethod
    def has_permission(user, permission: str, db: Session) -> bool:
        """Check if user has a specific permission"""
        user_roles = BCMRBACService.get_user_roles(user, db)
        
        for role in user_roles:
            if permission in BCMPlanPermissions.ROLE_PERMISSIONS.get(role, []):
                return True
        
        return False
    
    @staticmethod
    def can_access_organization_plan(user, organization_id: str, db: Session) -> bool:
        """Check if user can access organization-level BCM plan"""
        from sqlalchemy import text
        
        # System Admin can access all organizations
        if BCMRBACService.has_permission(user, BCMPlanPermissions.VIEW_ORG_PLAN, db):
            user_roles = BCMRBACService.get_user_roles(user, db)
            if "System Admin" in user_roles:
                return True
        
        # Check if user belongs to this organization
        try:
            result = db.execute(
                text("""
                    SELECT COUNT(*) 
                    FROM user_organization_mapping 
                    WHERE user_id = :user_id AND organization_id = :org_id
                """),
                {"user_id": user.id, "org_id": organization_id}
            )
            belongs_to_org = result.scalar() > 0
            
            if belongs_to_org and BCMRBACService.has_permission(user, BCMPlanPermissions.VIEW_ORG_PLAN, db):
                return True
        except Exception as e:
            print(f"Error checking organization access: {str(e)}")
        
        return False
    
    @staticmethod
    def can_access_department_plan(user, department_id: str, organization_id: str, db: Session) -> bool:
        """Check if user can access departmental-level BCM plan"""
        from sqlalchemy import text
        
        # System Admin can access all departments
        user_roles = BCMRBACService.get_user_roles(user, db)
        if "System Admin" in user_roles:
            return True
        
        # Check if user has department-level access
        if not BCMRBACService.has_permission(user, BCMPlanPermissions.VIEW_DEPT_PLAN, db):
            return False
        
        # Department Head can only access their own department
        if "Department Head" in user_roles:
            try:
                result = db.execute(
                    text("""
                        SELECT COUNT(*) 
                        FROM user_department_mapping 
                        WHERE user_id = :user_id AND department_id = :dept_id
                    """),
                    {"user_id": user.id, "dept_id": department_id}
                )
                return result.scalar() > 0
            except Exception as e:
                print(f"Error checking department access: {str(e)}")
                return False
        
        # BCM Coordinator, CEO, CXO, Client Head can access all departments in their organization
        if any(role in user_roles for role in ["BCM Coordinator", "CEO", "CXO", "Client Head"]):
            return BCMRBACService.can_access_organization_plan(user, organization_id, db)
        
        return False
    
    @staticmethod
    def can_edit_organization_plan(user, organization_id: str, db: Session) -> bool:
        """Check if user can edit organization-level BCM plan"""
        if not BCMRBACService.can_access_organization_plan(user, organization_id, db):
            return False
        
        return BCMRBACService.has_permission(user, BCMPlanPermissions.EDIT_ORG_PLAN, db)
    
    @staticmethod
    def can_edit_department_plan(user, department_id: str, organization_id: str, db: Session) -> bool:
        """Check if user can edit departmental-level BCM plan"""
        if not BCMRBACService.can_access_department_plan(user, department_id, organization_id, db):
            return False
        
        return BCMRBACService.has_permission(user, BCMPlanPermissions.EDIT_DEPT_PLAN, db)
    
    @staticmethod
    def can_approve_organization_plan(user, organization_id: str, db: Session) -> bool:
        """Check if user can approve organization-level BCM plan"""
        if not BCMRBACService.can_access_organization_plan(user, organization_id, db):
            return False
        
        return BCMRBACService.has_permission(user, BCMPlanPermissions.APPROVE_ORG_PLAN, db)
    
    @staticmethod
    def can_approve_department_plan(user, department_id: str, organization_id: str, db: Session) -> bool:
        """Check if user can approve departmental-level BCM plan"""
        if not BCMRBACService.can_access_department_plan(user, department_id, organization_id, db):
            return False
        
        return BCMRBACService.has_permission(user, BCMPlanPermissions.APPROVE_DEPT_PLAN, db)
    
    @staticmethod
    def can_export_bcm_plan(user, db: Session) -> bool:
        """Check if user can export BCM plans"""
        return BCMRBACService.has_permission(user, BCMPlanPermissions.EXPORT_BCM_PLAN, db)

# Dependency functions for FastAPI endpoints

async def require_org_plan_view(
    organization_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Require permission to view organization-level BCM plan"""
    if not BCMRBACService.can_access_organization_plan(current_user, organization_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this organization's BCM plan"
        )
    return current_user

async def require_org_plan_edit(
    organization_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Require permission to edit organization-level BCM plan"""
    if not BCMRBACService.can_edit_organization_plan(current_user, organization_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to edit this organization's BCM plan"
        )
    return current_user

async def require_dept_plan_view(
    department_id: str,
    organization_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Require permission to view departmental-level BCM plan"""
    if not BCMRBACService.can_access_department_plan(current_user, department_id, organization_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this department's BCM plan"
        )
    return current_user

async def require_dept_plan_edit(
    department_id: str,
    organization_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Require permission to edit departmental-level BCM plan"""
    if not BCMRBACService.can_edit_department_plan(current_user, department_id, organization_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to edit this department's BCM plan"
        )
    return current_user

async def require_bcm_export(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Require permission to export BCM plans"""
    if not BCMRBACService.can_export_bcm_plan(current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to export BCM plans"
        )
    return current_user
