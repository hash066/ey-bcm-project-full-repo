"""
Integration middleware for intercepting existing API calls and adding approval requirements.
"""

from typing import Dict, Any, Optional
from fastapi import HTTPException, status, Depends, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_active_user
from app.models import User, REQUEST_TYPE_CLAUSE_EDIT, REQUEST_TYPE_FRAMEWORK_ADDITION
from app.services.approval_engine import ApprovalWorkflowEngine
from app.schemas import ApprovalRequestCreate

class ApprovalIntegrationMiddleware:
    """
    Middleware for integrating approval workflows with existing API endpoints.
    This intercepts operations that require approval and routes them through the approval process.
    """

    def __init__(self, db: Session, current_user: User):
        """
        Initialize the integration middleware.

        Args:
            db: Database session
            current_user: Current authenticated user
        """
        self.db = db
        self.current_user = current_user
        self.approval_engine = ApprovalWorkflowEngine(db)

    def require_clause_edit_approval(self, clause_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check if clause edit requires approval and create approval request if needed.

        Args:
            clause_data: Clause edit data

        Returns:
            Result of approval check/creation

        Raises:
            HTTPException: If approval is required but cannot be created
        """
        # For now, all clause edits require approval
        # In the future, this could be based on risk level, user permissions, etc.

        try:
            # Create approval request
            approval_data = ApprovalRequestCreate(
                type=REQUEST_TYPE_CLAUSE_EDIT,
                title=f"Clause Edit: {clause_data.get('control_id', 'Unknown')}",
                payload=clause_data
            )

            approval_request = self.approval_engine.create_approval_request(
                approval_data, self.current_user
            )

            return {
                "requires_approval": True,
                "approval_request_id": approval_request.id,
                "message": "Clause edit submitted for approval",
                "status": "pending_approval"
            }

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create approval request: {str(e)}"
            )

    def require_framework_addition_approval(self, framework_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check if framework addition requires approval and create approval request if needed.

        Args:
            framework_data: Framework addition data

        Returns:
            Result of approval check/creation

        Raises:
            HTTPException: If approval is required but cannot be created
        """
        # Framework additions always require approval
        try:
            # Create approval request
            approval_data = ApprovalRequestCreate(
                type=REQUEST_TYPE_FRAMEWORK_ADDITION,
                title=f"Framework Addition: {framework_data.get('name', 'Unknown')}",
                payload={"framework_data": framework_data}
            )

            approval_request = self.approval_engine.create_approval_request(
                approval_data, self.current_user
            )

            return {
                "requires_approval": True,
                "approval_request_id": approval_request.id,
                "message": "Framework addition submitted for approval",
                "status": "pending_approval"
            }

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create approval request: {str(e)}"
            )

    def check_operation_approval_status(self, approval_request_id: int) -> Dict[str, Any]:
        """
        Check the status of an approval request.

        Args:
            approval_request_id: Approval request ID

        Returns:
            Approval status information
        """
        from app.models import ApprovalRequest

        request = self.db.query(ApprovalRequest).filter(
            ApprovalRequest.id == approval_request_id
        ).first()

        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Approval request not found"
            )

        return {
            "approval_request_id": request.id,
            "status": request.status,
            "current_approver_role": request.current_approver_role,
            "is_approved": request.status == "approved",
            "is_rejected": request.status == "rejected",
            "is_pending": request.status == "pending"
        }

    def get_operation_permissions(self) -> Dict[str, bool]:
        """
        Get permissions for operations that require approval.

        Returns:
            Dictionary of operation permissions
        """
        return {
            "can_edit_clauses": self.current_user.role == "process_owner",
            "can_add_frameworks": self.current_user.role in ["process_owner", "department_head"],
            "can_approve_clause_edits": self.approval_engine.get_user_permissions(self.current_user).get("can_approve_requests", False),
            "can_approve_framework_additions": self.approval_engine.get_user_permissions(self.current_user).get("can_approve_frameworks", False),
        }

def get_approval_integration(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> ApprovalIntegrationMiddleware:
    """
    Dependency to get approval integration middleware.

    Args:
        current_user: Current authenticated user
        db: Database session

    Returns:
        Approval integration middleware instance
    """
    return ApprovalIntegrationMiddleware(db, current_user)

# Integration functions for specific operations
async def integrate_clause_edit(
    job_id: str,
    control_id: str,
    clause_data: Dict[str, Any],
    remedy: str,
    justification: str,
    integration: ApprovalIntegrationMiddleware = Depends(get_approval_integration)
) -> Dict[str, Any]:
    """
    Integrate clause edit with approval workflow.

    Args:
        job_id: Job identifier
        control_id: Control identifier
        clause_data: Clause data to edit
        remedy: Proposed remedy
        justification: Justification for the edit
        integration: Approval integration middleware

    Returns:
        Integration result
    """
    # Prepare clause edit data
    edit_data = {
        "job_id": job_id,
        "control_id": control_id,
        "clause_data": clause_data,
        "remedy": remedy,
        "justification": justification,
        "submitted_by": integration.current_user.id,
        "submitted_at": integration.current_user.created_at.isoformat() if integration.current_user.created_at else None
    }

    return integration.require_clause_edit_approval(edit_data)

async def integrate_framework_addition(
    framework_data: Dict[str, Any],
    justification: str,
    integration: ApprovalIntegrationMiddleware = Depends(get_approval_integration)
) -> Dict[str, Any]:
    """
    Integrate framework addition with approval workflow.

    Args:
        framework_data: Framework data to add
        justification: Justification for the addition
        integration: Approval integration middleware

    Returns:
        Integration result
    """
    # Prepare framework addition data
    addition_data = {
        "framework_data": framework_data,
        "justification": justification,
        "submitted_by": integration.current_user.id,
        "submitted_at": integration.current_user.created_at.isoformat() if integration.current_user.created_at else None
    }

    return integration.require_framework_addition_approval(addition_data)

def check_approval_before_operation(
    approval_request_id: Optional[int] = None,
    integration: ApprovalIntegrationMiddleware = Depends(get_approval_integration)
) -> Dict[str, Any]:
    """
    Check if an operation has been approved before proceeding.

    Args:
        approval_request_id: Approval request ID to check
        integration: Approval integration middleware

    Returns:
        Approval status

    Raises:
        HTTPException: If operation is not approved
    """
    if not approval_request_id:
        return {"approved": True, "message": "No approval required"}

    status_info = integration.check_approval_status(approval_request_id)

    if not status_info["is_approved"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Operation not approved. Current status: {status_info['status']}"
        )

    return status_info
