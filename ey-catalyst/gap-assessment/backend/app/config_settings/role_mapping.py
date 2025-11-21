"""
Role mapping configuration for integrating with main app's role system.
This maps the main app's roles to the approval workflow hierarchy.
"""

from enum import Enum
from typing import Dict, List, Optional

class ApprovalRole(str, Enum):
    """Approval system role hierarchy."""
    PROCESS_OWNER = "process_owner"
    DEPARTMENT_HEAD = "department_head"
    ORGANIZATION_HEAD = "organization_head"
    EY_ADMIN = "ey_admin"

# Map your main app roles to approval roles
# Update these mappings based on your main app's role names
MAIN_APP_ROLE_MAPPING: Dict[str, Optional[ApprovalRole]] = {
    # Your main app roles → Approval roles
    'ey/admin': ApprovalRole.EY_ADMIN,                    # Highest level admin
    'organization heads': ApprovalRole.ORGANIZATION_HEAD, # Organization-level heads
    'department heads': ApprovalRole.DEPARTMENT_HEAD,     # Department-level heads
    'sub department heads': ApprovalRole.DEPARTMENT_HEAD, # Same as department heads
    'process owners': ApprovalRole.PROCESS_OWNER,        # Process-level owners

    # Add more mappings as needed
    # 'your_other_role': ApprovalRole.DEPARTMENT_HEAD,
    # 'read_only_user': None,  # No approval permissions
}

# Define approval chains for different operation types
# These define who needs to approve what in sequence
APPROVAL_CHAINS: Dict[str, List[ApprovalRole]] = {
    'clause_edit': [
        ApprovalRole.DEPARTMENT_HEAD,
        ApprovalRole.ORGANIZATION_HEAD,
        ApprovalRole.EY_ADMIN
    ],
    'framework_addition': [
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
}

# Role hierarchy levels for permission checking
ROLE_HIERARCHY_LEVELS: Dict[ApprovalRole, int] = {
    ApprovalRole.PROCESS_OWNER: 1,
    ApprovalRole.DEPARTMENT_HEAD: 2,
    ApprovalRole.ORGANIZATION_HEAD: 3,
    ApprovalRole.EY_ADMIN: 4,
}

# Permission matrix for each role
ROLE_PERMISSIONS: Dict[ApprovalRole, Dict[str, bool]] = {
    ApprovalRole.PROCESS_OWNER: {
        'can_submit_clause_edits': True,
        'can_submit_framework_additions': False,
        'can_approve_requests': False,
        'can_manage_users': False,
        'can_view_all_requests': False,
        'can_admin': False,
    },
    ApprovalRole.DEPARTMENT_HEAD: {
        'can_submit_clause_edits': True,
        'can_submit_framework_additions': True,
        'can_approve_requests': True,
        'can_manage_users': False,
        'can_view_all_requests': True,
        'can_admin': False,
    },
    ApprovalRole.ORGANIZATION_HEAD: {
        'can_submit_clause_edits': True,
        'can_submit_framework_additions': True,
        'can_approve_requests': True,
        'can_manage_users': True,
        'can_view_all_requests': True,
        'can_admin': False,
    },
    ApprovalRole.EY_ADMIN: {
        'can_submit_clause_edits': True,
        'can_submit_framework_additions': True,
        'can_approve_requests': True,
        'can_manage_users': True,
        'can_view_all_requests': True,
        'can_admin': True,
    },
}

def get_approval_role(main_app_role: str) -> Optional[ApprovalRole]:
    """
    Map main app role to approval role.

    Args:
        main_app_role: Role from your main application

    Returns:
        ApprovalRole enum value or None if no mapping exists
    """
    return MAIN_APP_ROLE_MAPPING.get(main_app_role)

def get_main_app_role(approval_role: ApprovalRole) -> List[str]:
    """
    Get main app roles that map to an approval role.

    Args:
        approval_role: Approval role to find mappings for

    Returns:
        List of main app roles that map to this approval role
    """
    return [role for role, mapped in MAIN_APP_ROLE_MAPPING.items() if mapped == approval_role]

def can_user_approve(main_app_role: str, target_approval_role: ApprovalRole) -> bool:
    """
    Check if a main app user can approve for a target approval role.

    Args:
        main_app_role: User's role in main app
        target_approval_role: Approval role to check against

    Returns:
        True if user can approve for the target role
    """
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
        return {
            'can_submit_clause_edits': False,
            'can_submit_framework_additions': False,
            'can_approve_requests': False,
            'can_manage_users': False,
            'can_view_all_requests': False,
            'can_admin': False,
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

def validate_role_mapping() -> Dict[str, any]:
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

# Integration helper functions
def get_user_context_from_headers(headers: Dict[str, str]) -> Dict[str, any]:
    """
    Extract user context from request headers (for integration with main app).

    Args:
        headers: Request headers from main app

    Returns:
        User context dictionary
    """
    return {
        'user_id': headers.get('X-User-ID'),
        'user_role': headers.get('X-User-Role'),
        'organization': headers.get('X-Organization'),
        'department': headers.get('X-Department'),
        'email': headers.get('X-User-Email'),
    }

def get_user_context_from_jwt(token_data: Dict[str, any]) -> Dict[str, any]:
    """
    Extract user context from JWT token (alternative integration method).

    Args:
        token_data: Decoded JWT token data

    Returns:
        User context dictionary
    """
    return {
        'user_id': token_data.get('user_id') or token_data.get('sub'),
        'user_role': token_data.get('role') or token_data.get('user_role'),
        'organization': token_data.get('organization'),
        'department': token_data.get('department'),
        'email': token_data.get('email'),
    }
