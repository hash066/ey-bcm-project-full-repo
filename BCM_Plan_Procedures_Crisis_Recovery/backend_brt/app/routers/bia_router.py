"""
Business Impact Analysis (BIA) router for handling BIA-related operations.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Dict, Any, List, Optional
from uuid import UUID
import json

from app.db.postgres import get_db
from app.middleware.auth import get_current_user, require_permission
from app.models.rbac_models import User
from app.models.global_models import GlobalOrganization, GlobalDepartment, GlobalSubdepartment, GlobalProcess
from app.models.bia_models import BIAProcessInfo, BIADepartmentInfo, BIASubdepartmentInfo, ProcessImpactAnalysis
from app.schemas.bia_schemas import (
    BIAProcessRequest, BIAProcessInfoCreate, BIAProcessInfoUpdate, 
    BIAProcessInfo as BIAProcessInfoSchema, BIAProcessInfoWithName,
    BIAProcessBulkUpdate, ProcessImpactAnalysisCreate, ProcessImpactAnalysisUpdate,
    ProcessImpactAnalysisResponse, ProcessImpactAnalysisBulkUpdate
)

router = APIRouter(
    prefix="/bia",
    tags=["bia"],
    responses={404: {"description": "Not found"}},
)

@router.post("/processes", response_model=List[Dict[str, Any]])
async def get_processes_for_bia(
    request: BIAProcessRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get processes for BIA based on organization ID, department name, and subdepartment name.
    Also includes any existing BIA information for these processes.
    """
    try:
        # First, verify the organization exists
        organization = db.query(GlobalOrganization).filter(
            GlobalOrganization.id == request.organization_id
        ).first()
        
        if not organization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Organization with ID {request.organization_id} not found"
            )
        
        # Find the department by name within the organization
        department = db.query(GlobalDepartment).filter(
            GlobalDepartment.organization_id == request.organization_id,
            GlobalDepartment.name == request.department_name
        ).first()
        
        if not department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Department '{request.department_name}' not found in the specified organization"
            )
        
        # Find the subdepartment by name within the department
        subdepartment = db.query(GlobalSubdepartment).filter(
            GlobalSubdepartment.department_id == department.id,
            GlobalSubdepartment.name == request.subdepartment_name
        ).first()
        
        if not subdepartment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Subdepartment '{request.subdepartment_name}' not found in the specified department"
            )
        
        # Get all processes for this subdepartment
        processes = db.query(GlobalProcess).filter(
            GlobalProcess.subdepartment_id == subdepartment.id
        ).all()
        
        # Get any existing BIA information for these processes
        result = []
        for process in processes:
            # Check if BIA info exists for this process
            bia_info = db.query(BIAProcessInfo).filter(
                BIAProcessInfo.process_id == process.id
            ).first()
            
            process_data = {
                "id": str(process.id),
                "name": process.name,
                "process_owner": process.process_owner or "",
                "bia_info": None
            }
            
            if bia_info:
                process_data["bia_info"] = {
                    "id": str(bia_info.id),
                    "description": bia_info.description,
                    "peak_period": bia_info.peak_period,
                    "spoc": bia_info.spoc,
                    "review_status": bia_info.review_status
                }
            
            result.append(process_data)
        
        return result
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving processes: {str(e)}"
        )

@router.post("/process-info", response_model=BIAProcessInfoSchema)
async def create_process_bia_info(
    bia_info: BIAProcessInfoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create BIA information for a process.
    """
    try:
        # Check if the process exists
        process = db.query(GlobalProcess).filter(GlobalProcess.id == bia_info.process_id).first()
        if not process:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Process with ID {bia_info.process_id} not found"
            )
        
        # Check if BIA info already exists for this process
        existing_info = db.query(BIAProcessInfo).filter(
            BIAProcessInfo.process_id == bia_info.process_id
        ).first()
        
        if existing_info:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"BIA information already exists for process with ID {bia_info.process_id}"
            )
        
        # Create new BIA info
        new_bia_info = BIAProcessInfo(
            process_id=bia_info.process_id,
            description=bia_info.description,
            peak_period=bia_info.peak_period,
            spoc=bia_info.spoc,
            review_status=bia_info.review_status
        )
        
        db.add(new_bia_info)
        db.commit()
        db.refresh(new_bia_info)
        
        return new_bia_info
    
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating BIA information: {str(e)}"
        )

@router.put("/process-info/{bia_info_id}", response_model=BIAProcessInfoSchema)
async def update_process_bia_info(
    bia_info_id: UUID,
    bia_info_update: BIAProcessInfoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update BIA information for a process.
    """
    try:
        # Check if BIA info exists
        existing_info = db.query(BIAProcessInfo).filter(BIAProcessInfo.id == bia_info_id).first()
        
        if not existing_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"BIA information with ID {bia_info_id} not found"
            )
        
        # Update fields
        if bia_info_update.description is not None:
            existing_info.description = bia_info_update.description
        if bia_info_update.peak_period is not None:
            existing_info.peak_period = bia_info_update.peak_period
        if bia_info_update.spoc is not None:
            existing_info.spoc = bia_info_update.spoc
        if bia_info_update.review_status is not None:
            existing_info.review_status = bia_info_update.review_status
        
        db.commit()
        db.refresh(existing_info)
        
        return existing_info
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating BIA information: {str(e)}"
        )

@router.post("/bulk-update", response_model=Dict[str, Any])
async def bulk_update_process_bia_info(
    bulk_update: BIAProcessBulkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Bulk update or create BIA information for multiple processes.
    This endpoint is designed to handle the form submission from the BIA information page.
    """
    try:
        # First, get the subdepartment ID
        organization = db.query(GlobalOrganization).filter(
            GlobalOrganization.id == bulk_update.organization_id
        ).first()
        
        if not organization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Organization with ID {bulk_update.organization_id} not found"
            )
        
        department = db.query(GlobalDepartment).filter(
            GlobalDepartment.organization_id == bulk_update.organization_id,
            GlobalDepartment.name == bulk_update.department_name
        ).first()
        
        if not department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Department '{bulk_update.department_name}' not found in the specified organization"
            )
        
        subdepartment = db.query(GlobalSubdepartment).filter(
            GlobalSubdepartment.department_id == department.id,
            GlobalSubdepartment.name == bulk_update.subdepartment_name
        ).first()
        
        if not subdepartment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Subdepartment '{bulk_update.subdepartment_name}' not found in the specified department"
            )
        
        # Process each process update
        updated_processes = []
        skipped_processes = []
        
        print(f"Processing {len(bulk_update.processes)} processes")
        
        for process_data in bulk_update.processes:
            process_id = process_data.get("id")
            process_name = process_data.get("name", "Unknown")
            
            # Find the process either by ID or by name
            process = None
            
            if process_id:
                # If ID is provided, try to find by ID
                try:
                    process_id = UUID(process_id)
                    process = db.query(GlobalProcess).filter(
                        GlobalProcess.id == process_id,
                        GlobalProcess.subdepartment_id == subdepartment.id
                    ).first()
                except ValueError:
                    print(f"Invalid UUID format: {process_id} for process {process_name}")
            
            if not process and process_name:
                # If process not found by ID or ID not provided, try to find by name
                print(f"Looking up process by name: {process_name}")
                process = db.query(GlobalProcess).filter(
                    GlobalProcess.name == process_name,
                    GlobalProcess.subdepartment_id == subdepartment.id
                ).first()
            
            if not process:
                print(f"Process not found: {process_name}")
                skipped_processes.append(f"{process_name} (Not found)")
                continue
                
            print(f"Found process: {process.name} with ID: {process.id}")
            
            # Check if BIA info exists for this process
            bia_info = db.query(BIAProcessInfo).filter(
                BIAProcessInfo.process_id == process.id
            ).first()
            
            # Handle the peak_period field which might be camelCase in the request
            peak_period = process_data.get("peak_period")
            if peak_period is None:
                peak_period = process_data.get("peakPeriod")
            
            if bia_info:
                # Update existing BIA info
                print(f"Updating existing BIA info for process: {process.name}")
                if "description" in process_data:
                    bia_info.description = process_data.get("description")
                if peak_period is not None:
                    bia_info.peak_period = peak_period
                if "spoc" in process_data:
                    bia_info.spoc = process_data.get("spoc")
                bia_info.review_status = bulk_update.review_status
            else:
                # Create new BIA info
                print(f"Creating new BIA info for process: {process.name}")
                try:
                    bia_info = BIAProcessInfo(
                        process_id=process.id,
                        description=process_data.get("description"),
                        peak_period=peak_period,
                        spoc=process_data.get("spoc"),
                        review_status=bulk_update.review_status
                    )
                    db.add(bia_info)
                    print(f"Added new BIA info for {process.name}")
                except Exception as e:
                    print(f"Error creating BIA info for {process.name}: {str(e)}")
                    skipped_processes.append(f"{process.name} (Error: {str(e)})")
                    continue
            
            updated_processes.append(process.name)
        
        print(f"Committing changes for {len(updated_processes)} processes")
        db.commit()
        print("Commit successful")
        
        return {
            "status": "success",
            "message": f"Updated BIA information for {len(updated_processes)} processes",
            "updated_processes": updated_processes,
            "skipped_processes": skipped_processes
        }
    
    except Exception as e:
        db.rollback()
        print(f"Error in bulk update: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating BIA information: {str(e)}"
        )

@router.get("/process-info/{process_id}", response_model=BIAProcessInfoWithName)
async def get_process_bia_info(
    process_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get BIA information for a specific process.
    """
    try:
        # Check if the process exists
        process = db.query(GlobalProcess).filter(GlobalProcess.id == process_id).first()
        if not process:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Process with ID {process_id} not found"
            )
        
        # Get BIA info
        bia_info = db.query(BIAProcessInfo).filter(
            BIAProcessInfo.process_id == process_id
        ).first()
        
        if not bia_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"BIA information for process with ID {process_id} not found"
            )
        
        # Combine process name with BIA info
        result = {
            "id": bia_info.id,
            "process_id": bia_info.process_id,
            "process_name": process.name,
            "description": bia_info.description,
            "peak_period": bia_info.peak_period,
            "spoc": bia_info.spoc,
            "review_status": bia_info.review_status,
            "created_at": bia_info.created_at,
            "updated_at": bia_info.updated_at
        }
        
        return result
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving BIA information: {str(e)}"
        )

@router.post("/impact-analysis", response_model=ProcessImpactAnalysisResponse)
async def create_process_impact_analysis(
    impact_analysis: ProcessImpactAnalysisCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create impact analysis for a process.
    """
    try:
        # Verify the process exists
        process = db.query(GlobalProcess).filter(
            GlobalProcess.id == impact_analysis.process_id
        ).first()
        
        if not process:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Process with ID {impact_analysis.process_id} not found"
            )
        
        # Check if impact analysis already exists for this process
        existing_analysis = db.query(ProcessImpactAnalysis).filter(
            ProcessImpactAnalysis.process_id == impact_analysis.process_id
        ).first()
        
        if existing_analysis:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Impact analysis already exists for process with ID {impact_analysis.process_id}"
            )
        
        # Convert impact_data to JSON string if it's a dict
        impact_data_json = json.dumps(impact_analysis.impact_data) if impact_analysis.impact_data else None
        
        # Convert highest_impact to JSON string if it's a dict
        highest_impact = impact_analysis.highest_impact
        if isinstance(highest_impact, dict):
            highest_impact = json.dumps(highest_impact)
        elif highest_impact is not None and not isinstance(highest_impact, str):
            highest_impact = str(highest_impact)
        
        # Create new impact analysis
        new_analysis = ProcessImpactAnalysis(
            process_id=impact_analysis.process_id,
            rto=impact_analysis.rto,
            mtpd=impact_analysis.mtpd,
            impact_data=impact_data_json,
            highest_impact=highest_impact,
            is_critical=impact_analysis.is_critical,
            rationale=impact_analysis.rationale
        )
        
        db.add(new_analysis)
        db.commit()
        db.refresh(new_analysis)
        
        # Convert JSON string back to dict for response
        if new_analysis.impact_data:
            new_analysis.impact_data = json.loads(new_analysis.impact_data)
        else:
            new_analysis.impact_data = {}
        
        return new_analysis
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating impact analysis: {str(e)}"
        )

@router.put("/impact-analysis/{impact_analysis_id}", response_model=ProcessImpactAnalysisResponse)
async def update_process_impact_analysis(
    impact_analysis_id: UUID,
    impact_analysis_update: ProcessImpactAnalysisUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update impact analysis for a process.
    """
    try:
        # Find the impact analysis
        analysis = db.query(ProcessImpactAnalysis).filter(
            ProcessImpactAnalysis.id == impact_analysis_id
        ).first()
        
        if not analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Impact analysis with ID {impact_analysis_id} not found"
            )
        
        # Update fields if provided
        if impact_analysis_update.rto is not None:
            analysis.rto = impact_analysis_update.rto
        if impact_analysis_update.mtpd is not None:
            analysis.mtpd = impact_analysis_update.mtpd
        if impact_analysis_update.impact_data is not None:
            analysis.impact_data = json.dumps(impact_analysis_update.impact_data)
        if impact_analysis_update.highest_impact is not None:
            # Convert highest_impact to JSON string if it's a dict
            highest_impact = impact_analysis_update.highest_impact
            if isinstance(highest_impact, dict):
                analysis.highest_impact = json.dumps(highest_impact)
            elif not isinstance(highest_impact, str):
                analysis.highest_impact = str(highest_impact)
            else:
                analysis.highest_impact = highest_impact
        if impact_analysis_update.is_critical is not None:
            analysis.is_critical = impact_analysis_update.is_critical
        if impact_analysis_update.rationale is not None:
            analysis.rationale = impact_analysis_update.rationale
        
        db.commit()
        db.refresh(analysis)
        
        # Convert JSON string back to dict for response
        if analysis.impact_data:
            analysis.impact_data = json.loads(analysis.impact_data)
        else:
            analysis.impact_data = {}
        
        return analysis
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating impact analysis: {str(e)}"
        )

@router.get("/impact-analysis/process/{process_id}", response_model=ProcessImpactAnalysisResponse, responses={
    404: {"description": "Process impact analysis not found"},
    400: {"description": "Invalid process ID format"}
})
async def get_process_impact_analysis(
    process_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get impact analysis for a specific process.
    """
    print(f"Received request for process_id: {process_id}, type: {type(process_id)}")
    
    # Try to convert process_id to UUID if it's not already
    try:
        if not isinstance(process_id, UUID):
            process_id = UUID(process_id)
            print(f"Successfully converted process_id to UUID: {process_id}")
    except ValueError as e:
        print(f"Invalid UUID format for process_id: {process_id}, error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid process ID format: {process_id}. Must be a valid UUID."
        )
    
    # Query by process_id (foreign key) instead of id (primary key)
    print(f"Querying database for process_id: {process_id}")
    analysis = db.query(ProcessImpactAnalysis).filter(
        ProcessImpactAnalysis.process_id == process_id
    ).first()
    
    if not analysis:
        print(f"No impact analysis found for process_id: {process_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Impact analysis for process with ID {process_id} not found"
        )
    
    print(f"Found impact analysis for process_id: {process_id}")
    
    # Return only the essential fields
    return {
        "id": analysis.id,
        "process_id": analysis.process_id,
        "rto": analysis.rto,
        "mtpd": analysis.mtpd,
        "is_critical": analysis.is_critical
    }

@router.post("/impact-analysis/bulk", response_model=dict)
async def bulk_update_process_impact_analysis(
    bulk_update: ProcessImpactAnalysisBulkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Bulk update or create impact analysis for multiple processes.
    """
    try:
        # Process each process update
        updated_processes = []
        created_processes = []
        skipped_processes = []
        updated_count = 0
        created_count = 0
        
        print(f"Processing impact analysis for {len(bulk_update.processes)} processes")
        
        for process_data in bulk_update.processes:
            process_id = process_data.get("id")
            process_name = process_data.get("name", "Unknown")
            
            # Find the process either by ID or by name
            process = None
            
            if process_id:
                try:
                    if not isinstance(process_id, UUID):
                        process_id = UUID(process_id)
                    process = db.query(GlobalProcess).filter(GlobalProcess.id == process_id).first()
                except (ValueError, TypeError):
                    print(f"Invalid UUID format: {process_id} for process {process_name}")
            
            if not process and process_name:
                # If process not found by ID or ID not provided, try to find by name
                print(f"Looking up process by name: {process_name}")
                process = db.query(GlobalProcess).filter(
                    GlobalProcess.name == process_name
                ).first()
            
            if not process:
                error_msg = f"Process not found: ID={process_id}, Name={process_name}"
                print(error_msg)
                skipped_processes.append(error_msg)
                continue
            
            print(f"Found process: {process.name} with ID: {process.id}")
            
            # Extract impact analysis data
            rto = process_data.get("rto")
            mtpd = process_data.get("mtpd")
            impact_data = process_data.get("impact_data", {})
            highest_impact = process_data.get("highest_impact")
            is_critical = process_data.get("is_critical", False)
            rationale = process_data.get("rationale")
            
            # Check if impact analysis exists for this process
            existing_analysis = db.query(ProcessImpactAnalysis).filter(
                ProcessImpactAnalysis.process_id == process.id
            ).first()
            
            # Convert impact_data to JSON string if it's a dict
            impact_data_json = json.dumps(impact_data) if impact_data else None
            
            # Convert highest_impact to JSON string if it's a dict
            if isinstance(highest_impact, dict):
                highest_impact = json.dumps(highest_impact)
            elif highest_impact is not None and not isinstance(highest_impact, str):
                highest_impact = str(highest_impact)
            
            # Create or update impact analysis
            if existing_analysis:
                # Update existing analysis
                if rto is not None:
                    existing_analysis.rto = rto
                if mtpd is not None:
                    existing_analysis.mtpd = mtpd
                if impact_data is not None:
                    existing_analysis.impact_data = impact_data_json
                if highest_impact is not None:
                    existing_analysis.highest_impact = highest_impact
                if is_critical is not None:
                    existing_analysis.is_critical = is_critical
                if rationale is not None:
                    existing_analysis.rationale = rationale
                
                db.add(existing_analysis)
                updated_count += 1
                updated_processes.append(process.name)
            else:
                # Create new analysis
                try:
                    new_analysis = ProcessImpactAnalysis(
                        process_id=process.id,
                        rto=rto,
                        mtpd=mtpd,
                        impact_data=impact_data_json,
                        highest_impact=highest_impact,
                        is_critical=is_critical,
                        rationale=rationale
                    )
                    db.add(new_analysis)
                    created_count += 1
                    created_processes.append(process.name)
                except Exception as e:
                    error_msg = f"{process.name} (Error: {str(e)})"
                    print(f"Error creating impact analysis: {error_msg}")
                    skipped_processes.append(error_msg)
                    continue
        
        print(f"Committing changes: {updated_count} updated, {created_count} created")
        db.commit()
        
        return {
            "status": "success",
            "message": f"Updated impact analysis for {len(updated_processes)} processes, created for {len(created_processes)} processes",
            "updated_processes": updated_processes,
            "created_processes": created_processes,
            "skipped_processes": skipped_processes
        }
    
    except Exception as e:
        db.rollback()
        print(f"Error in bulk update: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update process impact analysis: {str(e)}"
        )

@router.get("/organization/{organization_id}/processes", response_model=List[Dict[str, Any]])
async def get_organization_processes(
    organization_id: UUID,
    department_id: Optional[str] = None,
    subdepartment_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all processes for an organization, optionally filtered by department and subdepartment.
    """
    try:
        # Verify the organization exists
        organization = db.query(GlobalOrganization).filter(
            GlobalOrganization.id == organization_id
        ).first()
        
        if not organization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Organization with ID {organization_id} not found"
            )
        
        # Build the query for processes
        # Since GlobalProcess doesn't have organization_id, we need to join through the relationships
        query = db.query(GlobalProcess).join(
            GlobalSubdepartment, GlobalProcess.subdepartment_id == GlobalSubdepartment.id
        ).join(
            GlobalDepartment, GlobalSubdepartment.department_id == GlobalDepartment.id
        ).filter(
            GlobalDepartment.organization_id == organization_id
        )
        
        # Apply department filter if provided
        if department_id:
            try:
                if not isinstance(department_id, UUID):
                    department_id = UUID(department_id)
                query = query.filter(GlobalSubdepartment.department_id == department_id)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid department ID format: {department_id}. Must be a valid UUID."
                )
        
        # Apply subdepartment filter if provided
        if subdepartment_id:
            try:
                if not isinstance(subdepartment_id, UUID):
                    subdepartment_id = UUID(subdepartment_id)
                query = query.filter(GlobalProcess.subdepartment_id == subdepartment_id)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid subdepartment ID format: {subdepartment_id}. Must be a valid UUID."
                )
        
        # Execute the query
        processes = query.all()
        
        # Format the response
        result = []
        for process in processes:
            # Get department and subdepartment names if available
            department_name = None
            subdepartment_name = None
            
            if process.subdepartment and process.subdepartment.department:
                department_name = process.subdepartment.department.name
            
            if process.subdepartment:
                subdepartment_name = process.subdepartment.name
            
            # Check if BIA info exists for this process
            bia_info = db.query(BIAProcessInfo).filter(
                BIAProcessInfo.process_id == process.id
            ).first()
            
            # Check if impact analysis exists for this process
            impact_analysis = db.query(ProcessImpactAnalysis).filter(
                ProcessImpactAnalysis.process_id == process.id
            ).first()
            
            result.append({
                "id": str(process.id),
                "name": process.name,
                "department_id": str(process.subdepartment.department_id) if process.subdepartment else None,
                "department_name": department_name,
                "subdepartment_id": str(process.subdepartment_id),
                "subdepartment_name": subdepartment_name,
                "has_bia_info": bia_info is not None,
                "has_impact_analysis": impact_analysis is not None
            })
        
        return result
    
    except Exception as e:
        print(f"Error retrieving organization processes: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving organization processes: {str(e)}"
        )

@router.get("/impact-analysis/organization/{organization_id}", response_model=List[Dict[str, Any]])
async def get_organization_impact_analysis(
    organization_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get impact analysis for all processes in an organization.
    """
    try:
        # Verify the organization exists
        organization = db.query(GlobalOrganization).filter(
            GlobalOrganization.id == organization_id
        ).first()
        
        if not organization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Organization with ID {organization_id} not found"
            )
        
        # Get all processes in the organization
        processes = db.query(GlobalProcess).join(
            GlobalSubdepartment, GlobalProcess.subdepartment_id == GlobalSubdepartment.id
        ).join(
            GlobalDepartment, GlobalSubdepartment.department_id == GlobalDepartment.id
        ).filter(
            GlobalDepartment.organization_id == organization_id
        ).all()
        
        result = []
        for process in processes:
            # Get impact analysis for this process
            analysis = db.query(ProcessImpactAnalysis).filter(
                ProcessImpactAnalysis.process_id == process.id
            ).first()
            
            process_data = {
                "id": str(process.id),
                "name": process.name,
                "process_owner": process.process_owner or "",
                "impact_analysis": None
            }
            
            if analysis:
                # Convert JSON string back to dict
                try:
                    impact_data = json.loads(analysis.impact_data) if analysis.impact_data else {}
                except json.JSONDecodeError:
                    print(f"Warning: Could not parse impact_data as JSON: {analysis.impact_data}")
                    impact_data = {}
                
                # Convert highest_impact from JSON string if needed
                highest_impact = analysis.highest_impact
                if highest_impact and isinstance(highest_impact, str):
                    try:
                        if highest_impact.startswith('{'):
                            highest_impact = json.loads(highest_impact)
                    except json.JSONDecodeError:
                        # If not valid JSON, keep as string
                        print(f"Warning: Could not parse highest_impact as JSON: {highest_impact}")
                
                process_data["impact_analysis"] = {
                    "id": str(analysis.id),
                    "rto": analysis.rto,
                    "mtpd": analysis.mtpd,
                    "impact_data": impact_data,
                    "highest_impact": highest_impact,
                    "is_critical": analysis.is_critical,
                    "rationale": analysis.rationale
                }
            
            result.append(process_data)
        
        return result
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving impact analysis: {str(e)}"
        )