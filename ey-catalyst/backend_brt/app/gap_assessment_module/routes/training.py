"""
Training corpus routes for AI model improvement with approved clause-remedy pairs.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.postgres import get_db
from ..auth import get_current_active_user, check_role_hierarchy
from ..models import TrainingCorpus, User, ROLE_PROCESS_OWNER, ROLE_DEPARTMENT_HEAD, ROLE_ORGANIZATION_HEAD, ROLE_EY_ADMIN
from ..schemas import TrainingCorpus as TrainingCorpusSchema, TrainingCorpusCreate, PaginatedResponse

router = APIRouter()

@router.post("/", response_model=TrainingCorpusSchema)
async def create_training_entry(
    training_data: TrainingCorpusCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new training corpus entry.

    - **training_data**: Training corpus data

    Returns created training corpus entry.
    """
    # Only process owners and above can create training entries
    if not check_role_hierarchy(current_user, ROLE_PROCESS_OWNER):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to create training entries"
        )

    # Create training corpus entry
    training_entry = TrainingCorpus(
        clause_id=training_data.clause_id,
        remedy=training_data.remedy,
        source=training_data.source,
        submitted_by=current_user.id,
        approval_status="pending"  # Default to pending approval
    )

    db.add(training_entry)
    db.commit()
    db.refresh(training_entry)

    return training_entry

@router.get("/", response_model=PaginatedResponse)
async def get_training_entries(
    page: int = Query(1, gt=0),
    size: int = Query(20, gt=0, le=100),
    clause_id_filter: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    source_filter: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get training corpus entries with filtering and pagination.

    - **page**: Page number
    - **size**: Page size
    - **clause_id_filter**: Filter by clause ID
    - **status_filter**: Filter by approval status
    - **source_filter**: Filter by source

    Returns paginated list of training entries.
    """
    # Build query
    query = db.query(TrainingCorpus)

    # Apply filters
    if clause_id_filter:
        query = query.filter(TrainingCorpus.clause_id.ilike(f"%{clause_id_filter}%"))

    if status_filter:
        query = query.filter(TrainingCorpus.approval_status == status_filter)

    if source_filter:
        query = query.filter(TrainingCorpus.source == source_filter)

    # Get total count
    total = query.count()

    # Apply pagination and ordering
    training_entries = query.order_by(desc(TrainingCorpus.created_at)).offset((page - 1) * size).limit(size).all()

    # Calculate total pages
    pages = (total + size - 1) // size

    return PaginatedResponse(
        items=training_entries,
        total=total,
        page=page,
        size=size,
        pages=pages
    )

@router.get("/{entry_id}", response_model=TrainingCorpusSchema)
async def get_training_entry(
    entry_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get specific training corpus entry details.

    - **entry_id**: Training entry ID

    Returns training entry details.
    """
    entry = db.query(TrainingCorpus).filter(TrainingCorpus.id == entry_id).first()

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training entry not found"
        )

    return entry

@router.put("/{entry_id}", response_model=TrainingCorpusSchema)
async def update_training_entry(
    entry_id: int,
    training_update: TrainingCorpusCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update training corpus entry.

    - **entry_id**: Training entry ID to update
    - **training_update**: Updated training data

    Returns updated training entry.
    """
    entry = db.query(TrainingCorpus).filter(TrainingCorpus.id == entry_id).first()

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training entry not found"
        )

    # Check permissions - only the submitter or higher roles can update
    if (entry.submitted_by != current_user.id and
        not check_role_hierarchy(current_user, ROLE_DEPARTMENT_HEAD)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to update this training entry"
        )

    # Update entry fields
    entry.clause_id = training_update.clause_id
    entry.remedy = training_update.remedy
    entry.source = training_update.source

    db.commit()
    db.refresh(entry)

    return entry

@router.delete("/{entry_id}")
async def delete_training_entry(
    entry_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a training corpus entry.

    - **entry_id**: Training entry ID to delete

    Returns success message.
    """
    entry = db.query(TrainingCorpus).filter(TrainingCorpus.id == entry_id).first()

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training entry not found"
        )

    # Check permissions - only department heads and above can delete
    if not check_role_hierarchy(current_user, ROLE_DEPARTMENT_HEAD):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to delete training entries"
        )

    db.delete(entry)
    db.commit()

    return {"message": "Training entry deleted successfully"}

@router.post("/{entry_id}/approve")
async def approve_training_entry(
    entry_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Approve a training corpus entry.

    - **entry_id**: Training entry ID to approve

    Returns success message.
    """
    entry = db.query(TrainingCorpus).filter(TrainingCorpus.id == entry_id).first()

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training entry not found"
        )

    # Only department heads and above can approve training entries
    if not check_role_hierarchy(current_user, ROLE_DEPARTMENT_HEAD):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to approve training entries"
        )

    # Update entry approval
    entry.approval_status = "approved"
    entry.approved_by = current_user.id
    db.commit()

    return {"message": "Training entry approved successfully"}

@router.post("/{entry_id}/reject")
async def reject_training_entry(
    entry_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Reject a training corpus entry.

    - **entry_id**: Training entry ID to reject

    Returns success message.
    """
    entry = db.query(TrainingCorpus).filter(TrainingCorpus.id == entry_id).first()

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training entry not found"
        )

    # Only department heads and above can reject training entries
    if not check_role_hierarchy(current_user, ROLE_DEPARTMENT_HEAD):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to reject training entries"
        )

    # Update entry status
    entry.approval_status = "rejected"
    entry.approved_by = current_user.id
    db.commit()

    return {"message": "Training entry rejected"}

@router.get("/approved/list")
async def get_approved_training_entries(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get list of approved training entries for AI model training.

    Returns list of approved clause-remedy pairs.
    """
    entries = db.query(TrainingCorpus).filter(
        TrainingCorpus.approval_status == "approved"
    ).all()

    return [
        {
            "id": entry.id,
            "clause_id": entry.clause_id,
            "remedy": entry.remedy,
            "source": entry.source,
            "submitted_by": entry.submitted_by_user.email if entry.submitted_by_user else "Unknown",
            "created_at": entry.created_at.isoformat()
        }
        for entry in entries
    ]

@router.get("/pending/approvals")
async def get_pending_training_approvals(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get training entries pending approval for current user.

    Returns list of training entries awaiting user's approval.
    """
    # Only department heads and above can approve training entries
    if not check_role_hierarchy(current_user, ROLE_DEPARTMENT_HEAD):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view pending approvals"
        )

    entries = db.query(TrainingCorpus).filter(
        TrainingCorpus.approval_status == "pending"
    ).all()

    return entries

@router.get("/stats/summary")
async def get_training_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get training corpus statistics.

    Returns training corpus statistics.
    """
    total_entries = db.query(TrainingCorpus).count()
    approved_entries = db.query(TrainingCorpus).filter(
        TrainingCorpus.approval_status == "approved"
    ).count()
    rejected_entries = db.query(TrainingCorpus).filter(
        TrainingCorpus.approval_status == "rejected"
    ).count()
    pending_entries = db.query(TrainingCorpus).filter(
        TrainingCorpus.approval_status == "pending"
    ).count()

    # Entries by source
    entries_by_source = {}
    source_stats = db.query(
        TrainingCorpus.source,
        db.func.count(TrainingCorpus.id).label('count')
    ).group_by(TrainingCorpus.source).all()

    for source, count in source_stats:
        if source:
            entries_by_source[source] = count

    # Entries by user (if user has permission to view)
    entries_by_user = {}
    if check_role_hierarchy(current_user, ROLE_DEPARTMENT_HEAD):
        # Get entry counts by submitter
        user_entries = db.query(
            TrainingCorpus.submitted_by,
            db.func.count(TrainingCorpus.id).label('count')
        ).group_by(TrainingCorpus.submitted_by).all()

        for user_id, count in user_entries:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                entries_by_user[user.email] = count

    return {
        "total_entries": total_entries,
        "approved_entries": approved_entries,
        "rejected_entries": rejected_entries,
        "pending_entries": pending_entries,
        "entries_by_source": entries_by_source,
        "entries_by_user": entries_by_user
    }
