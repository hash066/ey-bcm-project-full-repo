from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.postgres import get_db
from app.models.technical_info import TechnicalInfo
from app.models.business_application_impact import BusinessApplicationImpact
from app.schemas.technical_info import TechnicalInfoCreate, TechnicalInfoOut
from typing import List
from uuid import UUID

router = APIRouter(prefix="/bia/technical-info", tags=["Technical Info"])

@router.get("/{organization_id}", response_model=List[TechnicalInfoOut])
def get_technical_info(organization_id: UUID, db: Session = Depends(get_db)):
    # Get all business_application_impact for this org
    apps = db.query(BusinessApplicationImpact).filter(BusinessApplicationImpact.organization_id == organization_id).all()
    tech_infos = db.query(TechnicalInfo).filter(TechnicalInfo.organization_id == organization_id).all()
    tech_info_map = {ti.service: ti for ti in tech_infos}

    def is_valid(val):
        return val and str(val).strip().upper() != "EMPTY"

    seen_services = set()
    result = []
    for app in apps:
        if app.application_name in seen_services:
            continue
        seen_services.add(app.application_name)
        app_rows = [a for a in apps if a.application_name == app.application_name]
        rto = next((a.rto for a in app_rows if is_valid(a.rto)), None)
        rpo = next((a.rpo for a in app_rows if is_valid(a.rpo)), None)
        interdependency = next((a.interdependency for a in app_rows if a.interdependency), None)
        ti = tech_info_map.get(app.application_name)
        if ti:
            ti_dict = ti.__dict__.copy()
            ti_dict['rto'] = rto
            ti_dict['rpo'] = rpo
            result.append(ti_dict)
        else:
            result.append({
                'id': str(app.id),
                'service': app.application_name,
                'owner': None,
                'interdependency': interdependency,
                'rto': rto,
                'rpo': rpo,
                'min_human_resource': None,
                'admin_accounts': None,
                'internet_connectivity': None,
                'special_tools': None,
                'external': None,
                'service_provider': None,
                'vendor_onsite_support': None,
                'vendor_offsite_support': None,
                'organization_id': organization_id
            })
    return result

@router.post("/", response_model=List[TechnicalInfoOut])
def save_technical_info(
    infos: List[TechnicalInfoCreate],
    db: Session = Depends(get_db)
):
    saved = []
    for info in infos:
        existing = db.query(TechnicalInfo).filter(
            TechnicalInfo.organization_id == info.organization_id,
            TechnicalInfo.service == info.service
        ).first()
        if existing:
            for field, value in info.dict().items():
                setattr(existing, field, value)
            db.add(existing)
            saved.append(existing)
        else:
            new_info = TechnicalInfo(**info.dict())
            db.add(new_info)
            saved.append(new_info)
    db.commit()
    return saved 