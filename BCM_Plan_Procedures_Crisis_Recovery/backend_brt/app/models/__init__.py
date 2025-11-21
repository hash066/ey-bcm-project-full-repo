"""
SQLAlchemy models for database tables.
This module re-exports the Base class from the database configuration.
"""
from app.db.postgres import Base

# Import models to register them with SQLAlchemy
from app.models.rbac_models import User, Role, Permission, user_roles
from app.models.global_models import GlobalOrganization, GlobalDepartment, GlobalSubdepartment, GlobalProcess
from app.models.bia_models import BIAProcessInfo, BIADepartmentInfo, BIASubdepartmentInfo
from app.models.recovery_strategy_models import RecoveryStrategy

__all__ = ["Base"]
