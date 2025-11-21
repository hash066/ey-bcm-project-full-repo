"""
Module Request Router - Handles module access request pipeline
Flow: User Request -> Client Head & Project Sponsor Approval -> Manual handling
"""
from datetime import datetime
from typing import List
from uuid import UUID
import ldap3
import ssl
from fastapi import APIRouter, HTTPException, Header, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.db.postgres import get_db_context
from app.models.global_models import ModuleRequest, GlobalOrganization
from app.schemas.module_request import (
    ModuleRequestCreate, 
    ModuleRequestApproval, 
    ModuleRequestResponse, 
    ModuleRequestSummary
)
from app.core.config import settings

print("=== MODULE REQUEST ROUTER INITIALIZED ===")

router = APIRouter(prefix="/module-requests", tags=["Module Requests"])


@router.get("/test")
async def test_endpoint():
    """Test endpoint to verify router is working"""
    print("=== TEST ENDPOINT CALLED ===")
    return {"message": "Module request router is working", "status": "ok"}


def create_ad_connection():
    """Create a connection to Active Directory"""
    try:
        use_ssl = settings.AD_SERVER_URI.lower().startswith('ldaps://')
        tls_configuration = ldap3.Tls(validate=ssl.CERT_NONE)
        
        server = ldap3.Server(
            settings.AD_SERVER_URI, 
            use_ssl=use_ssl,
            tls=tls_configuration if use_ssl else None,
            get_info=ldap3.ALL
        )
        
        conn = ldap3.Connection(
            server,
            user=settings.AD_BIND_USER,
            password=settings.AD_BIND_PASSWORD,
            authentication=ldap3.SIMPLE,
            auto_bind=True
        )
        
        return conn
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to connect to Active Directory: {str(e)}"
        )


def get_user_organization_from_ad(username: str):
    """
    Get user's organization by looking up their OU in Active Directory.
    Users are structured as: CN=username,OU=ProcessName,OU=SubdepartmentName,OU=DepartmentName,OU=OrganizationName,OU=Clients,DC=...
    """
    try:
        print(f"=== AD LOOKUP: Searching for user '{username}' ===")
        conn = create_ad_connection()
        
        # Search for the user in AD
        search_filter = f"(&(objectClass=user)(sAMAccountName={username}))"
        print(f"=== AD LOOKUP: Using filter '{search_filter}' ===")
        print(f"=== AD LOOKUP: Search base '{settings.AD_BASE_DN}' ===")
        
        conn.search(
            search_base=settings.AD_BASE_DN,
            search_filter=search_filter,
            search_scope=ldap3.SUBTREE,
            attributes=['distinguishedName', 'memberOf', 'sAMAccountName']
        )
        
        print(f"=== AD LOOKUP: Found {len(conn.entries)} entries ===")
        
        if not conn.entries:
            print("=== AD LOOKUP: No user found in AD ===")
            return None
        
        user_dn = str(conn.entries[0].distinguishedName)
        print(f"=== AD LOOKUP: User DN: {user_dn} ===")
        
        # Parse the DN to extract organization name
        # DN format: CN=username,OU=Process,OU=Subdept,OU=Dept,OU=OrgName,OU=Clients,DC=...
        dn_parts = user_dn.split(',')
        print(f"=== AD LOOKUP: DN parts: {dn_parts} ===")
        
        # Find the organization OU (should be before OU=Clients)
        org_name = None
        for i, part in enumerate(dn_parts):
            part = part.strip()
            print(f"=== AD LOOKUP: Checking part {i}: '{part}' ===")
            if part.startswith('OU=Clients'):
                print(f"=== AD LOOKUP: Found OU=Clients at index {i} ===")
                # The previous OU should be the organization
                if i > 0:
                    prev_part = dn_parts[i-1].strip()
                    print(f"=== AD LOOKUP: Previous part: '{prev_part}' ===")
                    if prev_part.startswith('OU='):
                        org_name = prev_part[3:]  # Remove 'OU=' prefix
                        print(f"=== AD LOOKUP: Extracted org name: '{org_name}' ===")
                break
        
        conn.unbind()
        print(f"=== AD LOOKUP: Final result: '{org_name}' ===")
        return org_name
        
    except Exception as e:
        print(f"=== AD LOOKUP ERROR: {str(e)} ===")
        import traceback
        traceback.print_exc()
        return None


# Simple auth check without database dependency
def simple_auth_check(authorization: str = Header(None)):
    """
    Simple auth check using Authorization header without database dependency.
    Returns user info extracted from JWT token.
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
    
    try:
        # Decode JWT token (simplified - no signature verification for now)
        import base64
        import json
        
        # Split JWT into parts
        parts = token.split('.')
        if len(parts) != 3:
            raise ValueError("Invalid JWT format")
        
        # Decode payload (add padding if needed)
        payload = parts[1]
        # Add padding if needed
        payload += '=' * (4 - len(payload) % 4)
        decoded_payload = base64.b64decode(payload)
        user_data = json.loads(decoded_payload)
        
        print(f"=== JWT DECODED: {user_data} ===")
        
        return {
            "username": user_data.get("sub"),
            "user_id": user_data.get("user_id"),
            "organization_id": user_data.get("organization_id"),
            "department_id": user_data.get("department_id"),
            "subdepartment_id": user_data.get("subdepartment_id"),
            "roles": user_data.get("roles", []),
            "email": f"{user_data.get('sub')}@example.com",  # Placeholder
            "display_name": user_data.get("sub", "").title()  # Placeholder
        }
    except Exception as e:
        print(f"=== JWT DECODE ERROR: {str(e)} ===")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format"
        )


@router.post("/", response_model=ModuleRequestResponse)
async def create_module_request(
    request_data: ModuleRequestCreate,
    authorization: str = Header(None)
):
    """Create a new module access request."""
    print("=== CREATE MODULE REQUEST CALLED ===")
    # Simple auth check
    user_info = simple_auth_check(authorization)
    
    with get_db_context() as db:
        # Get organization from database
        organization = db.query(GlobalOrganization).filter(
            GlobalOrganization.id == user_info["organization_id"]
        ).first()
        
        if not organization:
            raise HTTPException(status_code=404, detail="User's organization not found in database")
        
        # Check if module is already licensed
        if request_data.module_id in (organization.licensed_modules or []):
            raise HTTPException(status_code=400, detail="Module already available to organization")
        
        # Check for existing pending request
        existing_request = db.query(ModuleRequest).filter(
            and_(
                ModuleRequest.organization_id == organization.id,
                ModuleRequest.module_id == request_data.module_id,
                ModuleRequest.status.in_(["pending", "client_head_approved", "project_sponsor_approved"])
            )
        ).first()
        
        if existing_request:
            raise HTTPException(status_code=400, detail="Request for this module already pending")
        
        # Create new request
        new_request = ModuleRequest(
            organization_id=organization.id,
            module_id=request_data.module_id,
            module_name=request_data.module_name,
            requester_username=user_info["username"],
            requester_email=user_info.get("email"),
            requester_display_name=user_info.get("display_name"),
            request_reason=request_data.request_reason,
            status="pending"
        )
        
        db.add(new_request)
        db.commit()
        db.refresh(new_request)
        
        return new_request


@router.get("/my-requests", response_model=List[ModuleRequestSummary])
async def get_my_requests(
    authorization: str = Header(None)
):
    """Get all module requests made by the current user."""
    print("=== GET MY REQUESTS CALLED ===")
    user_info = simple_auth_check(authorization)
    
    with get_db_context() as db:
        requests = db.query(ModuleRequest).filter(
            ModuleRequest.requester_username == user_info["username"]
        ).order_by(ModuleRequest.created_at.desc()).all()
        
        return requests


@router.get("/pending-approvals", response_model=List[ModuleRequestSummary])
async def get_pending_approvals(
    authorization: str = Header(None)
):
    """Get module requests pending approval by current user."""
    print("=== GET PENDING APPROVALS CALLED ===")
    user_info = simple_auth_check(authorization)
    
    with get_db_context() as db:
        # Check if user has Client Head or Project Sponsor role
        user_roles = user_info.get("roles", [])
        print(f"=== USER ROLES: {user_roles} ===")
        
        is_client_head = "Client Head" in user_roles
        is_project_sponsor = "Project Sponsor" in user_roles
        
        if not (is_client_head or is_project_sponsor):
            raise HTTPException(status_code=403, detail="Only Client Head or Project Sponsor can view pending approvals")
        
        # Get organization from database
        organization = db.query(GlobalOrganization).filter(
            GlobalOrganization.id == user_info["organization_id"]
        ).first()
        
        if not organization:
            raise HTTPException(status_code=404, detail="User's organization not found in database")
        
        # Get requests that need this user's approval
        query = db.query(ModuleRequest).filter(
            ModuleRequest.organization_id == organization.id
        )
        
        # Filter based on user role and current approval status
        if is_client_head:
            # Client Head sees requests pending their approval
            query = query.filter(
                and_(
                    ModuleRequest.status == "pending",
                    ModuleRequest.client_head_approved.is_(None)
                )
            )
        elif is_project_sponsor:
            # Project Sponsor sees requests pending their approval (after Client Head approved)
            query = query.filter(
                or_(
                    and_(
                        ModuleRequest.status == "pending",
                        ModuleRequest.project_sponsor_approved.is_(None)
                    ),
                    and_(
                        ModuleRequest.status == "client_head_approved",
                        ModuleRequest.project_sponsor_approved.is_(None)
                    )
                )
            )
        
        requests = query.order_by(ModuleRequest.created_at.desc()).all()
        return requests


@router.post("/{request_id}/client-head-approval", response_model=ModuleRequestResponse)
async def client_head_approval(
    request_id: UUID,
    approval_data: ModuleRequestApproval,
    authorization: str = Header(None)
):
    """Client Head approves or rejects a module request."""
    print("=== CLIENT HEAD APPROVAL CALLED ===")
    user_info = simple_auth_check(authorization)
    
    with get_db_context() as db:
        # Get the request
        request = db.query(ModuleRequest).filter(ModuleRequest.id == request_id).first()
        if not request:
            raise HTTPException(status_code=404, detail="Request not found")
        
        # Get request's organization
        organization = db.query(GlobalOrganization).filter(
            GlobalOrganization.id == request.organization_id
        ).first()
        
        if not organization:
            raise HTTPException(status_code=404, detail="Organization not found")
        
        # Verify user has Client Head role
        if "Client Head" not in user_info.get("roles", []):
            raise HTTPException(status_code=403, detail="Only Client Head can approve requests")
        
        # Check if already processed by Client Head
        if request.client_head_approved is not None:
            raise HTTPException(status_code=400, detail="Request already processed by Client Head")
        
        # Update request
        request.client_head_approved = approval_data.action
        request.client_head_approved_by = user_info["username"]
        request.client_head_approved_at = datetime.utcnow()
        request.client_head_comments = approval_data.comments
        
        if approval_data.action == "reject":
            request.status = "rejected"
            request.completed_at = datetime.utcnow()
        elif approval_data.action == "approve":
            # Check if Project Sponsor also approved
            if request.project_sponsor_approved == "approve":
                request.status = "approved"
                request.completed_at = datetime.utcnow()
            else:
                request.status = "client_head_approved"
        
        db.commit()
        db.refresh(request)
        
        return request


@router.post("/{request_id}/project-sponsor-approval", response_model=ModuleRequestResponse)
async def project_sponsor_approval(
    request_id: UUID,
    approval_data: ModuleRequestApproval,
    authorization: str = Header(None)
):
    """Project Sponsor approves or rejects a module request."""
    print("=== PROJECT SPONSOR APPROVAL CALLED ===")
    user_info = simple_auth_check(authorization)
    
    with get_db_context() as db:
        # Get the request
        request = db.query(ModuleRequest).filter(ModuleRequest.id == request_id).first()
        if not request:
            raise HTTPException(status_code=404, detail="Request not found")
        
        # Get request's organization
        organization = db.query(GlobalOrganization).filter(
            GlobalOrganization.id == request.organization_id
        ).first()
        
        if not organization:
            raise HTTPException(status_code=404, detail="Organization not found")
        
        # Verify user has Project Sponsor role
        if "Project Sponsor" not in user_info.get("roles", []):
            raise HTTPException(status_code=403, detail="Only Project Sponsor can approve requests")
        
        # Check if already processed by Project Sponsor
        if request.project_sponsor_approved is not None:
            raise HTTPException(status_code=400, detail="Request already processed by Project Sponsor")
        
        # Update request
        request.project_sponsor_approved = approval_data.action
        request.project_sponsor_approved_by = user_info["username"]
        request.project_sponsor_approved_at = datetime.utcnow()
        request.project_sponsor_comments = approval_data.comments
        
        if approval_data.action == "reject":
            request.status = "rejected"
            request.completed_at = datetime.utcnow()
        elif approval_data.action == "approve":
            # Check if Client Head also approved
            if request.client_head_approved == "approve":
                request.status = "approved"
                request.completed_at = datetime.utcnow()
            else:
                request.status = "project_sponsor_approved"
        
        db.commit()
        db.refresh(request)
        
        return request


@router.get("/{request_id}", response_model=ModuleRequestResponse)
async def get_request_details(
    request_id: UUID,
    authorization: str = Header(None)
):
    """Get detailed information about a specific module request."""
    print("=== GET REQUEST DETAILS CALLED ===")
    user_info = simple_auth_check(authorization)
    
    with get_db_context() as db:
        request = db.query(ModuleRequest).filter(ModuleRequest.id == request_id).first()
        if not request:
            raise HTTPException(status_code=404, detail="Request not found")
        
        # Get request's organization
        organization = db.query(GlobalOrganization).filter(
            GlobalOrganization.id == request.organization_id
        ).first()
        
        if not organization:
            raise HTTPException(status_code=404, detail="Organization not found")
        
        # Check access permissions
        has_access = (
            request.requester_username == user_info["username"] or
            "Client Head" in user_info.get("roles", []) or
            "Project Sponsor" in user_info.get("roles", [])
        )
        
        if not has_access:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return request


@router.get("/organization/{organization_id}", response_model=List[ModuleRequestResponse])
async def get_organization_requests(
    organization_id: UUID,
    authorization: str = Header(None)
):
    """Get all module requests for a specific organization."""
    print("=== GET ORGANIZATION REQUESTS CALLED ===")
    user_info = simple_auth_check(authorization)
    
    with get_db_context() as db:
        # Get organization from database
        organization = db.query(GlobalOrganization).filter(
            GlobalOrganization.id == organization_id
        ).first()
        
        if not organization:
            raise HTTPException(status_code=404, detail="Organization not found")
        
        # Check if user has Client Head or Project Sponsor role
        has_access = (
            "Client Head" in user_info.get("roles", []) or
            "Project Sponsor" in user_info.get("roles", [])
        )
        
        if not has_access:
            raise HTTPException(status_code=403, detail="Access denied")
        
        requests = db.query(ModuleRequest).filter(
            ModuleRequest.organization_id == organization_id
        ).order_by(ModuleRequest.created_at.desc()).all()
        
        return requests
