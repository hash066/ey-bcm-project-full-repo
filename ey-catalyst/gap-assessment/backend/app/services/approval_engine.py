"""
Approval workflow engine for managing multi-stage approval processes.
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.database import get_db
from app.models import (
    ApprovalRequest, ApprovalStep, User,
    ROLE_PROCESS_OWNER, ROLE_DEPARTMENT_HEAD, ROLE_ORGANIZATION_HEAD, ROLE_EY_ADMIN,
    APPROVAL_STATUS_PENDING, APPROVAL_STATUS_APPROVED, APPROVAL_STATUS_REJECTED,
    REQUEST_TYPE_CLAUSE_EDIT, REQUEST_TYPE_FRAMEWORK_ADDITION
)
from app.auth import check_approval_permission
from app.config_settings.role_mapping import (
    get_approval_role, can_user_approve, get_user_permissions,
    get_approval_chain, get_main_app_role, ApprovalRole, MAIN_APP_ROLE_MAPPING
)
from app.schemas import ApprovalRequestCreate

class ApprovalWorkflowEngine:
    """Engine for managing approval workflows and business logic."""

    def __init__(self, db: Session):
        """
        Initialize the approval engine.

        Args:
            db: Database session
        """
        self.db = db

    def get_next_approver_role(self, current_role: str) -> str:
        """
        Get the next role in the approval hierarchy using role mapping.

        Args:
            current_role: Current approver role (main app role)

        Returns:
            Next role in hierarchy or current role if at the top
        """
        # Map main app role to approval role
        current_approval_role = get_approval_role(current_role)
        if not current_approval_role:
            return current_role  # Return as-is if no mapping

        # Get approval chain for this role
        # For simplicity, use the next level in hierarchy
        role_levels = {ApprovalRole.PROCESS_OWNER: 1, ApprovalRole.DEPARTMENT_HEAD: 2,
                      ApprovalRole.ORGANIZATION_HEAD: 3, ApprovalRole.EY_ADMIN: 4}

        current_level = role_levels.get(current_approval_role, 0)

        # Find next role with higher level
        for approval_role, level in role_levels.items():
            if level > current_level:
                # Map back to main app roles that correspond to this approval role
                main_app_roles = get_main_app_role(approval_role)
                if main_app_roles:
                    return main_app_roles[0]  # Return first matching role

        return current_role  # No higher role found

    def get_approvers_for_role(self, role: str) -> List[User]:
        """
        Get all users who can approve for a specific role.

        Args:
            role: Role to find approvers for

        Returns:
            List of users who can approve for the role
        """
        # Get users with higher role levels than the target role
        role_levels = {
            ROLE_PROCESS_OWNER: 1,
            ROLE_DEPARTMENT_HEAD: 2,
            ROLE_ORGANIZATION_HEAD: 3,
            ROLE_EY_ADMIN: 4
        }

        target_level = role_levels.get(role, 0)

        approvers = self.db.query(User).filter(
            and_(
                User.is_active == True,
                User.role.in_([r for r, level in role_levels.items() if level > target_level])
            )
        ).all()

        return approvers

    def create_approval_request(
        self,
        request_data: ApprovalRequestCreate,
        submitted_by: User
    ) -> ApprovalRequest:
        """
        Create a new approval request.

        Args:
            request_data: Approval request data
            submitted_by: User submitting the request

        Returns:
            Created approval request
        """
        # Determine the first approver role based on submitter's role
        first_approver_role = self.get_next_approver_role(submitted_by.role)

        approval_request = ApprovalRequest(
            type=request_data.type,
            title=request_data.title,
            payload=request_data.payload,
            submitted_by=submitted_by.id,
            current_approver_role=first_approver_role,
            status=APPROVAL_STATUS_PENDING
        )

        self.db.add(approval_request)
        self.db.commit()
        self.db.refresh(approval_request)

        return approval_request

    def process_approval(
        self,
        request_id: int,
        approver: User,
        decision: str,
        comments: Optional[str] = None
    ) -> ApprovalRequest:
        """
        Process an approval decision.

        Args:
            request_id: Approval request ID
            approver: User making the decision
            decision: Approval decision (approved/rejected)
            comments: Optional comments

        Returns:
            Updated approval request

        Raises:
            ValueError: If the approval cannot be processed
        """
        # Get the approval request
        request = self.db.query(ApprovalRequest).filter(
            ApprovalRequest.id == request_id
        ).first()

        if not request:
            raise ValueError("Approval request not found")

        # Validate that the user can approve this request
        if request.current_approver_role != approver.role:
            raise ValueError("User is not authorized to approve this request")

        if request.status != APPROVAL_STATUS_PENDING:
            raise ValueError("Request is not in pending status")

        # Create approval step record
        approval_step = ApprovalStep(
            request_id=request_id,
            role=approver.role,
            approver_id=approver.id,
            decision=decision,
            comments=comments
        )

        self.db.add(approval_step)

        # Update request status and history
        if decision == "approved":
            # Check if this is the final approval
            next_role = self.get_next_approver_role(approver.role)

            if next_role == approver.role:  # Final approval
                request.status = APPROVAL_STATUS_APPROVED
                request.current_approver_role = approver.role  # Keep final approver
            else:
                request.current_approver_role = next_role
        else:
            request.status = APPROVAL_STATUS_REJECTED

        # Update approval history
        history_entry = {
            "step_id": approval_step.id,
            "role": approver.role,
            "approver_id": approver.id,
            "decision": decision,
            "comments": comments,
            "timestamp": approval_step.timestamp.isoformat()
        }

        if not request.approval_history:
            request.approval_history = []

        request.approval_history.append(history_entry)

        self.db.commit()
        self.db.refresh(request)

        return request

    def get_pending_approvals_for_user(self, user: User) -> List[ApprovalRequest]:
        """
        Get approval requests pending for a specific user.

        Args:
            user: User to get pending approvals for

        Returns:
            List of pending approval requests
        """
        requests = self.db.query(ApprovalRequest).filter(
            and_(
                ApprovalRequest.current_approver_role == user.role,
                ApprovalRequest.status == APPROVAL_STATUS_PENDING
            )
        ).all()

        return requests

    def get_requests_submitted_by_user(self, user: User) -> List[ApprovalRequest]:
        """
        Get approval requests submitted by a specific user.

        Args:
            user: User to get requests for

        Returns:
            List of user's submitted requests
        """
        requests = self.db.query(ApprovalRequest).filter(
            ApprovalRequest.submitted_by == user.id
        ).all()

        return requests

    def get_requests_accessible_to_user(self, user: User) -> List[ApprovalRequest]:
        """
        Get all approval requests accessible to a user (submitted by them or pending their approval).

        Args:
            user: User to get accessible requests for

        Returns:
            List of accessible approval requests
        """
        requests = self.db.query(ApprovalRequest).filter(
            or_(
                ApprovalRequest.submitted_by == user.id,
                ApprovalRequest.current_approver_role == user.role
            )
        ).all()

        return requests

    def get_approval_statistics(self, user: User) -> Dict[str, Any]:
        """
        Get approval statistics for a user.

        Args:
            user: User to get statistics for

        Returns:
            Dictionary of approval statistics
        """
        # Total submitted by user
        total_submitted = self.db.query(ApprovalRequest).filter(
            ApprovalRequest.submitted_by == user.id
        ).count()

        # Total approved by user
        total_approved = self.db.query(ApprovalStep).filter(
            and_(
                ApprovalStep.approver_id == user.id,
                ApprovalStep.decision == "approved"
            )
        ).count()

        # Total rejected by user
        total_rejected = self.db.query(ApprovalStep).filter(
            and_(
                ApprovalStep.approver_id == user.id,
                ApprovalStep.decision == "rejected"
            )
        ).count()

        # Pending approvals for user
        pending_approvals = self.get_pending_approvals_for_user(user)

        # Requests by status
        requests_by_status = {}
        for status in [APPROVAL_STATUS_PENDING, APPROVAL_STATUS_APPROVED, APPROVAL_STATUS_REJECTED]:
            count = self.db.query(ApprovalRequest).filter(
                ApprovalRequest.submitted_by == user.id,
                ApprovalRequest.status == status
            ).count()
            requests_by_status[status] = count

        # Requests by type
        requests_by_type = {}
        for request_type in [REQUEST_TYPE_CLAUSE_EDIT, REQUEST_TYPE_FRAMEWORK_ADDITION]:
            count = self.db.query(ApprovalRequest).filter(
                ApprovalRequest.submitted_by == user.id,
                ApprovalRequest.type == request_type
            ).count()
            requests_by_type[request_type] = count

        return {
            "total_submitted": total_submitted,
            "total_approved": total_approved,
            "total_rejected": total_rejected,
            "pending_approvals_count": len(pending_approvals),
            "requests_by_status": requests_by_status,
            "requests_by_type": requests_by_type,
            "pending_approvals": [
                {
                    "id": req.id,
                    "type": req.type,
                    "title": req.title,
                    "submitted_at": req.created_at.isoformat()
                }
                for req in pending_approvals
            ]
        }

    def can_user_approve_request(self, request: ApprovalRequest, user: User) -> bool:
        """
        Check if a user can approve a specific request.

        Args:
            request: Approval request
            user: User to check

        Returns:
            True if user can approve the request
        """
        return (request.current_approver_role == user.role and
                request.status == APPROVAL_STATUS_PENDING)

    def get_approval_chain_for_request_type(self, request_type: str, submitter_role: str) -> List[str]:
        """
        Get the approval chain for a request type.

        Args:
            request_type: Type of request
            submitter_role: Role of the person submitting

        Returns:
            List of roles in approval chain
        """
        # Start from the first approver role
        current_role = self.get_next_approver_role(submitter_role)
        chain = []

        while current_role != submitter_role:  # Avoid infinite loop
            chain.append(current_role)
            next_role = self.get_next_approver_role(current_role)
            if next_role == current_role:  # Reached the end
                break
            current_role = next_role

        return chain

    def escalate_request(self, request_id: int, target_role: str) -> ApprovalRequest:
        """
        Escalate a request to a specific role (for admin override).

        Args:
            request_id: Approval request ID
            target_role: Role to escalate to

        Returns:
            Updated approval request
        """
        request = self.db.query(ApprovalRequest).filter(
            ApprovalRequest.id == request_id
        ).first()

        if not request:
            raise ValueError("Approval request not found")

        # Only EY Admins can escalate requests
        if target_role not in [ROLE_PROCESS_OWNER, ROLE_DEPARTMENT_HEAD, ROLE_ORGANIZATION_HEAD, ROLE_EY_ADMIN]:
            raise ValueError("Invalid target role")

        old_role = request.current_approver_role
        request.current_approver_role = target_role

        # Add escalation note to history
        escalation_note = {
            "action": "escalated",
            "from_role": old_role,
            "to_role": target_role,
            "timestamp": request.updated_at.isoformat() if request.updated_at else None
        }

        if not request.approval_history:
            request.approval_history = []

        request.approval_history.append(escalation_note)

        self.db.commit()
        self.db.refresh(request)

        return request

    def get_dashboard_data(self, user: User) -> Dict[str, Any]:
        """
        Get comprehensive dashboard data for a user.

        Args:
            user: User to get dashboard data for

        Returns:
            Dictionary of dashboard data
        """
        # Get user's statistics
        user_stats = self.get_approval_statistics(user)

        # Get system-wide statistics (if user has permission)
        system_stats = {}
        if check_approval_permission(user, ROLE_PROCESS_OWNER):
            total_requests = self.db.query(ApprovalRequest).count()
            pending_requests = self.db.query(ApprovalRequest).filter(
                ApprovalRequest.status == APPROVAL_STATUS_PENDING
            ).count()
            approved_requests = self.db.query(ApprovalRequest).filter(
                ApprovalRequest.status == APPROVAL_STATUS_APPROVED
            ).count()
            rejected_requests = self.db.query(ApprovalRequest).filter(
                ApprovalRequest.status == APPROVAL_STATUS_REJECTED
            ).count()

            system_stats = {
                "total_requests": total_requests,
                "pending_requests": pending_requests,
                "approved_requests": approved_requests,
                "rejected_requests": rejected_requests
            }

        # Get recent activity
        recent_requests = self.db.query(ApprovalRequest).order_by(
            ApprovalRequest.updated_at.desc()
        ).limit(10).all()

        recent_activity = [
            {
                "id": req.id,
                "type": req.type,
                "title": req.title,
                "status": req.status,
                "updated_at": req.updated_at.isoformat() if req.updated_at else None
            }
            for req in recent_requests
        ]

        return {
            "user_stats": user_stats,
            "system_stats": system_stats,
            "recent_activity": recent_activity,
            "user_role": user.role,
            "user_permissions": self.get_user_permissions(user)
        }

    def get_user_permissions(self, user: User) -> Dict[str, bool]:
        """
        Get permissions for a user.

        Args:
            user: User to get permissions for

        Returns:
            Dictionary of user permissions
        """
        return {
            "can_create_users": check_approval_permission(user, ROLE_DEPARTMENT_HEAD),
            "can_approve_requests": check_approval_permission(user, ROLE_PROCESS_OWNER),
            "can_manage_frameworks": check_approval_permission(user, ROLE_DEPARTMENT_HEAD),
            "can_approve_frameworks": check_approval_permission(user, ROLE_ORGANIZATION_HEAD),
            "can_delete_frameworks": user.role == ROLE_EY_ADMIN,
            "can_view_all_users": check_approval_permission(user, ROLE_DEPARTMENT_HEAD),
            "can_view_dashboard": True,  # All users can view dashboard
            "can_submit_clause_edits": user.role == ROLE_PROCESS_OWNER,
            "can_submit_framework_additions": check_approval_permission(user, ROLE_DEPARTMENT_HEAD),
            "can_escalate_requests": user.role == ROLE_EY_ADMIN,
        }
