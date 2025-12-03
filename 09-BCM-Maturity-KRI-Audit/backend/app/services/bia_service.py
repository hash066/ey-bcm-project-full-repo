"""
Business Impact Analysis (BIA) Service for handling impact scale uploads and management.
This service follows the CLIENT->DEPARTMENT->SUBDEPARTMENT->PROCESS hierarchy.
"""
import io
import pandas as pd
from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import UploadFile, HTTPException, status
from pymongo.collection import Collection

from app.schemas.bia import (
    ImpactScaleCreate,
    ImpactScaleUpdate
)
from app.db.mongodb import get_mongodb_client
from app.models.bia_models import BIAInformation
from app.schemas.bia_schemas import BIAInformationCreate

# Constants
BIA_IMPACT_SCALE_COLLECTION = "bia_impact_scales"
BIA_IMPACT_MATRIX_COLLECTION = "bia_impact_matrices"

class BIAService:
    """Service for handling Business Impact Analysis operations."""
    
    @staticmethod
    def _get_impact_scale_collection(client_id: int) -> Collection:
        """Get MongoDB collection for impact scales."""
        client = get_mongodb_client()
        db_name = f"client_{client_id}"
        db = client[db_name]
        return db[BIA_IMPACT_SCALE_COLLECTION]
    
    @staticmethod
    async def upload_impact_scale(
        file: UploadFile,
        impact_scale_data: ImpactScaleCreate
    ) -> Dict[str, Any]:
        """
        Upload an impact scale Excel file and store in MongoDB.
        
        Args:
            file: Uploaded Excel file
            impact_scale_data: Impact scale metadata
            
        Returns:
            Dict: Stored impact scale data
        """
        # Read Excel file
        try:
            content = await file.read()
            df = pd.read_excel(io.BytesIO(content))
            
            # Convert DataFrame to dict for storage
            impact_scale_content = df.to_dict(orient='records')
            
            # Create impact scale document
            impact_scale = {
                "id": str(datetime.now().timestamp()),
                "title": impact_scale_data.title,
                "description": impact_scale_data.description,
                "client_id": impact_scale_data.client_id,
                "department_id": impact_scale_data.department_id,
                "subdepartment_id": impact_scale_data.subdepartment_id,
                "process_id": impact_scale_data.process_id,
                "uploaded_by": impact_scale_data.uploaded_by,
                "upload_date": datetime.now().isoformat(),
                "is_global": impact_scale_data.is_global,
                "content": impact_scale_content,
                "version": impact_scale_data.version or "1.0",
                "status": "active"
            }
            
            # Store in MongoDB
            collection = BIAService._get_impact_scale_collection(impact_scale_data.client_id)
            collection.insert_one(impact_scale)
            
            # Remove MongoDB _id field for response
            impact_scale.pop("_id", None)
            
            return impact_scale
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error processing impact scale: {str(e)}"
            )
    
    @staticmethod
    def get_impact_scale(client_id: int, impact_scale_id: str) -> Dict[str, Any]:
        """
        Get impact scale by ID.
        
        Args:
            client_id: Client ID
            impact_scale_id: Impact scale ID
            
        Returns:
            Dict: Impact scale data
        """
        collection = BIAService._get_impact_scale_collection(client_id)
        impact_scale = collection.find_one({"id": impact_scale_id})
        
        if not impact_scale:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Impact scale with ID {impact_scale_id} not found"
            )
        
        # Remove MongoDB _id field for response
        impact_scale.pop("_id", None)
        
        return impact_scale
    
    @staticmethod
    def get_impact_scales(
        client_id: int,
        department_id: Optional[int] = None,
        subdepartment_id: Optional[int] = None,
        process_id: Optional[int] = None,
        is_global: Optional[bool] = None,
        limit: int = 100,
        skip: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Get impact scales with optional filtering.
        
        Args:
            client_id: Client ID
            department_id: Optional Department ID
            subdepartment_id: Optional Subdepartment ID
            process_id: Optional Process ID
            is_global: Optional filter for global impact scales
            limit: Maximum number of results
            skip: Number of results to skip
            
        Returns:
            List[Dict]: List of impact scales
        """
        collection = BIAService._get_impact_scale_collection(client_id)
        
        # Build query
        query = {"client_id": client_id}
        
        if department_id is not None:
            query["department_id"] = department_id
            
        if subdepartment_id is not None:
            query["subdepartment_id"] = subdepartment_id
            
        if process_id is not None:
            query["process_id"] = process_id
            
        if is_global is not None:
            query["is_global"] = is_global
        
        # Execute query
        impact_scales = list(collection.find(query).skip(skip).limit(limit))
        
        # Remove MongoDB _id field for response
        for impact_scale in impact_scales:
            impact_scale.pop("_id", None)
        
        return impact_scales
    
    @staticmethod
    def update_impact_scale(
        client_id: int,
        impact_scale_id: str,
        update_data: ImpactScaleUpdate
    ) -> Dict[str, Any]:
        """
        Update impact scale metadata.
        
        Args:
            client_id: Client ID
            impact_scale_id: Impact scale ID
            update_data: Updated impact scale data
            
        Returns:
            Dict: Updated impact scale
        """
        collection = BIAService._get_impact_scale_collection(client_id)
        
        # Check if impact scale exists
        existing = collection.find_one({"id": impact_scale_id})
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Impact scale with ID {impact_scale_id} not found"
            )
        
        # Prepare update data
        update_dict = update_data.dict(exclude_unset=True)
        
        # Update document
        collection.update_one(
            {"id": impact_scale_id},
            {"$set": update_dict}
        )
        
        # Get updated document
        updated = collection.find_one({"id": impact_scale_id})
        updated.pop("_id", None)
        
        return updated
    
    @staticmethod
    def delete_impact_scale(client_id: int, impact_scale_id: str) -> bool:
        """
        Delete impact scale.
        
        Args:
            client_id: Client ID
            impact_scale_id: Impact scale ID
            
        Returns:
            bool: True if deleted successfully
        """
        collection = BIAService._get_impact_scale_collection(client_id)
        
        # Check if impact scale exists
        existing = collection.find_one({"id": impact_scale_id})
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Impact scale with ID {impact_scale_id} not found"
            )
        
        # Delete document
        collection.delete_one({"id": impact_scale_id})
        
        return True
    
    @staticmethod
    async def create_impact_matrix(
        client_id: int,
        sector: str,
        cells: List[Dict[str, Any]],
        created_by: int
    ) -> Dict[str, Any]:
        """
        Create a new impact matrix for a client.
        
        Args:
            client_id: Client ID
            sector: Business sector
            cells: List of impact matrix cells
            created_by: User ID who created the matrix
            
        Returns:
            Dict: Created impact matrix
        """
        # Get MongoDB collection
        client = get_mongodb_client()
        db_name = f"client_{client_id}"
        db = client[db_name]
        collection = db[BIA_IMPACT_MATRIX_COLLECTION]
        
        # Check if matrix for this client and sector already exists
        existing = collection.find_one({"client_id": client_id, "sector": sector})
        
        # Create or update impact matrix
        impact_matrix = {
            "client_id": client_id,
            "sector": sector,
            "created_by": created_by,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "cells": cells
        }
        
        if existing:
            # Update existing matrix
            impact_matrix["created_by"] = existing["created_by"]
            impact_matrix["created_at"] = existing["created_at"]
            collection.update_one(
                {"client_id": client_id, "sector": sector},
                {"$set": impact_matrix}
            )
        else:
            # Insert new matrix
            collection.insert_one(impact_matrix)
        
        # Remove MongoDB _id field for response
        impact_matrix.pop("_id", None)
        
        return impact_matrix
    
    @staticmethod
    async def get_impact_matrix(
        client_id: int,
        sector: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get impact matrix for a client, optionally filtered by sector.
        
        Args:
            client_id: Client ID
            sector: Optional sector filter
            
        Returns:
            Dict: Impact matrix
        """
        # Get MongoDB collection
        client = get_mongodb_client()
        db_name = f"client_{client_id}"
        db = client[db_name]
        collection = db[BIA_IMPACT_MATRIX_COLLECTION]
        
        # Build query
        query = {"client_id": client_id}
        if sector:
            query["sector"] = sector
        
        # Get impact matrix
        impact_matrix = collection.find_one(query)
        
        if not impact_matrix:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Impact matrix not found for client {client_id}" + 
                       (f" and sector {sector}" if sector else "")
            )
        
        # Remove MongoDB _id field for response
        impact_matrix.pop("_id", None)
        
        return impact_matrix
    
    @staticmethod
    def get_template_excel() -> bytes:
        """
        Generate a template Excel file for impact scale.
        
        Returns:
            bytes: Excel file content
        """
        # Create template DataFrame
        data = {
            "Type": ["Financial Impact", "Operational Impact", "Customer Impact", 
                    "Reputational Impact", "Legal and Regulatory Impact", "Wellbeing, Health & safety Impact"],
            "Areas of Impact": ["Revenue, Penalties/Claims, Productivity Loss", "Continuity of operations", 
                              "Service Availability", "Brand value & Reputation", 
                              "Legal and Statutory Compliance, Regulatory Compliance", 
                              "Employees, Visitors, Public"],
            "Insignificant - 0": ["Earning Loss to the tune of Rs. 1K/Day", 
                                "Limited impact to internal non-critical activities with no external stakeholders impacted",
                                "No service delivery impact\nNo loss to customer satisfaction",
                                "No adverse media coverage and no perceived impact by external stakeholders",
                                "Minor legal/regulatory lapses leading to internal escalation; no statutory impact",
                                "No Impact"],
            "Low - 1": ["Earning Loss to the tune of Rs. 10K/Day",
                      "Limited impact to internal activities with partial disruption to non-critical processes",
                      "Service delivery impact limited to customers but not breaching SLA",
                      "Some adverse local media coverage, but doesn't threaten the organization's public image or stakeholder confidence",
                      "Minor prosecution/litigation; no statutory impact",
                      "Minor injury requiring first aid; no workdays lost"],
            "Moderate - 2": ["Earning Loss to the tune of Rs. 20K/Day",
                           "Full operational disruption for multiple non-critical processes or partial disruption for a critical process across single/multiple facilities within the same zones",
                           "Impact to service delivery, breach of SLA\nRise in customer complaints",
                           "Adverse local media coverage, but doesn't materially threaten the organization's public image or stakeholder confidence in the long term. Stakeholders request information",
                           "Minor scrutiny and litigation; receipt of structure or warning letter from regulatory authorities",
                           "Major injury requiring medical treatment and/or time off work"],
            "Major - 3": ["Earning Loss to the tune of Rs. 50K/Day",
                        "Operational disruption for multiple one or more critical processes across multiple facilities within the same zones",
                        "Impact to High Net Income (HNI) group of customers\nBreach of SLA results in customer complaints",
                        "Significant stakeholder concern and adverse provincial media coverage (including social media), with a medium-term impact on organizational public image",
                        "Multiple instances of regulatory scrutiny and litigation; penalties imposed by statutory authorities",
                        "Threat to life or permanent disability of one or more individuals"],
            "Catastrophic - 4": ["Earning Loss greater than Rs. 50K/Day",
                               "Full operational disruption to the entire organization",
                               "Contract termination by the customer\nLoss of future business\ncustomer complaints across media platforms",
                               "Significant loss of public confidence and adverse national media coverage (including social media), with a long-term impact on the organization's public image or reputation",
                               "Severe regulatory scrutiny and litigation; possible license revocation, embargo, and/or criminal action against senior management",
                               "Loss of life of employee(s), visitor(s), or public"]
        }
        
        df = pd.DataFrame(data)
        
        # Convert to Excel
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='BIA Impact Scale', index=False)
        
        return output.getvalue()

    @staticmethod
    def create_bia_information(db, info: BIAInformationCreate):
        """
        Create or update BIA information for a department/subdepartment.
        If a record exists for the given organization_id, department_id, and subdepartment_id, update it; otherwise, create a new one.
        """
        # Check for existing record
        existing_info = db.query(BIAInformation).filter(
            BIAInformation.organization_id == info.organization_id,
            BIAInformation.department_id == info.department_id,
            BIAInformation.subdepartment_id == info.subdepartment_id
        ).first()

        if existing_info:
            # Update only changed fields
            updated = False
            for field in [
                "department_name", "department_description", "bcp_coordinator", "secondary_spoc",
                "primary_location", "secondary_location", "primary_staff_count", "secondary_staff_count"
            ]:
                new_value = getattr(info, field, None)
                if new_value is not None and getattr(existing_info, field) != new_value:
                    setattr(existing_info, field, new_value)
                    updated = True
            if updated:
                db.commit()
                db.refresh(existing_info)
            return existing_info
        else:
            new_info = BIAInformation(
                department_id=info.department_id,
                subdepartment_id=info.subdepartment_id,
                department_name=info.department_name,
                department_description=info.department_description,
                bcp_coordinator=info.bcp_coordinator,
                secondary_spoc=info.secondary_spoc,
                primary_location=info.primary_location,
                secondary_location=info.secondary_location,
                primary_staff_count=info.primary_staff_count,
                secondary_staff_count=info.secondary_staff_count,
                organization_id=info.organization_id
            )
            db.add(new_info)
            db.commit()
            db.refresh(new_info)
            return new_info

    @staticmethod
    def create_or_update_bia_process_info(db, info):
        """
        Create or update BIA process info for a process.
        If a record exists for the given process_id, update it; otherwise, create a new one.
        """
        from app.models.bia_models import BIAProcessInfo
        # Check for existing record
        existing_info = db.query(BIAProcessInfo).filter(
            BIAProcessInfo.process_id == info.process_id
        ).first()

        if existing_info:
            updated = False
            for field in ["description", "peak_period", "spoc", "review_status"]:
                new_value = getattr(info, field, None)
                if new_value is not None and getattr(existing_info, field) != new_value:
                    setattr(existing_info, field, new_value)
                    updated = True
            if updated:
                db.commit()
                db.refresh(existing_info)
            return existing_info
        else:
            from app.models.bia_models import BIAProcessInfo
            new_info = BIAProcessInfo(
                process_id=info.process_id,
                description=info.description,
                peak_period=info.peak_period,
                spoc=info.spoc,
                review_status=info.review_status
            )
            db.add(new_info)
            db.commit()
            db.refresh(new_info)
            return new_info