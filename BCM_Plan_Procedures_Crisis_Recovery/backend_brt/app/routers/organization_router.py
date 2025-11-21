"""
Organization Router for handling organization-related operations.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from uuid import UUID
from pydantic import BaseModel

from app.db.postgres import get_db_context, get_db
from app.middleware.auth import get_current_user, require_permission
from app.models.rbac_models import User
from app.models.global_models import GlobalOrganization, GlobalDepartment, GlobalSubdepartment, GlobalProcess
from app.schemas.organization import (
    Organization as OrganizationSchema, 
    OrganizationCreate, 
    OrganizationUpdate, 
    ImpactMatrix, 
    FrontendImpactMatrix, 
    ImpactType, 
    ImpactLevel, 
    MatrixCell,
    OrganizationCriticality,
    Module,
    ModuleLicense,
    OrganizationModules,
    AvailableModules,
    AVAILABLE_MODULES,
    OrganizationDescription,
    OrganizationCreateMinimal
)
import ldap3
from app.services.org_hierarchy_service import OrgHierarchyService

router = APIRouter(
    prefix="/organizations",
    tags=["organizations"],
    responses={404: {"description": "Not found"}},
)

# Simple auth check without database dependency
def simple_auth_check(authorization: str = Header(None)):
    """
    Simple auth check using Authorization header without database dependency.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header"
        )
    
    token = authorization.split(" ")[1]
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    return True

@router.get("/search-by-name", response_model=List[OrganizationSchema])
async def search_organizations_by_name(
    name: str,
    # auth_check: bool = Depends(simple_auth_check)
):
    """
    Search for organizations by name.
    This endpoint helps administrators find organization IDs
    for use with other endpoints like module licensing.
    
    Args:
        name: Name or partial name to search for (case-insensitive)
        
    Returns:
        List of matching organizations with their IDs and basic information
    """
    try:
        # Get a database session using context manager
        with get_db_context() as db:
            # Build the query with name filter
            query = db.query(GlobalOrganization).filter(GlobalOrganization.name.ilike(f"%{name}%"))
            
            # Execute query and get results (limit to 20 for performance)
            organizations = query.limit(20).all()
            
            # Return the results
            return organizations
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching organizations: {str(e)}"
        )

@router.get("/{organization_id}", response_model=OrganizationSchema)
async def get_organization(
    organization_id: UUID,
    # auth_check: bool = Depends(simple_auth_check)
):
    """
    Get organization details by ID.
    """
    with get_db_context() as db:
        # Query organization from database
        org = db.query(GlobalOrganization).filter(GlobalOrganization.id == organization_id).first()
        
        if not org:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Organization with ID {organization_id} not found"
            )
        
        return org

@router.get("/{organization_id}/impact-matrix", response_model=Dict[str, Any])
async def get_organization_impact_matrix(
    organization_id: UUID,
    # auth_check: bool = Depends(simple_auth_check)
):
    """
    Get the impact matrix for an organization.
    """
    with get_db_context() as db:
        return await OrgHierarchyService.get_organization_impact_matrix(organization_id, db)

@router.get("/{organization_id}/impact-matrix/frontend", response_model=Dict[str, Any])
async def get_organization_impact_matrix_frontend(
    organization_id: UUID,
    # auth_check: bool = Depends(simple_auth_check)
):
    """
    Get the impact matrix for an organization in a frontend-friendly format.
    This endpoint is specifically designed for displaying the impact matrix in a table.
    
    Args:
        organization_id: UUID of the organization
        
    Returns:
        Impact matrix in a format suitable for frontend display
    """
    try:
        with get_db_context() as db:
            # Get the impact matrix from the database
            impact_matrix_data = await OrgHierarchyService.get_organization_impact_matrix(organization_id, db)
            
            if not impact_matrix_data or not impact_matrix_data.get("impact_matrix"):
                return {
                    "status": "success",
                    "message": "No impact matrix found for this organization",
                    "data": {
                        "organization_id": organization_id,
                        "title": "Impact Matrix",
                        "description": "",
                        "impact_types": [],
                        "impact_levels": [],
                        "cells": []
                    }
                }
            
            # Convert from storage format to frontend format
            impact_matrix = impact_matrix_data.get("impact_matrix", {})
            cells = impact_matrix.get("cells", [])
            impact_types = impact_matrix.get("impact_types", [])
            impact_levels = impact_matrix.get("impact_levels", [])
            areas_of_impact = impact_matrix.get("areas_of_impact", {})
            metadata = impact_matrix.get("metadata", {})
            
            # Create frontend impact types
            frontend_impact_types = []
            for impact_type in impact_types:
                frontend_impact_types.append(
                    ImpactType(
                        id=impact_type.lower().replace(" ", "_"),
                        name=impact_type,
                        area_of_impact=areas_of_impact.get(impact_type, "")
                    )
                )
            
            # Create frontend impact levels
            frontend_impact_levels = []
            for impact_level in impact_levels:
                # Extract value from level name if possible (e.g., "Major - 3" -> 3)
                value = None
                if " - " in impact_level:
                    try:
                        value = int(impact_level.split(" - ")[1])
                    except (ValueError, IndexError):
                        pass
                        
                frontend_impact_levels.append(
                    ImpactLevel(
                        id=impact_level.lower().replace(" ", "_").replace("-", ""),
                        name=impact_level,
                        value=value
                    )
                )
            
            # Create frontend cells
            frontend_cells = []
            for cell in cells:
                impact_type = cell.get("impact_type")
                impact_level = cell.get("impact_level")
                
                # Get IDs for the impact type and level
                impact_type_id = impact_type.lower().replace(" ", "_") if impact_type else ""
                impact_level_id = impact_level.lower().replace(" ", "_").replace("-", "") if impact_level else ""
                
                frontend_cells.append(
                    MatrixCell(
                        impact_type_id=impact_type_id,
                        impact_level_id=impact_level_id,
                        description=cell.get("description", "")
                    )
                )
            
            # Create frontend response
            frontend_data = {
                "organization_id": organization_id,
                "title": metadata.get("title", "Impact Matrix"),
                "description": metadata.get("description", ""),
                "impact_types": [type.dict() for type in frontend_impact_types],
                "impact_levels": [level.dict() for level in frontend_impact_levels],
                "cells": [cell.dict() for cell in frontend_cells],
                "created_by": metadata.get("created_by"),
                "updated_at": metadata.get("updated_at")
            }
            
            return {
                "status": "success",
                "message": "Impact matrix retrieved successfully",
                "data": frontend_data
            }
    except HTTPException as e:
        # Re-raise HTTP exceptions
        raise e
    except Exception as e:
        # Handle other exceptions
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving impact matrix: {str(e)}"
        )

@router.put("/{organization_id}/impact-matrix", response_model=Dict[str, Any])
async def update_organization_impact_matrix(
    organization_id: UUID,
    impact_matrix: ImpactMatrix,
    # auth_check: bool = Depends(simple_auth_check)
):
    """
    Update the impact matrix for an organization.
    """
    with get_db_context() as db:
        return await OrgHierarchyService.update_organization_impact_matrix(
            organization_id, 
            impact_matrix.dict(), 
            db
        )

@router.post("/{organization_id}/impact-matrix", response_model=Dict[str, Any])
async def create_organization_impact_matrix(
    organization_id: UUID,
    impact_matrix: ImpactMatrix,
    sector: Optional[str] = None,
    # auth_check: bool = Depends(simple_auth_check)
):
    """
    Create or replace an impact matrix for an organization.
    This endpoint is specifically designed for frontend integration.
    
    Args:
        organization_id: UUID of the organization
        impact_matrix: Impact matrix data
        sector: Optional sector to update for the organization
        
    Returns:
        Updated organization with the new impact matrix
        
    Example request body:
    ```json
    {
      "cells": [
        {
          "impact_type": "Financial Impact",
          "impact_level": "Major - 3",
          "description": "Earning Loss to the tune of Rs. 50K/Day"
        },
        {
          "impact_type": "Financial Impact",
          "impact_level": "Low - 1",
          "description": "Earning Loss to the tune of Rs. 10K/Day"
        }
      ],
      "impact_types": ["Financial Impact", "Operational Impact", "Customer Impact"],
      "impact_levels": ["Insignificant - 0", "Low - 1", "Moderate - 2", "Major - 3", "Catastrophic - 4"],
      "areas_of_impact": {
        "Financial Impact": "Revenue, Penalties/Claims, Productivity Loss, Contractual Liability",
        "Operational Impact": "Continuity of operations"
      },
      "metadata": {
        "title": "BIA Impact Scale",
        "description": "Organization impact scale matrix"
      }
    }
    ```
    """
    try:
        with get_db_context() as db:
            # Update the organization's impact matrix
            result = await OrgHierarchyService.update_organization_impact_matrix(
                organization_id,
                impact_matrix.dict(),
                db
            )
            
            # Update sector if provided
            if sector:
                org = db.query(GlobalOrganization).filter(GlobalOrganization.id == organization_id).first()
                if org:
                    org.sector = sector
                    db.commit()
                    result["sector"] = sector
            
            return {
                "status": "success",
                "message": "Impact matrix successfully stored",
                "data": result
            }
    except HTTPException as e:
        # Re-raise HTTP exceptions
        raise e
    except Exception as e:
        # Handle other exceptions
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error storing impact matrix: {str(e)}"
        )

@router.post("/{organization_id}/impact-matrix/frontend", response_model=Dict[str, Any])
async def create_organization_impact_matrix_frontend(
    organization_id: UUID,
    impact_matrix: FrontendImpactMatrix,
    # auth_check: bool = Depends(simple_auth_check)
):
    """
    Create or replace an impact matrix for an organization using a frontend-friendly format.
    This endpoint is specifically designed for frontend integration.
    
    Args:
        organization_id: UUID of the organization
        impact_matrix: Frontend-friendly impact matrix data
        
    Returns:
        Updated organization with the new impact matrix
    """
    try:
        with get_db_context() as db:
            # Ensure organization_id in path matches the one in the request body
            if impact_matrix.organization_id != organization_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Organization ID in path must match organization ID in request body"
                )
            
            # Extract sector from the request if available
            sector = getattr(impact_matrix, 'sector', None)
            
            # First, update the organization's sector if provided
            if sector:
                org = db.query(GlobalOrganization).filter(GlobalOrganization.id == organization_id).first()
                if not org:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Organization with ID {organization_id} not found"
                    )
                org.sector = sector
                db.commit()
            
            # Convert frontend format to storage format
            storage_format = impact_matrix.to_storage_format()
            
            # Set created_by if not provided (since we don't have current_user, skip this)
            # if not impact_matrix.created_by and current_user:
            #     storage_format.metadata["created_by"] = current_user.username
            
            # Update the organization's impact matrix
            result = await OrgHierarchyService.update_organization_impact_matrix(
                organization_id,
                storage_format.dict(),
                db
            )
            
            # Add sector to the result if it was updated
            if sector:
                result["sector"] = sector
            
            return {
                "status": "success",
                "message": "Impact matrix successfully stored",
                "data": result
            }
    except HTTPException as e:
        # Re-raise HTTP exceptions
        raise e
    except Exception as e:
        # Handle other exceptions
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error storing impact matrix: {str(e)}"
        )

@router.get("/{organization_id}/sector", response_model=Dict[str, Any])
async def get_organization_sector(
    organization_id: UUID,
    # auth_check: bool = Depends(simple_auth_check)
):
    """
    Get the sector for an organization.
    
    Args:
        organization_id: UUID of the organization
        
    Returns:
        Organization sector information
    """
    with get_db_context() as db:
        # Query organization from database
        org = db.query(GlobalOrganization).filter(GlobalOrganization.id == organization_id).first()
        
        if not org:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Organization with ID {organization_id} not found"
            )
        
        return {
            "organization_id": org.id,
            "sector": org.sector
        }

@router.get("/{organization_id}/criticality", response_model=Dict[str, Any])
async def get_organization_criticality(
    organization_id: UUID,
    # auth_check: bool = Depends(simple_auth_check)
):
    """
    Get the criticality for an organization.
    
    Args:
        organization_id: UUID of the organization
        
    Returns:
        Organization criticality information
    """
    try:
        with get_db_context() as db:
            # Query organization from database
            org = db.query(GlobalOrganization).filter(GlobalOrganization.id == organization_id).first()
            
            if not org:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Organization with ID {organization_id} not found"
                )
            
            # Return organization criticality
            return {
                "organization_id": str(org.id),
                "name": org.name,
                "criticality": org.criticality
            }
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error retrieving organization criticality: {str(e)}")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving organization criticality"
        )

@router.post("/{organization_id}/criticality", response_model=Dict[str, Any])
async def update_organization_criticality(
    organization_id: UUID,
    criticality_data: OrganizationCriticality,
    # auth_check: bool = Depends(simple_auth_check)
):
    """
    Update the criticality for an organization.
    
    Args:
        organization_id: UUID of the organization
        criticality_data: Criticality data with the new criticality value
        
    Returns:
        Updated organization criticality information
    """
    try:
        with get_db_context() as db:
            # Query organization from database
            org = db.query(GlobalOrganization).filter(GlobalOrganization.id == organization_id).first()
            
            if not org:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Organization with ID {organization_id} not found"
                )
            
            # Update criticality
            org.criticality = criticality_data.criticality
            db.commit()
            db.refresh(org)
            
            return {
                "status": "success",
                "message": "Organization criticality updated successfully",
                "data": {
                    "organization_id": org.id,
                    "criticality": org.criticality
                }
            }
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error updating organization criticality: {str(e)}")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while updating organization criticality"
        )

@router.get("/", response_model=List[OrganizationSchema])
async def list_organizations(
    skip: int = 0,
    limit: int = 100,
    # auth_check: bool = Depends(simple_auth_check)
):
    """
    List all organizations with pagination.
    """
    with get_db_context() as db:
        orgs = db.query(GlobalOrganization).offset(skip).limit(limit).all()
        
        # Ensure impact_matrix is a dictionary for each organization
        for org in orgs:
            if org.impact_matrix is None or (isinstance(org.impact_matrix, list) and len(org.impact_matrix) == 0):
                org.impact_matrix = {}
        
        return orgs

class ProcessFilterRequest(BaseModel):
    organization_id: UUID
    department_name: str
    subdepartment_name: str

@router.post("/processes/filter", response_model=List[Dict[str, str]])
async def get_processes_by_hierarchy(
    filter_request: ProcessFilterRequest,
    # auth_check: bool = Depends(simple_auth_check)
):
    """
    Get processes based on organization ID, department name, and subdepartment name.
    
    Args:
        filter_request: Request body containing organization_id, department_name, and subdepartment_name
        
    Returns:
        List of processes with their IDs, names, and process owner usernames
    """
    try:
        with get_db_context() as db:
            # First, verify the organization exists
            organization = db.query(GlobalOrganization).filter(
                GlobalOrganization.id == filter_request.organization_id
            ).first()
            
            if not organization:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Organization with ID {filter_request.organization_id} not found"
                )
            
            # Find the department by name within the organization
            department = db.query(GlobalDepartment).filter(
                GlobalDepartment.organization_id == filter_request.organization_id,
                GlobalDepartment.name == filter_request.department_name
            ).first()
            
            if not department:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Department '{filter_request.department_name}' not found in the specified organization"
                )
            
            # Find the subdepartment by name within the department
            subdepartment = db.query(GlobalSubdepartment).filter(
                GlobalSubdepartment.department_id == department.id,
                GlobalSubdepartment.name == filter_request.subdepartment_name
            ).first()
            
            if not subdepartment:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Subdepartment '{filter_request.subdepartment_name}' not found in the specified department"
                )
            
            # Get all processes for this subdepartment
            processes = db.query(GlobalProcess).filter(
                GlobalProcess.subdepartment_id == subdepartment.id
            ).all()
            
            # Convert to simplified format with id, name and process_owner
            result = []
            for process in processes:
                result.append({
                    "id": str(process.id),
                    "name": process.name,
                    "process_owner": process.process_owner or ""
                })
            
            return result
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving processes: {str(e)}"
        )

class OrganizationalUserLevel(BaseModel):
    """Schema for user level in organization hierarchy."""
    username: str
    display_name: str
    email: str
    organization: Optional[str] = None
    department: Optional[str] = None
    subdepartment: Optional[str] = None
    process: Optional[str] = None
    is_process_owner: bool = False
    is_department_head: bool = False
    is_subdepartment_head: bool = False

class OrganizationalUsersResponse(BaseModel):
    """Response schema for organizational users."""
    total_users: int
    users: List[OrganizationalUserLevel]

@router.get("/admin/users", response_model=OrganizationalUsersResponse)
async def get_all_organizational_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("admin", "read")),
    force_refresh: bool = False
):
    """
    Get all users across all organizations with their organizational levels from AD DS.
    This endpoint is for administrators only.
    
    Args:
        force_refresh: If True, bypass cache and fetch fresh data from AD
    
    Returns:
        List of all users with their organizational levels
    """
    # Import Redis caching utilities
    from app.utils.redis_utils import cache_get, cache_set
    import logging
    
    # Cache key for AD users
    cache_key = "ad_users_list"
    
    # Check if we have cached data and force_refresh is not requested
    if not force_refresh:
        cached_data = cache_get(cache_key)
        if cached_data:
            logger = logging.getLogger(__name__)
            logger.info("Returning AD users from Redis cache")
            return OrganizationalUsersResponse(
                total_users=len(cached_data),
                users=[OrganizationalUserLevel(**user) for user in cached_data]
            )
    
    # Create AD authenticator to interact with AD DS
    from app.core.config import settings
    from app.middleware.auth import ADAuthenticator
    from app.routers.admin_router import create_ad_connection
    
    ad_authenticator = ADAuthenticator(
        server_uri=settings.AD_SERVER_URI,
        base_dn=settings.AD_BASE_DN
    )
    
    try:
        # Connect to AD server using the secure connection with IP fallback
        conn = create_ad_connection()
        
        # Search for all users in the directory
        search_filter = f"(&(objectClass=user)(objectCategory=person))"
        
        # Search in the entire directory
        conn.search(
            search_base=settings.AD_BASE_DN,
            search_filter=search_filter,
            search_scope=ldap3.SUBTREE,
            attributes=[
                "sAMAccountName", "distinguishedName", "displayName", 
                "mail", "memberOf", "title", "department", "accountExpires"
            ]
        )
        
        users = []
        
        # Process each user entry
        for entry in conn.entries:
            user_dn = entry.distinguishedName.value if hasattr(entry, 'distinguishedName') else None
            
            if not user_dn:
                continue
                
            # Extract organizational hierarchy from DN
            org_path = ad_authenticator._extract_org_hierarchy(user_dn)
            
            # Determine user roles based on DN and memberOf
            is_process_owner = False
            is_department_head = False
            is_subdepartment_head = False
            
            # Check title or memberOf attributes for roles
            if hasattr(entry, 'title') and entry.title.value:
                title = entry.title.value.lower()
                is_process_owner = "process owner" in title
                is_department_head = "department head" in title
                is_subdepartment_head = "subdepartment head" in title
            
            # Check DN for process owner indication
            if "Process Owner" in user_dn or "Porcess Owner" in user_dn:
                is_process_owner = True
            
            # Create user object
            user = OrganizationalUserLevel(
                username=entry.sAMAccountName.value if hasattr(entry, 'sAMAccountName') else "",
                display_name=entry.displayName.value if hasattr(entry, 'displayName') else "",
                email=entry.mail.value if hasattr(entry, 'mail') else "",
                organization=org_path.get("organization"),
                department=org_path.get("department"),
                subdepartment=org_path.get("subdepartment"),
                process=org_path.get("process"),
                is_process_owner=is_process_owner,
                is_department_head=is_department_head,
                is_subdepartment_head=is_subdepartment_head
            )
            
            users.append(user.dict())
        
        # Cache the result
        cache_set(cache_key, users)
        
        # Return the response
        return OrganizationalUsersResponse(
            total_users=len(users),
            users=[OrganizationalUserLevel(**user) for user in users]
        )
        
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving users from AD DS: {str(e)}\n{error_detail}"
        )

@router.get("/modules/available", response_model=AvailableModules)
async def get_available_modules(
    auth_check: bool = Depends(simple_auth_check)
):
    """
    Get all available modules that can be licensed to organizations.
    
    Returns:
        List of all available modules with their IDs, names, and descriptions
    """
    return AvailableModules(modules=AVAILABLE_MODULES)


@router.get("/{organization_id}/modules", response_model=OrganizationModules)
async def get_organization_modules(
    organization_id: UUID,
    auth_check: bool = Depends(simple_auth_check)
):
    """
    Get the licensed modules for an organization.
    
    Args:
        organization_id: UUID of the organization
        
    Returns:
        List of modules licensed to the organization
    """
    try:
        with get_db_context() as db:
            # Query organization from database
            org = db.query(GlobalOrganization).filter(GlobalOrganization.id == organization_id).first()
            
            if not org:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Organization with ID {organization_id} not found"
                )
            
            # Return licensed modules or empty list if none
            licensed_modules = []
            if org.licensed_modules:
                # Convert each dict to ModuleLicense
                for module_dict in org.licensed_modules:
                    licensed_modules.append(ModuleLicense(**module_dict))
            
            return OrganizationModules(modules=licensed_modules)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving organization modules: {str(e)}"
        )


@router.put("/{organization_id}/modules", response_model=OrganizationModules)
async def update_organization_modules(
    organization_id: UUID,
    modules_data: OrganizationModules,
    auth_check: bool = Depends(simple_auth_check)
):
    """
    Update the licensed modules for an organization.
    
    Args:
        organization_id: UUID of the organization
        modules_data: Data containing the modules to be licensed to the organization
        
    Returns:
        Updated list of modules licensed to the organization
    """
    try:
        with get_db_context() as db:
            # Query organization from database
            org = db.query(GlobalOrganization).filter(GlobalOrganization.id == organization_id).first()
            
            if not org:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Organization with ID {organization_id} not found"
                )
            
            # Validate module IDs
            valid_module_ids = {module.id for module in AVAILABLE_MODULES}
            for module in modules_data.modules:
                if module.module_id not in valid_module_ids:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Invalid module ID: {module.module_id}"
                    )
            
            # Convert modules to list of dictionaries with module_id, is_licensed, start_date, and expiry_date
            module_list = []
            for module in modules_data.modules:
                module_dict = {
                    "module_id": module.module_id,
                    "is_licensed": module.is_licensed
                }
                
                # Add start_date if provided
                if module.start_date:
                    module_dict["start_date"] = module.start_date.isoformat()
                    
                # Add expiry_date if provided
                if module.expiry_date:
                    module_dict["expiry_date"] = module.expiry_date.isoformat()
                    
                module_list.append(module_dict)
            
            # Update using direct assignment - the column is JSONB type
            org.licensed_modules = module_list
            db.commit()
            db.refresh(org)
            
            # Return the updated modules
            return OrganizationModules(modules=modules_data.modules)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating organization modules: {str(e)}"
        )

@router.put("/{organization_id}/description", response_model=Dict[str, Any])
async def update_organization_description(
    organization_id: UUID,
    description_data: OrganizationDescription,
    auth_check: bool = Depends(simple_auth_check)
):
    """
    Update the description for an organization.
    
    Args:
        organization_id: UUID of the organization
        description_data: Description data containing structured information about the organization
        
    Returns:
        Updated organization description information
    """
    try:
        with get_db_context() as db:
            # Query organization from database
            org = db.query(GlobalOrganization).filter(GlobalOrganization.id == organization_id).first()
            
            if not org:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Organization with ID {organization_id} not found"
                )
            
            # Convert the description data to a dictionary
            description_dict = description_data.dict()
            
            # Update the organization's description field
            org.description = description_dict
            db.commit()
            db.refresh(org)
            
            return {
                "status": "success",
                "message": "Organization description updated successfully",
                "data": {
                    "organization_id": org.id,
                    "description": org.description
                }
            }
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error updating organization description: {str(e)}")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while updating organization description"
        )

@router.get("/{organization_id}/description", response_model=Dict[str, Any])
async def get_organization_description(
    organization_id: UUID,
    auth_check: bool = Depends(simple_auth_check)
):
    """
    Get the description for an organization.
    
    Args:
        organization_id: UUID of the organization
        
    Returns:
        Organization description information
    """
    try:
        with get_db_context() as db:
            # Query organization from database
            org = db.query(GlobalOrganization).filter(GlobalOrganization.id == organization_id).first()
            
            if not org:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Organization with ID {organization_id} not found"
                )
            
            # Return organization description
            return {
                "organization_id": str(org.id),
                "name": org.name,
                "description": org.description or {}
            }
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error retrieving organization description: {str(e)}")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving organization description"
        )

@router.post("/create-minimal", response_model=Dict[str, Any])
async def create_minimal_organization(
    organization_data: OrganizationCreateMinimal,
    auth_check: bool = Depends(simple_auth_check)
):
    """
    Create a new organization with just name and description.
    
    Args:
        organization_data: Minimal organization data (name and description)
        
    Returns:
        Created organization information
    """
    try:
        with get_db_context() as db:
            # Check if organization with this name already exists
            existing_org = db.query(GlobalOrganization).filter(
                GlobalOrganization.name == organization_data.name
            ).first()
            
            if existing_org:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Organization with name '{organization_data.name}' already exists"
                )
            
            # Create new organization
            new_org = GlobalOrganization(
                name=organization_data.name,
                description=organization_data.description.dict() if organization_data.description else {},
                impact_matrix={},
                licensed_modules=[],
                sector=None,
                criticality=None
            )
            
            db.add(new_org)
            db.commit()
            db.refresh(new_org)
            
            return {
                "status": "success",
                "message": "Organization created successfully",
                "data": {
                    "id": str(new_org.id),
                    "name": new_org.name,
                    "description": new_org.description
                }
            }
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error creating organization: {str(e)}")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while creating the organization"
        )

@router.delete("/{organization_id}", response_model=Dict[str, Any])
async def delete_organization(
    organization_id: UUID,
    auth_check: bool = Depends(simple_auth_check)
):
    """
    Delete an organization from both Active Directory and the database.
    
    Args:
        organization_id: UUID of the organization to delete
        
    Returns:
        Deletion status information
    """
    try:
        with get_db_context() as db:
            # Query organization from database
            org = db.query(GlobalOrganization).filter(GlobalOrganization.id == organization_id).first()
            
            if not org:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Organization with ID {organization_id} not found"
                )
            
            organization_name = org.name
            
            # Delete from database
            db.delete(org)
            db.commit()
            
            return {
                "status": "success",
                "message": f"Organization '{organization_name}' deleted successfully",
                "data": {
                    "organization_id": str(organization_id),
                    "organization_name": organization_name
                }
            }
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error deleting organization: {str(e)}")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while deleting the organization"
        )

@router.post("/", response_model=Dict[str, Any])
async def create_organization(
    organization_data: OrganizationCreate,
    auth_check: bool = Depends(simple_auth_check)
):
    """
    Create a new organization.
    
    Args:
        organization_data: Data for creating the new organization
        
    Returns:
        Newly created organization data
    """
    try:
        with get_db_context() as db:
            # Create new organization object
            new_org = GlobalOrganization(
                name=organization_data.name,
                sector=organization_data.sector,
                head_username=organization_data.head_username,
                # Convert description model to dict if provided
                description=organization_data.description.dict() if organization_data.description else {}
            )
            
            # Add to database
            db.add(new_org)
            db.commit()
            db.refresh(new_org)
            
            return {
                "status": "success",
                "message": "Organization created successfully",
                "data": {
                    "organization_id": str(new_org.id),
                    "name": new_org.name,
                    "sector": new_org.sector,
                    "head_username": new_org.head_username,
                    "description": new_org.description
                }
            }
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error creating organization: {str(e)}")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while creating the organization"
        )
