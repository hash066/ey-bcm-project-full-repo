"""
Authentication middleware for RBAC with Active Directory integration.
"""
import os
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

from fastapi import Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timedelta
import ldap3
import ssl
import tempfile
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.postgres import get_db
# Import RBACService with fallback
try:
    from app.services.rbac_service import RBACService
except ImportError:
    RBACService = None
from app.core.config import settings

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

def create_secure_ad_connection(server_uri, user, password, auto_bind=True):
    """
    Create a secure LDAP connection with proper SSL certificate validation using PFX certificate.

    Args:
        server_uri: LDAP server URI
        user: Username for binding
        password: Password for binding
        auto_bind: Whether to automatically bind the connection

    Returns:
        Connection: LDAP connection object
    """
    try:
        # Debug: Print the actual server URI being used
        print(f"Creating secure AD connection with URI: {server_uri}")

        # Check if we're using LDAPS
        use_ssl = server_uri.lower().startswith('ldaps://')
        print(f"Using SSL/TLS: {use_ssl}")

        if use_ssl:
            # Load PFX certificate for TLS validation
            tls_configuration = _load_tls_config_from_pfx()

            # If TLS config loading failed, fall back to no validation (for development)
            if tls_configuration is None:
                print("Warning: Failed to load PFX certificate, falling back to CERT_NONE")
                tls_configuration = ldap3.Tls(validate=ssl.CERT_NONE)
        else:
            tls_configuration = None

        # Try to connect
        def _connect_with_uri(uri):
            print(f"Connecting to: {uri}")
            server = ldap3.Server(
                uri,
                get_info=ldap3.ALL,
                tls=tls_configuration if use_ssl else None,
                use_ssl=use_ssl
            )

            conn = ldap3.Connection(
                server,
                user=user,
                password=password,
                authentication=ldap3.SIMPLE,
                auto_bind=auto_bind
            )

            return conn

        try:
            # First try with the configured URI
            conn = _connect_with_uri(server_uri)
            print("AD connection successful")
            return conn
        except Exception as socket_error:  # type: ignore
            # If hostname doesn't work, try with IP address
            print(f"Error connecting with hostname: {str(socket_error)}")
            print("Trying with IP address instead...")

            # Use IP address instead of hostname (fallback for development)
            ip_uri = "ldaps://192.168.182.148:636" if use_ssl else "ldap://192.168.182.135:389"
            print(f"Using IP address URI: {ip_uri}")

            conn = _connect_with_uri(ip_uri)
            print("AD connection successful with IP address")
            return conn

    except Exception as e:
        print(f"Error creating secure AD connection: {str(e)}")
        raise e

def _load_tls_config_from_pfx():
    """
    Load TLS configuration from PFX certificate file.

    Returns:
        ldap3.Tls: TLS configuration object or None if loading fails
    """
    try:
        cert_path = getattr(settings, 'LDAP_CERT_PATH', None)
        cert_password = getattr(settings, 'LDAP_CERT_PASSWORD', None)

        if not cert_path or not cert_password:
            print("LDAP certificate path or password not configured")
            return None

        # Get absolute path relative to backend_brt directory
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        full_cert_path = os.path.join(backend_dir, cert_path.lstrip('./'))

        if not os.path.exists(full_cert_path):
            print(f"PFX certificate file not found at: {full_cert_path}")
            return None

        print(f"Loading PFX certificate from: {full_cert_path}")

        # Load PFX file
        with open(full_cert_path, 'rb') as pfx_file:
            pfx_data = pfx_file.read()

        # Load PFX with password
        pfx = serialization.pkcs12.load_key_and_certificates(  # type: ignore
            pfx_data,
            password=cert_password.encode(),
            backend=default_backend()
        )

        certificate = pfx[1]  # Certificate
        private_key = pfx[0]  # Private key

        if not certificate:
            print("No certificate found in PFX file")
            return None

        # Convert certificate to PEM format
        cert_pem = certificate.public_bytes(serialization.Encoding.PEM).decode()

        # Create temporary file for certificate
        with tempfile.NamedTemporaryFile(mode='w', suffix='.pem', delete=False) as temp_cert:
            temp_cert.write(cert_pem)
            temp_cert_path = temp_cert.name

        print(f"Certificate loaded successfully. Using cert file: {temp_cert_path}")

        # Create TLS configuration with certificate validation
        tls = ldap3.Tls(
            validate=ssl.CERT_REQUIRED,  # Require certificate validation
            ca_certs_file=temp_cert_path,  # Use our certificate as CA
            version=ssl.PROTOCOL_TLSv1_2
        )

        # Store temp file path for cleanup
        tls._temp_cert_file = temp_cert_path  # type: ignore

        return tls

    except Exception as e:
        print(f"Error loading PFX certificate: {str(e)}")
        import traceback
        print(f"Detailed PFX loading error: {traceback.format_exc()}")
        return None

class ADAuthenticator:
    """Active Directory authentication handler."""
    
    def __init__(self, server_uri: str, base_dn: str):
        """
        Initialize AD authenticator.
        
        Args:
            server_uri: AD server URI (e.g., ldap://ad.example.com)
            base_dn: Base DN for LDAP searches (e.g., dc=example,dc=com)
        """
        self.server_uri = server_uri
        self.base_dn = base_dn
    
    def authenticate(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        """
        Authenticate user against Active Directory.
        
        Args:
            username: Username
            password: Password
            
        Returns:
            Dict[str, Any]: User information or None if authentication fails
        """
        try:
            print(f"Attempting to connect to AD server: {self.server_uri}")
            print(f"Base DN: {self.base_dn}")
            print(f"Searching for user: {username}")
            
            # First, do a bind with admin credentials to search for the user DN
            try:
                print("Performing admin bind to search for user DN")
                # Use admin credentials from environment variables
                admin_user = settings.AD_ADMIN_USER if hasattr(settings, 'AD_ADMIN_USER') else "EY\\Administrator"
                admin_password = settings.AD_ADMIN_PASSWORD if hasattr(settings, 'AD_ADMIN_PASSWORD') else "Ayush16092003ojha"
                
                conn = create_secure_ad_connection(self.server_uri, admin_user, admin_password)
                
                # Search for the user by sAMAccountName
                search_filter = f"(sAMAccountName={username})"
                print(f"Searching with filter: {search_filter}")
                
                conn.search(
                    search_base=self.base_dn,
                    search_filter=search_filter,
                    search_scope=ldap3.SUBTREE, 
                    attributes=["distinguishedName", "displayName", "mail", "memberOf", "accountExpires", "userPrincipalName"]
                )
                
                if not conn.entries:
                    print(f"User {username} not found in directory")
                    return None
                
                # Get the user's distinguished name
                user_entry = conn.entries[0]
                user_dn = user_entry.distinguishedName.value
                print(f"Found user DN: {user_dn}")
                
                # Debug: Print all attributes of the user entry
                print(f"User entry attributes: {user_entry.entry_attributes}")
                if hasattr(user_entry, 'accountExpires'):
                    print(f"Raw accountExpires value: {user_entry.accountExpires.value}")
                    print(f"Type of accountExpires: {type(user_entry.accountExpires.value)}")
                else:
                    print("No accountExpires attribute found")
                
                # Extract organizational hierarchy from the DN
                org_path = self._extract_org_hierarchy(user_dn)
                
                # Now try binding with the actual user credentials
                try:
                    print("Attempting to bind with user credentials")
                    
                    # Since we know the hostname has issues, use IP directly for user authentication
                    ip_uri = "ldaps://192.168.182.148:636" if self.server_uri.lower().startswith('ldaps://') else "ldap://192.168.182.135:389"
                    print(f"Using IP address for user authentication: {ip_uri}")
                    
                    # Try all possible username formats
                    bind_formats = [
                        # Format 1: domain\username (Windows/AD style)
                        {"format": f"EY\\{username}", "description": "domain\\username format"},
                        # Format 2: Distinguished Name
                        {"format": user_dn, "description": "Distinguished Name (DN)"},
                        # Format 3: username@domain
                        {"format": f"{username}@{settings.AD_DOMAIN}", "description": "username@domain format"},
                        # Format 4: Just the username (sAMAccountName)
                        {"format": username, "description": "sAMAccountName only"},
                        # Format 5: CN with domain
                        {"format": f"CN={username},DC=ey,DC=local", "description": "CN with domain"},
                        # Format 6: Full DN with quotes
                        {"format": f'"{user_dn}"', "description": "quoted DN"}
                    ]
                    
                    # Try each format
                    bind_successful = False
                    for bind_format in bind_formats:
                        if bind_successful:
                            break
                            
                        bind_user = bind_format["format"]
                        desc = bind_format["description"]
                        print(f"Trying {desc}: {bind_user}")
                        
                        try:
                            user_conn = create_secure_ad_connection(ip_uri, bind_user, password, auto_bind=False)
                            bind_successful = user_conn.bind()
                            print(f"{desc} bind result: {bind_successful}")
                            
                            if bind_successful:
                                print(f"Authentication successful with {desc}")
                                break
                        except Exception as bind_error:
                            print(f"Error binding with {desc}: {str(bind_error)}")
                            continue
                    
                    # If all formats failed, check if userPrincipalName exists and try that
                    if not bind_successful and hasattr(user_entry, 'userPrincipalName'):
                        upn = user_entry.userPrincipalName.value
                        print(f"All standard formats failed, trying with userPrincipalName: {upn}")
                        try:
                            user_conn = create_secure_ad_connection(ip_uri, upn, password, auto_bind=False)
                            bind_successful = user_conn.bind()
                            print(f"userPrincipalName bind result: {bind_successful}")
                        except Exception as bind_error:
                            print(f"Error binding with userPrincipalName: {str(bind_error)}")
                    
                    if bind_successful:
                        print(f"Authentication successful for {username}")
                        
                        # Build user info from the entry we already retrieved
                        user_info = {
                            "username": username,
                            "display_name": user_entry.displayName.value if hasattr(user_entry, 'displayName') else username,
                            "email": user_entry.mail.value if hasattr(user_entry, 'mail') else f"{username}@example.com",
                            "groups": [],
                            "path": org_path,  # Add the organizational path to user info
                            "account_valid": True,
                            "account_expires_on": None
                        }
                        
                        # Extract account expiration date if available
                        if hasattr(user_entry, 'accountExpires'):
                            account_expires = user_entry.accountExpires.value
                            # Check if account_expires is already a datetime object
                            import datetime
                            if isinstance(account_expires, datetime.datetime):
                                # If it's already a datetime, just format it
                                user_info["account_expires_on"] = account_expires.strftime("%Y-%m-%d %H:%M:%S UTC")
                            elif account_expires and account_expires not in (0, 9223372036854775807):
                                try:
                                    # Windows file time is 100-nanosecond intervals since January 1, 1601 UTC
                                    # Convert to Unix timestamp (seconds since January 1, 1970 UTC)
                                    # 116444736000000000 is the difference in 100-nanosecond intervals between
                                    # January 1, 1601 and January 1, 1970
                                    unix_time = (int(account_expires) - 116444736000000000) / 10000000
                                    # Convert to datetime
                                    expires_date = datetime.datetime.fromtimestamp(unix_time, tz=datetime.timezone.utc)
                                    user_info["account_expires_on"] = expires_date.strftime("%Y-%m-%d %H:%M:%S UTC")
                                except (TypeError, ValueError) as e:
                                    print(f"Error converting account expiration date: {e}")
                                    # Use a default expiration date (6 months from now)
                                    default_expiry = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=180)
                                    user_info["account_expires_on"] = default_expiry.strftime("%Y-%m-%d %H:%M:%S UTC")
                        
                        # Extract group memberships
                        if hasattr(user_entry, 'memberOf'):
                            for group_dn in user_entry.memberOf:
                                # Extract CN from DN
                                cn = group_dn.split(',')[0].split('=')[1]
                                user_info["groups"].append(cn)
                        
                        print(f"Found user groups: {user_info['groups']}")
                        return user_info
                    else:
                        print(f"Bind failed for user DN: {user_dn}")
                        return None
                        
                except ldap3.core.exceptions.LDAPBindError as e:
                    print(f"AD Bind Error: {e}")
                    return None
                except Exception as e:
                    print(f"Error binding with user credentials: {str(e)}")
                    import traceback
                    print(f"Detailed binding error: {traceback.format_exc()}")
                    return None
                    
            except Exception as e:
                print(f"Error during anonymous bind or search: {str(e)}")
                import traceback
                print(f"Detailed error: {traceback.format_exc()}")
                return None
                
        except Exception as e:
            print(f"General authentication error: {str(e)}")
            import traceback
            print(f"Detailed authentication error: {traceback.format_exc()}")
            return None
            
    def _extract_org_hierarchy(self, user_dn: str) -> Dict[str, str]:
        """
        Extract organizational hierarchy from user's distinguished name.
        
        Args:
            user_dn: User's distinguished name from AD
            
        Returns:
            Dict[str, str]: Organizational hierarchy information
        """
        # Initialize path with default values
        path = {
            "organization": None,
            "department": None,
            "subdepartment": None,
            "process": None
        }
        
        print(f"Extracting hierarchy from DN: {user_dn}")
        
        # Split the DN into components
        dn_parts = user_dn.split(',')
        print(f"DN parts: {dn_parts}")
        
        # Filter out only the OU parts
        ou_parts = [part.split('=')[1] for part in dn_parts if part.startswith('OU=')]
        
        # Get the CN part to check if it's a process owner
        cn_part = next((part for part in dn_parts if part.startswith('CN=')), None)
        
        # First, find the organization (Client) - it's usually after "Departments" and before "Clients"
        for i, ou in enumerate(ou_parts):
            if ou.startswith("Client"):
                path["organization"] = ou
                print(f"Set organization to: {ou}")
                break
        
        # Find the department - it's usually right before "Departments"
        for i, ou in enumerate(ou_parts):
            if i < len(ou_parts) - 1 and ou_parts[i+1] == "Departments":
                path["department"] = ou
                print(f"Set department to: {ou}")
                break
        
        # Find Subdepartments OU index
        subdepts_index = -1
        for i, ou in enumerate(ou_parts):
            if ou == "Subdepartments":
                subdepts_index = i
                break
        
        # Check if this is a process owner by examining the OU structure
        # Process owners are typically under a process OU which is under a subdepartment OU
        is_process_owner = False
        
        # If we have at least 3 OUs before the Subdepartments marker, and the CN doesn't contain "Head",
        # it's likely a process owner
        if subdepts_index >= 0 and subdepts_index >= 2:
            # Check if the username contains indicators of being a process owner
            if cn_part:
                cn_value = cn_part.split('=')[1].lower()
                if "owner" in cn_value or (not any(role in cn_value for role in ["head", "admin", "coordinator"])):
                    is_process_owner = True
        
        if is_process_owner:
            # For process owners, the structure is typically:
            # OU=Process,OU=Subdepartment,OU=Subdepartments,...
            if len(ou_parts) > subdepts_index:
                # Process is the OU right before the subdepartment
                path["process"] = ou_parts[0]
                print(f"Set process to: {ou_parts[0]}")
                
                # Subdepartment is the OU right before Subdepartments
                if len(ou_parts) > 1:
                    path["subdepartment"] = ou_parts[1]
                    print(f"Set subdepartment to: {ou_parts[1]}")
        else:
            # For department/subdepartment heads
            # Find subdepartment - it's usually the first OU for subdepartment heads
            if len(ou_parts) > 0 and path["department"] and ou_parts[0] != path["department"]:
                path["subdepartment"] = ou_parts[0]
                print(f"Set subdepartment to: {ou_parts[0]}")
        
        print(f"Final extracted path: {path}")
        return path

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT access token.
    
    Args:
        data: Data to encode in token
        expires_delta: Token expiration time
        
    Returns:
        str: JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Get current user from token.
    
    Args:
        token: JWT token
        db: Database session
        
    Returns:
        User: Current user
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode JWT token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        
        if username is None:
            raise credentials_exception
        
    except JWTError:
        raise credentials_exception
    
    # Get user from database
    from app.models.rbac_models import User
    user = db.query(User).filter(User.username == username).first()
    
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive")
    
    return user

def sync_ad_user_to_db(user_info: Dict[str, Any], db: Session) -> Any:
    """
    Synchronize AD user to database.
    
    Args:
        user_info: User information from AD
        db: Database session
        
    Returns:
        User: Synchronized user
    """
    from app.models.rbac_models import User
    
    # Check if user exists
    user = db.query(User).filter(User.username == user_info["username"]).first()
    
    if user:
        # Update existing user
        user.email = user_info["email"] or user.email
        db.commit()
        db.refresh(user)
    else:
        # Create new user
        user = User(
            username=user_info["username"],
            email=user_info["email"] or f"{user_info['username']}@example.com",
            hashed_password="AD_AUTHENTICATED"  # Placeholder, as auth is done via AD
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    return user

def sync_ad_groups_to_roles(user: Any, groups: list, db: Session) -> list:
    """
    Synchronize AD groups to user roles.
    
    Args:
        user: User object
        groups: List of AD group names
        db: Database session
        
    Returns:
        list: List of role names assigned to the user
    """
    from app.models.rbac_models import Role
    from sqlalchemy import text
    from datetime import datetime
    
    # Get mapping of AD groups to roles
    # This could be stored in a configuration or database table
    group_to_role_map = {
        "BRT_Admins": "System Admin",
        "BRT_CEOs": "CEO",
        "BRT_Reportees": "Reportee",
        "BRT_SubReportees": "Sub-reportee",
        "BRT_CXOs": "CXO",
        "BRT_ProjectSponsors": "Project Sponsor",
        "BRT_ClientHeads": "Client Head",
        "BRT_BCMCoordinators": "BCM Coordinator",
        "BRT_DepartmentHeads": "Department Head",
        "BRT_SubDepartmentHeads": "SubDepartment Head",
        "BRT_ProcessOwners": "Process Owner",
        "BRT_SubProcessOwners": "Sub Process Owner"
    }
    
    # Get roles for user's AD groups
    role_names = [group_to_role_map.get(group) for group in groups if group in group_to_role_map]
    role_names = [name for name in role_names if name]  # Filter out None values
    
    # Get role objects
    roles = db.query(Role).filter(Role.name.in_(role_names)).all() if role_names else []
    
    # Assign roles to user using direct SQL to avoid ORM schema issues
    for role in roles:
        try:
            # Check if user already has this role
            check_sql = text("""
                SELECT COUNT(*) FROM user_roles 
                WHERE user_id = :user_id AND role_id = :role_id
            """)
            result = db.execute(check_sql, {"user_id": user.id, "role_id": role.id}).scalar()
            
            if not result:
                # Add role to user with parameterized SQL, including valid_from and is_active
                current_time = datetime.utcnow()
                add_role_sql = text("""
                    INSERT INTO user_roles (user_id, role_id, assigned_by, valid_from, is_active) 
                    VALUES (:user_id, :role_id, :assigned_by, :valid_from, :is_active)
                """)
                db.execute(add_role_sql, {
                    "user_id": user.id, 
                    "role_id": role.id, 
                    "assigned_by": 1,  # System user ID
                    "valid_from": current_time,
                    "is_active": True
                })
                db.commit()
                print(f"Added user {user.username} to role {role.name}")
        except Exception as e:
            print(f"Error assigning role: {str(e)}")
            # Continue with other roles even if one fails
            continue
        
    return role_names

async def check_module_access(
    module_id: int,
    organization_id: UUID,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
) -> bool:
    """
    Check if an organization has access to a specific module.
    
    Args:
        module_id: ID of the module to check
        organization_id: UUID of the organization
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        True if the organization has access to the module, False otherwise
        
    Raises:
        HTTPException: If the organization is not found
    """
    from app.models.global_models import GlobalOrganization
    
    # Query organization from database
    org = db.query(GlobalOrganization).filter(GlobalOrganization.id == organization_id).first()
    
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Organization with ID {organization_id} not found"
        )
    
    # Check if the organization has access to the module
    if not org.licensed_modules:
        return False
    
    # Check if the module is in the list of licensed modules
    for module in org.licensed_modules:
        if module.get('module_id') == module_id and module.get('is_licensed', False):
            # Check if the module has an expiry date and if it's still valid
            expiry_date = module.get('expiry_date')
            if expiry_date:
                from datetime import datetime
                # If expiry date is in the past, the module is not accessible
                if datetime.fromisoformat(expiry_date) < datetime.now():
                    return False
            return True
    
    return False

async def require_module_access(
    module_id: int,
    organization_id: UUID,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    """
    Dependency to check if an organization has access to a specific module.
    
    Args:
        module_id: ID of the module to check
        organization_id: UUID of the organization
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Current user if the organization has access to the module
        
    Raises:
        HTTPException: If the organization does not have access to the module
    """
    has_access = await check_module_access(module_id, organization_id, db, current_user)
    
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Organization does not have access to module {module_id}"
        )
    
    return current_user

class RBACMiddleware:
    """
    RBAC middleware for FastAPI.
    
    This middleware integrates with Active Directory for authentication
    and maps AD groups to application roles.
    """
    
    def __init__(self, ad_server_uri: str, ad_base_dn: str):
        """
        Initialize RBAC middleware.
        
        Args:
            ad_server_uri: AD server URI
            ad_base_dn: AD base DN
        """
        self.ad_authenticator = ADAuthenticator(ad_server_uri, ad_base_dn)
    
    async def authenticate_user(self, username: str, password: str, db: Session) -> Optional[Dict[str, Any]]:
        """
        Authenticate user against AD and synchronize with database.

        Args:
            username: Username
            password: Password
            db: Database session

        Returns:
            Dict: User information if authentication successful, None otherwise
        """
        # Check for development bypass authentication
        username_lower = username.lower()
        admin_usernames = ["admin", "administrator", "systemadmin"]

        if username_lower in admin_usernames:
            # Admin access - bypass AD authentication for development
            print(f"Development bypass: Admin authentication for {username}")
            user_info = {
                "username": username,
                "display_name": f"{username.title()} (Dev)",
                "email": f"{username}@example.com",
                "groups": ["BRT_Admins", "Domain Admins"],
                "path": {
                    "organization": "Test Organization",
                    "department": "IT",
                    "subdepartment": "Development",
                    "process": "Admin"
                },
                "account_valid": True,
                "account_expires_on": None
            }
        elif not any(admin_username in username_lower for admin_username in admin_usernames):
            # Organization access for non-admin users - bypass AD authentication for development
            print(f"Development bypass: Organization authentication for {username}")
            user_info = {
                "username": username,
                "display_name": f"{username.title()} (Dev)",
                "email": f"{username}@example.com",
                "groups": ["BRT_Reportees"],
                "path": {
                    "organization": "Test Organization",
                    "department": "Finance",
                    "subdepartment": "Accounting",
                    "process": "Budgeting"
                },
                "account_valid": True,
                "account_expires_on": None
            }
        else:
            # For other usernames that might still contain admin words, try AD authentication
            # Authenticate against AD
            user_info = self.ad_authenticator.authenticate(username, password)

            if not user_info:
                return None
        
        # Synchronize user with database
        user = sync_ad_user_to_db(user_info, db)
        
        # Synchronize AD groups to roles and get role names
        role_names = sync_ad_groups_to_roles(user, user_info["groups"], db)
        
        # Get client ID if available (can be None)
        client_id = None
        # If you have client assignment logic, implement it here
        
        # Return user information with roles and client_id
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "groups": user_info["groups"],
            "roles": role_names,
            "client_id": client_id,
            "path": user_info.get("path", {
                "organization": None,
                "department": None,
                "subdepartment": None,
                "process": None
            })
        }

# Dependency for requiring specific permissions
def require_permission(resource: str, action: str):
    """
    Dependency for requiring specific permissions.
    
    Args:
        resource: Resource name
        action: Action name
        
    Returns:
        Function: Dependency function
    """
    def permission_dependency(
        token: str = Depends(oauth2_scheme),
        current_user = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        # Extract client_id from token if available
        client_id = None
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            client_id = payload.get("client_id")
        except JWTError:
            pass
        
        from app.services.rbac_service import RBACService
        if not RBACService.check_permission(db, current_user.id, resource, action, client_id=client_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Not enough permissions to {action} {resource}"
            )
        return current_user
    
    return permission_dependency

async def get_current_user_from_request(request: Request) -> Dict[str, Any]:
    """
    Extract user information from the request's authorization header.
    
    Args:
        request: FastAPI request object
        
    Returns:
        Dict: User information from the token
        
    Raises:
        HTTPException: If token is invalid or missing
    """
    try:
        # Get authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authorization header missing",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Extract token
        scheme, token = auth_header.split()
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Decode token
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Error extracting user from request: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
