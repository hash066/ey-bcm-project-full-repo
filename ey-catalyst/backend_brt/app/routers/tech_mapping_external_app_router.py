from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.postgres import get_db
from app.models.tech_mapping_external_app import TechMappingExternalApp
from app.models.technical_info import TechnicalInfo
from app.schemas.tech_mapping_external_app import TechMappingExternalAppCreate, TechMappingExternalAppOut
from typing import List
from uuid import UUID

router = APIRouter(prefix="/bia/tech-mapping-external-app", tags=["Tech Mapping External App"])

@router.get("/{organization_id}", response_model=List[TechMappingExternalAppOut])
def get_tech_mapping_external_app(organization_id: UUID, db: Session = Depends(get_db)):
    # 1. Get all existing TechMappingExternalApp records for this org
    existing = db.query(TechMappingExternalApp).filter(TechMappingExternalApp.organization_id == organization_id).all()
    existing_names = set(e.application_name for e in existing)
    result = [e for e in existing]

    # 2. For each unique application_name in technical_info not already present, add a blank row
    tech_infos = db.query(TechnicalInfo).filter(TechnicalInfo.organization_id == organization_id).all()
    for ti in tech_infos:
        if ti.service not in existing_names:
            result.append(
                TechMappingExternalApp(
                    id=ti.id,  # Use the technical_info id for unsaved rows
                    application_name=ti.service,
                    application_owner=ti.owner,
                    application_status="",
                    integration_with_inhouse_app="",
                    organization_id=organization_id
                )
            )
            existing_names.add(ti.service)
    return result

@router.post("/", response_model=List[TechMappingExternalAppOut])
def save_tech_mapping_external_app(
    infos: List[TechMappingExternalAppCreate],
    db: Session = Depends(get_db)
):
    saved = []
    for info in infos:
        existing = db.query(TechMappingExternalApp).filter(
            TechMappingExternalApp.organization_id == info.organization_id,
            TechMappingExternalApp.application_name == info.application_name
        ).first()
        if existing:
            for field, value in info.dict().items():
                setattr(existing, field, value)
            db.add(existing)
            saved.append(existing)
        else:
            new_info = TechMappingExternalApp(**info.dict())
            db.add(new_info)
            saved.append(new_info)
    db.commit()
    return saved 