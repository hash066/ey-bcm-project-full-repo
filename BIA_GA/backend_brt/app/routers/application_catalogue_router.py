from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from app.db.postgres import get_db
from app.models.business_application_impact import BusinessApplicationImpact
from app.models.minimum_operating_requirement import MinimumOperatingRequirement
from app.models.bia_models import BIAProcessInfo
from app.models.global_models import GlobalProcess, GlobalSubdepartment, GlobalDepartment, GlobalOrganization
from typing import List, Dict, Any
from uuid import UUID

router = APIRouter(prefix="/bia/application-catalogue", tags=["Application Catalogue"])

@router.get("/{organization_id}", response_model=List[Dict[str, Any]])
def get_application_catalogue(organization_id: UUID, db: Session = Depends(get_db)):
    # 1. Get all business_application_impact for this org
    app_impacts = db.query(BusinessApplicationImpact).filter(BusinessApplicationImpact.organization_id == organization_id).all()
    # 2. Get all process names for this org via minimum_operating_requirement
    process_rows = (
        db.query(
            MinimumOperatingRequirement,
            BIAProcessInfo,
            GlobalProcess,
            GlobalSubdepartment,
            GlobalDepartment
        )
        .join(BIAProcessInfo, MinimumOperatingRequirement.process_id == BIAProcessInfo.id)
        .join(GlobalProcess, BIAProcessInfo.process_id == GlobalProcess.id)
        .join(GlobalSubdepartment, GlobalProcess.subdepartment_id == GlobalSubdepartment.id)
        .join(GlobalDepartment, GlobalSubdepartment.department_id == GlobalDepartment.id)
        .filter(GlobalDepartment.organization_id == organization_id)
        .all()
    )
    # Build a mapping from (department_name, application_name) to process_name if possible
    process_map = {}
    for mor, bia_proc, proc, subdep, dep in process_rows:
        # Try to extract application_name from mor.it_applications if possible (comma-separated list)
        app_names = []
        if mor.it_applications:
            app_names = [a.strip().lower() for a in mor.it_applications.split(',') if a.strip()]
        key = (dep.name.strip().lower() if dep.name else None, tuple(app_names))
        process_map.setdefault(dep.name.strip().lower() if dep.name else None, []).append((proc.name, app_names))
    # 3. Merge data for frontend
    result = []
    for app in app_impacts:
        row = {
            "application_name": app.application_name,
            "department_name": app.department_name,
            "application_rto": app.rto,
            "application_rpo": app.rpo,
            "mtpd_summary": app.mtpd,
            "process_name": None
        }
        # Try to find a process_name for this application (match department and application_name)
        candidates = process_map.get(app.department_name.strip().lower() if app.department_name else None, [])
        found = False
        for proc_name, app_names in candidates:
            if app.application_name and app.application_name.strip().lower() in app_names:
                row["process_name"] = proc_name
                found = True
                break
        if not found and candidates:
            # fallback: just use the first process name for the department
            row["process_name"] = candidates[0][0]
        result.append(row)
    return result 