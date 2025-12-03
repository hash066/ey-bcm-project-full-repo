"""
Centralized Role-Based Access Control (RBAC) configuration.
This module serves as the single source of truth for role definitions, permissions, and approval hierarchies.
Used by both the main application (BIA/Admin) and Gap Assessment module.

Maps main app roles (from RBACService) to approval workflow roles.
"""

from enum import Enum
from typing import Dict, List, Optional, Any
import logging

logger = logging.getLogger(__name__)


class ApprovalRole(str, Enum):
    """Approval system role hierarchy for workflows."""
    PROCESS_OWNER = "process_owner"
    DEPARTMENT_HEAD = "department_head"
    ORGANIZATION_HEAD = "organization_head"
    EY_ADMIN = "ey_admin"


# Main app roles from RBACService mapped to approval roles
# These are the database roles used by the main BIA/Admin application
MAIN_APP_ROLE_MAPPING: Dict[str, Optional[ApprovalRole]] = {
    # From RBACService roles (database values)
    'Process Owner': ApprovalRole.PROCESS_OWNER,
    'Sub Process Owner': ApprovalRole.PROCESS_OWNER,  # Maps to same level as Process Owner
    'Department Head': ApprovalRole.DEPARTMENT_HEAD,
    'SubDepartment Head': ApprovalRole.DEPARTMENT_HEAD,  # Maps to same level as Department Head
    'Client Head': ApprovalRole.ORGANIZATION_HEAD,
    'CEO': ApprovalRole.ORGANIZATION_HEAD,
    'CXO': ApprovalRole.ORGANIZATION_HEAD,
    'BCM Coordinator': ApprovalRole.ORGANIZATION_HEAD,  # Same level as CEO
    'System Admin': ApprovalRole.EY_ADMIN,
    'Project Sponsor': ApprovalRole.ORGANIZATION_HEAD,

    # AD group mappings from auth.py middleware
    'BRT_ProcessOwners': ApprovalRole.PROCESS_OWNER,
    'BRT_SubProcessOwners': ApprovalRole.PROCESS_OWNER,
    'BRT_DepartmentHeads': ApprovalRole.DEPARTMENT_HEAD,
    'BRT_SubDepartmentHeads': ApprovalRole.DEPARTMENT_HEAD,
    'BRT_ClientHeads': ApprovalRole.ORGANIZATION_HEAD,
    'BRT_CXOs': ApprovalRole.ORGANIZATION_HEAD,
    'BRT_CEOs': ApprovalRole.ORGANIZATION_HEAD,
    'BRT_BCMCoordinators': ApprovalRole.ORGANIZATION_HEAD,  # BCM Coordinator AD group
    'BRT_ProjectSponsors': ApprovalRole.ORGANIZATION_HEAD,
    'BRT_Admins': ApprovalRole.EY_ADMIN,

    # Add more mappings as needed for other roles
    # 'other_role': ApprovalRole.DEPARTMENT_HEAD,
}


# Define approval chains for different operation types
APPROVAL_CHAINS: Dict[str, List[ApprovalRole]] = {
    'clause_edit': [
        ApprovalRole.DEPARTMENT_HEAD,
        ApprovalRole.ORGANIZATION_HEAD,
        ApprovalRole.EY_ADMIN
    ],
    'framework_addition': [
        ApprovalRole.DEPARTMENT_HEAD,
        ApprovalRole.ORGANIZATION_HEAD,
        ApprovalRole.EY_ADMIN
    ],
    'user_management': [
        ApprovalRole.ORGANIZATION_HEAD,
        ApprovalRole.EY_ADMIN
    ],
    'training_corpus': [
        ApprovalRole.DEPARTMENT_HEAD,
        ApprovalRole.ORGANIZATION_HEAD
    ],
    'gap_assessment': [
        ApprovalRole.DEPARTMENT_HEAD,
        ApprovalRole.ORGANIZATION_HEAD,
        ApprovalRole.EY_ADMIN
    ],
}


# DEPRECATED: Use unified RBAC system hierarchy instead
# Role hierarchy levels for permission checking (legacy compatibility)
# Now fully aligned with unified system (ey_admin = 6)
ROLE_HIERARCHY_LEVELS: Dict[ApprovalRole, int] = {
    ApprovalRole.PROCESS_OWNER: 1,
    ApprovalRole.DEPARTMENT_HEAD: 2,
    ApprovalRole.ORGANIZATION_HEAD: 3,
    ApprovalRole.EY_ADMIN: 6,  # Fully matches unified system
}


# Permission matrix for each approval role
ROLE_PERMISSIONS: Dict[ApprovalRole, Dict[str, bool]] = {
    ApprovalRole.PROCESS_OWNER: {
        'can_submit_requests': True,
        'can_submit_clause_edits': True,
        'can_submit_framework_additions': False,
        'can_submit_gap_assessment': True,
        'can_approve_requests': False,
        'can_manage_users': False,
        'can_view_all_requests': False,
        'can_admin': False,
        'can_escalate': False,
    },
    ApprovalRole.DEPARTMENT_HEAD: {
        'can_submit_requests': True,
        'can_submit_clause_edits': True,
        'can_submit_framework_additions': False,  # Restricted to BCM Coordinator, CEO, Admin only
        'can_submit_gap_assessment': True,
        'can_approve_requests': True,
        'can_manage_users': False,
        'can_view_all_requests': True,
        'can_admin': False,
        'can_escalate': False,
    },
    ApprovalRole.ORGANIZATION_HEAD: {
        'can_submit_requests': True,
        'can_submit_clause_edits': True,
        'can_submit_framework_additions': True,
        'can_submit_gap_assessment': True,
        'can_approve_requests': True,
        'can_manage_users': True,
        'can_view_all_requests': True,
        'can_admin': False,
        'can_escalate': True,
    },
    ApprovalRole.EY_ADMIN: {
        'can_submit_requests': True,
        'can_submit_clause_edits': True,
        'can_submit_framework_additions': True,
        'can_submit_gap_assessment': True,
        'can_approve_requests': True,
        'can_manage_users': True,
        'can_view_all_requests': True,
        'can_admin': True,
        'can_escalate': True,
    },
}


def get_approval_role(main_app_role: str) -> Optional[ApprovalRole]:
    """
    Map main app role to approval role.

    Args:
        main_app_role: Role from main application (e.g., "Process Owner", "BRT_ProcessOwners")

    Returns:
        ApprovalRole enum value or None if no mapping exists
    """
    if not main_app_role:
        return None

    return MAIN_APP_ROLE_MAPPING.get(main_app_role.strip())


def get_main_app_roles_for_approval_role(approval_role: ApprovalRole) -> List[str]:
    """
    Get all main app roles that map to an approval role.

    Args:
        approval_role: Approval role to find mappings for

    Returns:
        List of main app roles that map to this approval role
    """
    return [role for role, mapped in MAIN_APP_ROLE_MAPPING.items() if mapped == approval_role]


def can_user_approve(main_app_role: str, target_approval_role: ApprovalRole) -> bool:
    """
    Check if a main app user can approve for a target approval role.

    DEPRECATED: Redirect to unified RBAC system for consistency.
    """
    # Map approval role to unified role name
    role_name_map = {
        ApprovalRole.PROCESS_OWNER: "process_owner",
        ApprovalRole.DEPARTMENT_HEAD: "department_head",
        ApprovalRole.ORGANIZATION_HEAD: "organization_head",
        ApprovalRole.EY_ADMIN: "ey_admin"
    }

    target_role_name = role_name_map.get(target_approval_role)
    if not target_role_name:
        return False

    # For now, just check if the main_app_role maps to a higher level
    # This is a simplified redirect - ideally we'd get the user ID and use unified system
    user_approval_role = get_approval_role(main_app_role)
    if not user_approval_role:
        return False

    user_level = ROLE_HIERARCHY_LEVELS.get(user_approval_role, 0)
    target_level = ROLE_HIERARCHY_LEVELS.get(target_approval_role, 0)

    return user_level > target_level


def get_user_permissions(main_app_role: str) -> Dict[str, bool]:
    """
    Get permissions for a main app user role.

    Args:
        main_app_role: User's role in main app

    Returns:
        Dictionary of user permissions
    """
    approval_role = get_approval_role(main_app_role)
    if not approval_role:
        logger.warning(f"No approval role mapping found for main app role: {main_app_role}")
        return {
            'can_submit_requests': False,
            'can_submit_clause_edits': False,
            'can_submit_framework_additions': False,
            'can_submit_gap_assessment': False,
            'can_approve_requests': False,
            'can_manage_users': False,
            'can_view_all_requests': False,
            'can_admin': False,
            'can_escalate': False,
        }

    return ROLE_PERMISSIONS.get(approval_role, {})


def get_approval_chain(operation_type: str, submitter_role: str) -> List[ApprovalRole]:
    """
    Get the approval chain for an operation type.

    Args:
        operation_type: Type of operation (clause_edit, framework_addition, etc.)
        submitter_role: Role of the person submitting

    Returns:
        List of approval roles in sequence
    """
    chain = APPROVAL_CHAINS.get(operation_type, [])
    if not chain:
        return []

    # Start from the first role that can approve this submitter
    submitter_approval_role = get_approval_role(submitter_role)
    if not submitter_approval_role:
        return chain

    # Filter chain to only include roles that can approve this submitter
    filtered_chain = []
    for role in chain:
        if can_user_approve(submitter_role, role):
            filtered_chain.append(role)

    return filtered_chain


def get_next_approver_role(current_role: str) -> ApprovalRole:
    """
    Get the next higher approver role in the hierarchy.

    Args:
        current_role: Current approval role

    Returns:
        Next approval role in hierarchy
    """
    if isinstance(current_role, ApprovalRole):
        current_approval_role = current_role
    else:
        current_approval_role = get_approval_role(current_role)

    if not current_approval_role:
        return ApprovalRole.DEPARTMENT_HEAD  # Default fallback

    current_level = ROLE_HIERARCHY_LEVELS.get(current_approval_role, 0)

    # Find next role with higher level
    for role, level in ROLE_HIERARCHY_LEVELS.items():
        if level > current_level:
            return role

    return current_approval_role  # Return same role if already at top


def validate_role_mapping() -> Dict[str, Any]:
    """
    Validate the role mapping configuration.

    Returns:
        Validation results
    """
    validation = {
        'valid': True,
        'errors': [],
        'warnings': []
    }

    # Check if all main app roles are mapped
    unmapped_roles = []
    for role in MAIN_APP_ROLE_MAPPING:
        if MAIN_APP_ROLE_MAPPING[role] is None:
            unmapped_roles.append(role)

    if unmapped_roles:
        validation['warnings'].append(f"Roles with no approval permissions: {unmapped_roles}")

    # Check if approval chains are valid
    for operation, chain in APPROVAL_CHAINS.items():
        if not chain:
            validation['errors'].append(f"Empty approval chain for operation: {operation}")
            validation['valid'] = False

        # Check if chain roles exist in hierarchy
        for role in chain:
            if role not in ROLE_HIERARCHY_LEVELS:
                validation['errors'].append(f"Unknown role in chain for {operation}: {role}")
                validation['valid'] = False

    return validation


def get_user_context_from_headers(headers: Dict[str, str]) -> Dict[str, Any]:
    """
    Extract user context from request headers (for integration with main app).

    Args:
        headers: Request headers from main app

    Returns:
        User context dictionary
    """
    return {
        'user_id': headers.get('X-User-ID'),
        'username': headers.get('X-User-Username') or headers.get('X-Username'),
        'user_role': headers.get('X-User-Role'),
        'organization': headers.get('X-Organization'),
        'department': headers.get('X-Department'),
        'email': headers.get('X-User-Email'),
    }


def get_user_context_from_jwt(token_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract user context from JWT token (alternative integration method).

    Args:
        token_data: Decoded JWT token data

    Returns:
        User context dictionary
    """
    return {
        'user_id': token_data.get('user_id') or token_data.get('sub'),
        'username': token_data.get('username') or token_data.get('preferred_username'),
        'user_role': token_data.get('role') or token_data.get('user_role'),
        'organization': token_data.get('organization') or token_data.get('org'),
        'department': token_data.get('department') or token_data.get('dept'),
        'email': token_data.get('email'),
    }


# Integration helper functions
def get_dashboard_permissions(user_role: str) -> Dict[str, bool]:
    """
    Get dashboard view permissions for a user role.

    Args:
        user_role: Main app user role

    Returns:
        Dashboard permissions
    """
    all_permissions = get_user_permissions(user_role)
    dashboard_perms = {
        'can_view_dashboard': True,
        'can_view_own_requests': True,
        'can_view_all_requests': all_permissions.get('can_view_all_requests', False),
        'can_approve_requests': all_permissions.get('can_approve_requests', False),
        'can_submit_requests': all_permissions.get('can_submit_requests', True),
    }
    return dashboard_perms


# Log validation on import
validation_result = validate_role_mapping()
if not validation_result['valid']:
    logger.error(f"Role mapping validation errors: {validation_result['errors']}")
if validation_result['warnings']:
    logger.warning(f"Role mapping validation warnings: {validation_result['warnings']}")
else:
    logger.info("Role mapping validation passed")
