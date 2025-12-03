"""
Organization Approvals Router - API endpoints for organization-level approval workflows.
Handles approval workflows for AI-generated content edits in organization impact matrices.
Migrated to use Supabase as the primary database.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

from app.db.postgres import get_db
from app.middleware.auth import get_current_user
from app.utils.supabase_migration_utils import (
    supabase_select, supabase_insert, supabase_update, supabase_delete,
    convert_uuid_to_string, prepare_record_for_supabase
)

router = APIRouter(
    prefix="/organizations",
    tags=["Organization Approvals"],
    responses={404: {"description": "Not found"}},
)

# Approval workflow hierarchy
APPROVAL_HIERARCHY = [
    "Process Owner",
    "Department Sub Head",
    "Department Head",
    "Organization Head",
    "EY Admin"
]

class ApprovalRequest(BaseModel):
    edited_result: Dict[str, Any]
    original_ai_result: str
    reason: Optional[str] = "AI content edit"

class ApprovalAction(BaseModel):
    action: str  # 'approve' or 'reject'
    comments: Optional[str] = ""

# Simple auth check
def simple_auth_check(authorization: str = Header(None)):
    """
    Simple auth check using Authorization header.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header"
        )
    return True

@router.post("/{organization_id}/impact-matrix/approval-request", response_model=Dict[str, Any])
async def create_impact_matrix_approval_request(
    organization_id: UUID,
    request: ApprovalRequest,
    authorization: str = Header(None),
    auth_check: bool = Depends(simple_auth_check)
):
    """
    Create an approval request when AI-generated content is edited in the organization impact matrix.
    Migrated to use Supabase as primary database.
    """
    try:
        # Decode user info from token
        import base64
        import json
        token = authorization.split(" ")[1]
        # Fix base64 padding
        token_part = token.split('.')[1]
        missing_padding = len(token_part) % 4
        if missing_padding:
            token_part += '=' * (4 - missing_padding)
        token_payload = json.loads(base64.b64decode(token_part).decode())

        user_roles = token_payload.get("roles", [])
        user_role = user_roles[0] if user_roles else None
        username = token_payload.get("sub", "unknown")

        if not user_role:
            raise HTTPException(status_code=403, detail="User role not found")

        # Find next approver based on hierarchy
        current_index = APPROVAL_HIERARCHY.index(user_role) if user_role in APPROVAL_HIERARCHY else -1
        if current_index >= len(APPROVAL_HIERARCHY) - 1:
            # Already at final approval level
            raise HTTPException(status_code=400, detail="User is already at final approval level")

        next_role = APPROVAL_HIERARCHY[current_index + 1]

        # Create approval workflow in Supabase
        workflow_data = {
            "organization_id": str(organization_id),
            "edited_content": request.edited_result.get("content", ""),
            "original_content": request.original_ai_result,
            "reason": request.reason,
            "requester_username": username,
            "requester_role": user_role,
            "next_approver_role": next_role,
            "current_approver_role": user_role,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat(),
            "approval_chain": APPROVAL_HIERARCHY[current_index + 1:],
            "approvals": []
        }

        # Insert into Supabase
        result = supabase_insert("organization_approval_workflows", workflow_data)
        if not result:
            raise Exception("Failed to create approval workflow in database")

        # Get the created workflow ID
        workflow_id = result[0]["id"] if isinstance(result, list) and result else result.get("id")

        return {
            "status": "success",
            "message": f"Approval request created for {next_role} review",
            "request_id": workflow_id,
            "next_approver": next_role
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating approval request: {str(e)}"
        )

@router.get("/{organization_id}/approvals/pending", response_model=Dict[str, Any])
async def get_pending_approvals(
    organization_id: UUID,
    authorization: str = Header(None),
    auth_check: bool = Depends(simple_auth_check)
):
    """
    Get pending approval requests for the current user.
    Migrated to use Supabase as primary database.
    """
    try:
        # Decode user info from token
        import base64
        import json
        token = authorization.split(" ")[1]
        # Fix base64 padding
        token_part = token.split('.')[1]
        missing_padding = len(token_part) % 4
        if missing_padding:
            token_part += '=' * (4 - missing_padding)
        token_payload = json.loads(base64.b64decode(token_part).decode())

        user_roles = token_payload.get("roles", [])
        user_role = user_roles[0] if user_roles else None

        if not user_role:
            raise HTTPException(status_code=403, detail="User role not found")

        # Query Supabase for pending approvals
        pending_approvals = supabase_select(
            "organization_approval_workflows",
            filters={
                "organization_id": str(organization_id),
                "status": "pending",
                "next_approver_role": user_role
            }
        )

        # Transform to frontend format
        formatted_approvals = []
        for approval in pending_approvals:
            formatted_approvals.append({
                "id": approval["id"],
                "edited_content": approval["edited_content"],
                "original_content": approval["original_content"],
                "reason": approval["reason"],
                "requester_username": approval["requester_username"],
                "requester_role": approval["requester_role"],
                "created_at": approval["created_at"]
            })

        return {
            "approvals": formatted_approvals,
            "total": len(formatted_approvals)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching pending approvals: {str(e)}"
        )

@router.post("/approvals/{request_id}/approve", response_model=Dict[str, Any])
async def approve_request(
    request_id: int,
    approval: ApprovalAction,
    authorization: str = Header(None),
    auth_check: bool = Depends(simple_auth_check)
):
    """
    Approve or reject an approval request.
    Migrated to use Supabase as primary database.
    """
    try:
        # Decode user info from token
        import base64
        import json
        token = authorization.split(" ")[1]
        # Fix base64 padding
        token_part = token.split('.')[1]
        missing_padding = len(token_part) % 4
        if missing_padding:
            token_part += '=' * (4 - missing_padding)
        token_payload = json.loads(base64.b64decode(token_part).decode())

        user_roles = token_payload.get("roles", [])
        approver_role = user_roles[0] if user_roles else None
        approver_username = token_payload.get("sub", "unknown")

        if not approver_role:
            raise HTTPException(status_code=403, detail="User role not found")

        # Find the approval request in Supabase
        workflow = supabase_select(
            "organization_approval_workflows",
            filters={"id": request_id},
            single=True
        )

        if not workflow:
            raise HTTPException(status_code=404, detail="Approval request not found")

        # Check if user can approve this request
        if workflow["next_approver_role"] != approver_role:
            raise HTTPException(status_code=403, detail="Not authorized to approve this request")

        # Get current approvals and add new one
        current_approvals = workflow.get("approvals", [])
        approval_record = {
            "approver_username": approver_username,
            "approver_role": approver_role,
            "action": approval.action,
            "comments": approval.comments,
            "timestamp": datetime.utcnow().isoformat()
        }
        current_approvals.append(approval_record)

        # Prepare update data
        update_data = {
            "approvals": current_approvals
        }

        if approval.action == "approve":
            # Check if this is the final approval
            current_index = APPROVAL_HIERARCHY.index(approver_role)
            if current_index >= len(APPROVAL_HIERARCHY) - 1:
                # Final approval - implement the changes
                update_data["status"] = "approved"
                await _implement_approved_changes(workflow)
            else:
                # Move to next approver
                next_role = APPROVAL_HIERARCHY[current_index + 1]
                update_data["next_approver_role"] = next_role
        else:
            # Rejected - end the workflow
            update_data["status"] = "rejected"

        # Update the workflow in Supabase
        supabase_update(
            "organization_approval_workflows",
            update_data,
            filters={"id": request_id}
        )

        return {
            "status": "success",
            "action": approval.action,
            "message": f"Request {approval.action}d successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing approval: {str(e)}"
        )

async def _implement_approved_changes(workflow):
    """
    Implement the approved changes to the organization's impact matrix.
    """
    try:
        # Extract the approved changes
        edited_content = workflow["edited_content"]

        # In a real implementation, this would update the organization impact matrix
        # For now, we'll just log the implementation
        print(f"Implementing approved changes: {edited_content}")

        # You would implement actual logic here to update the impact matrix
        # based on the approved edits

    except Exception as e:
        print(f"Error implementing approved changes: {str(e)}")
        # In production, you might want to handle rollback or notifications
