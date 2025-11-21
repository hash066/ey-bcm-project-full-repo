"""
Constants and configuration for Gap Assessment Module
"""

# Request types for approval workflow
REQUEST_TYPE_CLAUSE_EDIT = "clause_edit"
REQUEST_TYPE_FRAMEWORK_ADDITION = "framework_addition"

# Approval status constants
APPROVAL_STATUS_PENDING = "pending"
APPROVAL_STATUS_APPROVED = "approved"
APPROVAL_STATUS_REJECTED = "rejected"

# Role constants
ROLE_PROCESS_OWNER = "process_owner"
ROLE_DEPARTMENT_HEAD = "department_head"
ROLE_ORGANIZATION_HEAD = "organization_head"
ROLE_EY_ADMIN = "ey_admin"

# Role hierarchy levels
ROLE_HIERARCHY = {
    ROLE_PROCESS_OWNER: 1,
    ROLE_DEPARTMENT_HEAD: 2,
    ROLE_ORGANIZATION_HEAD: 3,
    ROLE_EY_ADMIN: 4,
}
