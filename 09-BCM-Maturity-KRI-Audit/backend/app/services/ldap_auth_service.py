#!/usr/bin/env python3
"""
LDAP/Active Directory Authentication Service
Integrates ADDS authentication with RBAC system for login-based visibility control.
"""

import ldap3
from ldap3 import Server, Connection, Tls, ALL
import ssl
import os
import logging
from typing import Dict, Optional, List, Tuple
from pathlib import Path
from ldap3.core.exceptions import LDAPException, LDAPSocketOpenError, LDAPBindError
from sqlalchemy.orm import Session

from app.db.postgres import get_db
from app.models.unified_rbac import UnifiedRBACService, user_has_role
from app.models import User
from app.core.security import create_access_token
from app.core.config import settings

logger = logging.getLogger(__name__)

class LDAPAuthenticationService:
    """
    LDAP/ADDS Authentication Service with RBAC Integration
    Handles user authentication against ADDS and automatic role assignment.
    """

    def __init__(self):
        self.server_uri = getattr(settings, 'AD_SERVER_URI', 'ldap://192.168.163.10:389')
        self.ssl_server_uri = getattr(settings, 'AD_SSL_SERVER_URI', 'ldaps://192.168.163.10:636')
        self.base_dn = getattr(settings, 'AD_BASE_DN', 'dc=ey,dc=local')
        self.bind_user = getattr(settings, 'AD_BIND_USER', 'EY\\Administrator')
        self.bind_password = getattr(settings, 'AD_BIND_PASSWORD', 'Ganesha123')
        self.domain = getattr(settings, 'AD_DOMAIN', 'in.ey.com')
        self.netbios_domain = getattr(settings, 'AD_NETBIOS_DOMAIN', 'IN')  # Add netbios domain
        self.logger = logger  # Add logger reference

    def _create_ldap_connection(self, user_dn: str = None, password: str = None,
                               auto_bind: bool = True) -> ldap3.Connection:
        """
        Create LDAP connection with proper configuration. Tries non-SSL first, SSL as fallback.

        Args:
            user_dn: User DN for binding (optional)
            password: Password for binding (optional)
            auto_bind: Whether to auto-bind the connection

        Returns:
            ldap3.Connection: Configured LDAP connection
        """
        try:
            # Try non-SSL first (port 389)
            logger.info(f"Connecting to LDAP server: {self.server_uri} (non-SSL)")
            server = ldap3.Server(self.server_uri, get_info=ldap3.ALL)

            user_to_bind = user_dn if user_dn else self.bind_user
            password_to_bind = password if password else self.bind_password

            conn = ldap3.Connection(
                server,
                user=user_to_bind,
                password=password_to_bind,
                authentication=ldap3.SIMPLE,
                auto_bind=auto_bind
            )

            return conn

        except (LDAPSocketOpenError, LDAPException) as e:
            logger.warning(f"Non-SSL connection failed, trying SSL: {str(e)}")

            # Fallback to SSL connection if available
            try:
                tls = Tls(
                    ca_certs_file=settings.LDAP_CA_CERT_PATH,
                    validate=ssl.CERT_REQUIRED,
                    version=ssl.PROTOCOL_TLSv1_2
                )
                print(f"TLS configuration loaded with RootCA.cer")

                server = Server(
                    self.ssl_server_uri,
                    use_ssl=True,
                    get_info=ALL,
                    tls=tls
                )

                logger.info(f"Connecting to LDAP server: {self.ssl_server_uri} (SSL)")

                conn = ldap3.Connection(
                    server,
                    user=user_dn if user_dn else self.bind_user,
                    password=password if password else self.bind_password,
                    authentication=ldap3.SIMPLE,
                    auto_bind=auto_bind
                )

                return conn

            except Exception as ssl_error:
                logger.error(f"Both SSL and non-SSL connections failed. SSL error: {str(ssl_error)}")
                logger.error(f"Original non-SSL error: {str(e)}")
                raise e  # Raise original non-SSL error

    def _attempt_user_bind(self, username, password):
        r"""
        Try several username formats until one binds:
          1. username as provided
          2. username@<AD_DOMAIN> (UPN)
          3. <AD_NETBIOS_DOMAIN>\username (DOMAIN\user)
          4. sAMAccountName (if we can extract it)
        Returns bound Connection on success, or raises the last exception on failure.
        """
        import socket
        from ldap3 import Connection, ALL
        formats = [username]

        # Add UPN if domain configured
        if getattr(self, "domain", None):
            formats.append(f"{username}@{self.domain}")
        # NetBIOS style (try uppercase domain short name if available)
        if getattr(self, "netbios_domain", None):
            formats.append(f"{self.netbios_domain}\\{username}")
        else:
            # fallback guess for domain short name (IN -> in)
            try:
                short = self.domain.split('.')[0].upper()
                formats.append(f"{short}\\{username}")
            except Exception:
                pass

        last_exc = None
        for u in formats:
            try:
                # Try SSL connection first, fallback to non-SSL if fails
                try:
                    tls = Tls(
                        ca_certs_file=settings.LDAP_CA_CERT_PATH,
                        validate=ssl.CERT_REQUIRED,
                        version=ssl.PROTOCOL_TLSv1_2
                    )
                    server = Server(
                        self.ssl_server_uri,
                        use_ssl=True,
                        get_info=ALL,
                        tls=tls
                    )
                except Exception:
                    # Fallback to non-SSL
                    server = Server(self.server_uri, get_info=ALL)

                conn = Connection(server, user=u, password=password, auto_bind=True)
                if conn.bound:
                    self.logger.info("User bind succeeded using format: %s", u)
                    return conn
            except Exception as e:
                last_exc = e
                self.logger.debug("Bind attempt failed for %s: %s", u, e)
        # nothing worked
        raise last_exc or Exception("All bind attempts failed")

    def authenticate_user(self, username: str, password: str, db: Session = None) -> Optional[Dict]:
        """
        Authenticate user against ADDS and return user info with roles.

        Args:
            username: ADDS username (without domain)
            password: User password
            db: Database session

        Returns:
            Dict: User info with roles and JWT token, or None if failed
        """
        if not db:
            db = next(get_db())

        try:
            # Step 1: Attempt to bind with username/password - try multiple formats
            try:
                user_conn = self._attempt_user_bind(username, password)
                logger.info(f"Password verification successful for user {username}")

                # For AD, DN might be available via who_am_i or we need to find the user
                # Let's try to get the DN after successful bind
                user_dn = user_conn.who_am_i()

                # Step 2: Find user attributes (need to search or use bind DN)
                user_attributes = {}  # We'll get this from the search

                user_conn.unbind()

            except Exception as e:
                logger.warning(f"All bind attempts failed for user {username}: {str(e)}")
                return None

            # For now, if bind worked but DN is not available, try to find the user
            if not user_dn or not user_dn.startswith('dn:'):
                # Fallback to search if who_am_i didn't give us DN
                user_dn, user_attributes = self._find_user_in_adds(username)
                if not user_dn:
                    logger.warning(f"User {username} bind worked but search failed")
                    return None
            else:
                # Parse the DN from who_am_i response
                user_dn = user_dn.replace('dn:', '')
                # Try to get attributes with a search using the DN we now have
                try:
                    search_conn = self._create_ldap_connection(auto_bind=True)
                    search_conn.search(
                        search_base=user_dn,
                        search_filter="(objectClass=user)",
                        search_scope=ldap3.BASE,
                        attributes=['displayName', 'mail', 'memberOf', 'department', 'title']
                    )
                    if search_conn.entries:
                        entry = search_conn.entries[0]
                        user_attributes = {
                            'displayName': entry.displayName.values if hasattr(entry, 'displayName') else [username],
                            'mail': entry.mail.values if hasattr(entry, 'mail') else [f"{username}@{self.domain}"],
                            'memberOf': entry.memberOf.values if hasattr(entry, 'memberOf') else [],
                            'department': entry.department.values if hasattr(entry, 'department') else [],
                            'title': entry.title.values if hasattr(entry, 'title') else []
                        }
                    search_conn.unbind()
                except Exception as e:
                    logger.debug(f"Could not get attributes for {username}: {str(e)}")
                    user_attributes = {}

            # Step 3: Map ADDS user to database user and assign roles
            db_user = self._get_or_create_db_user(
                username=username,
                user_dn=user_dn,
                user_attributes=user_attributes,
                db=db
            )

            if not db_user:
                logger.error(f"Failed to create/get database user for {username}")
                return None

            # Step 4: Assign roles based on ADDS groups or attributes
            user_roles = self._assign_rbac_roles(db_user.id, user_attributes, db)

            # Step 5: Generate JWT token
            token_data = {
                "sub": str(db_user.id),
                "username": db_user.username,
                "email": db_user.email,
                "roles": user_roles
            }

            access_token = create_access_token(token_data)

            logger.info(f"Authentication successful for user {username} with roles: {user_roles}")

            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": db_user.id,
                    "username": db_user.username,
                    "email": db_user.email,
                    "full_name": user_attributes.get('displayName', [username])[0],
                    "roles": user_roles
                },
                "expires_in": 1800  # 30 minutes
            }

        except Exception as e:
            logger.error(f"Authentication error for {username}: {str(e)}")
            return None

    def _find_user_in_adds(self, username: str) -> Tuple[Optional[str], Dict]:
        """
        Find user in ADDS and return DN and attributes.

        Args:
            username: Username to search for

        Returns:
            Tuple: (user_dn, user_attributes) or (None, {}) if not found
        """
        try:
            # First try sAMAccountName search
            search_filters = [
                f"(sAMAccountName={username})",
                f"(userPrincipalName={username}@{self.domain})",
                f"(cn={username})"
            ]

            for search_filter in search_filters:
                conn = self._create_ldap_connection(auto_bind=True)

                try:
                    conn.search(
                        search_base=self.base_dn,
                        search_filter=search_filter,
                        search_scope=ldap3.SUBTREE,
                        attributes=['distinguishedName', 'displayName', 'mail', 'memberOf', 'department', 'title']
                    )

                    if conn.entries:
                        entry = conn.entries[0]
                        user_dn = entry.distinguishedName.value
                        attributes = {
                            'displayName': entry.displayName.values if hasattr(entry, 'displayName') else [username],
                            'mail': entry.mail.values if hasattr(entry, 'mail') else [f"{username}@{self.domain}"],
                            'memberOf': entry.memberOf.values if hasattr(entry, 'memberOf') else [],
                            'department': entry.department.values if hasattr(entry, 'department') else [],
                            'title': entry.title.values if hasattr(entry, 'title') else []
                        }

                        conn.unbind()
                        return user_dn, attributes

                finally:
                    if conn and conn.bound:
                        conn.unbind()

            return None, {}

        except Exception as e:
            logger.error(f"Error searching for user {username}: {str(e)}")
            return None, {}

    def _get_or_create_db_user(self, username: str, user_dn: str,
                              user_attributes: Dict, db: Session) -> Optional[User]:
        """
        Get existing user or create new user in database.

        Args:
            username: Username
            user_dn: ADDS DN
            user_attributes: ADDS user attributes
            db: Database session

        Returns:
            User: Database user object
        """
        try:
            # Try to find existing user
            db_user = db.query(User).filter(User.username == username).first()

            if db_user:
                # Update existing user attributes if needed
                if not db_user.email and user_attributes.get('mail'):
                    db_user.email = user_attributes['mail'][0]
                return db_user

            # Create new user
            full_name = user_attributes.get('displayName', [username])[0]
            email = user_attributes.get('mail', [f"{username}@{self.domain}"])[0]

            db_user = User(
                username=username,
                email=email,
                full_name=full_name,
                is_active=True,
                is_ldap_user=True,
                ldap_dn=user_dn
            )

            db.add(db_user)
            db.commit()
            db.refresh(db_user)

            logger.info(f"Created new user in database: {username} (ID: {db_user.id})")
            return db_user

        except Exception as e:
            db.rollback()
            logger.error(f"Error creating/getting user {username}: {str(e)}")
            return None

    def _assign_rbac_roles(self, user_id: int, user_attributes: Dict, db: Session) -> List[str]:
        """
        Assign RBAC roles based on ADDS groups and attributes.

        Args:
            user_id: Database user ID
            user_attributes: ADDS user attributes
            db: Database session

        Returns:
            List[str]: Assigned role names
        """
        try:
            assigned_roles = []

            # Get ADDS groups
            member_of = user_attributes.get('memberOf', [])
            department = user_attributes.get('department', [''])[0].lower() if user_attributes.get('department') else ''
            title = user_attributes.get('title', [''])[0].lower() if user_attributes.get('title') else ''

            # Role mapping based on ADDS groups and attributes
            role_mappings = {
                # Admin roles
                'domain admins': 'ey_admin',
                'enterprise admins': 'ey_admin',
                'administrators': 'ey_admin',

                # Executive roles
                'ceo': 'ceo',
                'chief executive': 'ceo',
                'executive': 'ceo',

                # BCM roles
                'bcm': 'bcm_coordinator',
                'business continuity': 'bcm_coordinator',
                'crisis management': 'bcm_coordinator',

                # Department head roles
                'head': 'department_head',
                'director': 'department_head',
                'manager': 'department_head' if department in ['it', 'finance', 'hr', 'operations'] else None,

                # Sub-department head roles
                'sub': 'sub_department_head',
                'assistant': 'sub_department_head',
                'supervisor': 'sub_department_head',

                # Process owner roles (default)
                'owner': 'process_owner',
                'specialist': 'process_owner',
                'analyst': 'process_owner'
            }

            # Check ADDS groups first
            for group in member_of:
                group_name = group.lower()
                for keyword, role in role_mappings.items():
                    if keyword in group_name and role:
                        try:
                            UnifiedRBACService.assign_role(db, user_id, role)
                            if role not in assigned_roles:
                                assigned_roles.append(role)
                        except Exception as e:
                            logger.warning(f"Failed to assign role {role}: {str(e)}")

            # Check job title
            if title:
                for keyword, role in role_mappings.items():
                    if keyword in title and role and role not in assigned_roles:
                        try:
                            UnifiedRBACService.assign_role(db, user_id, role)
                            assigned_roles.append(role)
                        except Exception as e:
                            logger.warning(f"Failed to assign role {role}: {str(e)}")

            # Default role if no roles assigned
            if not assigned_roles:
                try:
                    UnifiedRBACService.assign_role(db, user_id, 'process_owner')
                    assigned_roles.append('process_owner')
                    logger.info(f"Assigned default role 'process_owner' to user {user_id}")
                except Exception as e:
                    logger.warning(f"Failed to assign default role: {str(e)}")

            logger.info(f"Assigned roles for user {user_id}: {assigned_roles}")
            return assigned_roles

        except Exception as e:
            logger.error(f"Error assigning roles for user {user_id}: {str(e)}")
            return ['process_owner']  # Fallback role

    def test_connection(self) -> bool:
        """
        Test LDAP connection and return status.

        Returns:
            bool: True if connection successful
        """
        try:
            conn = self._create_ldap_connection(auto_bind=True)

            # Perform a simple search
            conn.search(
                search_base=self.base_dn,
                search_filter="(objectClass=user)",
                search_scope=ldap3.BASE,
                size_limit=1
            )

            conn.unbind()
            logger.info("LDAP connection test successful")
            return True

        except Exception as e:
            logger.error(f"LDAP connection test failed: {str(e)}")
            return False

# Global service instance
ldap_auth_service = LDAPAuthenticationService()

# Convenience functions
def authenticate_with_adds(username: str, password: str, db=None) -> Optional[Dict]:
    """Authenticate user with ADDS and return user data with roles."""
    return ldap_auth_service.authenticate_user(username, password, db)

def test_ldap_connection() -> bool:
    """Test LDAP connection."""
    return ldap_auth_service.test_connection()
