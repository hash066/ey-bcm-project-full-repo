"""
Service layer for the Procedures module.
Handles business logic for procedure document management and LLM integration.
"""

import logging
import hashlib
import json
import traceback
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models.procedures_models import (
    ProcedureDocument,
    ProcedureChangeLog,
    ProcedureTemplate,
    LLMContentCache,
    ProcedureExport
)

from app.schemas.procedures import (
    ProcedureDocumentCreate,
    ProcedureDocumentResponse,
    ProcedureTemplateResponse,
    LLMContentRequest,
    LLMContentResponse,
    LLMContent,
    DocumentInfo,
    ChangeLogEntry
)

from app.services.llm_integration_service import LLMIntegrationService

logger = logging.getLogger(__name__)


class ProceduresService:
    """Service for managing procedure documents and LLM integration."""

    def __init__(self, db: Session):
        self.db = db
        self.llm_service = LLMIntegrationService()

    async def get_procedure_templates(self) -> List[ProcedureTemplateResponse]:
        """Get all available procedure templates."""
        try:
            templates = self.db.query(ProcedureTemplate).filter(
                ProcedureTemplate.is_active == True
            ).all()

            return [
                ProcedureTemplateResponse(
                    procedure_type=template.procedure_type,
                    template_name=template.template_name,
                    description=template.description or "",
                    default_document_info=DocumentInfo(**template.default_document_info),
                    sections=template.sections
                )
                for template in templates
            ]

        except Exception as e:
            logger.error(f"Error getting procedure templates: {str(e)}")
            raise

    async def get_bia_procedure(self, organization_id: int, user_id: int) -> ProcedureDocumentResponse:
        """Get BIA procedure document for an organization."""
        return await self._get_procedure_by_type("bia", organization_id, user_id)

    async def get_risk_assessment_procedure(self, organization_id: int, user_id: int) -> ProcedureDocumentResponse:
        """Get Risk Assessment procedure document for an organization."""
        return await self._get_procedure_by_type("risk_assessment", organization_id, user_id)

    async def get_bcm_plan_procedure(self, organization_id: int, user_id: int) -> ProcedureDocumentResponse:
        """Get BCM Plan procedure document for an organization."""
        return await self._get_procedure_by_type("bcm_plan", organization_id, user_id)

    async def get_crisis_communication_procedure(self, organization_id: int, user_id: int) -> ProcedureDocumentResponse:
        """Get Crisis Communication procedure document for an organization."""
        return await self._get_procedure_by_type("crisis_communication", organization_id, user_id)

    async def create_or_update_bia_procedure(
        self,
        organization_id: int,
        procedure_data: ProcedureDocumentCreate,
        user_id: int
    ) -> ProcedureDocumentResponse:
        """Create or update BIA procedure document."""
        return await self._create_or_update_procedure("bia", organization_id, procedure_data, user_id)

    async def create_or_update_risk_assessment_procedure(
        self,
        organization_id: int,
        procedure_data: ProcedureDocumentCreate,
        user_id: int
    ) -> ProcedureDocumentResponse:
        """Create or update Risk Assessment procedure document."""
        return await self._create_or_update_procedure("risk_assessment", organization_id, procedure_data, user_id)

    async def create_or_update_bcm_plan_procedure(
        self,
        organization_id: int,
        procedure_data: ProcedureDocumentCreate,
        user_id: int
    ) -> ProcedureDocumentResponse:
        """Create or update BCM Plan procedure document."""
        return await self._create_or_update_procedure("bcm_plan", organization_id, procedure_data, user_id)

    async def create_or_update_crisis_communication_procedure(
        self,
        organization_id: int,
        procedure_data: ProcedureDocumentCreate,
        user_id: int
    ) -> ProcedureDocumentResponse:
        """Create or update Crisis Communication procedure document."""
        return await self._create_or_update_procedure("crisis_communication", organization_id, procedure_data, user_id)

    async def get_nonconformity_procedure(self, organization_id: int, user_id: int) -> ProcedureDocumentResponse:
        """Get Nonconformity procedure document for an organization."""
        return await self._get_procedure_by_type("nonconformity", organization_id, user_id)

    async def create_or_update_nonconformity_procedure(
        self,
        organization_id: int,
        procedure_data: ProcedureDocumentCreate,
        user_id: int
    ) -> ProcedureDocumentResponse:
        """Create or update Nonconformity procedure document."""
        return await self._create_or_update_procedure("nonconformity", organization_id, procedure_data, user_id)

    async def get_performance_monitoring_procedure(self, organization_id: int, user_id: int) -> ProcedureDocumentResponse:
        """Get Performance Monitoring procedure document for an organization."""
        return await self._get_procedure_by_type("performance_monitoring", organization_id, user_id)

    async def create_or_update_performance_monitoring_procedure(
        self,
        organization_id: int,
        procedure_data: ProcedureDocumentCreate,
        user_id: int
    ) -> ProcedureDocumentResponse:
        """Create or update Performance Monitoring procedure document."""
        return await self._create_or_update_procedure("performance_monitoring", organization_id, procedure_data, user_id)

    async def get_testing_exercising_procedure(self, organization_id: int, user_id: int) -> ProcedureDocumentResponse:
        """Get Testing and Exercising procedure document for an organization."""
        return await self._get_procedure_by_type("testing_exercising", organization_id, user_id)

    async def create_or_update_testing_exercising_procedure(
        self,
        organization_id: int,
        procedure_data: ProcedureDocumentCreate,
        user_id: int
    ) -> ProcedureDocumentResponse:
        """Create or update Testing and Exercising procedure document."""
        return await self._create_or_update_procedure("testing_exercising", organization_id, procedure_data, user_id)

    async def get_training_awareness_procedure(self, organization_id: int, user_id: int) -> ProcedureDocumentResponse:
        """Get Training and Awareness procedure document for an organization."""
        return await self._get_procedure_by_type("training_awareness", organization_id, user_id)

    async def create_or_update_training_awareness_procedure(
        self,
        organization_id: int,
        procedure_data: ProcedureDocumentCreate,
        user_id: int
    ) -> ProcedureDocumentResponse:
        """Create or update Training and Awareness procedure document."""
        return await self._create_or_update_procedure("training_awareness", organization_id, procedure_data, user_id)

    async def get_recovery_strategy_procedure(self, organization_id: int, user_id: int) -> ProcedureDocumentResponse:
        """Get Recovery Strategy procedure document for an organization."""
        return await self._get_procedure_by_type("recovery_strategy", organization_id, user_id)

    async def create_or_update_recovery_strategy_procedure(
        self,
        organization_id: int,
        procedure_data: ProcedureDocumentCreate,
        user_id: int
    ) -> ProcedureDocumentResponse:
        """Create or update Recovery Strategy procedure document."""
        return await self._create_or_update_procedure("recovery_strategy", organization_id, procedure_data, user_id)

    async def get_nonconformity_corrective_actions_procedure(self, organization_id: int, user_id: int) -> ProcedureDocumentResponse:
        """Get Nonconformity and Corrective Actions procedure document for an organization."""
        return await self._get_procedure_by_type("nonconformity_corrective_actions", organization_id, user_id)

    async def create_or_update_nonconformity_corrective_actions_procedure(
        self,
        organization_id: int,
        procedure_data: ProcedureDocumentCreate,
        user_id: int
    ) -> ProcedureDocumentResponse:
        """Create or update Nonconformity and Corrective Actions procedure document."""
        return await self._create_or_update_procedure("nonconformity_corrective_actions", organization_id, procedure_data, user_id)

    # ✅ NEW METHOD - GET PROCEDURE VERSIONS
    def get_procedure_versions(self, procedure_type: str, organization_id: int):
        """
        Get all versions of a specific procedure from database
        
        Args:
            procedure_type: Type of procedure (e.g., 'bia', 'crisis_communication')
            organization_id: Organization ID
            
        Returns:
            List of procedure versions with their content
        """
        try:
            logger.info(f"Fetching procedure versions for {procedure_type} - Org {organization_id}")
            
            # Try to get from LLMContentCache first
            content_records = self.db.query(LLMContentCache).filter(
                LLMContentCache.procedure_type == procedure_type,
                LLMContentCache.organization_id == organization_id
            ).order_by(LLMContentCache.created_at.desc()).all()
            
            if not content_records:
                logger.info(f"No cached versions found, checking ProcedureDocument table")
                # Fallback to ProcedureDocument table
                procedure_records = self.db.query(ProcedureDocument).filter(
                    ProcedureDocument.procedure_type == procedure_type,
                    ProcedureDocument.organization_id == organization_id
                ).order_by(ProcedureDocument.created_at.desc()).all()
                
                if not procedure_records:
                    logger.info(f"No versions found for {procedure_type}")
                    return []
                
                # Format results from ProcedureDocument
                versions = []
                for record in procedure_records:
                    version_data = {
                        'id': record.id,
                        'version': record.document_version_no if hasattr(record, 'document_version_no') else '1.0',
                        'content': record.llm_content if record.llm_content else record.custom_content,
                        'created_at': record.created_at.isoformat() if record.created_at else None,
                        'updated_at': record.updated_at.isoformat() if record.updated_at else None,
                        'document_name': record.document_name if hasattr(record, 'document_name') else None
                    }
                    versions.append(version_data)
                
                logger.info(f"Found {len(versions)} versions from ProcedureDocument table")
                return versions
            
            # Format results from LLMContentCache
            versions = []
            for record in content_records:
                version_data = {
                    'id': record.id,
                    'version': '1.0',  # Default version
                    'content': record.generated_content,  # This is the JSON content generated by LLM
                    'created_at': record.created_at.isoformat() if record.created_at else None,
                    'updated_at': record.created_at.isoformat() if record.created_at else None,
                    'content_type': record.content_type if hasattr(record, 'content_type') else None
                }
                versions.append(version_data)
            
            logger.info(f"Found {len(versions)} versions for {procedure_type}")
            return versions
            
        except Exception as e:
            logger.error(f"Error fetching procedure versions: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            return []

    async def _get_procedure_by_type(
        self,
        procedure_type: str,
        organization_id: int,
        user_id: int
    ) -> ProcedureDocumentResponse:
        """Get procedure document by type and organization."""
        try:
            procedure = self.db.query(ProcedureDocument).filter(
                and_(
                    ProcedureDocument.procedure_type == procedure_type,
                    ProcedureDocument.organization_id == organization_id
                )
            ).first()

            if not procedure:
                # Create default procedure if none exists
                default_data = await self._get_default_procedure_data(procedure_type, organization_id)
                procedure = await self._create_procedure(procedure_type, organization_id, default_data, user_id)

            return await self._convert_to_response(procedure)

        except Exception as e:
            logger.error(f"Error getting {procedure_type} procedure: {str(e)}")
            raise

    async def _create_or_update_procedure(
        self,
        procedure_type: str,
        organization_id: int,
        procedure_data: ProcedureDocumentCreate,
        user_id: int
    ) -> ProcedureDocumentResponse:
        """Create or update a procedure document."""
        try:
            existing_procedure = self.db.query(ProcedureDocument).filter(
                and_(
                    ProcedureDocument.procedure_type == procedure_type,
                    ProcedureDocument.organization_id == organization_id
                )
            ).first()

            if existing_procedure:
                # Update existing procedure
                procedure = await self._update_procedure(existing_procedure, procedure_data, user_id)
            else:
                # Create new procedure
                procedure = await self._create_procedure(procedure_type, organization_id, procedure_data, user_id)

            return await self._convert_to_response(procedure)

        except Exception as e:
            logger.error(f"Error creating/updating {procedure_type} procedure: {str(e)}")
            raise

    async def _create_procedure(
        self,
        procedure_type: str,
        organization_id: int,
        procedure_data: ProcedureDocumentCreate,
        user_id: int
    ) -> ProcedureDocument:
        """Create a new procedure document."""
        try:
            # Create procedure document
            procedure = ProcedureDocument(
                procedure_type=procedure_type,
                organization_id=organization_id,
                document_name=procedure_data.document_info.document_name,
                document_owner=procedure_data.document_info.document_owner,
                document_version_no=procedure_data.document_info.document_version_no,
                document_version_date=procedure_data.document_info.document_version_date,
                prepared_by=procedure_data.document_info.prepared_by,
                reviewed_by=procedure_data.document_info.reviewed_by,
                approved_by=procedure_data.document_info.approved_by,
                use_llm_content=procedure_data.use_llm_content,
                llm_content=procedure_data.llm_content.model_dump(exclude_none=True) if procedure_data.llm_content else None,
                custom_content=procedure_data.custom_content,
                created_by=user_id
            )

            self.db.add(procedure)
            self.db.flush()  # Get the ID

            # Create change log entries
            for entry_data in procedure_data.change_log:
                change_log_entry = ProcedureChangeLog(
                    procedure_document_id=procedure.id,
                    sr_no=entry_data.sr_no,
                    version_no=entry_data.version_no,
                    approval_date=entry_data.approval_date,
                    description_of_change=entry_data.description_of_change,
                    reviewed_by=entry_data.reviewed_by,
                    approved_by=entry_data.approved_by,
                    created_by=user_id
                )
                self.db.add(change_log_entry)

            self.db.commit()
            self.db.refresh(procedure)

            return procedure

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating procedure: {str(e)}")
            raise

    async def _update_procedure(
        self,
        procedure: ProcedureDocument,
        procedure_data: ProcedureDocumentCreate,
        user_id: int
    ) -> ProcedureDocument:
        """Update an existing procedure document."""
        try:
            # Update procedure fields
            procedure.document_name = procedure_data.document_info.document_name
            procedure.document_owner = procedure_data.document_info.document_owner
            procedure.document_version_no = procedure_data.document_info.document_version_no
            procedure.document_version_date = procedure_data.document_info.document_version_date
            procedure.prepared_by = procedure_data.document_info.prepared_by
            procedure.reviewed_by = procedure_data.document_info.reviewed_by
            procedure.approved_by = procedure_data.document_info.approved_by
            procedure.use_llm_content = procedure_data.use_llm_content
            procedure.llm_content = procedure_data.llm_content.model_dump(exclude_none=True) if procedure_data.llm_content else None
            procedure.custom_content = procedure_data.custom_content
            procedure.updated_by = user_id

            # Delete existing change log entries
            self.db.query(ProcedureChangeLog).filter(
                ProcedureChangeLog.procedure_document_id == procedure.id
            ).delete()

            # Create new change log entries
            for entry_data in procedure_data.change_log:
                change_log_entry = ProcedureChangeLog(
                    procedure_document_id=procedure.id,
                    sr_no=entry_data.sr_no,
                    version_no=entry_data.version_no,
                    approval_date=entry_data.approval_date,
                    description_of_change=entry_data.description_of_change,
                    reviewed_by=entry_data.reviewed_by,
                    approved_by=entry_data.approved_by,
                    created_by=user_id
                )
                self.db.add(change_log_entry)

            self.db.commit()
            self.db.refresh(procedure)

            return procedure

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating procedure: {str(e)}")
            raise

    async def _convert_to_response(self, procedure: ProcedureDocument) -> ProcedureDocumentResponse:
        """Convert procedure document to response schema."""
        try:
            # Get change log entries
            change_log_entries = [
                ChangeLogEntry(
                    sr_no=entry.sr_no,
                    version_no=entry.version_no,
                    approval_date=entry.approval_date,
                    description_of_change=entry.description_of_change,
                    reviewed_by=entry.reviewed_by,
                    approved_by=entry.approved_by
                )
                for entry in procedure.change_log_entries
            ]

            llm_content_value = None
            if procedure.llm_content:
                if isinstance(procedure.llm_content, str):
                    try:
                        llm_content_value = LLMContent(**json.loads(procedure.llm_content))
                    except Exception:
                        llm_content_value = None
                elif isinstance(procedure.llm_content, dict):
                    llm_content_value = LLMContent(**procedure.llm_content)

            return ProcedureDocumentResponse(
                id=procedure.id,
                procedure_type=procedure.procedure_type,
                organization_id=procedure.organization_id,
                document_info=DocumentInfo(
                    document_name=procedure.document_name,
                    document_owner=procedure.document_owner,
                    document_version_no=procedure.document_version_no,
                    document_version_date=procedure.document_version_date,
                    prepared_by=procedure.prepared_by,
                    reviewed_by=procedure.reviewed_by,
                    approved_by=procedure.approved_by
                ),
                change_log=change_log_entries,
                use_llm_content=procedure.use_llm_content,
                llm_content=llm_content_value,
                custom_content=procedure.custom_content,
                created_at=procedure.created_at,
                updated_at=procedure.updated_at,
                created_by=procedure.created_by,
                updated_by=procedure.updated_by
            )

        except Exception as e:
            logger.error(f"Error converting procedure to response: {str(e)}")
            raise

    async def _get_default_procedure_data(self, procedure_type: str, organization_id: int) -> ProcedureDocumentCreate:
        """Get default procedure data for a given type."""
        try:
            # Get template
            template = self.db.query(ProcedureTemplate).filter(
                and_(
                    ProcedureTemplate.procedure_type == procedure_type,
                    ProcedureTemplate.is_active == True
                )
            ).first()

            if not template:
                # Create basic default if no template exists
                return self._create_basic_default_procedure_data(procedure_type, organization_id)

            return ProcedureDocumentCreate(
                procedure_type=procedure_type,
                organization_id=organization_id,
                document_info=DocumentInfo(**template.default_document_info),
                change_log=[
                    ChangeLogEntry(
                        sr_no=1,
                        version_no="1.0",
                        approval_date="",
                        description_of_change="Initial document",
                        reviewed_by="",
                        approved_by=""
                    )
                ],
                use_llm_content=False,
                llm_content=None,
                custom_content=None
            )

        except Exception as e:
            logger.error(f"Error getting default procedure data: {str(e)}")
            raise

    def _create_basic_default_procedure_data(self, procedure_type: str, organization_id: int) -> ProcedureDocumentCreate:
        """Create basic default procedure data when no template exists."""
        procedure_names = {
            "bia": "BCMS BIA Procedure",
            "risk_assessment": "Risk Assessment Procedure",
            "bcm_plan": "BCMS BCM Plan Development Procedure",
            "crisis_communication": "Crisis Communication Procedure",
            "nonconformity_corrective_actions": "Nonconformity and Corrective Actions Procedure",
            "recovery_strategy": "Recovery Strategy Procedure",
            "performance_monitoring": "Performance Monitoring Procedure",
            "testing_exercising": "Testing and Exercising Procedure",
            "training_awareness": "Training and Awareness Procedure"
        }

        return ProcedureDocumentCreate(
            procedure_type=procedure_type,
            organization_id=organization_id,
            document_info=DocumentInfo(
                document_name=procedure_names.get(procedure_type, "Procedure Document"),
                document_owner="BCM Team",
                document_version_no="1.0",
                document_version_date=datetime.now().strftime("%Y-%m-%d"),
                prepared_by="BCM Team",
                reviewed_by="Head-ORMD",
                approved_by="ORMC - Operational Risk Management Committee"
            ),
            change_log=[
                ChangeLogEntry(
                    sr_no=1,
                    version_no="1.0",
                    approval_date="",
                    description_of_change="Initial document",
                    reviewed_by="",
                    approved_by=""
                )
            ],
            use_llm_content=False,
            llm_content=None,
            custom_content=None
        )

    async def regenerate_procedure(self, procedure_id: int, user_id: int) -> ProcedureDocumentResponse:
        # Placeholder for regeneration logic
        # This would typically involve fetching the procedure, re-running LLM generation, and saving as a new version
        procedure = self.db.query(ProcedureDocument).filter(ProcedureDocument.id == procedure_id, ProcedureDocument.created_by == user_id).first()
        if not procedure:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Procedure not found")
        
        # Simulate regeneration by updating content and creating a new version
        new_content = f"Regenerated content for {procedure.procedure_type} - {datetime.now()}"
        new_version = ProcedureDocument(
            organization_id=procedure.organization_id,
            procedure_type=procedure.procedure_type,
            title=procedure.title,
            content=new_content,
            version=procedure.version + 1,
            is_current=True,
            created_by=user_id,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        self.db.add(new_version)
        procedure.is_current = False # Mark old as not current
        self.db.commit()
        self.db.refresh(new_version)
        return ProcedureDocumentResponse.from_orm(new_version)

    async def refine_procedure(self, procedure_id: int, user_id: int) -> ProcedureDocumentResponse:
        # Placeholder for refinement logic
        procedure = self.db.query(ProcedureDocument).filter(ProcedureDocument.id == procedure_id, ProcedureDocument.created_by == user_id).first()
        if not procedure:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Procedure not found")
        
        # Simulate refinement by updating content and creating a new version
        new_content = f"Refined content for {procedure.procedure_type} - {datetime.now()}"
        new_version = ProcedureDocument(
            organization_id=procedure.organization_id,
            procedure_type=procedure.procedure_type,
            title=procedure.title,
            content=new_content,
            version=procedure.version + 1,
            is_current=True,
            created_by=user_id,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        self.db.add(new_version)
        procedure.is_current = False # Mark old as not current
        self.db.commit()
        self.db.refresh(new_version)
        return ProcedureDocumentResponse.from_orm(new_version)

    async def analyze_existing_procedure(self, procedure_id: int, user_id: int) -> Dict[str, Any]:
        # Placeholder for analysis logic
        procedure = self.db.query(ProcedureDocument).filter(ProcedureDocument.id == procedure_id, ProcedureDocument.created_by == user_id).first()
        if not procedure:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Procedure not found")
        
        # Simulate analysis results
        analysis_results = {
            "procedure_id": procedure.id,
            "title": procedure.title,
            "analysis": "This is a simulated analysis of the procedure content. It looks good!",
            "timestamp": datetime.now().isoformat()
        }
        return analysis_results

    async def get_all_procedure_versions(self, procedure_type: str, user_id: int) -> List[ProcedureDocumentResponse]:
        versions = self.db.query(ProcedureDocument).filter(
            ProcedureDocument.procedure_type == procedure_type,
            ProcedureDocument.created_by == user_id
        ).order_by(ProcedureDocument.version.desc()).all()
        return [ProcedureDocumentResponse.from_orm(version) for version in versions]

    async def get_specific_procedure_version(self, procedure_type: str, version_id: str, user_id: int) -> ProcedureDocumentResponse:
        version = self.db.query(ProcedureDocument).filter(
            ProcedureDocument.procedure_type == procedure_type,
            ProcedureDocument.id == version_id,
            ProcedureDocument.created_by == user_id
        ).first()
        if not version:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Procedure version not found")
        return ProcedureDocumentResponse.from_orm(version)

    async def set_current_procedure_version(self, procedure_id: int, user_id: int) -> ProcedureDocumentResponse:
        procedure = self.db.query(ProcedureDocument).filter(ProcedureDocument.id == procedure_id, ProcedureDocument.created_by == user_id).first()
        if not procedure:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Procedure not found")
        
        # Set all other versions of the same procedure type to not current
        self.db.query(ProcedureDocument).filter(
            ProcedureDocument.procedure_type == procedure.procedure_type,
            ProcedureDocument.created_by == user_id
        ).update({"is_current": False})
        
        procedure.is_current = True
        self.db.commit()
        self.db.refresh(procedure)
        return ProcedureDocumentResponse.from_orm(procedure)

    async def upload_procedure(self, procedure_data: ProcedureDocumentCreate, user_id: int) -> ProcedureDocumentResponse:
        # Placeholder for upload logic
        # This would involve saving the new procedure document
        new_procedure = ProcedureDocument(
            organization_id=procedure_data.organization_id,
            procedure_type=procedure_data.procedure_type,
            title=procedure_data.title,
            content=procedure_data.content,
            version=1, # Assuming initial upload is version 1
            is_current=True,
            created_by=user_id,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        self.db.add(new_procedure)
        self.db.commit()
        self.db.refresh(new_procedure)
        return ProcedureDocumentResponse.from_orm(new_procedure)

    async def get_current_procedure(self, procedure_type: str, user_id: int) -> ProcedureDocumentResponse:
        procedure = self.db.query(ProcedureDocument).filter(
            ProcedureDocument.procedure_type == procedure_type,
            ProcedureDocument.is_current == True,
            ProcedureDocument.created_by == user_id
        ).first()
        if not procedure:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Current procedure not found for this type")
        return ProcedureDocumentResponse.from_orm(procedure)

    async def generate_llm_content(self, request: LLMContentRequest, user_id: int) -> LLMContentResponse:
        """Generate LLM content for procedures."""
        try:
            force = False
            if request.custom_parameters and isinstance(request.custom_parameters, dict):
                force = bool(request.custom_parameters.get("force_regenerate"))

            cached_content = None
            if not force:
                cached_content = await self._get_cached_llm_content(request)

            if cached_content and not force:
                return LLMContentResponse(
                    success=True,
                    content=cached_content,
                    errors=None,
                    warnings=["Using cached content"]
                )

            # Generate new content using actual LLM service
            generated_content = await self.llm_service.generate_procedure_content(request)

            await self._cache_llm_content(request, generated_content, user_id)

            return LLMContentResponse(
                success=True,
                content=generated_content,
                errors=None,
                warnings=None
            )

        except Exception as e:
            logger.error(f"Error generating LLM content: {str(e)}")
            return LLMContentResponse(
                success=False,
                content=None,
                errors=[str(e)],
                warnings=None
            )

    async def _get_cached_llm_content(self, request: LLMContentRequest) -> Optional[LLMContent]:
        """Get cached LLM content if available and not expired."""
        try:
            content_key = self._generate_content_key(request)

            cached_entry = self.db.query(LLMContentCache).filter(
                and_(
                    LLMContentCache.content_key == content_key,
                    LLMContentCache.organization_id == request.organization_id,
                    or_(
                        LLMContentCache.expires_at.is_(None),
                        LLMContentCache.expires_at > datetime.utcnow()
                    )
                )
            ).first()

            if cached_entry:
                return LLMContent(**cached_entry.generated_content)

            return None

        except Exception as e:
            logger.error(f"Error getting cached LLM content: {str(e)}")
            return None

    async def _cache_llm_content(self, request: LLMContentRequest, content: LLMContent, user_id: int):
        """Cache LLM content for future use."""
        try:
            content_key = self._generate_content_key(request)
            expires_at = datetime.utcnow() + timedelta(hours=24)  # Cache for 24 hours

            # Delete existing cache entry if it exists
            self.db.query(LLMContentCache).filter(
                and_(
                    LLMContentCache.content_key == content_key,
                    LLMContentCache.organization_id == request.organization_id
                )
            ).delete()

            # Create new cache entry
            cache_entry = LLMContentCache(
                content_type="full_procedure",
                procedure_type=request.procedure_type,
                organization_id=request.organization_id,
                content_key=content_key,
                generated_content=content.dict(),
                generation_parameters=request.dict(),
                expires_at=expires_at,
                created_by=user_id
            )

            self.db.add(cache_entry)
            self.db.commit()

        except Exception as e:
            logger.error(f"Error caching LLM content: {str(e)}")
            # Don't raise exception for caching errors

    def _generate_content_key(self, request: LLMContentRequest) -> str:
        """Generate a unique key for caching LLM content."""
        key_data = {
            "procedure_type": request.procedure_type,
            "organization_name": request.organization_name,
            "content_types": sorted(request.content_types),
            "custom_parameters": request.custom_parameters or {}
        }

        key_string = json.dumps(key_data, sort_keys=True)
        return hashlib.md5(key_string.encode()).hexdigest()

    async def get_organization_procedures(self, organization_id: int, user_id: int) -> List[ProcedureDocumentResponse]:
        """Get all procedure documents for an organization."""
        try:
            procedures = self.db.query(ProcedureDocument).filter(
                ProcedureDocument.organization_id == organization_id
            ).all()

            return [await self._convert_to_response(procedure) for procedure in procedures]

        except Exception as e:
            logger.error(f"Error getting organization procedures: {str(e)}")
            raise

    async def delete_procedure(self, procedure_id: int, user_id: int):
        """Delete a procedure document."""
        try:
            procedure = self.db.query(ProcedureDocument).filter(
                ProcedureDocument.id == procedure_id
            ).first()

            if not procedure:
                raise ValueError("Procedure not found")

            self.db.delete(procedure)
            self.db.commit()

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error deleting procedure: {str(e)}")
            raise

    async def export_procedure(self, procedure_id: int, format: str, user_id: int) -> Dict[str, Any]:
        """Export procedure document in specified format."""
        try:
            procedure = self.db.query(ProcedureDocument).filter(
                ProcedureDocument.id == procedure_id
            ).first()

            if not procedure:
                raise ValueError("Procedure not found")

            # In a full implementation, this would generate the actual file
            return {
                "success": True,
                "download_url": f"/api/procedures/download/{procedure_id}",
                "file_name": f"{procedure.document_name}.{format}",
                "file_size": None,
                "expires_at": datetime.utcnow() + timedelta(hours=1)
            }

        except Exception as e:
            logger.error(f"Error exporting procedure: {str(e)}")
            raise
