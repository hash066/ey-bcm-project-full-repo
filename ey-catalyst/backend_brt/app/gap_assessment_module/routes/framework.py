"""
Framework management routes for global framework database.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.postgres import get_db
from ..auth import get_current_active_user, check_role_hierarchy
from ..models import Framework, User, ROLE_PROCESS_OWNER, ROLE_DEPARTMENT_HEAD, ROLE_ORGANIZATION_HEAD, ROLE_EY_ADMIN, ROLE_BCM_COORDINATOR
from ..schemas import Framework as FrameworkSchema, FrameworkCreate, PaginatedResponse

router = APIRouter()

@router.post("/", response_model=FrameworkSchema)
async def create_framework(
    framework_data: FrameworkCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new framework in the global database.

    - **framework_data**: Framework data

    Returns created framework.
    """
    # Only BCM Coordinator, CEO (Organization Head), and Admin can create frameworks
    allowed_roles = [ROLE_BCM_COORDINATOR, ROLE_ORGANIZATION_HEAD, ROLE_EY_ADMIN]
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to create frameworks. Only BCM Coordinator, CEO, and Admin can create frameworks"
        )

    # Check if framework with same name and version already exists
    existing_framework = db.query(Framework).filter(
        Framework.name == framework_data.name,
        Framework.version == framework_data.version
    ).first()

    if existing_framework:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Framework with same name and version already exists"
        )

    # Create framework
    framework = Framework(
        name=framework_data.name,
        version=framework_data.version,
        description=framework_data.description,
        content=framework_data.content,
        submitted_by=current_user.id,
        global_available=framework_data.global_available
    )

    db.add(framework)
    db.commit()
    db.refresh(framework)

    return framework

@router.get("/", response_model=PaginatedResponse)
async def get_frameworks(
    page: int = Query(1, gt=0),
    size: int = Query(20, gt=0, le=100),
    name_filter: Optional[str] = Query(None),
    version_filter: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get frameworks with filtering and pagination.

    - **page**: Page number
    - **size**: Page size
    - **name_filter**: Filter by framework name
    - **version_filter**: Filter by framework version

    Returns paginated list of frameworks.
    """
    # Build query with department-scoped visibility
    query = db.query(Framework)

    # Department-scoped visibility for Process Owners and Department Heads
    if current_user.role in [ROLE_PROCESS_OWNER, ROLE_DEPARTMENT_HEAD]:
        # Get users in the same department and organization
        department_users = db.query(User.id).filter(
            User.department == current_user.department,
            User.organization == current_user.organization,
            User.is_active == True
        ).subquery()

        # Only show frameworks submitted by users in the same department
        query = query.filter(Framework.submitted_by.in_(department_users))
    # Organization Heads and above can see all frameworks (no additional filtering needed)

    # Apply filters
    if name_filter:
        query = query.filter(Framework.name.ilike(f"%{name_filter}%"))

    if version_filter:
        query = query.filter(Framework.version == version_filter)

    # Get total count
    total = query.count()

    # Apply pagination and ordering
    frameworks = query.order_by(desc(Framework.created_at)).offset((page - 1) * size).limit(size).all()

    # Calculate total pages
    pages = (total + size - 1) // size

    return PaginatedResponse(
        items=frameworks,
        total=total,
        page=page,
        size=size,
        pages=pages
    )

@router.get("/{framework_id}", response_model=FrameworkSchema)
async def get_framework(
    framework_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get specific framework details.

    - **framework_id**: Framework ID

    Returns framework details.
    """
    framework = db.query(Framework).filter(Framework.id == framework_id).first()

    if not framework:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Framework not found"
        )

    return framework

@router.put("/{framework_id}", response_model=FrameworkSchema)
async def update_framework(
    framework_id: int,
    framework_update: FrameworkCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update framework information.

    - **framework_id**: Framework ID to update
    - **framework_update**: Updated framework data

    Returns updated framework.
    """
    framework = db.query(Framework).filter(Framework.id == framework_id).first()

    if not framework:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Framework not found"
        )

    # Check permissions - only organization heads and above can update frameworks
    if not check_role_hierarchy(current_user, ROLE_ORGANIZATION_HEAD):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to update frameworks"
        )

    # Check if another framework with same name and version exists
    existing_framework = db.query(Framework).filter(
        Framework.name == framework_update.name,
        Framework.version == framework_update.version,
        Framework.id != framework_id
    ).first()

    if existing_framework:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Another framework with same name and version already exists"
        )

    # Update framework fields
    framework.name = framework_update.name
    framework.version = framework_update.version
    framework.description = framework_update.description
    framework.content = framework_update.content
    framework.global_available = framework_update.global_available

    db.commit()
    db.refresh(framework)

    return framework

@router.delete("/{framework_id}")
async def delete_framework(
    framework_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a framework.

    - **framework_id**: Framework ID to delete

    Returns success message.
    """
    framework = db.query(Framework).filter(Framework.id == framework_id).first()

    if not framework:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Framework not found"
        )

    # Only EY Admins can delete frameworks
    if current_user.role != ROLE_EY_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only EY Admins can delete frameworks"
        )

    db.delete(framework)
    db.commit()

    return {"message": "Framework deleted successfully"}

@router.get("/available/list")
async def get_available_frameworks(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get list of globally available frameworks for dropdown selection.

    Returns list of framework names and versions.
    """
    frameworks = db.query(Framework).filter(
        Framework.global_available == True
    ).all()

    return [
        {
            "id": framework.id,
            "name": framework.name,
            "version": framework.version,
            "description": framework.description
        }
        for framework in frameworks
    ]

@router.post("/{framework_id}/approve")
async def approve_framework(
    framework_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Approve a framework (mark as approved by current user).

    - **framework_id**: Framework ID to approve

    Returns success message.
    """
    framework = db.query(Framework).filter(Framework.id == framework_id).first()

    if not framework:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Framework not found"
        )

    # Only organization heads and above can approve frameworks
    if not check_role_hierarchy(current_user, ROLE_ORGANIZATION_HEAD):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to approve frameworks"
        )

    # Update framework approval
    framework.approved_by = current_user.id
    db.commit()

    return {"message": "Framework approved successfully"}

@router.get("/stats/summary")
async def get_framework_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get framework statistics.

    Returns framework statistics.
    """
    total_frameworks = db.query(Framework).count()
    approved_frameworks = db.query(Framework).filter(
        Framework.approved_by.isnot(None)
    ).count()
    global_available = db.query(Framework).filter(
        Framework.global_available == True
    ).count()

    # Frameworks by user (if user has permission to view)
    frameworks_by_user = {}
    if check_role_hierarchy(current_user, ROLE_DEPARTMENT_HEAD):
        # Get framework counts by submitter
        user_frameworks = db.query(
            Framework.submitted_by,
            db.func.count(Framework.id).label('count')
        ).group_by(Framework.submitted_by).all()

        for user_id, count in user_frameworks:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                frameworks_by_user[user.email] = count

    return {
        "total_frameworks": total_frameworks,
        "approved_frameworks": approved_frameworks,
        "global_available": global_available,
        "frameworks_by_user": frameworks_by_user
    }
