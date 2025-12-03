from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.postgres import get_db
from app.models.critical_applications_summary import CriticalApplicationsSummary
from app.models.business_application_impact import BusinessApplicationImpact
from app.schemas.critical_applications_summary import CriticalApplicationsSummaryCreate, CriticalApplicationsSummaryOut
from typing import List
from uuid import UUID

router = APIRouter(prefix="/bia/critical-applications-summary", tags=["Critical Applications Summary"])

@router.get("/{organization_id}", response_model=List[CriticalApplicationsSummaryOut])
def get_critical_applications_summary(organization_id: UUID, db: Session = Depends(get_db)):
    apps = db.query(BusinessApplicationImpact).filter(BusinessApplicationImpact.organization_id == organization_id).all()
    seen = set()
    result = []
    for app in apps:
        if app.application_name in seen:
            continue
        seen.add(app.application_name)
        rto = app.rto if app.rto and app.rto.upper() != "EMPTY" else None
        rpo = app.rpo if app.rpo and app.rpo.upper() != "EMPTY" else None
        result.append({
            "id": str(app.id),
            "app_name": app.application_name,
            "location": "",
            "app_rto": rto,
            "app_rpo": rpo,
            "business_rto": "",
            "trans_status": "",
            "prog_status": "",
            "replacement": "",
            "tech_rto": "",
            "tech_rpo": "",
            "remarks": "",
            "organization_id": organization_id
        })
    return result

@router.post("/", response_model=List[CriticalApplicationsSummaryOut])
def save_critical_applications_summary(
    infos: List[CriticalApplicationsSummaryCreate],
    db: Session = Depends(get_db)
):
    saved = []
    for info in infos:
        existing = db.query(CriticalApplicationsSummary).filter(
            CriticalApplicationsSummary.organization_id == info.organization_id,
            CriticalApplicationsSummary.app_name == info.app_name
        ).first()
        if existing:
            for field, value in info.dict().items():
                setattr(existing, field, value)
            db.add(existing)
            saved.append(existing)
        else:
            new_info = CriticalApplicationsSummary(**info.dict())
            db.add(new_info)
            saved.append(new_info)
    db.commit()
    return saved 