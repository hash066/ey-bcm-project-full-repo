"""
Organization Hierarchy Service for synchronizing AD DS organizational structure to database.
"""
from typing import Dict, Optional, Any, List
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import select, insert, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.sql import text

from app.db.postgres import get_db
from app.models.global_models import GlobalOrganization, GlobalDepartment, GlobalSubdepartment, GlobalProcess
from fastapi import HTTPException
from fastapi import status


class OrgHierarchyService:
    """
    Service for synchronizing organizational hierarchy from AD DS to database.
    """
    
    @staticmethod
    async def sync_org_hierarchy(path: Dict[str, str], username: str, db: Session, roles: List[str] = None) -> Dict[str, UUID]:
        """
        Synchronize organizational hierarchy from AD DS path to database.
        
        Args:
            path: Organizational path from AD DS (organization, department, subdepartment, process)
            username: Username of the authenticated user
            db: Database session
            roles: List of user roles
            
        Returns:
            Dictionary with IDs of created/retrieved entities
        """
        result = {}
        
        # Get or create organization
        if org_name := path.get("organization"):
            org_id = await OrgHierarchyService.get_or_create_organization(
                org_name, db, username if "Client Head" in (roles or []) else None
            )
            result["organization_id"] = org_id
            
            # Update role-specific user IDs in the organization table
            if roles:
                from app.models.rbac_models import User
                from sqlalchemy import update
                
                # Get the user ID
                user = db.query(User).filter(User.username == username).first()
                if user:
                    user_id = str(user.id)
                    
                    # Map roles to organization table columns
                    role_to_column_map = {
                        "CEO": "ceo_user_id",
                        "Reportee": "reportee_user_id",
                        "Sub-reportee": "sub_reportee_user_id",
                        "CXO": "cxo_user_id",
                        "Project Sponsor": "project_sponsor_user_id",
                        "Client Head": "client_head_user_id",
                        "BCM Coordinator": "bcm_coordinator_user_id"
                    }
                    
                    # Update the appropriate column based on the user's role
                    for role in roles:
                        if role in role_to_column_map:
                            column_name = role_to_column_map[role]
                            update_values = {column_name: user_id}
                            
                            # Execute the update
                            db.execute(
                                update(GlobalOrganization.__table__).where(
                                    GlobalOrganization.id == org_id
                                ).values(**update_values)
                            )
                            db.commit()
                            print(f"Updated organization {org_name} with {role} user ID: {user_id}")
            
            # Get or create department if organization exists
            if dept_name := path.get("department"):
                dept_id = await OrgHierarchyService.get_or_create_department(
                    dept_name, org_id, db, username if "Department Head" in (roles or []) else None
                )
                result["department_id"] = dept_id
                
                # Get or create subdepartment if department exists
                if subdept_name := path.get("subdepartment"):
                    subdept_id = await OrgHierarchyService.get_or_create_subdepartment(
                        subdept_name, dept_id, db, username if "SubDepartment Head" in (roles or []) else None
                    )
                    result["subdepartment_id"] = subdept_id
                    
                    # Get or create process if subdepartment exists
                    if process_name := path.get("process"):
                        process_id = await OrgHierarchyService.get_or_create_process(
                            process_name, subdept_id, username if "Process Owner" in (roles or []) else None, db
                        )
                        result["process_id"] = process_id
        
        return result
    
    @staticmethod
    async def get_or_create_organization(name: str, db: Session, head_username: str = None, roles: List[str] = None) -> UUID:
        """
        Get or create an organization by name.
        
        Args:
            name: Organization name
            db: Database session
            head_username: Username of the organization head
            roles: List of user roles
            
        Returns:
            UUID of the organization
        """
        # Try to find existing organization
        stmt = select(GlobalOrganization.id).where(GlobalOrganization.name == name)
        result = db.execute(stmt).first()
        
        if result:
            org_id = result[0]
            
            # Update head if provided
            if head_username:
                # Find user ID from username
                from app.models.rbac_models import User
                user = db.query(User).filter(User.username == head_username).first()
                if user:
                    # Update organization head
                    db.execute(
                        update(GlobalOrganization.__table__).where(
                            GlobalOrganization.id == org_id
                        ).values(
                            head_username=head_username
                        )
                    )
                    db.commit()
            
            # Update role-specific user IDs
            if roles:
                from app.models.rbac_models import User
                for role in roles:
                    if role == "CEO":
                        user = db.query(User).filter(User.username == head_username).first()
                        if user:
                            db.execute(
                                update(GlobalOrganization.__table__).where(
                                    GlobalOrganization.id == org_id
                                ).values(
                                    ceo_username=head_username
                                )
                            )
                            db.commit()
                    elif role == "Reportee":
                        user = db.query(User).filter(User.username == head_username).first()
                        if user:
                            db.execute(
                                update(GlobalOrganization.__table__).where(
                                    GlobalOrganization.id == org_id
                                ).values(
                                    reportee_username=head_username
                                )
                            )
                            db.commit()
                    elif role == "Sub-reportee":
                        user = db.query(User).filter(User.username == head_username).first()
                        if user:
                            db.execute(
                                update(GlobalOrganization.__table__).where(
                                    GlobalOrganization.id == org_id
                                ).values(
                                    sub_reportee_username=head_username
                                )
                            )
                            db.commit()
                    elif role == "CXO":
                        user = db.query(User).filter(User.username == head_username).first()
                        if user:
                            db.execute(
                                update(GlobalOrganization.__table__).where(
                                    GlobalOrganization.id == org_id
                                ).values(
                                    cxo_username=head_username
                                )
                            )
                            db.commit()
                    elif role == "Project Sponsor":
                        user = db.query(User).filter(User.username == head_username).first()
                        if user:
                            db.execute(
                                update(GlobalOrganization.__table__).where(
                                    GlobalOrganization.id == org_id
                                ).values(
                                    project_sponsor_username=head_username
                                )
                            )
                            db.commit()
                    elif role == "BCM Coordinator":
                        user = db.query(User).filter(User.username == head_username).first()
                        if user:
                            db.execute(
                                update(GlobalOrganization.__table__).where(
                                    GlobalOrganization.id == org_id
                                ).values(
                                    bcm_coordinator_username=head_username
                                )
                            )
                            db.commit()
            
            return org_id
        
        # Create new organization if not found
        stmt = pg_insert(GlobalOrganization.__table__).values(
            name=name,
            head_username=head_username
        ).on_conflict_do_nothing().returning(GlobalOrganization.id)
        
        result = db.execute(stmt).first()
        
        # If insert returned a result, use it
        if result:
            db.commit()
            return result[0]
        
        # If insert didn't return (due to conflict), query again
        stmt = select(GlobalOrganization.id).where(GlobalOrganization.name == name)
        result = db.execute(stmt).first()
        
        if result:
            return result[0]
        
        # This should not happen if the database is working correctly
        raise Exception(f"Failed to create or retrieve organization: {name}")
    
    @staticmethod
    async def get_or_create_department(name: str, organization_id: UUID, db: Session, head_username: str = None) -> UUID:
        """
        Get or create a department by name and organization.
        
        Args:
            name: Department name
            organization_id: Parent organization ID
            db: Database session
            head_username: Username of the department head
            
        Returns:
            UUID of the department
        """
        # Try to find existing department
        stmt = select(GlobalDepartment.id).where(
            GlobalDepartment.name == name,
            GlobalDepartment.organization_id == organization_id
        )
        result = db.execute(stmt).first()
        
        if result:
            dept_id = result[0]
            
            # Update head if provided
            if head_username:
                # Find user ID from username
                from app.models.rbac_models import User
                user = db.query(User).filter(User.username == head_username).first()
                if user:
                    # Update department head
                    db.execute(
                        update(GlobalDepartment.__table__).where(
                            GlobalDepartment.id == dept_id
                        ).values(
                            head_username=head_username
                        )
                    )
                    db.commit()
            
            return dept_id
        
        # Create new department if not found
        stmt = pg_insert(GlobalDepartment.__table__).values(
            name=name,
            organization_id=organization_id,
            head_username=head_username
        ).on_conflict_do_nothing().returning(GlobalDepartment.id)
        
        result = db.execute(stmt).first()
        
        # If insert returned a result, use it
        if result:
            db.commit()
            return result[0]
        
        # If insert didn't return (due to conflict), query again
        stmt = select(GlobalDepartment.id).where(
            GlobalDepartment.name == name,
            GlobalDepartment.organization_id == organization_id
        )
        result = db.execute(stmt).first()
        
        if result:
            return result[0]
        
        # This should not happen if the database is working correctly
        raise Exception(f"Failed to create or retrieve department: {name}")
    
    @staticmethod
    async def get_or_create_subdepartment(name: str, department_id: UUID, db: Session, head_username: str = None) -> UUID:
        """
        Get or create a subdepartment by name and department.
        
        Args:
            name: Subdepartment name
            department_id: Parent department ID
            db: Database session
            head_username: Username of the subdepartment head
            
        Returns:
            UUID of the subdepartment
        """
        # Try to find existing subdepartment
        stmt = select(GlobalSubdepartment.id).where(
            GlobalSubdepartment.name == name,
            GlobalSubdepartment.department_id == department_id
        )
        result = db.execute(stmt).first()
        
        if result:
            subdept_id = result[0]
            
            # Update head if provided
            if head_username:
                # Find user ID from username
                from app.models.rbac_models import User
                user = db.query(User).filter(User.username == head_username).first()
                if user:
                    # Update subdepartment head
                    db.execute(
                        update(GlobalSubdepartment.__table__).where(
                            GlobalSubdepartment.id == subdept_id
                        ).values(
                            head_username=head_username
                        )
                    )
                    db.commit()
            
            return subdept_id
        
        # Create new subdepartment if not found
        stmt = pg_insert(GlobalSubdepartment.__table__).values(
            name=name,
            department_id=department_id,
            head_username=head_username
        ).on_conflict_do_nothing().returning(GlobalSubdepartment.id)
        
        result = db.execute(stmt).first()
        
        # If insert returned a result, use it
        if result:
            db.commit()
            return result[0]
        
        # If insert didn't return (due to conflict), query again
        stmt = select(GlobalSubdepartment.id).where(
            GlobalSubdepartment.name == name,
            GlobalSubdepartment.department_id == department_id
        )
        result = db.execute(stmt).first()
        
        if result:
            return result[0]
        
        # This should not happen if the database is working correctly
        raise Exception(f"Failed to create or retrieve subdepartment: {name}")
    
    @staticmethod
    async def get_or_create_process(name: str, subdepartment_id: UUID, owner: str, db: Session) -> UUID:
        """
        Get or create a process by name and subdepartment, updating the owner if needed.
        
        Args:
            name: Process name
            subdepartment_id: Parent subdepartment ID
            owner: Process owner username
            db: Database session
            
        Returns:
            UUID of the process
        """
        # Try to find existing process
        stmt = select(GlobalProcess.id).where(
            GlobalProcess.name == name,
            GlobalProcess.subdepartment_id == subdepartment_id
        )
        result = db.execute(stmt).first()
        
        if result:
            process_id = result[0]
            # Update process owner if this user is logging in
            db.execute(
                update(GlobalProcess.__table__).where(
                    GlobalProcess.id == process_id
                ).values(
                    process_owner=owner
                )
            )
            db.commit()
            return process_id
        
        # Create new process if not found
        stmt = pg_insert(GlobalProcess.__table__).values(
            name=name,
            subdepartment_id=subdepartment_id,
            process_owner=owner
        ).on_conflict_do_nothing().returning(GlobalProcess.id)
        
        result = db.execute(stmt).first()
        
        # If insert returned a result, use it
        if result:
            db.commit()
            return result[0]
        
        # If insert didn't return (due to conflict), query again
        stmt = select(GlobalProcess.id).where(
            GlobalProcess.name == name,
            GlobalProcess.subdepartment_id == subdepartment_id
        )
        result = db.execute(stmt).first()
        
        if result:
            return result[0]
        
        # This should not happen if the database is working correctly
        raise Exception(f"Failed to create or retrieve process: {name}")

    @staticmethod
    async def update_organization_impact_matrix(
        organization_id: UUID,
        impact_matrix: Dict[str, Any],
        db: Session
    ) -> Dict[str, Any]:
        """
        Update the impact matrix for an organization.
        
        Args:
            organization_id: UUID of the organization
            impact_matrix: Impact matrix data as a dictionary
            db: Database session
            
        Returns:
            Updated organization with impact matrix
        """
        # Check if organization exists
        org = db.query(GlobalOrganization).filter(GlobalOrganization.id == organization_id).first()
        if not org:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Organization with ID {organization_id} not found"
            )
        
        # Update impact matrix
        org.impact_matrix = impact_matrix
        db.commit()
        db.refresh(org)
        
        # Convert to dict for response
        return {
            "id": org.id,
            "name": org.name,
            "head_username": org.head_username,
            "sector": org.sector,
            "criticality": org.criticality,
            "impact_matrix": org.impact_matrix,
            "created_at": org.created_at
        }
    
    @staticmethod
    async def get_organization_impact_matrix(
        organization_id: UUID,
        db: Session
    ) -> Dict[str, Any]:
        """
        Get the impact matrix for an organization.
        
        Args:
            organization_id: UUID of the organization
            db: Database session
            
        Returns:
            Organization impact matrix
        """
        # Get organization
        org = db.query(GlobalOrganization).filter(GlobalOrganization.id == organization_id).first()
        if not org:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Organization with ID {organization_id} not found"
            )
        
        # Return impact matrix
        return {
            "id": org.id,
            "name": org.name,
            "impact_matrix": org.impact_matrix or {}
        }
