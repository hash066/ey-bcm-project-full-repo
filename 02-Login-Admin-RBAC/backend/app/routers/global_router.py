from fastapi import APIRouter, Depends, HTTPException, Body, Path
from sqlalchemy.orm import Session
from app.db.postgres import get_db
from app.models.rbac_models import User
from app.models.global_models import GlobalOrganization, GlobalDepartment, GlobalSubdepartment, GlobalProcess
from app.models.bia_models import BIAProcessInfo
from app.models.minimum_operating_requirement import MinimumOperatingRequirement
from sqlalchemy import update
from app.models.business_application_impact import BusinessApplicationImpact

router = APIRouter()

@router.get("/bia-process-info/{bia_process_info_id}/full-hierarchy")
async def get_bia_process_full_hierarchy(bia_process_info_id: str, db: Session = Depends(get_db)):
    # 1. Get the BIA Process Info row
    bia_proc = db.query(BIAProcessInfo).filter(BIAProcessInfo.id == bia_process_info_id).first()
    if not bia_proc:
        raise HTTPException(status_code=404, detail="BIA Process Info not found")
    # 2. Get the Process row
    process = db.query(GlobalProcess).filter(GlobalProcess.id == bia_proc.process_id).first()
    if not process:
        raise HTTPException(status_code=404, detail="Process not found")
    # 3. Get the Subdepartment row
    subdept = db.query(GlobalSubdepartment).filter(GlobalSubdepartment.id == process.subdepartment_id).first()
    if not subdept:
        raise HTTPException(status_code=404, detail="Subdepartment not found")
    # 4. Get the Department row
    dept = db.query(GlobalDepartment).filter(GlobalDepartment.id == subdept.department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return {
        "bia_process_info_id": str(bia_proc.id),
        "process_id": str(process.id),
        "process_name": process.name,
        "subdepartment_id": str(subdept.id),
        "subdepartment_name": subdept.name,
        "department_id": str(dept.id),
        "department_name": dept.name
    }

@router.get("/user/{username}/mor-applications")
async def get_user_mor_applications(username: str, db: Session = Depends(get_db)):
    # 1. Get departments where user is head
    organization = db.query(GlobalOrganization).filter(GlobalOrganization.head_username == username).all()
    departments=db.query(GlobalDepartment).filter(GlobalDepartment.head_username == username).all()
    if not departments:
        raise HTTPException(status_code=404, detail="No departments found for user")
    results = []
    for dept in departments:
        org = db.query(GlobalOrganization).filter(GlobalOrganization.id == dept.organization_id).first()
        subdepts = db.query(GlobalSubdepartment).filter(GlobalSubdepartment.department_id == dept.id).all()
        for subdept in subdepts:
            processes = db.query(GlobalProcess).filter(GlobalProcess.subdepartment_id == subdept.id).all()
            for process in processes:
                bia_infos = db.query(BIAProcessInfo).filter(BIAProcessInfo.process_id == process.id).all()
                for bia_info in bia_infos:
                    mors = db.query(MinimumOperatingRequirement).filter(MinimumOperatingRequirement.process_id == bia_info.id).all()
                    for mor in mors:
                        results.append({
                            "application_name": process.name,
                            "department_name": dept.name,
                            "subdepartment_name": subdept.name,
                            "organization_name": org.name if org else None,
                            "mor_id": str(mor.id),
                            "bia_process_info_id": str(bia_info.id),
                            # add other MOR fields as needed
                        })
    return results

@router.get("/user/{username}/mor-applications-v2")
async def get_user_mor_applications_v2(username: str, db: Session = Depends(get_db)):
    print(f"DEBUG: Looking for organizations with head_username={username}")
    print(username)
    orgs = db.query(GlobalOrganization).filter(GlobalOrganization.head_username == username).all()
    if not orgs:
        print(f"DEBUG: No organizations found for user {username} as head.")
        return []
    results = []
    for org in orgs:
        print(f"DEBUG: Found organization {org.id} ({org.name}) for user {username}")
        departments = db.query(GlobalDepartment).filter(GlobalDepartment.organization_id == org.id).all()
        print(f"DEBUG: Found {len(departments)} departments for organization {org.id}")
        for dept in departments:
            print(f"DEBUG: Department {dept.id} ({dept.name})")
            subdepts = db.query(GlobalSubdepartment).filter(GlobalSubdepartment.department_id == dept.id).all()
            print(f"DEBUG:   Found {len(subdepts)} subdepartments for department {dept.id}")
            for subdept in subdepts:
                print(f"DEBUG:   Subdepartment {subdept.id} ({subdept.name})")
                processes = db.query(GlobalProcess).filter(GlobalProcess.subdepartment_id == subdept.id).all()
                print(f"DEBUG:     Found {len(processes)} processes for subdepartment {subdept.id}")
                for process in processes:
                    print(f"DEBUG:     Process {process.id} ({process.name})")
                    bia_infos = db.query(BIAProcessInfo).filter(BIAProcessInfo.process_id == process.id).all()
                    print(f"DEBUG:       Found {len(bia_infos)} BIAProcessInfo for process {process.id}")
                    for bia_info in bia_infos:
                        mors = db.query(MinimumOperatingRequirement).filter(MinimumOperatingRequirement.process_id == bia_info.id).all()
                        print(f"DEBUG:         Found {len(mors)} MORs for BIAProcessInfo {bia_info.id}")
                        for mor in mors:
                            results.append({
                                "department_name": dept.name,
                                "mor_id": str(mor.id),
                                "bia_process_info_id": str(bia_info.id),
                                "it_applications": mor.it_applications,
                                # add other MOR fields as needed
                                "updated_at": mor.updated_at.isoformat() if mor.updated_at else None,
                                "created_at": mor.created_at.isoformat() if mor.created_at else None,
                            })
    print(f"DEBUG: Returning {len(results)} MOR application records for user {username}")
    # After collecting all results, filter for unique (department, process, it_applications) with latest updated_at/created_at
    filtered = {}
    for row in results:
        dept = row.get("department_name", "")
        process_id = row.get("bia_process_info_id", "")
        app = row.get("it_applications", "")
        if not process_id or not app:
            continue
        key = f"{dept}||{process_id}||{app}"
        current = filtered.get(key)
        row_date = None
        if row.get("updated_at"):
            try:
                row_date = row["updated_at"]
                if isinstance(row_date, str):
                    from dateutil.parser import parse
                    row_date = parse(row_date)
            except Exception:
                row_date = None
        if not row_date and row.get("created_at"):
            try:
                row_date = row["created_at"]
                if isinstance(row_date, str):
                    from dateutil.parser import parse
                    row_date = parse(row_date)
            except Exception:
                row_date = None
        current_date = None
        if current:
            if current.get("updated_at"):
                try:
                    current_date = current["updated_at"]
                    if isinstance(current_date, str):
                        from dateutil.parser import parse
                        current_date = parse(current_date)
                except Exception:
                    current_date = None
            if not current_date and current.get("created_at"):
                try:
                    current_date = current["created_at"]
                    if isinstance(current_date, str):
                        from dateutil.parser import parse
                        current_date = parse(current_date)
                except Exception:
                    current_date = None
        if not current or (row_date and (not current_date or row_date > current_date)):
            filtered[key] = row
    return list(filtered.values())

@router.post("/user/{username}/mor-applications-v2")
async def post_user_mor_applications_v2(username: str, mor_data: list = Body(...), db: Session = Depends(get_db)):
    """
    Accepts a list of MOR data and stores/updates them in the MinimumOperatingRequirement table.
    If mor_id is present, update the record; otherwise, create a new one.
    """
    processed_ids = []
    for entry in mor_data:
        mor_id = entry.get("mor_id")
        if mor_id:
            # Update existing MOR
            mor = db.query(MinimumOperatingRequirement).filter(MinimumOperatingRequirement.id == mor_id).first()
            if mor:
                for field in ["it_applications"]:  # Add more fields as needed
                    if field in entry:
                        setattr(mor, field, entry[field])
                db.add(mor)
                processed_ids.append(str(mor.id))
        else:
            # Create new MOR
            new_mor = MinimumOperatingRequirement(
                process_id=entry.get("bia_process_info_id"),
                it_applications=entry.get("it_applications"),
                # Add more fields as needed
            )
            db.add(new_mor)
            db.flush()  # To get the new id
            processed_ids.append(str(new_mor.id))
    db.commit()
    return {"status": "success", "processed_ids": processed_ids}

@router.post("/bia/business-application-impact")
async def post_business_application_impact(data: list = Body(...), db: Session = Depends(get_db)):
    """
    Accepts a list of business application impact data and stores them in the business_application_impact table.
    """
    processed_ids = []
    for entry in data:
        new_row = BusinessApplicationImpact(
            organization_id=entry.get("organization_id"),
            application_name=entry.get("application_name"),
            department_name=entry.get("department_name"),
            impact_matrix=entry.get("impact_matrix"),
            mtpd=entry.get("mtpd"),
            rto=entry.get("rto"),
            rpo=entry.get("rpo"),
            recovery_category=entry.get("recovery_category"),
            interdependency=entry.get("interdependency"),
            external_application_service=entry.get("external_application_service"),
            desktop_software_list=entry.get("desktop_software_list"),
        )
        db.add(new_row)
        db.flush()
        processed_ids.append(str(new_row.id))
    db.commit()
    return {"status": "success", "processed_ids": processed_ids}

@router.get("/organization/{organization_id}/mor-applications")
async def get_organization_mor_applications(organization_id: str, db: Session = Depends(get_db)):
    """
    Return all MOR rows for all departments and processes in the given organization,
    with department name, process name, and it_applications. Deduplicate by (department, process, it_applications), keeping only the latest.
    """
    results = []
    departments = db.query(GlobalDepartment).filter(GlobalDepartment.organization_id == organization_id).all()
    for dept in departments:
        subdepts = db.query(GlobalSubdepartment).filter(GlobalSubdepartment.department_id == dept.id).all()
        for subdept in subdepts:
            processes = db.query(GlobalProcess).filter(GlobalProcess.subdepartment_id == subdept.id).all()
            for process in processes:
                bia_infos = db.query(BIAProcessInfo).filter(BIAProcessInfo.process_id == process.id).all()
                for bia_info in bia_infos:
                    mors = db.query(MinimumOperatingRequirement).filter(MinimumOperatingRequirement.process_id == bia_info.id).all()
                    for mor in mors:
                        results.append({
                            "department_name": dept.name,
                            "process_name": process.name,
                            "mor_id": str(mor.id),
                            "bia_process_info_id": str(bia_info.id),
                            "it_applications": mor.it_applications,
                            "updated_at": mor.updated_at.isoformat() if mor.updated_at else None,
                            "created_at": mor.created_at.isoformat() if mor.created_at else None,
                        })
    # Return all rows, no deduplication
    return results
