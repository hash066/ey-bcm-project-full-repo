"""
Approval workflow routes for managing clause edits and framework additions.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc

from app.database import get_db
from app.auth import get_current_active_user, check_approval_permission
from app.config_settings.role_mapping import get_approval_role, can_user_approve, get_user_permissions, MAIN_APP_ROLE_MAPPING
from app.middleware.approval_integration import ApprovalIntegrationMiddleware
from app.services.approval_engine import ApprovalWorkflowEngine
from app.models import (
    ApprovalRequest, ApprovalStep, User,
    ROLE_PROCESS_OWNER, ROLE_DEPARTMENT_HEAD, ROLE_ORGANIZATION_HEAD, ROLE_EY_ADMIN,
    APPROVAL_STATUS_PENDING, APPROVAL_STATUS_APPROVED, APPROVAL_STATUS_REJECTED,
    REQUEST_TYPE_CLAUSE_EDIT, REQUEST_TYPE_FRAMEWORK_ADDITION
)
from app.schemas import (
    ApprovalRequest, ApprovalRequestCreate, ApprovalStep, ApprovalStepCreate,
    ApprovalActionRequest, ClauseEditRequest, FrameworkAdditionRequest,
    RequestFilters, PaginationParams, PaginatedResponse, DashboardStats
)

router = APIRouter()

def get_next_approver_role(current_role: str) -> str:
    """
    Get the next role in the approval hierarchy.

    Args:
        current_role: Current approver role

    Returns:
        Next role in hierarchy or EY_ADMIN if at the top
    """
    role_hierarchy = {
        ROLE_PROCESS_OWNER: ROLE_DEPARTMENT_HEAD,
        ROLE_DEPARTMENT_HEAD: ROLE_ORGANIZATION_HEAD,
        ROLE_ORGANIZATION_HEAD: ROLE_EY_ADMIN,
        ROLE_EY_ADMIN: ROLE_EY_ADMIN  # EY Admin is the final level
    }

    return role_hierarchy.get(current_role, ROLE_EY_ADMIN)

def create_approval_request(
    request_type: str,
    title: str,
    payload: dict,
    submitted_by: User,
    db: Session
) -> ApprovalRequest:
    """
    Create a new approval request.

    Args:
        request_type: Type of request (clause_edit, framework_addition)
        title: Request title
        payload: Request data
        submitted_by: User submitting the request
        db: Database session

    Returns:
        Created approval request
    """
    # Determine the first approver role based on submitter's role
    first_approver_role = get_next_approver_role(submitted_by.role)

    approval_request = ApprovalRequest(
        type=request_type,
        title=title,
        payload=payload,
        submitted_by=submitted_by.id,
        current_approver_role=first_approver_role,
        status=APPROVAL_STATUS_PENDING
    )

    db.add(approval_request)
    db.commit()
    db.refresh(approval_request)

    return approval_request

@router.post("/clause-edit", response_model=ApprovalRequest)
async def submit_clause_edit(
    request: ClauseEditRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Submit a clause edit for approval.

    - **request**: Clause edit request data

    Returns created approval request.
    """
    # Only process owners can submit clause edits
    if current_user.role != ROLE_PROCESS_OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Process Owners can submit clause edits"
        )

    # Create approval request
    payload = {
        "job_id": request.job_id,
        "control_id": request.control_id,
        "clause_data": request.clause_data,
        "remedy": request.remedy,
        "justification": request.justification
    }

    approval_request = create_approval_request(
        request_type=REQUEST_TYPE_CLAUSE_EDIT,
        title=f"Clause Edit: {request.control_id}",
        payload=payload,
        submitted_by=current_user,
        db=db
    )

    return approval_request

@router.post("/framework-addition", response_model=ApprovalRequest)
async def submit_framework_addition(
    request: FrameworkAdditionRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Submit a framework addition for approval.

    - **request**: Framework addition request data

    Returns created approval request.
    """
    # Only process owners and department heads can submit framework additions
    if not check_approval_permission(current_user, ROLE_DEPARTMENT_HEAD):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to submit framework additions"
        )

    # Create approval request
    payload = {
        "framework_data": request.framework_data,
        "justification": request.justification
    }

    approval_request = create_approval_request(
        request_type=REQUEST_TYPE_FRAMEWORK_ADDITION,
        title=f"Framework Addition: {request.framework_data.get('name', 'Unknown')}",
        payload=payload,
        submitted_by=current_user,
        db=db
    )

    return approval_request

@router.get("/requests", response_model=PaginatedResponse)
async def get_approval_requests(
    status_filter: Optional[str] = Query(None),
    type_filter: Optional[str] = Query(None),
    role_filter: Optional[str] = Query(None),
    page: int = Query(1, gt=0),
    size: int = Query(20, gt=0, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get approval requests with filtering and pagination.

    - **status_filter**: Filter by status (pending, approved, rejected)
    - **type_filter**: Filter by type (clause_edit, framework_addition)
    - **role_filter**: Filter by current approver role
    - **page**: Page number
    - **size**: Page size

    Returns paginated list of approval requests.
    """
    # Build query based on user permissions
    query = db.query(ApprovalRequest)

    # Users can see requests they submitted or requests pending their approval
    query = query.filter(
        or_(
            ApprovalRequest.submitted_by == current_user.id,
            ApprovalRequest.current_approver_role == current_user.role
        )
    )

    # Apply filters
    if status_filter:
        query = query.filter(ApprovalRequest.status == status_filter)

    if type_filter:
        query = query.filter(ApprovalRequest.type == type_filter)

    if role_filter:
        query = query.filter(ApprovalRequest.current_approver_role == role_filter)

    # Get total count
    total = query.count()

    # Apply pagination and ordering
    requests = query.order_by(desc(ApprovalRequest.created_at)).offset((page - 1) * size).limit(size).all()

    # Calculate total pages
    pages = (total + size - 1) // size

    return PaginatedResponse(
        items=requests,
        total=total,
        page=page,
        size=size,
        pages=pages
    )

@router.get("/requests/{request_id}", response_model=ApprovalRequest)
async def get_approval_request(
    request_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get specific approval request details.

    - **request_id**: Approval request ID

    Returns approval request details.
    """
    request = db.query(ApprovalRequest).filter(ApprovalRequest.id == request_id).first()

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Approval request not found"
        )

    # Check if user can view this request
    if (request.submitted_by != current_user.id and
        request.current_approver_role != current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this request"
        )

    return request

@router.get("/pending", response_model=List[ApprovalRequest])
async def get_pending_approvals(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get approval requests pending current user's approval.

    Returns list of requests awaiting user's approval.
    """
    requests = db.query(ApprovalRequest).filter(
        and_(
            ApprovalRequest.current_approver_role == current_user.role,
            ApprovalRequest.status == APPROVAL_STATUS_PENDING
        )
    ).all()

    return requests

@router.post("/requests/{request_id}/approve", response_model=ApprovalRequest)
async def approve_request(
    request_id: int,
    action: ApprovalActionRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Approve or reject an approval request.

    - **request_id**: Approval request ID
    - **action**: Approval action (approved/rejected) with comments

    Returns updated approval request.
    """
    request = db.query(ApprovalRequest).filter(ApprovalRequest.id == request_id).first()

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Approval request not found"
        )

    # Check if user can approve this request
    if request.current_approver_role != current_user.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to approve this request"
        )

    if request.status != APPROVAL_STATUS_PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request is not in pending status"
        )

    # Create approval step record
    approval_step = ApprovalStep(
        request_id=request_id,
        role=current_user.role,
        approver_id=current_user.id,
        decision=action.decision,
        comments=action.comments
    )

    db.add(approval_step)

    # Update request status and history
    if action.decision == "approved":
        # Check if this is the final approval
        next_role = get_next_approver_role(current_user.role)

        if next_role == current_user.role:  # Final approval
            request.status = APPROVAL_STATUS_APPROVED
            request.current_approver_role = current_user.role  # Keep final approver
        else:
            request.current_approver_role = next_role
    else:
        request.status = APPROVAL_STATUS_REJECTED

    # Update approval history
    history_entry = {
        "step_id": approval_step.id,
        "role": current_user.role,
        "approver_id": current_user.id,
        "decision": action.decision,
        "comments": action.comments,
        "timestamp": approval_step.timestamp.isoformat()
    }

    if not request.approval_history:
        request.approval_history = []

    request.approval_history.append(history_entry)

    db.commit()
    db.refresh(request)

    return request

@router.get("/requests/{request_id}/steps", response_model=List[ApprovalStep])
async def get_approval_steps(
    request_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get approval steps for a request.

    - **request_id**: Approval request ID

    Returns list of approval steps.
    """
    request = db.query(ApprovalRequest).filter(ApprovalRequest.id == request_id).first()

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Approval request not found"
        )

    # Check if user can view this request
    if (request.submitted_by != current_user.id and
        request.current_approver_role != current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this request"
        )

    steps = db.query(ApprovalStep).filter(ApprovalStep.request_id == request_id).all()
    return steps

@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get dashboard statistics.

    Returns comprehensive statistics for the dashboard.
    """
    # Total users (only if user has permission to view)
    from app.auth import check_role_hierarchy
    total_users = 0
    if check_role_hierarchy(current_user, ROLE_DEPARTMENT_HEAD):
        total_users = db.query(User).filter(User.is_active == True).count()

    # Request statistics
    total_requests = db.query(ApprovalRequest).count()
    pending_approvals = db.query(ApprovalRequest).filter(
        ApprovalRequest.status == APPROVAL_STATUS_PENDING
    ).count()
    approved_requests = db.query(ApprovalRequest).filter(
        ApprovalRequest.status == APPROVAL_STATUS_APPROVED
    ).count()
    rejected_requests = db.query(ApprovalRequest).filter(
        ApprovalRequest.status == APPROVAL_STATUS_REJECTED
    ).count()

    # Requests by type
    clause_edits = db.query(ApprovalRequest).filter(
        ApprovalRequest.type == REQUEST_TYPE_CLAUSE_EDIT
    ).count()
    framework_additions = db.query(ApprovalRequest).filter(
        ApprovalRequest.type == REQUEST_TYPE_FRAMEWORK_ADDITION
    ).count()

    # Requests by role (current approver role)
    requests_by_role = {}
    for role in [ROLE_PROCESS_OWNER, ROLE_DEPARTMENT_HEAD, ROLE_ORGANIZATION_HEAD, ROLE_EY_ADMIN]:
        count = db.query(ApprovalRequest).filter(
            ApprovalRequest.current_approver_role == role
        ).count()
        requests_by_role[role] = count

    return DashboardStats(
        total_users=total_users,
        total_requests=total_requests,
        pending_approvals=pending_approvals,
        approved_requests=approved_requests,
        rejected_requests=rejected_requests,
        requests_by_type={
            REQUEST_TYPE_CLAUSE_EDIT: clause_edits,
            REQUEST_TYPE_FRAMEWORK_ADDITION: framework_additions
        },
        requests_by_role=requests_by_role
    )

# Integration endpoints for main app (header-based authentication)
@router.post("/clause-edit", response_model=ApprovalRequest)
async def submit_clause_edit_integration(
    request: ClauseEditRequest,
    # Main app user context via headers
    user_id: str = Query(..., description="User ID from main app"),
    user_role: str = Query(..., description="User role from main app"),
    user_email: str = Query(..., description="User email from main app"),
    db: Session = Depends(get_db)
):
    """
    Submit a clause edit for approval (integration endpoint for main app).

    This endpoint accepts user context via headers instead of local authentication,
    allowing seamless integration with your main application's authentication system.

    Headers required:
    - X-User-ID: User ID from your main app
    - X-User-Role: User role from your main app
    - X-User-Email: User email from your main app

    - **request**: Clause edit request data

    Returns created approval request.
    """
    # Validate user role mapping
    approval_role = get_approval_role(user_role)
    if not approval_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role '{user_role}' is not mapped to any approval role"
        )

    # Check permissions using role mapping
    permissions = get_user_permissions(user_role)
    if not permissions.get('can_submit_clause_edits', False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to submit clause edits"
        )

    # Create or get user record (link to main app user)
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        # Create user record if doesn't exist (for integration)
        user = User(
            email=user_email,
            name=user_email.split('@')[0],  # Use email prefix as name
            role=user_role,
            department="Integration",  # Default department
            organization="Main App",
            hashed_password="integration_user",  # Not used for header auth
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Create approval request
    payload = {
        "job_id": request.job_id,
        "control_id": request.control_id,
        "clause_data": request.clause_data,
        "remedy": request.remedy,
        "justification": request.justification,
        "main_app_user_id": user_id,
        "main_app_user_role": user_role
    }

    approval_request = create_approval_request(
        request_type=REQUEST_TYPE_CLAUSE_EDIT,
        title=f"Clause Edit: {request.control_id}",
        payload=payload,
        submitted_by=user,
        db=db
    )

    return approval_request

@router.get("/pending-integration")
async def get_pending_approvals_integration(
    user_role: str = Query(..., description="User role from main app"),
    db: Session = Depends(get_db)
):
    """
    Get approval requests pending for a main app user (integration endpoint).

    This endpoint accepts user role via query parameter and returns
    requests that the user can approve based on role mapping.

    - **user_role**: User role from your main app

    Returns list of requests awaiting user's approval.
    """
    # Map main app role to approval role
    approval_role = get_approval_role(user_role)
    if not approval_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role '{user_role}' is not mapped to any approval role"
        )

    # Get requests pending for this approval role
    requests = db.query(ApprovalRequest).filter(
        and_(
            ApprovalRequest.current_approver_role == user_role,  # Use main app role directly
            ApprovalRequest.status == APPROVAL_STATUS_PENDING
        )
    ).all()

    return requests

@router.post("/requests/{request_id}/approve-integration")
async def approve_request_integration(
    request_id: int,
    action: ApprovalActionRequest,
    user_id: str = Query(..., description="User ID from main app"),
    user_role: str = Query(..., description="User role from main app"),
    user_email: str = Query(..., description="User email from main app"),
    db: Session = Depends(get_db)
):
    """
    Approve or reject an approval request (integration endpoint for main app).

    This endpoint accepts user context via query parameters and processes
    the approval using role mapping permissions.

    - **request_id**: Approval request ID
    - **action**: Approval action (approved/rejected) with comments
    - **user_id**: User ID from main app
    - **user_role**: User role from main app
    - **user_email**: User email from main app

    Returns updated approval request.
    """
    # Get or create user record
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        user = User(
            email=user_email,
            name=user_email.split('@')[0],
            role=user_role,
            department="Integration",
            organization="Main App",
            hashed_password="integration_user",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Get the approval request
    request = db.query(ApprovalRequest).filter(ApprovalRequest.id == request_id).first()

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Approval request not found"
        )

    # Check if user can approve this request using role mapping
    if not can_user_approve(user_role, request.current_approver_role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to approve this request"
        )

    if request.status != APPROVAL_STATUS_PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request is not in pending status"
        )

    # Create approval step record
    approval_step = ApprovalStep(
        request_id=request_id,
        role=user_role,  # Use main app role
        approver_id=user.id,
        decision=action.decision,
        comments=action.comments
    )

    db.add(approval_step)

    # Update request status and history
    if action.decision == "approved":
        # Check if this is the final approval using role mapping
        next_approval_role = get_approval_role(user_role)
        if next_approval_role:
            # Check if there are higher roles that can approve
            role_levels = {'process_owner': 1, 'department_head': 2, 'organization_head': 3, 'ey_admin': 4}
            current_level = role_levels.get(next_approval_role.value, 0)

            has_higher_approvers = any(
                level > current_level for level in role_levels.values()
            )

            if not has_higher_approvers:
                request.status = APPROVAL_STATUS_APPROVED
                request.current_approver_role = user_role
            else:
                # Find next approver role
                for role, level in role_levels.items():
                    if level > current_level:
                        # Map back to main app role
                        main_app_roles = [r for r, mapped in MAIN_APP_ROLE_MAPPING.items() if mapped and mapped.value == role]
                        if main_app_roles:
                            request.current_approver_role = main_app_roles[0]
                            break
        else:
            request.status = APPROVAL_STATUS_APPROVED
            request.current_approver_role = user_role
    else:
        request.status = APPROVAL_STATUS_REJECTED

    # Update approval history
    history_entry = {
        "step_id": approval_step.id,
        "role": user_role,
        "approver_id": user_id,
        "decision": action.decision,
        "comments": action.comments,
        "timestamp": approval_step.timestamp.isoformat(),
        "main_app_user": True
    }

    if not request.approval_history:
        request.approval_history = []

    request.approval_history.append(history_entry)

    db.commit()
    db.refresh(request)

    return request

@router.get("/user-permissions")
async def get_user_permissions_integration(
    user_role: str = Query(..., description="User role from main app")
):
    """
    Get permissions for a main app user role (integration endpoint).

    - **user_role**: User role from your main app

    Returns user permissions based on role mapping.
    """
    permissions = get_user_permissions(user_role)

    return {
        "user_role": user_role,
        "approval_role": get_approval_role(user_role),
        "permissions": permissions,
        "can_approve_for_roles": [
            role for role in MAIN_APP_ROLE_MAPPING.keys()
            if can_user_approve(user_role, role)
        ]
    }
