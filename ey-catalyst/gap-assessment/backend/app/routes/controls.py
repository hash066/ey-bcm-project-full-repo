"""
Controls routes for accessing and managing gap analysis results.
"""

import json
import logging
from typing import Dict, List, Optional, Any
from pathlib import Path
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query, Path as PathParam, Depends
from pydantic import BaseModel, Field

from app.utils.gap_calculator import GapAnalysisResult, AssessmentComment
from app.middleware.rbac import require_process_owner, check_resource_ownership
from app.auth import get_current_active_user
from app.middleware.approval_integration import get_approval_integration, integrate_clause_edit, ApprovalIntegrationMiddleware
from app.models import ApprovalRequest, User
from app.database import get_db
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# Pydantic Models
class ControlsListResponse(BaseModel):
    """Response model for controls list."""
    controls: List[GapAnalysisResult] = Field(..., description="List of controls")
    total: int = Field(..., description="Total number of controls matching filters")
    filters_applied: Dict[str, str] = Field(..., description="Filters that were applied")

class ControlResponse(BaseModel):
    """Response model for single control."""
    control: GapAnalysisResult = Field(..., description="Control details")

class CommentRequest(BaseModel):
    """Request model for adding comments."""
    comment: str = Field(..., description="Comment text")
    reviewer: str = Field(..., description="Reviewer name")

class CommentResponse(BaseModel):
    """Response model for comment operations."""
    success: bool = Field(..., description="Operation success status")
    message: str = Field(..., description="Operation result message")
    comment: AssessmentComment = Field(..., description="Added comment details")

# Create router
router = APIRouter()

def load_processed_data(job_id: str) -> Dict[str, Any]:
    """
    Load processed data from JSON file.

    Args:
        job_id: Job identifier

    Returns:
        Processed data dictionary

    Raises:
        HTTPException: If job data not found or invalid
    """
    file_path = Path("data/processed") / f"{job_id}.json"

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Processed data not found for job {job_id}. Make sure the job has completed processing."
        )

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Validate that this is a completed job
        if data.get('gap_analysis', {}).get('results') is None:
            raise HTTPException(
                status_code=404,
                detail=f"Gap analysis results not found for job {job_id}"
            )

        return data

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail=f"Invalid JSON data for job {job_id}"
        )
    except Exception as e:
        logger.error(f"Error loading processed data for job {job_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error loading processed data: {str(e)}"
        )

def save_processed_data(job_id: str, data: Dict[str, Any]) -> None:
    """
    Save processed data to JSON file.

    Args:
        job_id: Job identifier
        data: Data to save

    Raises:
        HTTPException: If saving fails
    """
    file_path = Path("data/processed") / f"{job_id}.json"

    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        logger.info(f"Saved updated data for job {job_id}")
    except Exception as e:
        logger.error(f"Error saving processed data for job {job_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error saving updated data: {str(e)}"
        )

def find_control_by_id(results: List[Dict[str, Any]], control_id: str) -> Optional[Dict[str, Any]]:
    """
    Find a control by its ID in the results list.

    Args:
        results: List of gap analysis results
        control_id: Control ID to search for

    Returns:
        Control data if found, None otherwise
    """
    for result in results:
        if result.get('id') == control_id:
            return result
    return None

def filter_controls(
    results: List[Dict[str, Any]],
    framework: Optional[str] = None,
    domain: Optional[str] = None,
    priority: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Filter controls based on query parameters.

    Args:
        results: List of gap analysis results
        framework: Framework filter
        domain: Domain filter
        priority: Priority filter

    Returns:
        Filtered list of controls
    """
    filtered_results = results

    if framework:
        filtered_results = [r for r in filtered_results if r.get('framework') == framework]

    if domain:
        filtered_results = [r for r in filtered_results if r.get('domain') == domain]

    if priority:
        filtered_results = [r for r in filtered_results if r.get('priority') == priority]

    return filtered_results

@router.get("/controls", response_model=ControlsListResponse)
async def get_controls(
    job_id: str = Query(..., alias="jobId", description="Job ID to get controls from"),
    framework: Optional[str] = Query(None, description="Filter by framework name"),
    domain: Optional[str] = Query(None, description="Filter by domain name"),
    priority: Optional[str] = Query(None, description="Filter by priority level")
):
    """
    Get list of controls with optional filtering.

    - **job_id**: Job identifier returned from upload endpoint
    - **framework**: Filter by framework name (optional)
    - **domain**: Filter by domain name (optional)
    - **priority**: Filter by priority level (optional)

    Returns filtered list of controls matching the criteria.
    """
    logger.info(f"Getting controls for job {job_id} with filters: framework={framework}, domain={domain}, priority={priority}")

    # Load processed data
    data = load_processed_data(job_id)

    # Extract gap analysis results
    gap_results = data.get('gap_analysis', {}).get('results', [])

    if not gap_results:
        raise HTTPException(
            status_code=404,
            detail=f"No gap analysis results found for job {job_id}"
        )

    # Apply filters
    filtered_controls = filter_controls(gap_results, framework, domain, priority)

    # Convert to GapAnalysisResult objects for response
    controls = []
    for control_data in filtered_controls:
        try:
            control = GapAnalysisResult(**control_data)
            controls.append(control)
        except Exception as e:
            logger.warning(f"Error parsing control data: {str(e)}")
            continue

    # Build filters applied info
    filters_applied = {}
    if framework:
        filters_applied['framework'] = framework
    if domain:
        filters_applied['domain'] = domain
    if priority:
        filters_applied['priority'] = priority

    return ControlsListResponse(
        controls=controls,
        total=len(controls),
        filters_applied=filters_applied
    )

@router.get("/controls/{control_id}", response_model=ControlResponse)
async def get_control(
    control_id: str = PathParam(..., description="Control ID to retrieve"),
    job_id: str = Query(..., alias="jobId", description="Job ID the control belongs to")
):
    """
    Get a specific control by its ID.

    - **control_id**: Unique identifier for the control
    - **job_id**: Job identifier returned from upload endpoint

    Returns detailed information about the specified control.
    """
    logger.info(f"Getting control {control_id} for job {job_id}")

    # Load processed data
    data = load_processed_data(job_id)

    # Extract gap analysis results
    gap_results = data.get('gap_analysis', {}).get('results', [])

    if not gap_results:
        raise HTTPException(
            status_code=404,
            detail=f"No gap analysis results found for job {job_id}"
        )

    # Find the specific control
    control_data = find_control_by_id(gap_results, control_id)

    if not control_data:
        raise HTTPException(
            status_code=404,
            detail=f"Control {control_id} not found in job {job_id}"
        )

    # Convert to GapAnalysisResult object
    try:
        control = GapAnalysisResult(**control_data)
    except Exception as e:
        logger.error(f"Error parsing control data for {control_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error parsing control data: {str(e)}"
        )

    return ControlResponse(control=control)

@router.post("/controls/{control_id}/comments", response_model=CommentResponse)
async def add_control_comment(
    comment_request: CommentRequest,
    control_id: str = PathParam(..., description="Control ID to add comment to"),
    job_id: str = Query(..., alias="jobId", description="Job ID the control belongs to")
):
    """
    Add a comment to a specific control.

    - **control_id**: Unique identifier for the control
    - **job_id**: Job identifier returned from upload endpoint
    - **comment_request**: Comment details including text and reviewer

    Adds the comment to the control's assessment_comments array and saves the updated data.
    """
    logger.info(f"Adding comment to control {control_id} for job {job_id}")

    # Validate comment request
    if not comment_request.comment.strip():
        raise HTTPException(
            status_code=400,
            detail="Comment text cannot be empty"
        )

    if not comment_request.reviewer.strip():
        raise HTTPException(
            status_code=400,
            detail="Reviewer name cannot be empty"
        )

    # Load processed data
    data = load_processed_data(job_id)

    # Extract gap analysis results
    gap_results = data.get('gap_analysis', {}).get('results', [])

    if not gap_results:
        raise HTTPException(
            status_code=404,
            detail=f"No gap analysis results found for job {job_id}"
        )

    # Find the specific control
    control_data = find_control_by_id(gap_results, control_id)

    if not control_data:
        raise HTTPException(
            status_code=404,
            detail=f"Control {control_id} not found in job {job_id}"
        )

    # Create new comment
    new_comment = AssessmentComment(
        comment=comment_request.comment.strip(),
        reviewer=comment_request.reviewer.strip()
    )

    # Add comment to control data
    if 'assessment_comments' not in control_data:
        control_data['assessment_comments'] = []

    control_data['assessment_comments'].append(new_comment.dict())

    # Save updated data
    save_processed_data(job_id, data)

    logger.info(f"Added comment to control {control_id} by {comment_request.reviewer}")

    return CommentResponse(
        success=True,
        message=f"Comment added successfully to control {control_id}",
        comment=new_comment
    )

class ClauseEditRequest(BaseModel):
    """Request model for clause edits."""
    remedy: str = Field(..., description="Proposed remedy for the clause")
    justification: str = Field(..., description="Justification for the edit")
    required_actions: Optional[List[str]] = Field(default=None, description="Updated required actions")
    evidence_required: Optional[List[str]] = Field(default=None, description="Updated evidence requirements")

class ClauseEditResponse(BaseModel):
    """Response model for clause edit operations."""
    success: bool = Field(..., description="Operation success status")
    message: str = Field(..., description="Operation result message")
    approval_required: bool = Field(..., description="Whether approval is required")
    approval_request_id: Optional[int] = Field(None, description="Approval request ID if approval is required")
    updated_control: Optional[GapAnalysisResult] = Field(None, description="Updated control if no approval required")

@router.post("/controls/{control_id}/edit", response_model=ClauseEditResponse)
async def edit_control_clause(
    clause_edit: ClauseEditRequest,
    control_id: str = PathParam(..., description="Control ID to edit"),
    job_id: str = Query(..., alias="jobId", description="Job ID the control belongs to"),
    current_user: User = Depends(require_process_owner),
    integration: ApprovalIntegrationMiddleware = Depends(get_approval_integration)
):
    """
    Edit a control clause with approval workflow integration.

    - **control_id**: Unique identifier for the control
    - **job_id**: Job identifier returned from upload endpoint
    - **clause_edit**: Clause edit details including remedy and justification

    This endpoint integrates with the approval workflow. Process Owners can submit edits,
    but they require approval from higher-level roles before being applied.
    """
    logger.info(f"Processing clause edit for control {control_id} in job {job_id}")

    # Load processed data
    data = load_processed_data(job_id)

    # Extract gap analysis results
    gap_results = data.get('gap_analysis', {}).get('results', [])

    if not gap_results:
        raise HTTPException(
            status_code=404,
            detail=f"No gap analysis results found for job {job_id}"
        )

    # Find the specific control
    control_data = find_control_by_id(gap_results, control_id)

    if not control_data:
        raise HTTPException(
            status_code=404,
            detail=f"Control {control_id} not found in job {job_id}"
        )

    # Prepare clause edit data for approval
    edit_data = {
        "job_id": job_id,
        "control_id": control_id,
        "original_control": control_data,
        "remedy": clause_edit.remedy,
        "justification": clause_edit.justification,
        "required_actions": clause_edit.required_actions,
        "evidence_required": clause_edit.evidence_required,
        "submitted_by": current_user.id,
        "submitted_at": datetime.utcnow().isoformat()
    }

    try:
        # Submit for approval
        approval_result = integration.require_clause_edit_approval(edit_data)

        return ClauseEditResponse(
            success=True,
            message=approval_result["message"],
            approval_required=True,
            approval_request_id=approval_result["approval_request_id"]
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing clause edit: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing clause edit: {str(e)}"
        )

@router.get("/controls/{control_id}/approval-status")
async def get_clause_approval_status(
    control_id: str = PathParam(..., description="Control ID"),
    job_id: str = Query(..., alias="jobId", description="Job ID the control belongs to"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get approval status for a clause edit.

    - **control_id**: Control ID
    - **job_id**: Job ID

    Returns approval status for any pending clause edits.
    """
    # Find approval requests for this control
    approval_requests = db.query(ApprovalRequest).filter(
        ApprovalRequest.payload["control_id"].astext == control_id,
        ApprovalRequest.payload["job_id"].astext == job_id
    ).all()

    if not approval_requests:
        return {
            "has_pending_approval": False,
            "message": "No pending approvals for this clause"
        }

    # Get the most recent request
    latest_request = max(approval_requests, key=lambda r: r.created_at)

    return {
        "has_pending_approval": latest_request.status == "pending",
        "approval_request_id": latest_request.id,
        "status": latest_request.status,
        "current_approver_role": latest_request.current_approver_role,
        "submitted_at": latest_request.created_at.isoformat(),
        "submitted_by": latest_request.submitted_by_user.name if latest_request.submitted_by_user else "Unknown"
    }
