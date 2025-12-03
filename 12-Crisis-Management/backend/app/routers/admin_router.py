"""
Admin Router for administrator-specific operations.
Migrated to use Supabase as the primary database for applicable operations.
"""
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form, Body, Header
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, timedelta, timezone
from uuid import UUID
import os
import json
import csv
import ldap3
from ldap3 import core
from app.db.postgres import get_db
from app.middleware.auth import get_current_user
from app.models.rbac_models import Role, User
from app.models.global_models import GlobalOrganization, GlobalDepartment, GlobalSubdepartment, GlobalProcess
from app.core.config import settings
import re
import subprocess
import time
import ssl
import traceback
import logging
from app.utils.supabase_migration_utils import (
    supabase_select, supabase_insert, supabase_update, supabase_delete,
    convert_uuid_to_string, prepare_record_for_supabase
)

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    responses={401: {"description": "Unauthorized"}, 403: {"description": "Forbidden"}},
)

class OrganizationalUserLevel(BaseModel):
    """Schema for user level in organization hierarchy."""
    username: str
    display_name: str = ""  # Default empty string to handle None values
    email: str = ""  # Default empty string to handle None values
    organization: Optional[str] = None
    department: Optional[str] = None
    subdepartment: Optional[str] = None
    process: Optional[str] = None
    is_process_owner: bool = False
    is_department_head: bool = False
    is_subdepartment_head: bool = False
    account_expires: Optional[str] = None  # Account expiration date
    account_active: bool = True  # Whether the account is active

class OrganizationalUsersResponse(BaseModel):
    """Response schema for organizational users."""
    total_users: int
    users: List[OrganizationalUserLevel]

# Simple admin check without database dependency
def simple_admin_check(authorization: str = Header(None)):
    """
    Simple admin check using Authorization header without database dependency.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header"
        )
    
    # For now, we'll accept any valid Bearer token for admin operations
    # In production, you should validate the JWT token properly
    token = authorization.split(" ")[1]
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    return True

# Custom dependency to check for Administrator username
async def require_administrator(current_user = Depends(get_current_user)):
    """
    Check if the current user is the Administrator.
    This is a custom dependency that verifies the user has Administrator privileges.
    """
    # Check if the user is the Administrator user
    if not current_user or not hasattr(current_user, 'username') or current_user.username != "Administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint requires Administrator privileges"
        )
    return current_user

def create_ad_connection():
    """Create a connection to Active Directory"""
    try:
        # Debug: Print the actual server URI being used
        print(f"Creating AD connection with URI: {settings.AD_SERVER_URI}")
        
        # Check if we're using LDAPS
        use_ssl = settings.AD_SERVER_URI.lower().startswith('ldaps://')
        print(f"Using SSL/TLS: {use_ssl}")
        
        # Use TLS for secure connection
        tls_configuration = ldap3.Tls(validate=ssl.CERT_NONE)  # Skip certificate validation for self-signed certs
        
        try:
            # First try with the configured URI
            server = ldap3.Server(
                settings.AD_SERVER_URI, 
                get_info=ldap3.ALL, 
                tls=tls_configuration if use_ssl else None,
                use_ssl=use_ssl
            )
            
            # Debug: Print bind credentials (without showing the actual password)
            print(f"Binding with user: {settings.AD_BIND_USER}")
            
            # Create connection
            conn = ldap3.Connection(
                server,
                user=settings.AD_BIND_USER,
                password=settings.AD_BIND_PASSWORD,
                authentication=ldap3.SIMPLE,
                auto_bind=True
            )
            
            print("AD connection successful")
            return conn
        except ldap3.core.exceptions.LDAPSocketOpenError as socket_error:
            # If hostname doesn't work, try with IP address
            print(f"Error connecting with hostname: {str(socket_error)}")
            print("Trying with IP address instead...")
            
            # Use IP address instead of hostname
            ip_uri = "ldaps://192.168.182.148:636" if use_ssl else "ldap://192.168.182.135:389"
            print(f"Using IP address URI: {ip_uri}")
            
            server = ldap3.Server(
                ip_uri, 
                get_info=ldap3.ALL, 
                tls=tls_configuration if use_ssl else None,
                use_ssl=use_ssl
            )
            
            conn = ldap3.Connection(
                server,
                user=settings.AD_BIND_USER,
                password=settings.AD_BIND_PASSWORD,
                authentication=ldap3.SIMPLE,
                auto_bind=True
            )
            
            print("AD connection successful with IP address")
            return conn
            
    except Exception as e:
        print(f"Error connecting to AD: {str(e)}")
        raise e

@router.get("/users", response_model=OrganizationalUsersResponse)
async def get_all_organizational_users(
    admin_check: bool = Depends(simple_admin_check),
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
    try:
        from app.core.config import settings
        from app.middleware.auth import ADAuthenticator
        
        # Connect to AD server
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
        ad_authenticator = ADAuthenticator(
            server_uri=settings.AD_SERVER_URI,
            base_dn=settings.AD_BASE_DN
        )
        
        # Process each user entry
        for entry in conn.entries:
            user_dn = entry.distinguishedName.value if hasattr(entry, 'distinguishedName') else None
            
            if not user_dn:
                continue
                
            # Skip users from ARCHIVE ORGANIZATIONS OU
            if "ARCHIVE ORGANIZATIONS" in user_dn:
                continue
                
            # Extract organizational hierarchy from DN
            org_path = ad_authenticator._extract_org_hierarchy(user_dn)
            
            # Determine user roles
            is_process_owner = False
            is_department_head = False
            is_subdepartment_head = False
            
            if hasattr(entry, 'title') and entry.title.value:
                title = entry.title.value.lower()
                is_process_owner = "process owner" in title
                is_department_head = "department head" in title
                is_subdepartment_head = "subdepartment head" in title
            
            if "Process Owner" in user_dn or "Porcess Owner" in user_dn:
                is_process_owner = True
            
            # Get account expiration
            account_expires = None
            account_active = True
            if hasattr(entry, 'accountExpires') and entry.accountExpires.value:
                try:
                    if isinstance(entry.accountExpires.value, datetime):
                        expires_date = entry.accountExpires.value
                        account_expires = expires_date.isoformat()
                        account_active = expires_date > datetime.now(timezone.utc)
                    else:
                        try:
                            account_expires_value = int(entry.accountExpires.value)
                            if account_expires_value not in [0, 9223372036854775807]:
                                seconds_since_1601 = account_expires_value / 10000000
                                epoch_diff = 11644473600
                                seconds_since_1970 = seconds_since_1601 - epoch_diff
                                expires_date = datetime.fromtimestamp(seconds_since_1970, tz=timezone.utc)
                                account_expires = expires_date.isoformat()
                                account_active = expires_date > datetime.now(timezone.utc)
                        except (ValueError, TypeError):
                            pass
                except Exception:
                    pass
            
            # Create user object
            user = OrganizationalUserLevel(
                username=entry.sAMAccountName.value if hasattr(entry, 'sAMAccountName') else "",
                display_name=entry.displayName.value if hasattr(entry, 'displayName') and entry.displayName.value else "",
                email=entry.mail.value if hasattr(entry, 'mail') and entry.mail.value else "",
                organization=org_path.get("organization"),
                department=org_path.get("department"),
                subdepartment=org_path.get("subdepartment"),
                process=org_path.get("process"),
                is_process_owner=is_process_owner,
                is_department_head=is_department_head,
                is_subdepartment_head=is_subdepartment_head,
                account_expires=account_expires,
                account_active=account_active
            )
            users.append(user)
        
        conn.unbind()
        return OrganizationalUsersResponse(total_users=len(users), users=users)
        
    except Exception as e:
        if 'conn' in locals() and conn.bound:
            conn.unbind()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving users: {str(e)}"
        )

@router.post("/users/invalidate-cache", status_code=status.HTTP_200_OK)
async def invalidate_users_cache(
    admin_check: bool = Depends(simple_admin_check)
):
    """
    Invalidate the AD users cache to force a fresh fetch on next request.
    This endpoint is for administrators only.
    
    Returns:
        Status message
    """
    try:
        from app.utils.redis_utils import cache_delete
        
        # Delete the users cache
        cache_key = "ad_users_list"
        success = cache_delete(cache_key)
        
        if success:
            return {"status": "success", "message": "AD users cache invalidated successfully"}
        else:
            return {"status": "warning", "message": "Cache key not found or already cleared"}
            
    except ImportError:
        return {"status": "warning", "message": "Redis not available, no cache to invalidate"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to invalidate AD users cache: {str(e)}"
        )

# Schema for license expiry update request
class OrganizationLicenseExpiryRequest(BaseModel):
    """Schema for updating license expiry for all users in an organization"""
    organization_name: str
    expiry_date: datetime

@router.post("/organizations/update-license-expiry", response_model=dict)
async def update_organization_license_expiry(
    request: OrganizationLicenseExpiryRequest,
    current_user: User = Depends(require_administrator)
):
    """
    Update license expiry date for all users in a specific client organization.
    
    This endpoint sets the Active Directory accountExpirationDate attribute for all users
    in the specified organization's OU.
    
    Args:
        request: Request containing organization name and expiry date
        
    Returns:
        Dict with status and number of users updated
    """
    try:
        # Convert datetime to Windows FileTime format (100ns since Jan 1, 1601)
        # A value of 0 means "never expires"
        # 9223372036854775807 (0x7FFFFFFFFFFFFFFF) also means "never expires"
        def datetime_to_filetime(dt: datetime) -> str:
            if dt is None:
                return "0"  # Never expires
            
            windows_epoch = datetime(1601, 1, 1, tzinfo=timezone.utc)
            
            # Ensure dt has timezone info
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
                
            delta = dt - windows_epoch
            return str(int(delta.total_seconds() * 10**7))
        
        # Connect to AD server
        conn = create_ad_connection()
        
        # Build the OU path for the organization
        organization_ou = f"OU={request.organization_name},OU=Clients,{settings.AD_BASE_DN}"
        
        # Search for all users in the organization's OU
        conn.search(
            search_base=organization_ou,
            search_filter="(objectClass=user)",
            search_scope=ldap3.SUBTREE,
            attributes=["distinguishedName", "sAMAccountName"]
        )
        
        if not conn.entries:
            return {
                "status": "warning",
                "message": f"No users found in organization {request.organization_name}",
                "users_updated": 0
            }
        
        # Update expiry date for each user
        updated_count = 0
        failed_users = []
        
        for user in conn.entries:
            try:
                user_dn = user.distinguishedName.value
                username = user.sAMAccountName.value
                
                # Convert expiry date to FileTime format
                filetime_value = datetime_to_filetime(request.expiry_date)
                
                # Update accountExpires attribute
                conn.modify(user_dn, {'accountExpires': [(ldap3.MODIFY_REPLACE, [filetime_value])]})
                
                if conn.result["result"] == 0:  # Success
                    updated_count += 1
                else:
                    failed_users.append({
                        "username": username,
                        "error": conn.result["description"]
                    })
            except Exception as e:
                failed_users.append({
                    "username": user.sAMAccountName.value if hasattr(user, "sAMAccountName") else "unknown",
                    "error": str(e)
                })
        
        conn.unbind()
        
        return {
            "status": "success",
            "message": f"Updated license expiry for {updated_count} users in {request.organization_name}",
            "users_updated": updated_count,
            "failed_users": failed_users if failed_users else None,
            "expiry_date": request.expiry_date.isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update license expiry: {str(e)}"
        )

# Alternative endpoint using PowerShell for Windows environments
class PowerShellLicenseExpiryRequest(BaseModel):
    """Schema for updating license expiry using PowerShell"""
    organization_name: str
    expiry_months: int = 6  # Default to 6 months from now

@router.post("/organizations/update-license-expiry-powershell", response_model=dict)
async def update_organization_license_expiry_powershell(
    request: PowerShellLicenseExpiryRequest,
    current_user: User = Depends(require_administrator)
):
    """
    Update license expiry date for all users in a specific client organization using PowerShell.
    
    This endpoint uses PowerShell commands to set the Active Directory accountExpirationDate
    attribute for all users in the specified organization's OU.
    
    Args:
        request: Request containing organization name and expiry months
        
    Returns:
        Dict with status and command output
    """
    try:
        import subprocess
        
        # Create PowerShell command
        ps_command = f"""
        # Set the expiry date to {request.expiry_months} months from now
        $expiryDate = (Get-Date).AddMonths({request.expiry_months})

        # Get all users under the "{request.organization_name}" OU
        Get-ADUser -SearchBase "OU={request.organization_name},OU=Clients,DC=ey,DC=local" -Filter * |
        ForEach-Object {{
            Set-ADUser $_ -AccountExpirationDate $expiryDate
        }}
        
        # Return the number of users updated
        $users = Get-ADUser -SearchBase "OU={request.organization_name},OU=Clients,DC=ey,DC=local" -Filter *
        $users.Count
        """
        
        # Execute PowerShell command
        result = subprocess.run(
            ["powershell", "-Command", ps_command],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            raise Exception(f"PowerShell error: {result.stderr}")
        
        # Try to parse the number of users updated
        try:
            users_updated = int(result.stdout.strip())
        except:
            users_updated = None
        
        return {
            "status": "success",
            "message": f"Updated license expiry for users in {request.organization_name}",
            "users_updated": users_updated,
            "expiry_months": request.expiry_months,
            "powershell_output": result.stdout
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update license expiry: {str(e)}"
        )

# Schema for user creation in AD
class UserCreationSchema(BaseModel):
    """Schema for creating a user in Active Directory"""
    username: str
    display_name: Optional[str] = None
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    title: Optional[str] = None
    
class ProcessSchema(BaseModel):
    """Schema for a process in the organization hierarchy"""
    name: str
    owner: Optional[UserCreationSchema] = None
    
class SubdepartmentSchema(BaseModel):
    """Schema for a subdepartment in the organization hierarchy"""
    name: str
    head: Optional[UserCreationSchema] = None
    processes: List[ProcessSchema] = []
    
class DepartmentSchema(BaseModel):
    """Schema for a department in the organization hierarchy"""
    name: str
    head: Optional[UserCreationSchema] = None
    subdepartments: List[SubdepartmentSchema] = []
    
class OrganizationSetupSchema(BaseModel):
    """Schema for setting up a complete organization in AD"""
    organization_name: str
    default_password: str = Field(..., min_length=8)
    client_head: Optional[UserCreationSchema] = None
    bcm_coordinator: Optional[UserCreationSchema] = None
    ceo: Optional[UserCreationSchema] = None
    reportee: Optional[UserCreationSchema] = None
    sub_reportee: Optional[UserCreationSchema] = None
    cxo: Optional[UserCreationSchema] = None
    project_sponsor: Optional[UserCreationSchema] = None
    department_head: Optional[UserCreationSchema] = None
    subdepartment_head: Optional[UserCreationSchema] = None
    process_owner: Optional[UserCreationSchema] = None
    departments: List[DepartmentSchema] = []

@router.post("/organizations/setup", response_model=Dict[str, Any])
async def setup_organization_structure(
    setup_data: OrganizationSetupSchema,
    current_user: User = Depends(require_administrator)
):
    """
    Create a complete organization structure in Active Directory.
    
    This endpoint:
    1. Creates an OU for the organization under OU=Clients,DC=ey,DC=local
    2. Creates nested OUs for departments, subdepartments, and processes
    3. Creates users and assigns them to the correct OUs
    4. Sets up appropriate group memberships
    
    Args:
        setup_data: Complete organization structure data
        
    Returns:
        Dict with status and creation summary
    """
    try:
        print(f"Starting organization setup for: {setup_data.organization_name}")
        
        # Connect to AD server
        print(f"Connecting to AD server: {settings.AD_SERVER_URI}")
        print(f"Using bind user: {settings.AD_BIND_USER}")
        print(f"Base DN: {settings.AD_BASE_DN}")
        
        try:
            conn = create_ad_connection()
        except Exception as conn_error:
            print(f"ERROR in create_ad_connection: {str(conn_error)}")
            traceback.print_exc()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to connect to Active Directory: {str(conn_error)}"
            )
        
        # Track created objects for reporting
        created_objects = {
            "organization": None,
            "users": [],
            "departments": [],
            "subdepartments": [],
            "processes": []
        }
        
        # Create organization OU
        org_ou_dn = f"OU={setup_data.organization_name},OU=Clients,{settings.AD_BASE_DN}"
        print(f"Creating organization OU: {org_ou_dn}")
        
        # Check if organization OU already exists
        print(f"Checking if organization already exists in: OU=Clients,{settings.AD_BASE_DN}")
        conn.search(
            search_base=f"OU=Clients,{settings.AD_BASE_DN}",
            search_filter=f"(ou={setup_data.organization_name})",
            search_scope=ldap3.LEVEL,
            attributes=["ou"]
        )
        
        if conn.entries:
            print(f"Organization {setup_data.organization_name} already exists")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Organization '{setup_data.organization_name}' already exists in Active Directory"
            )
        
        # Create organization OU
        print(f"Adding organization OU: {org_ou_dn}")
        conn.add(org_ou_dn, ["organizationalUnit"], {"ou": setup_data.organization_name})
        if conn.result["result"] != 0:
            print(f"Failed to create organization OU: {conn.result}")
            raise Exception(f"Failed to create organization OU: {conn.result['description']}")
        print(f"Successfully created organization OU: {org_ou_dn}")
        created_objects["organization"] = org_ou_dn
        
        # Create Groups OU
        groups_ou_dn = f"OU=Groups,{org_ou_dn}"
        print(f"Creating Groups OU: {groups_ou_dn}")
        conn.add(groups_ou_dn, ["organizationalUnit"], {"ou": "Groups"})
        if conn.result["result"] != 0:
            print(f"Failed to create Groups OU: {conn.result}")
            raise Exception(f"Failed to create Groups OU: {conn.result['description']}")
        print(f"Successfully created Groups OU: {groups_ou_dn}")
        
        # Create the required security groups
        security_groups = [
            "BRT_Admins",
            "BRT_CEOs",
            "BRT_Reportees",
            "BRT_SubReportees", 
            "BRT_CXOs",
            "BRT_ProjectSponsors",
            "BRT_ClientHeads",
            "BRT_BCMCoordinators",
            "BRT_DepartmentHeads",
            "BRT_SubDepartmentHeads",
            "BRT_ProcessOwners"
        ]
        
        group_dns = {}
        for group_name in security_groups:
            group_dn = f"CN={group_name},{groups_ou_dn}"
            print(f"Creating security group: {group_dn}")
            
            # Check if the group already exists in the domain
            # We need to search in the entire domain since group names are domain-wide
            conn.search(
                search_base=settings.AD_BASE_DN,
                search_filter=f"(sAMAccountName={group_name})",
                search_scope=ldap3.SUBTREE,
                attributes=["distinguishedName"]
            )
            
            existing_group = None
            if conn.entries:
                print(f"Group {group_name} already exists in the domain")
                existing_group = conn.entries[0].distinguishedName.value
                
                # Check if the existing group is in a different organization
                if not existing_group.endswith(f",{groups_ou_dn}"):
                    print(f"Existing group is in a different location: {existing_group}")
                    # We'll create a local reference to the existing group
                    try:
                        # Create a group with the same name in our OU that references the domain group
                        print(f"Creating local reference to domain group: {group_dn}")
                        conn.add(group_dn, ["top", "group"], {
                            "cn": group_name,
                            "sAMAccountName": f"Local_{setup_data.organization_name}_{group_name}",
                            "groupType": "-2147483646",  # Security group, Global scope
                            "description": f"Local reference to domain group {existing_group}"
                        })
                        
                        if conn.result["result"] != 0:
                            print(f"Failed to create local reference group: {conn.result}")
                            # Not raising exception here, we'll use the domain group directly
                        else:
                            print(f"Successfully created local reference group")
                            group_dns[group_name] = group_dn
                    except Exception as e:
                        print(f"Error creating local reference group: {str(e)}")
                        # Fall back to using the domain group
                    
                # Store the existing group DN for later use
                group_dns[group_name] = existing_group
            else:
                # Create the group if it doesn't exist
                conn.add(group_dn, ["top", "group"], {
                    "cn": group_name,
                    "sAMAccountName": group_name,
                    "groupType": "-2147483646"  # Security group, Global scope
                })
                
                if conn.result["result"] != 0:
                    print(f"Failed to create security group {group_name}: {conn.result}")
                    # Instead of failing, we'll try to find the group again - it might have been created by another process
                    conn.search(
                        search_base=settings.AD_BASE_DN,
                        search_filter=f"(sAMAccountName={group_name})",
                        search_scope=ldap3.SUBTREE,
                        attributes=["distinguishedName"]
                    )
                    
                    if conn.entries:
                        print(f"Found group {group_name} on second attempt")
                        group_dns[group_name] = conn.entries[0].distinguishedName.value
                    else:
                        raise Exception(f"Failed to create security group {group_name}: {conn.result['description']}")
                else:
                    print(f"Successfully created security group: {group_dn}")
                    group_dns[group_name] = group_dn
        
        # Helper function to create a user
        def create_user(conn, user_data: UserCreationSchema, ou_dn: str, role: str = None, group_dns: dict = None) -> str:
            """Create a user in Active Directory and the database."""
            # Import necessary modules
            from app.db.postgres import get_db
            from sqlalchemy import text
            from app.models.rbac_models import User
            from app.services.rbac_service import RBACService
            
            # Create user in AD
            user_dn = None
            
            # Generate display name if not provided
            if not user_data.display_name:
                user_data.display_name = user_data.username.capitalize()
            
            # Create user DN
            user_dn = f"CN={user_data.display_name},{ou_dn}"
            print(f"User DN will be: {user_dn}")
            
            # Check if user already exists in AD
            conn.search(
                search_base=settings.AD_BASE_DN,
                search_filter=f"(sAMAccountName={user_data.username})",
                search_scope=ldap3.SUBTREE,
                attributes=["distinguishedName"]
            )
            
            if conn.entries:
                print(f"User {user_data.username} already exists in AD at {conn.entries[0].distinguishedName.value}")
                user_dn = conn.entries[0].distinguishedName.value
            else:
                # Create user object
                print(f"Adding user object: {user_dn}")
                conn.add(user_dn, ["top", "person", "organizationalPerson", "user"], {
                    "cn": user_data.display_name,
                    "sAMAccountName": user_data.username,
                    "userPrincipalName": f"{user_data.username}@{settings.AD_DOMAIN}",
                    "displayName": user_data.display_name
                })
                
                if conn.result["result"] != 0:
                    print(f"Failed to create user: {conn.result}")
                    raise Exception(f"Failed to create user: {conn.result['description']}")
                print(f"Successfully created user: {user_dn}")
                
                # Set password and enable account
                try:
                    # Set password
                    print(f"Setting password for user: {user_dn}")
                    password_set = False
                    
                    # Method 1: Try unicodePwd with LDAPS
                    try:
                        print("Trying unicodePwd method with LDAPS...")
                        # Convert password to UTF-16LE and add quotes
                        unicode_pwd = f'"{setup_data.default_password}"'.encode("utf-16-le")
                        conn.modify(user_dn, {'unicodePwd': [(ldap3.MODIFY_REPLACE, [unicode_pwd])]})
                        
                        if conn.result["result"] == 0:
                            print("Password set successfully with unicodePwd")
                            password_set = True
                        else:
                            print(f"unicodePwd method failed: {conn.result}")
                    except Exception as e:
                        print(f"unicodePwd error: {str(e)}")
                    
                    # Method 2: Try PowerShell if LDAPS failed
                    if not password_set:
                        try:
                            print("Trying PowerShell method...")
                            ps_command = f'$securePassword = ConvertTo-SecureString "{setup_data.default_password}" -AsPlainText -Force; Set-ADAccountPassword -Identity "{user_data.username}" -NewPassword $securePassword -Reset'
                            result = subprocess.run(["powershell", "-Command", ps_command], capture_output=True, text=True)
                            
                            if result.returncode == 0:
                                print("Password set successfully with PowerShell")
                                password_set = True
                            else:
                                print(f"PowerShell method failed: {result.stderr}")
                        except Exception as e:
                            print(f"PowerShell error: {str(e)}")
                    
                    # Method 3: Try userPassword attribute
                    if not password_set:
                        try:
                            print("Trying userPassword attribute...")
                            conn.modify(user_dn, {'userPassword': [(ldap3.MODIFY_REPLACE, [setup_data.default_password])]})
                            
                            if conn.result["result"] == 0:
                                print("Password set successfully with userPassword attribute")
                                password_set = True
                            else:
                                print(f"userPassword attribute method failed: {conn.result}")
                        except Exception as e:
                            print(f"userPassword attribute error: {str(e)}")
                    
                    if not password_set:
                        print("WARNING: All password setting methods failed. User may need manual password setup.")
                    
                    # Enable account by setting userAccountControl to 512 (NORMAL_ACCOUNT)
                    print("Enabling account...")
                    conn.modify(user_dn, {'userAccountControl': [(ldap3.MODIFY_REPLACE, [512])]})
                    
                    if conn.result["result"] == 0:
                        print("Account enabled successfully")
                    else:
                        print(f"Failed to enable account: {conn.result}")
                    
                    # Disable "user must change password at next logon" by setting pwdLastSet to -1
                    print("Disabling 'user must change password at next logon'...")
                    conn.modify(user_dn, {'pwdLastSet': [(ldap3.MODIFY_REPLACE, [-1])]})
                    
                    if conn.result["result"] == 0:
                        print("Successfully disabled 'user must change password at next logon'")
                    else:
                        print(f"Failed to disable 'user must change password at next logon': {conn.result}")
                    
                    # Set account to never expire
                    print("Setting account to never expire...")
                    conn.modify(user_dn, {'accountExpires': [(ldap3.MODIFY_REPLACE, ['0'])]})
                    
                    if conn.result["result"] == 0:
                        print("Successfully set account to never expire")
                    else:
                        print(f"Failed to set account to never expire: {conn.result}")
                    
                except Exception as e:
                    # Log the error but continue
                    print(f"Warning: Error during user account setup for {user_data.username}: {str(e)}")
                
                # Add optional attributes if provided
                if user_data.email:
                    conn.modify(user_dn, {'mail': [(ldap3.MODIFY_REPLACE, [user_data.email])]})
                if user_data.first_name:
                    conn.modify(user_dn, {'givenName': [(ldap3.MODIFY_REPLACE, [user_data.first_name])]})
                if user_data.last_name:
                    conn.modify(user_dn, {'sn': [(ldap3.MODIFY_REPLACE, [user_data.last_name])]})
                if user_data.title:
                    conn.modify(user_dn, {'title': [(ldap3.MODIFY_REPLACE, [user_data.title])]})
                elif role:
                    conn.modify(user_dn, {'title': [(ldap3.MODIFY_REPLACE, [role])]})
            
            # Create or get user in database
            db = next(get_db())
            db_user = db.query(User).filter(User.username == user_data.username).first()
            
            if not db_user:
                # Create user in database
                print(f"Creating user {user_data.username} in database")
                # Generate a random password for database user (not the actual login password)
                import secrets
                import string
                random_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
                
                # Create user data dictionary
                user_dict = {
                    "username": user_data.username,
                    "email": user_data.email if user_data.email else f"{user_data.username}@example.com",
                    "password": random_password,  # This is just for database purposes
                    "is_active": True
                }
                
                try:
                    # Create user in database
                    db_user = User(
                        username=user_dict["username"],
                        email=user_dict["email"],
                        hashed_password="ldap_auth_only",  # We use LDAP for authentication
                        is_active=True
                    )
                    db.add(db_user)
                    db.commit()
                    db.refresh(db_user)
                    print(f"Successfully created user {user_data.username} in database with ID: {db_user.id}")
                except Exception as e:
                    print(f"Error creating user in database: {str(e)}")
                    # Continue even if database creation fails
            else:
                print(f"User {user_data.username} already exists in database with ID: {db_user.id}")
            
            # Add user to appropriate security group based on role
            if role and group_dns:
                try:
                    # Map role names to uppercase enum values that match PostgreSQL
                    role_enum_map = {
                        "Client Head": "CLIENT_HEAD",
                        "Department Head": "DEPARTMENT_HEAD",
                        "Subdepartment Head": "SUBDEPT_HEAD",
                        "Process Owner": "PROCESS_OWNER",
                        "BCM Coordinator": "BCM_COORDINATOR",
                        "CEO": "CEO",
                        "Reportee": "REPORTEE",
                        "Sub-reportee": "SUB_REPORTEE",
                        "CXO": "CXO",
                        "Project Sponsor": "PROJECT_SPONSOR",
                        "Admin": "ADMIN"
                    }
                    
                    # Map roles to security group names
                    role_to_group_map = {
                        "Client Head": "BRT_ClientHeads",
                        "Department Head": "BRT_DepartmentHeads",
                        "Subdepartment Head": "BRT_SubDepartmentHeads",
                        "Process Owner": "BRT_ProcessOwners",
                        "BCM Coordinator": "BRT_BCMCoordinators",
                        "CEO": "BRT_CEOs",
                        "Reportee": "BRT_Reportees",
                        "Sub-reportee": "BRT_SubReportees",
                        "CXO": "BRT_CXOs",
                        "Project Sponsor": "BRT_ProjectSponsors",
                        "Admin": "BRT_Admins"
                    }
                    
                    if role in role_enum_map:
                        role_enum_value = role_enum_map[role]
                        print(f"Using role type: {role_enum_value}")
                        
                        # First check if the role exists
                        find_role_sql = """
                            SELECT id FROM roles 
                            WHERE name = :role_name
                            LIMIT 1
                        """
                        result = db.execute(text(find_role_sql), {"role_name": role}).fetchone()
                        
                        if not result:
                            # Create the role using direct SQL string interpolation for the enum
                            # This is safe in this specific case since role_enum_value comes from a fixed mapping
                            print(f"Creating role {role} with type {role_enum_value}")
                            
                            create_role_sql = f"""
                                INSERT INTO roles (name, type, description) 
                                VALUES (:name, '{role_enum_value}'::roletype, :description)
                                RETURNING id
                            """
                            result = db.execute(
                                text(create_role_sql), 
                                {
                                    "name": role, 
                                    "description": f"Auto-created role for {role}"
                                }
                            ).fetchone()
                            db.flush()
                        
                        role_id = result[0]
                        
                        # Get user
                        user = db.query(User).filter(User.username == user_data.username).first()
                        
                        # Check if user already has this role
                        has_role_sql = text("SELECT COUNT(*) FROM user_roles WHERE user_id = :user_id AND role_id = :role_id")
                        has_role = db.execute(has_role_sql, {"user_id": user.id, "role_id": role_id}).scalar()
                        
                        if not has_role:
                            # Add role to user with parameterized SQL
                            add_role_sql = text("INSERT INTO user_roles (user_id, role_id) VALUES (:user_id, :role_id)")
                            db.execute(add_role_sql, {"user_id": user.id, "role_id": role_id})
                            db.flush()
                            print(f"Added user {user_data.username} to role {role}")
                            
                        # Add user to appropriate AD security group based on role
                        if role in role_to_group_map:
                            group_name = role_to_group_map[role]
                            if group_name in group_dns:
                                group_dn = group_dns[group_name]
                                print(f"Adding user {user_data.username} to security group {group_name}")
                                
                                try:
                                    # Add user to group by modifying the group's member attribute
                                    conn.modify(group_dn, {'member': [(ldap3.MODIFY_ADD, [user_dn])]})
                                    
                                    if conn.result["result"] == 0:
                                        print(f"Successfully added user {user_data.username} to group {group_name}")
                                    else:
                                        print(f"Failed to add user to group: {conn.result}")
                                except Exception as e:
                                    print(f"Error adding user to group: {str(e)}")
                            else:
                                print(f"Warning: Group {group_name} not found in group_dns dictionary")
                except Exception as e:
                    print(f"Error assigning role: {str(e)}")
            
            # Add to created users list
            created_objects["users"].append({
                "username": user_data.username,
                "dn": user_dn,
                "role": role
            })
            
            return user_dn
    
        # Create client head directly under the organization OU
        if setup_data.client_head:
            print(f"Creating client head: {setup_data.client_head.username}")
            client_head_dn = create_user(conn, setup_data.client_head, org_ou_dn, "Client Head", group_dns)
            
        # Create BCM coordinator directly under the organization OU
        if setup_data.bcm_coordinator:
            print(f"Creating BCM coordinator: {setup_data.bcm_coordinator.username}")
            create_user(conn, setup_data.bcm_coordinator, org_ou_dn, "BCM Coordinator", group_dns)
        
        # Create CEO directly under the organization OU
        if setup_data.ceo:
            print(f"Creating CEO: {setup_data.ceo.username}")
            create_user(conn, setup_data.ceo, org_ou_dn, "CEO", group_dns)
        
        # Create Reportee directly under the organization OU
        if setup_data.reportee:
            print(f"Creating Reportee: {setup_data.reportee.username}")
            create_user(conn, setup_data.reportee, org_ou_dn, "Reportee", group_dns)
        
        # Create Sub-reportee directly under the organization OU
        if setup_data.sub_reportee:
            print(f"Creating Sub-reportee: {setup_data.sub_reportee.username}")
            create_user(conn, setup_data.sub_reportee, org_ou_dn, "Sub-reportee", group_dns)
        
        # Create CXO directly under the organization OU
        if setup_data.cxo:
            print(f"Creating CXO: {setup_data.cxo.username}")
            create_user(conn, setup_data.cxo, org_ou_dn, "CXO", group_dns)
        
        # Create Project Sponsor directly under the organization OU
        if setup_data.project_sponsor:
            print(f"Creating Project Sponsor: {setup_data.project_sponsor.username}")
            create_user(conn, setup_data.project_sponsor, org_ou_dn, "Project Sponsor", group_dns)
        
        # Create Department Head directly under the organization OU
        if setup_data.department_head:
            print(f"Creating Department Head: {setup_data.department_head.username}")
            create_user(conn, setup_data.department_head, org_ou_dn, "Department Head", group_dns)
        
        # Create Subdepartment Head directly under the organization OU
        if setup_data.subdepartment_head:
            print(f"Creating Subdepartment Head: {setup_data.subdepartment_head.username}")
            create_user(conn, setup_data.subdepartment_head, org_ou_dn, "Subdepartment Head", group_dns)
        
        # Create Process Owner directly under the organization OU
        if setup_data.process_owner:
            print(f"Creating Process Owner: {setup_data.process_owner.username}")
            create_user(conn, setup_data.process_owner, org_ou_dn, "Process Owner", group_dns)

        # Create Departments OU
        departments_ou_dn = f"OU=Departments,{org_ou_dn}"
        print(f"Creating Departments OU: {departments_ou_dn}")
        conn.add(departments_ou_dn, ["organizationalUnit"], {"ou": "Departments"})
        if conn.result["result"] != 0:
            print(f"Failed to create Departments OU: {conn.result}")
            raise Exception(f"Failed to create Departments OU: {conn.result['description']}")
        print(f"Successfully created Departments OU: {departments_ou_dn}")
        
        # Create departments, subdepartments, and processes
        for dept in setup_data.departments:
            # Create department OU under Departments OU
            dept_ou_dn = f"OU={dept.name},{departments_ou_dn}"
            print(f"Creating department OU: {dept_ou_dn}")
            conn.add(dept_ou_dn, ["organizationalUnit"], {"ou": dept.name})
            if conn.result["result"] != 0:
                print(f"Failed to create department OU: {conn.result}")
                raise Exception(f"Failed to create department OU {dept.name}: {conn.result['description']}")
            print(f"Successfully created department OU: {dept_ou_dn}")
            
            created_objects["departments"].append({
                "name": dept.name,
                "dn": dept_ou_dn
            })
            
            # Create department head directly under department OU
            if dept.head:
                print(f"Creating department head: {dept.head.username}")
                create_user(conn, dept.head, dept_ou_dn, "Department Head", group_dns)
            
            # Create Subdepartments OU under department OU
            subdepts_ou_dn = f"OU=Subdepartments,{dept_ou_dn}"
            print(f"Creating Subdepartments OU: {subdepts_ou_dn}")
            conn.add(subdepts_ou_dn, ["organizationalUnit"], {"ou": "Subdepartments"})
            if conn.result["result"] != 0:
                print(f"Failed to create Subdepartments OU: {conn.result}")
                raise Exception(f"Failed to create Subdepartments OU: {conn.result['description']}")
            print(f"Successfully created Subdepartments OU: {subdepts_ou_dn}")
            
            # Create subdepartments
            for subdept in dept.subdepartments:
                # Create subdepartment OU under Subdepartments OU
                subdept_ou_dn = f"OU={subdept.name},{subdepts_ou_dn}"
                print(f"Creating subdepartment OU: {subdept_ou_dn}")
                conn.add(subdept_ou_dn, ["organizationalUnit"], {"ou": subdept.name})
                if conn.result["result"] != 0:
                    print(f"Failed to create subdepartment OU: {conn.result}")
                    raise Exception(f"Failed to create subdepartment OU {subdept.name}: {conn.result['description']}")
                print(f"Successfully created subdepartment OU: {subdept_ou_dn}")
                
                created_objects["subdepartments"].append({
                    "name": subdept.name,
                    "department": dept.name,
                    "dn": subdept_ou_dn
                })
                
                # Create subdepartment head directly under subdepartment OU
                if subdept.head:
                    print(f"Creating subdepartment head: {subdept.head.username}")
                    create_user(conn, subdept.head, subdept_ou_dn, "Subdepartment Head", group_dns)
                
                # Create processes directly under subdepartment OU (not in a Processes OU)
                for process in subdept.processes:
                    # Create process OU under subdepartment OU
                    process_ou_dn = f"OU={process.name},{subdept_ou_dn}"
                    print(f"Creating process OU: {process_ou_dn}")
                    conn.add(process_ou_dn, ["organizationalUnit"], {"ou": process.name})
                    if conn.result["result"] != 0:
                        print(f"Failed to create process OU: {conn.result}")
                        raise Exception(f"Failed to create process OU {process.name}: {conn.result['description']}")
                    print(f"Successfully created process OU: {process_ou_dn}")
                    
                    created_objects["processes"].append({
                        "name": process.name,
                        "subdepartment": subdept.name,
                        "department": dept.name,
                        "dn": process_ou_dn
                    })
                    
                    # Create process owner directly under process OU
                    if process.owner:
                        print(f"Creating process owner: {process.owner.username}")
                        create_user(conn, process.owner, process_ou_dn, "Process Owner", group_dns)

        # Unbind from AD server
        print("Unbinding from AD server")
        conn.unbind()
        
        # Also create the organization in the database
        print("Creating organization record in database")
        db = next(get_db())
        try:
            from app.models.global_models import GlobalOrganization
            from uuid import uuid4
            
            # Check if organization already exists in database
            print(f"Checking if organization {setup_data.organization_name} exists in database")
            existing_org = db.query(GlobalOrganization).filter(
                GlobalOrganization.name == setup_data.organization_name
            ).first()
            
            if not existing_org:
                # Create organization in database
                print(f"Creating new organization record for {setup_data.organization_name}")
                new_org = GlobalOrganization(
                    id=uuid4(),
                    name=setup_data.organization_name,
                    head_username=setup_data.client_head.username if setup_data.client_head else None,
                    impact_matrix={},  # Empty impact matrix
                    licensed_modules=[]  # No licensed modules initially
                )
                db.add(new_org)
                db.commit()
                db.refresh(new_org)
                print(f"Successfully created organization in database with ID: {new_org.id}")
            else:
                print(f"Organization {setup_data.organization_name} already exists in database")
                created_objects["database_record"] = "Organization already exists in database"
            
        except Exception as db_error:
            # Log database error but don't fail the entire operation
            print(f"Database error: {str(db_error)}")
            created_objects["database_error"] = str(db_error)

        print("Organization setup completed successfully")
        return {
            "status": "success",
            "message": f"Successfully created organization structure for {setup_data.organization_name}",
            "created_objects": created_objects
        }
        
    except Exception as e:
        print(f"ERROR in setup_organization_structure: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create organization structure: {str(e)}"
        )

def create_or_update_role_for_user(db, username, role_type):
    """
    Create or update a role for a user.

    Args:
        db: Database session
        username: Username of the user
        role_type: Role type (must be uppercase to match PostgreSQL enum)
    """
    from sqlalchemy import text
    from app.models.rbac_models import User

    # Map role type to role name
    role_name_map = {
        "CLIENT_HEAD": "Client Head",
        "DEPARTMENT_HEAD": "Department Head",
        "SUBDEPT_HEAD": "Subdepartment Head",
        "PROCESS_OWNER": "Process Owner",
        "BCM_COORDINATOR": "BCM Coordinator",
        "CEO": "CEO",
        "REPORTEE": "Reportee",
        "SUB_REPORTEE": "Sub-reportee",
        "CXO": "CXO",
        "PROJECT_SPONSOR": "Project Sponsor",
        "ADMIN": "Admin"
    }

    role_name = role_name_map.get(role_type, role_type)
    print(f"Creating or updating role {role_name} with type {role_type} for user {username}")

    # First check if the role exists
    find_role_sql = """
        SELECT id FROM roles
        WHERE name = :role_name
        LIMIT 1
    """
    result = db.execute(text(find_role_sql), {"role_name": role_name}).fetchone()
    
    if not result:
        # Create the role using direct SQL string interpolation for the enum
        # This is safe in this specific case since role_type comes from a fixed mapping
        print(f"Creating role {role_name} with type {role_type}")
        
        create_role_sql = f"""
            INSERT INTO roles (name, type, description) 
            VALUES (:name, '{role_type}'::roletype, :description)
            RETURNING id
        """
        result = db.execute(
            text(create_role_sql), 
            {
                "name": role, 
                "description": f"Auto-created role for {role}"
            }
        ).fetchone()
        db.flush()
    
    role_id = result[0]
    
    # Get user
    user = db.query(User).filter(User.username == username).first()
    
    if not user:
        print(f"User {username} not found in database, cannot assign role")
        return
    
    # Check if user already has this role
    has_role_sql = text("SELECT COUNT(*) FROM user_roles WHERE user_id = :user_id AND role_id = :role_id")
    has_role = db.execute(has_role_sql, {"user_id": user.id, "role_id": role_id}).scalar()
    
    if not has_role:
        # Add role to user with parameterized SQL
        add_role_sql = text("INSERT INTO user_roles (user_id, role_id) VALUES (:user_id, :role_id)")
        db.execute(add_role_sql, {"user_id": user.id, "role_id": role_id})
        db.flush()
        print(f"Added user {username} to role {role_name}")
    else:
        print(f"User {username} already has role {role_name}")

def update_client_with_role_users(setup_data: OrganizationSetupSchema):
    """
    Update the organization with the role users and create the organization hierarchy.
    
    Args:
        setup_data: Organization setup data
    """
    from app.db.postgres import get_db
    from app.models.global_models import GlobalOrganization, GlobalDepartment, GlobalSubdepartment, GlobalProcess
    
    # Get database session
    db = next(get_db())
    
    # Get organization
    organization = db.query(GlobalOrganization).filter(GlobalOrganization.name == setup_data.organization_name).first()
    
    if not organization:
        print(f"Organization {setup_data.organization_name} not found in database")
        # Create the organization if it doesn't exist
        organization = GlobalOrganization(name=setup_data.organization_name)
        db.add(organization)
        db.flush()  # Flush to get the ID
        print(f"Created organization {setup_data.organization_name} in database")
    
    # Ensure all users exist in the database before updating references
    user_fields = [
        ('ceo', setup_data.ceo),
        ('reportee', setup_data.reportee),
        ('sub_reportee', setup_data.sub_reportee),
        ('cxo', setup_data.cxo),
        ('project_sponsor', setup_data.project_sponsor),
        ('client_head', setup_data.client_head),
        ('bcm_coordinator', setup_data.bcm_coordinator),
    ]
    
    # Create any missing users in the database
    for role_name, user_data in user_fields:
        if user_data:
            # Check if user exists in database
            user = db.query(User).filter(User.username == user_data.username).first()
            if not user:
                print(f"Creating user {user_data.username} in database for role {role_name}")
                # Create user in database
                user = User(
                    username=user_data.username,
                    email=user_data.email if user_data.email else f"{user_data.username}@example.com",
                    hashed_password="ldap_auth_only",  # We use LDAP for authentication
                    is_active=True
                )
                db.add(user)
                db.flush()  # Get the ID without committing yet
                print(f"Created user {user_data.username} in database with ID: {user.id}")
    
    # Update organization with role users
    if setup_data.ceo:
        user = db.query(User).filter(User.username == setup_data.ceo.username).first()
        if user:
            # Convert integer ID to string since the column is Text type
            organization.ceo_user_id = str(user.id)
            print(f"Updated organization with CEO: {setup_data.ceo.username} (ID: {user.id})")
    
    if setup_data.reportee:
        user = db.query(User).filter(User.username == setup_data.reportee.username).first()
        if user:
            # Convert integer ID to string since the column is Text type
            organization.reportee_user_id = str(user.id)
            print(f"Updated organization with Reportee: {setup_data.reportee.username} (ID: {user.id})")
    
    if setup_data.sub_reportee:
        user = db.query(User).filter(User.username == setup_data.sub_reportee.username).first()
        if user:
            # Convert integer ID to string since the column is Text type
            organization.sub_reportee_user_id = str(user.id)
            print(f"Updated organization with Sub-reportee: {setup_data.sub_reportee.username} (ID: {user.id})")
    
    if setup_data.cxo:
        user = db.query(User).filter(User.username == setup_data.cxo.username).first()
        if user:
            # Convert integer ID to string since the column is Text type
            organization.cxo_user_id = str(user.id)
            print(f"Updated organization with CXO: {setup_data.cxo.username} (ID: {user.id})")
    
    if setup_data.project_sponsor:
        user = db.query(User).filter(User.username == setup_data.project_sponsor.username).first()
        if user:
            # Convert integer ID to string since the column is Text type
            organization.project_sponsor_user_id = str(user.id)
            print(f"Updated organization with Project Sponsor: {setup_data.project_sponsor.username} (ID: {user.id})")
    
    if setup_data.client_head:
        user = db.query(User).filter(User.username == setup_data.client_head.username).first()
        if user:
            # Convert integer ID to string since the column is Text type
            organization.client_head_user_id = str(user.id)
            print(f"Updated organization with Client Head: {setup_data.client_head.username} (ID: {user.id})")
    
    if setup_data.bcm_coordinator:
        user = db.query(User).filter(User.username == setup_data.bcm_coordinator.username).first()
        if user:
            # Convert integer ID to string since the column is Text type
            organization.bcm_coordinator_user_id = str(user.id)
            print(f"Updated organization with BCM Coordinator: {setup_data.bcm_coordinator.username} (ID: {user.id})")
    
    # Create departments, subdepartments, and processes
    for dept_data in setup_data.departments:
        # Check if department exists
        department = db.query(GlobalDepartment).filter(
            GlobalDepartment.name == dept_data.name,
            GlobalDepartment.organization_id == organization.id
        ).first()
        
        if not department:
            # Create department
            department = GlobalDepartment(
                name=dept_data.name,
                organization_id=organization.id
            )
            db.add(department)
            db.flush()  # Flush to get the ID
            print(f"Created department {dept_data.name} in database")
        
        # Update department head if provided
        if dept_data.head:
            # Ensure department head exists in database
            head_user = db.query(User).filter(User.username == dept_data.head.username).first()
            if not head_user:
                head_user = User(
                    username=dept_data.head.username,
                    email=dept_data.head.email if dept_data.head.email else f"{dept_data.head.username}@example.com",
                    hashed_password="ldap_auth_only",
                    is_active=True
                )
                db.add(head_user)
                db.flush()
                print(f"Created department head user {dept_data.head.username} in database")
            
            # Only set the username field since head_user_id doesn't exist in the model
            department.head_username = dept_data.head.username
            print(f"Updated department {dept_data.name} with head: {dept_data.head.username} (ID: {head_user.id})")
            
            # Create role assignment for department head
            role_type = "DEPARTMENT_HEAD"
            create_or_update_role_for_user(db, head_user.username, role_type)
            print(f"Assigned role {role_type} to user {head_user.username}")
        
        # Create subdepartments
        for subdept_data in dept_data.subdepartments:
            # Check if subdepartment exists
            subdepartment = db.query(GlobalSubdepartment).filter(
                GlobalSubdepartment.name == subdept_data.name,
                GlobalSubdepartment.department_id == department.id
            ).first()
            
            if not subdepartment:
                # Create subdepartment
                subdepartment = GlobalSubdepartment(
                    name=subdept_data.name,
                    department_id=department.id
                )
                db.add(subdepartment)
                db.flush()  # Flush to get the ID
                print(f"Created subdepartment {subdept_data.name} in database")
            
            # Update subdepartment head if provided
            if subdept_data.head:
                # Ensure subdepartment head exists in database
                head_user = db.query(User).filter(User.username == subdept_data.head.username).first()
                if not head_user:
                    head_user = User(
                        username=subdept_data.head.username,
                        email=subdept_data.head.email if subdept_data.head.email else f"{subdept_data.head.username}@example.com",
                        hashed_password="ldap_auth_only",
                        is_active=True
                    )
                    db.add(head_user)
                    db.flush()
                    print(f"Created subdepartment head user {subdept_data.head.username} in database")
                
                # Only set the username field since head_user_id doesn't exist in the model
                subdepartment.head_username = subdept_data.head.username
                print(f"Updated subdepartment {subdept_data.name} with head: {subdept_data.head.username} (ID: {head_user.id})")
                
                # Create role assignment for subdepartment head
                role_type = "SUBDEPT_HEAD"
                create_or_update_role_for_user(db, head_user.username, role_type)
                print(f"Assigned role {role_type} to user {head_user.username}")
            
            # Create processes
            for process_data in subdept_data.processes:
                # Check if process exists
                process = db.query(GlobalProcess).filter(
                    GlobalProcess.name == process_data.name,
                    GlobalProcess.subdepartment_id == subdepartment.id
                ).first()
                
                if not process:
                    # Create process
                    process = GlobalProcess(
                        name=process_data.name,
                        subdepartment_id=subdepartment.id
                    )
                    db.add(process)
                    print(f"Created process {process_data.name} in database")
                
                # Update process owner if provided
                if process_data.owner:
                    # Ensure process owner exists in database
                    owner_user = db.query(User).filter(User.username == process_data.owner.username).first()
                    if not owner_user:
                        owner_user = User(
                            username=process_data.owner.username,
                            email=process_data.owner.email if process_data.owner.email else f"{process_data.owner.username}@example.com",
                            hashed_password="ldap_auth_only",
                            is_active=True
                        )
                        db.add(owner_user)
                        db.flush()
                        print(f"Created process owner user {process_data.owner.username} in database")
                    
                    # Only set the process_owner field since owner_user_id doesn't exist in the model
                    process.process_owner = process_data.owner.username
                    print(f"Updated process {process_data.name} with owner: {process_data.owner.username} (ID: {owner_user.id})")
                    
                    # Create role assignment for process owner
                    role_type = "PROCESS_OWNER"
                    create_or_update_role_for_user(db, owner_user.username, role_type)
                    print(f"Assigned role {role_type} to user {owner_user.username}")
    
    # Commit changes
    db.commit()
    print(f"Committed all changes to database for organization {setup_data.organization_name}")

# Endpoint to upload HRMS data as JSON file
@router.post("/organizations/setup-from-file", response_model=Dict[str, Any])
async def setup_organization_from_file(
    default_password: str = Form(..., min_length=8),
    file: UploadFile = File(...),
    current_user: User = Depends(require_administrator)
):
    """
    Create a complete organization structure in Active Directory from an uploaded HRMS file.
    
    This endpoint accepts a JSON or CSV file containing the complete organization structure
    and creates the corresponding OUs and users in Active Directory.
    
    Args:
        default_password: Default password for all created users
        file: Uploaded JSON or CSV file with organization structure
        
    Returns:
        Dict with status and creation summary
    """
    try:
        # Read the uploaded file
        contents = await file.read()
        
        # Determine file type based on extension
        file_extension = file.filename.split('.')[-1].lower()
        
        if file_extension == 'json':
            # Process JSON file
            import json
            try:
                data = json.loads(contents)
            except json.JSONDecodeError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid JSON file"
                )
        elif file_extension == 'csv':
            # Process CSV file
            import csv
            import io
            from collections import defaultdict
            
            try:
                # Parse CSV data
                csv_data = contents.decode('utf-8')
                csv_reader = csv.DictReader(io.StringIO(csv_data))
                
                # Convert CSV to our expected structure
                data = {"organization": None, "departments": []}
                departments_dict = {}
                subdepartments_dict = {}
                
                # First pass: collect all entities
                for row in csv_reader:
                    # Skip empty rows
                    if not any(row.values()):
                        continue
                        
                    # Set organization name if not set yet
                    if not data["organization"] and "organization" in row and row["organization"]:
                        data["organization"] = row["organization"]
                    
                    # Process CEO
                    if "role" in row and row["role"].lower() == "ceo":
                        data["ceo"] = {
                            "username": row.get("username", ""),
                            "email": row.get("email", ""),
                            "display_name": row.get("display_name", ""),
                            "first_name": row.get("first_name", ""),
                            "last_name": row.get("last_name", "")
                        }
                    
                    # Process Reportee
                    elif "role" in row and row["role"].lower() == "reportee":
                        data["reportee"] = {
                            "username": row.get("username", ""),
                            "email": row.get("email", ""),
                            "display_name": row.get("display_name", ""),
                            "first_name": row.get("first_name", ""),
                            "last_name": row.get("last_name", "")
                        }
                    
                    # Process Sub-reportee
                    elif "role" in row and row["role"].lower() == "sub-reportee":
                        data["sub_reportee"] = {
                            "username": row.get("username", ""),
                            "email": row.get("email", ""),
                            "display_name": row.get("display_name", ""),
                            "first_name": row.get("first_name", ""),
                            "last_name": row.get("last_name", "")
                        }
                    
                    # Process CXO
                    elif "role" in row and row["role"].lower() == "cxo":
                        data["cxo"] = {
                            "username": row.get("username", ""),
                            "email": row.get("email", ""),
                            "display_name": row.get("display_name", ""),
                            "first_name": row.get("first_name", ""),
                            "last_name": row.get("last_name", "")
                        }
                    
                    # Process Project Sponsor
                    elif "role" in row and row["role"].lower() == "project sponsor":
                        data["project_sponsor"] = {
                            "username": row.get("username", ""),
                            "email": row.get("email", ""),
                            "display_name": row.get("display_name", ""),
                            "first_name": row.get("first_name", ""),
                            "last_name": row.get("last_name", "")
                        }
                    
                    # Process client head
                    elif "role" in row and row["role"].lower() == "client head":
                        data["clienthead"] = {
                            "username": row.get("username", ""),
                            "email": row.get("email", ""),
                            "display_name": row.get("display_name", ""),
                            "first_name": row.get("first_name", ""),
                            "last_name": row.get("last_name", "")
                        }
                    
                    # Process BCM coordinator
                    elif "role" in row and row["role"].lower() == "bcm coordinator":
                        data["bcm_coordinator"] = {
                            "username": row.get("username", ""),
                            "email": row.get("email", ""),
                            "display_name": row.get("display_name", ""),
                            "first_name": row.get("first_name", ""),
                            "last_name": row.get("last_name", "")
                        }
                    
                    # Process department head
                    elif ("role" in row and row["role"].lower() == "department head" and 
                          "department" in row and row["department"]):
                        dept_name = row["department"]
                        if dept_name not in departments_dict:
                            departments_dict[dept_name] = {
                                "name": dept_name,
                                "head": {
                                    "username": row.get("username", ""),
                                    "email": row.get("email", ""),
                                    "display_name": row.get("display_name", ""),
                                    "first_name": row.get("first_name", ""),
                                    "last_name": row.get("last_name", "")
                                },
                                "subdepartments": []
                            }
                        else:
                            # Update the head if the department already exists but has no head
                            if departments_dict[dept_name].get("head") is None:
                                departments_dict[dept_name]["head"] = {
                                    "username": row.get("username", ""),
                                    "email": row.get("email", ""),
                                    "display_name": row.get("display_name", ""),
                                    "first_name": row.get("first_name", ""),
                                    "last_name": row.get("last_name", "")
                                }
                    
                    # Process subdepartment head
                    elif ("role" in row and row["role"].lower() == "subdepartment head" and 
                          "department" in row and row["department"] and 
                          "subdepartment" in row and row["subdepartment"]):
                        dept_name = row["department"]
                        subdept_name = row["subdepartment"]
                        key = f"{dept_name}:{subdept_name}"
                        
                        if key not in subdepartments_dict:
                            subdepartments_dict[key] = {
                                "name": subdept_name,
                                "head": {
                                    "username": row.get("username", ""),
                                    "email": row.get("email", ""),
                                    "display_name": row.get("display_name", ""),
                                    "first_name": row.get("first_name", ""),
                                    "last_name": row.get("last_name", "")
                                },
                                "processes": []
                            }
                            
                            # Make sure department exists
                            if dept_name not in departments_dict:
                                departments_dict[dept_name] = {
                                    "name": dept_name,
                                    "head": None,
                                    "subdepartments": []
                                }
                        else:
                            # Update the head if the subdepartment already exists but has no head
                            if subdepartments_dict[key].get("head") is None:
                                subdepartments_dict[key]["head"] = {
                                    "username": row.get("username", ""),
                                    "email": row.get("email", ""),
                                    "display_name": row.get("display_name", ""),
                                    "first_name": row.get("first_name", ""),
                                    "last_name": row.get("last_name", "")
                                }
                    
                    # Process process owner
                    elif ("role" in row and row["role"].lower() == "process owner" and 
                          "department" in row and row["department"] and 
                          "subdepartment" in row and row["subdepartment"] and
                          "process" in row and row["process"]):
                        dept_name = row["department"]
                        subdept_name = row["subdepartment"]
                        process_name = row["process"]
                        key = f"{dept_name}:{subdept_name}"
                        
                        process = {
                            "name": process_name,
                            "owner": {
                                "username": row.get("username", ""),
                                "email": row.get("email", ""),
                                "display_name": row.get("display_name", ""),
                                "first_name": row.get("first_name", ""),
                                "last_name": row.get("last_name", "")
                            }
                        }
                        
                        # Make sure subdepartment exists
                        if key not in subdepartments_dict:
                            subdepartments_dict[key] = {
                                "name": subdept_name,
                                "head": None,
                                "processes": [process]  # Add the process directly
                            }
                            
                            # Make sure department exists
                            if dept_name not in departments_dict:
                                departments_dict[dept_name] = {
                                    "name": dept_name,
                                    "head": None,
                                    "subdepartments": []
                                }
                        else:
                            # Add the process to the existing subdepartment
                            subdepartments_dict[key]["processes"].append(process)
                
                # Second pass: build the hierarchy
                for dept_name, dept in departments_dict.items():
                    # Add subdepartments to department
                    for key, subdept in subdepartments_dict.items():
                        if key.startswith(f"{dept_name}:"):
                            dept["subdepartments"].append(subdept)
                    
                    # Add department to data
                    data["departments"].append(dept)
                
                if not data["organization"]:
                    raise ValueError("Missing organization name in CSV data")
                    
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Error processing CSV file: {str(e)}"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format: {file_extension}. Please upload a JSON or CSV file."
            )
            
        # Convert the uploaded data to our schema format
        try:
            # Extract organization name
            if "organization" not in data:
                raise ValueError("Missing 'organization' field in data")
                
            setup_data = {
                "organization_name": data["organization"],
                "default_password": default_password,
                "client_head": None,
                "bcm_coordinator": None,
                "ceo": None,
                "reportee": None,
                "sub_reportee": None,
                "cxo": None,
                "project_sponsor": None,
                "departments": []
            }
            
            # Extract client head
            if "clienthead" in data:
                setup_data["client_head"] = {
                    "username": data["clienthead"].get("username"),
                    "email": data["clienthead"].get("email"),
                    "display_name": data["clienthead"].get("display_name"),
                    "first_name": data["clienthead"].get("first_name"),
                    "last_name": data["clienthead"].get("last_name"),
                    "title": "Client Head"
                }
                
            # Extract BCM coordinator
            if "bcm_coordinator" in data:
                setup_data["bcm_coordinator"] = {
                    "username": data["bcm_coordinator"].get("username"),
                    "email": data["bcm_coordinator"].get("email"),
                    "display_name": data["bcm_coordinator"].get("display_name"),
                    "first_name": data["bcm_coordinator"].get("first_name"),
                    "last_name": data["bcm_coordinator"].get("last_name"),
                    "title": "BCM Coordinator"
                }
                
            # Extract CEO
            if "ceo" in data:
                setup_data["ceo"] = {
                    "username": data["ceo"].get("username"),
                    "email": data["ceo"].get("email"),
                    "display_name": data["ceo"].get("display_name"),
                    "first_name": data["ceo"].get("first_name"),
                    "last_name": data["ceo"].get("last_name"),
                    "title": "CEO"
                }
                
            # Extract Reportee
            if "reportee" in data:
                setup_data["reportee"] = {
                    "username": data["reportee"].get("username"),
                    "email": data["reportee"].get("email"),
                    "display_name": data["reportee"].get("display_name"),
                    "first_name": data["reportee"].get("first_name"),
                    "last_name": data["reportee"].get("last_name"),
                    "title": "Reportee"
                }
                
            # Extract Sub-reportee
            if "sub_reportee" in data:
                setup_data["sub_reportee"] = {
                    "username": data["sub_reportee"].get("username"),
                    "email": data["sub_reportee"].get("email"),
                    "display_name": data["sub_reportee"].get("display_name"),
                    "first_name": data["sub_reportee"].get("first_name"),
                    "last_name": data["sub_reportee"].get("last_name"),
                    "title": "Sub-reportee"
                }
                
            # Extract CXO
            if "cxo" in data:
                setup_data["cxo"] = {
                    "username": data["cxo"].get("username"),
                    "email": data["cxo"].get("email"),
                    "display_name": data["cxo"].get("display_name"),
                    "first_name": data["cxo"].get("first_name"),
                    "last_name": data["cxo"].get("last_name"),
                    "title": "CXO"
                }
                
            # Extract Project Sponsor
            if "project_sponsor" in data:
                setup_data["project_sponsor"] = {
                    "username": data["project_sponsor"].get("username"),
                    "email": data["project_sponsor"].get("email"),
                    "display_name": data["project_sponsor"].get("display_name"),
                    "first_name": data["project_sponsor"].get("first_name"),
                    "last_name": data["project_sponsor"].get("last_name"),
                    "title": "Project Sponsor"
                }
                
            # Extract departments
            if "departments" in data and isinstance(data["departments"], list):
                # Print debug info about departments
                print(f"DEBUG: Found {len(data['departments'])} departments in data")
                for i, dept_data in enumerate(data["departments"]):
                    print(f"DEBUG: Department {i+1}: {dept_data.get('name')}")
                    print(f"DEBUG: Department head: {dept_data.get('head', 'None')}")
                    print(f"DEBUG: Subdepartments: {len(dept_data.get('subdepartments', []))}")
                    
                    dept = {
                        "name": dept_data.get("name", ""),
                        "head": None,
                        "subdepartments": []
                    }
                    
                    # Extract department head
                    if "head" in dept_data and dept_data["head"]:
                        dept["head"] = {
                            "username": dept_data["head"].get("username"),
                            "email": dept_data["head"].get("email"),
                            "display_name": dept_data["head"].get("display_name"),
                            "first_name": dept_data["head"].get("first_name"),
                            "last_name": dept_data["head"].get("last_name"),
                            "title": "Department Head"
                        }
                        
                    # Extract subdepartments
                    if "subdepartments" in dept_data and isinstance(dept_data["subdepartments"], list):
                        for j, subdept_data in enumerate(dept_data["subdepartments"]):
                            print(f"DEBUG: Subdepartment {j+1}: {subdept_data.get('name')}")
                            print(f"DEBUG: Subdepartment head: {subdept_data.get('head', 'None')}")
                            print(f"DEBUG: Processes: {len(subdept_data.get('processes', []))}")
                            
                            subdept = {
                                "name": subdept_data.get("name", ""),
                                "head": None,
                                "processes": []
                            }
                            
                            # Extract subdepartment head
                            if "head" in subdept_data and subdept_data["head"]:
                                subdept["head"] = {
                                    "username": subdept_data["head"].get("username"),
                                    "email": subdept_data["head"].get("email"),
                                    "display_name": subdept_data["head"].get("display_name"),
                                    "first_name": subdept_data["head"].get("first_name"),
                                    "last_name": subdept_data["head"].get("last_name"),
                                    "title": "Subdepartment Head"
                                }
                                
                            # Extract processes
                            if "processes" in subdept_data and isinstance(subdept_data["processes"], list):
                                for k, process_data in enumerate(subdept_data["processes"]):
                                    print(f"DEBUG: Process {k+1}: {process_data.get('name')}")
                                    print(f"DEBUG: Process owner: {process_data.get('owner', 'None')}")
                                    
                                    process = {
                                        "name": process_data.get("name", ""),
                                        "owner": None
                                    }
                                    
                                    # Extract process owner
                                    if "owner" in process_data and process_data["owner"]:
                                        process["owner"] = {
                                            "username": process_data["owner"].get("username"),
                                            "email": process_data["owner"].get("email"),
                                            "display_name": process_data["owner"].get("display_name"),
                                            "first_name": process_data["owner"].get("first_name"),
                                            "last_name": process_data["owner"].get("last_name"),
                                            "title": "Process Owner"
                                        }
                                        
                                    subdept["processes"].append(process)
                                    
                            dept["subdepartments"].append(subdept)
                            
                    setup_data["departments"].append(dept)
                
                # Convert to OrganizationSetupSchema
                print("\n\n=== DEBUG: Organization Structure Before Conversion ===")
                print(f"Organization Name: {setup_data['organization_name']}")
                print(f"Client Head: {setup_data.get('client_head')}")
                print(f"BCM Coordinator: {setup_data.get('bcm_coordinator')}")
                print(f"CEO: {setup_data.get('ceo')}")
                print(f"Reportee: {setup_data.get('reportee')}")
                print(f"Sub-reportee: {setup_data.get('sub_reportee')}")
                print(f"CXO: {setup_data.get('cxo')}")
                print(f"Project Sponsor: {setup_data.get('project_sponsor')}")
                print(f"Number of Departments: {len(setup_data.get('departments', []))}")
                
                for i, dept in enumerate(setup_data.get('departments', [])):
                    print(f"\nDepartment {i+1}: {dept.get('name')}")
                    print(f"  Department Head: {dept.get('head')}")
                    print(f"  Number of Subdepartments: {len(dept.get('subdepartments', []))}")
                    
                    for j, subdept in enumerate(dept.get('subdepartments', [])):
                        print(f"    Subdepartment {j+1}: {subdept.get('name')}")
                        print(f"      Subdepartment Head: {subdept.get('head')}")
                        print(f"      Number of Processes: {len(subdept.get('processes', []))}")
                        
                        for k, process in enumerate(subdept.get('processes', [])):
                            print(f"        Process {k+1}: {process.get('name')}")
                            print(f"          Process Owner: {process.get('owner')}")
                
                print("=== END DEBUG ===\n\n")
                
                org_setup = OrganizationSetupSchema(**setup_data)
                
                # Add debug logging after conversion
                print("\n\n=== DEBUG: Organization Structure After Conversion ===")
                print(f"Organization Name: {org_setup.organization_name}")
                print(f"Client Head: {org_setup.client_head}")
                print(f"BCM Coordinator: {org_setup.bcm_coordinator}")
                print(f"CEO: {org_setup.ceo}")
                print(f"Reportee: {org_setup.reportee}")
                print(f"Sub-reportee: {org_setup.sub_reportee}")
                print(f"CXO: {org_setup.cxo}")
                print(f"Project Sponsor: {org_setup.project_sponsor}")
                print(f"Number of Departments: {len(org_setup.departments)}")
                
                for i, dept in enumerate(org_setup.departments):
                    print(f"\nDepartment {i+1}: {dept.name}")
                    print(f"  Department Head: {dept.head}")
                    print(f"  Number of Subdepartments: {len(dept.subdepartments)}")
                    
                    for j, subdept in enumerate(dept.subdepartments):
                        print(f"    Subdepartment {j+1}: {subdept.name}")
                        print(f"      Subdepartment Head: {subdept.head}")
                        print(f"      Number of Processes: {len(subdept.processes)}")
                        
                        for k, process in enumerate(subdept.processes):
                            print(f"        Process {k+1}: {process.name}")
                            print(f"          Process Owner: {process.owner}")
                
                print("=== END DEBUG ===\n\n")
                
                # Call the setup_organization_structure endpoint
                return await setup_organization_structure(org_setup, current_user)
                
        except ValueError as ve:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(ve)
                    )
        except Exception as e:
            raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing organization data: {str(e)}"
            )
                
    except Exception as e:
        raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"Error processing file: {str(e)}"
    )

@router.get("/users/archived", response_model=OrganizationalUsersResponse)
async def get_archived_organizational_users(
    admin_check: bool = Depends(simple_admin_check),
    force_refresh: bool = False
):
    """
    Get all users from archived organizations in the ARCHIVE ORGANIZATIONS OU.
    """
    try:
        from app.core.config import settings
        from app.middleware.auth import ADAuthenticator
        
        # Connect to AD server
        conn = create_ad_connection()
        
        # Search for all users specifically in the ARCHIVE ORGANIZATIONS OU
        archive_ou_dn = f"OU=ARCHIVE ORGANIZATIONS,{settings.AD_BASE_DN}"
        search_filter = "(&(objectClass=user)(objectCategory=person))"
        
        # Search only in the archive OU
        conn.search(
            search_base=archive_ou_dn,
            search_filter=search_filter,
            search_scope=ldap3.SUBTREE,
            attributes=[
                "sAMAccountName", "distinguishedName", "displayName", 
                "mail", "memberOf", "title", "department", "accountExpires"
            ]
        )
        
        users = []
        ad_authenticator = ADAuthenticator(
            server_uri=settings.AD_SERVER_URI,
            base_dn=settings.AD_BASE_DN
        )
        
        # Process each user entry
        for entry in conn.entries:
            user_dn = entry.distinguishedName.value if hasattr(entry, 'distinguishedName') else None
            
            if not user_dn:
                continue
                
            # Extract organizational hierarchy from DN
            org_path = ad_authenticator._extract_org_hierarchy(user_dn)
            
            # Determine user roles
            is_process_owner = False
            is_department_head = False
            is_subdepartment_head = False
            
            if hasattr(entry, 'title') and entry.title.value:
                title = entry.title.value.lower()
                is_process_owner = "process owner" in title
                is_department_head = "department head" in title
                is_subdepartment_head = "subdepartment head" in title
            
            if "Process Owner" in user_dn or "Porcess Owner" in user_dn:
                is_process_owner = True
            
            # Get account expiration
            account_expires = None
            account_active = True
            if hasattr(entry, 'accountExpires') and entry.accountExpires.value:
                try:
                    if isinstance(entry.accountExpires.value, datetime):
                        expires_date = entry.accountExpires.value
                        account_expires = expires_date.isoformat()
                        account_active = expires_date > datetime.now(timezone.utc)
                    else:
                        try:
                            account_expires_value = int(entry.accountExpires.value)
                            if account_expires_value not in [0, 9223372036854775807]:
                                seconds_since_1601 = account_expires_value / 10000000
                                epoch_diff = 11644473600
                                seconds_since_1970 = seconds_since_1601 - epoch_diff
                                expires_date = datetime.fromtimestamp(seconds_since_1970, tz=timezone.utc)
                                account_expires = expires_date.isoformat()
                                account_active = expires_date > datetime.now(timezone.utc)
                        except (ValueError, TypeError):
                            pass
                except Exception:
                    pass
            
            # Create user object
            user = OrganizationalUserLevel(
                username=entry.sAMAccountName.value if hasattr(entry, 'sAMAccountName') else "",
                display_name=entry.displayName.value if hasattr(entry, 'displayName') and entry.displayName.value else "",
                email=entry.mail.value if hasattr(entry, 'mail') and entry.mail.value else "",
                organization=org_path.get("organization"),
                department=org_path.get("department"),
                subdepartment=org_path.get("subdepartment"),
                process=org_path.get("process"),
                is_process_owner=is_process_owner,
                is_department_head=is_department_head,
                is_subdepartment_head=is_subdepartment_head,
                account_expires=account_expires,
                account_active=account_active
            )
            users.append(user)
        
        conn.unbind()
        return OrganizationalUsersResponse(total_users=len(users), users=users)
        
    except Exception as e:
        if 'conn' in locals() and conn.bound:
            conn.unbind()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving archived users: {str(e)}"
        )

@router.post("/organizations/{organization_id}/archive", response_model=dict)
async def archive_organization(
    organization_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_administrator)
):
    """
    Archive an organization by moving its OU in Active Directory to the 'ARCHIVE ORGANIZATIONS' OU.

    This effectively revokes access and hides the organization from normal queries
    without permanently deleting its data from AD.
    """
    conn = None
    try:
        # 1. Get organization details from the database
        org = db.query(GlobalOrganization).filter(GlobalOrganization.id == organization_id).first()
        if not org:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Organization with ID {organization_id} not found in the database."
            )

        conn = create_ad_connection()

        # 2. Define DNs
        base_dn = settings.AD_BASE_DN
        current_ou_dn = f"OU={org.name},OU=Clients,{base_dn}"
        archive_parent_ou_dn = f"OU=ARCHIVE ORGANIZATIONS,{base_dn}"

        # 3. Check if the 'ARCHIVE ORGANIZATIONS' OU exists, create if not
        conn.search(search_base=base_dn, search_filter="(ou=ARCHIVE ORGANIZATIONS)", search_scope=ldap3.LEVEL, attributes=['ou'])
        if not conn.entries:
            print(f"Creating ARCHIVE ORGANIZATIONS OU: {archive_parent_ou_dn}")
            conn.add(archive_parent_ou_dn, 'organizationalUnit')
            if conn.result['result'] != 0:
                raise Exception(f"Failed to create ARCHIVE ORGANIZATIONS OU: {conn.result['description']}")

        # 4. Check if the source organization OU exists
        conn.search(search_base=current_ou_dn, search_filter="(objectClass=*)", search_scope=ldap3.BASE)
        if not conn.entries:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Organization OU '{org.name}' not found in Active Directory at {current_ou_dn}"
            )

        # 5. Move the organization's OU to the archive OU
        # The RDN (Relative Distinguished Name) remains the same, only the superior (parent) changes.
        new_rdn = f"OU={org.name}"
        conn.modify_dn(current_ou_dn, new_rdn, new_superior=archive_parent_ou_dn)

        if conn.result['result'] == 0:
            return {
                "status": "success",
                "message": f"Organization '{org.name}' has been successfully archived.",
                "moved_from": current_ou_dn,
                "moved_to": f"{new_rdn},{archive_parent_ou_dn}"
            }
        else:
            raise Exception(f"Failed to archive organization: {conn.result['description']}")

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print(f"Error archiving organization: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )
    finally:
        if conn and conn.bound:
            conn.unbind()
