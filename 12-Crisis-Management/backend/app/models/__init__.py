"""
SQLAlchemy models for database tables.
This module re-exports the Base class from the database configuration.
"""
from app.db.postgres import Base

# Import models to register them with SQLAlchemy
# Use unified RBAC system
try:
    from app.models.rbac_models import User, Role, Permission, UserRole, RolePermission, AuditLog
except Exception as e:
    print(f"Warning: Could not import rbac_models: {e}")
    # Fallback to basic User model if rbac_models fails
    try:
        from app.models.rbac_models import User
    except:
        User = None
    Role = None
    Permission = None
    UserRole = None
    RolePermission = None
    AuditLog = None

from app.models.global_models import GlobalOrganization, GlobalDepartment, GlobalSubdepartment, GlobalProcess
from app.models.bia_models import BIAProcessInfo, BIADepartmentInfo, BIASubdepartmentInfo
from app.models.gap_assessment_models import ApprovalRequest, ApprovalStep, Framework, FrameworkVersion, TrainingCorpus

# Import unified RBAC system
from app.models.unified_rbac import UserRole as UnifiedUserRole, UnifiedRBACService

# Import role constants from gap assessment module for global access
from app.gap_assessment_module.models import (
    ROLE_PROCESS_OWNER, ROLE_DEPARTMENT_HEAD, ROLE_ORGANIZATION_HEAD, ROLE_EY_ADMIN,
    ROLE_HIERARCHY,
    APPROVAL_STATUS_PENDING, APPROVAL_STATUS_APPROVED, APPROVAL_STATUS_REJECTED,
    REQUEST_TYPE_CLAUSE_EDIT, REQUEST_TYPE_FRAMEWORK_ADDITION
)

__all__ = ["Base", "ROLE_PROCESS_OWNER", "ROLE_DEPARTMENT_HEAD", "ROLE_ORGANIZATION_HEAD", "ROLE_EY_ADMIN"]
