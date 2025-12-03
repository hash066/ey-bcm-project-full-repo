"""
Active Directory password modification utilities.
Provides functions to change user passwords in Active Directory.
"""
import ldap3
import ssl
from typing import Optional, Dict, Any
from app.core.config import settings


def create_secure_ad_connection_for_admin(server_uri: str, admin_user: str, admin_password: str):
    """
    Create a secure LDAP connection with admin credentials for password modifications.
    
    Args:
        server_uri: LDAP server URI
        admin_user: Admin username for binding
        admin_password: Admin password for binding
        
    Returns:
        Connection: LDAP connection object with admin privileges
    """
    try:
        print(f"Creating secure AD admin connection with URI: {server_uri}")
        
        # Check if we're using LDAPS
        use_ssl = server_uri.lower().startswith('ldaps://')
        print(f"Using SSL/TLS: {use_ssl}")
        
        # Use TLS for secure connection with certificate validation disabled for self-signed certs
        tls_configuration = ldap3.Tls(validate=ssl.CERT_NONE)
        
        try:
            # First try with the configured URI
            server = ldap3.Server(
                server_uri, 
                get_info=ldap3.ALL, 
                tls=tls_configuration if use_ssl else None,
                use_ssl=use_ssl
            )
            
            # Create and bind connection with admin credentials
            conn = ldap3.Connection(
                server,
                user=admin_user,
                password=admin_password,
                authentication=ldap3.SIMPLE,
                auto_bind=True
            )
            
            print("AD admin connection successful")
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
                user=admin_user,
                password=admin_password,
                authentication=ldap3.SIMPLE,
                auto_bind=True
            )
            
            print("AD admin connection successful with IP address")
            return conn
            
    except Exception as e:
        print(f"Error creating secure AD admin connection: {str(e)}")
        raise e


def find_user_dn_in_ad(username: str) -> Optional[str]:
    """
    Find user's Distinguished Name in Active Directory.
    
    Args:
        username: Username to search for
        
    Returns:
        str: User's DN if found, None otherwise
    """
    try:
        print(f"Searching for user DN: {username}")
        
        # Use admin credentials to search
        admin_user = settings.AD_ADMIN_USER
        admin_password = settings.AD_ADMIN_PASSWORD
        
        conn = create_secure_ad_connection_for_admin(
            settings.AD_SERVER_URI, 
            admin_user, 
            admin_password
        )
        
        # Search for the user by sAMAccountName
        search_filter = f"(sAMAccountName={username})"
        print(f"Searching with filter: {search_filter}")
        
        conn.search(
            search_base=settings.AD_BASE_DN,
            search_filter=search_filter,
            search_scope=ldap3.SUBTREE, 
            attributes=["distinguishedName"]
        )
        
        if not conn.entries:
            print(f"User {username} not found in directory")
            return None
        
        # Get the user's distinguished name
        user_entry = conn.entries[0]
        user_dn = user_entry.distinguishedName.value
        print(f"Found user DN: {user_dn}")
        
        conn.unbind()
        return user_dn
        
    except Exception as e:
        print(f"Error finding user DN: {str(e)}")
        return None


def change_ad_user_password(username: str, new_password: str) -> Dict[str, Any]:
    """
    Change a user's password in Active Directory.
    
    Args:
        username: Username whose password to change
        new_password: New password to set
        
    Returns:
        Dict: Result with success status and message
    """
    try:
        print(f"Attempting to change AD password for user: {username}")
        
        # Find user's DN
        user_dn = find_user_dn_in_ad(username)
        if not user_dn:
            return {
                "success": False,
                "message": f"User {username} not found in Active Directory"
            }
        
        # Create admin connection
        admin_user = settings.AD_ADMIN_USER
        admin_password = settings.AD_ADMIN_PASSWORD
        
        conn = create_secure_ad_connection_for_admin(
            settings.AD_SERVER_URI, 
            admin_user, 
            admin_password
        )
        
        # Change the password using LDAP modify operation
        print(f"Changing password for DN: {user_dn}")
        
        # For Active Directory, we need to use the unicodePwd attribute
        # The password must be enclosed in quotes and encoded as UTF-16LE
        unicode_password = f'"{new_password}"'.encode('utf-16le')
        
        # Perform the modify operation
        modify_result = conn.modify(
            user_dn,
            {'unicodePwd': [(ldap3.MODIFY_REPLACE, [unicode_password])]}
        )
        
        if modify_result:
            print(f"Password changed successfully for {username}")
            conn.unbind()
            return {
                "success": True,
                "message": f"Password changed successfully for {username} in Active Directory"
            }
        else:
            error_msg = f"Failed to change password: {conn.result}"
            print(error_msg)
            conn.unbind()
            return {
                "success": False,
                "message": error_msg
            }
            
    except Exception as e:
        error_msg = f"Error changing AD password: {str(e)}"
        print(error_msg)
        return {
            "success": False,
            "message": error_msg
        }


def reset_ad_user_password(username: str, new_password: str, force_change_on_logon: bool = False) -> Dict[str, Any]:
    """
    Reset a user's password in Active Directory (admin function).
    
    Args:
        username: Username whose password to reset
        new_password: New password to set
        force_change_on_logon: Whether to force user to change password on next logon
        
    Returns:
        Dict: Result with success status and message
    """
    try:
        print(f"Attempting to reset AD password for user: {username}")
        
        # Find user's DN
        user_dn = find_user_dn_in_ad(username)
        if not user_dn:
            return {
                "success": False,
                "message": f"User {username} not found in Active Directory"
            }
        
        # Create admin connection
        admin_user = settings.AD_ADMIN_USER
        admin_password = settings.AD_ADMIN_PASSWORD
        
        conn = create_secure_ad_connection_for_admin(
            settings.AD_SERVER_URI, 
            admin_user, 
            admin_password
        )
        
        # Reset the password using LDAP modify operation
        print(f"Resetting password for DN: {user_dn}")
        
        # For Active Directory, we need to use the unicodePwd attribute
        unicode_password = f'"{new_password}"'.encode('utf-16le')
        
        # Prepare modify operations
        modify_operations = {
            'unicodePwd': [(ldap3.MODIFY_REPLACE, [unicode_password])]
        }
        
        # If force change on logon is requested, set pwdLastSet to 0
        if force_change_on_logon:
            modify_operations['pwdLastSet'] = [(ldap3.MODIFY_REPLACE, [0])]
        
        # Perform the modify operation
        modify_result = conn.modify(user_dn, modify_operations)
        
        if modify_result:
            message = f"Password reset successfully for {username} in Active Directory"
            if force_change_on_logon:
                message += " (user must change password on next logon)"
            print(message)
            conn.unbind()
            return {
                "success": True,
                "message": message
            }
        else:
            error_msg = f"Failed to reset password: {conn.result}"
            print(error_msg)
            conn.unbind()
            return {
                "success": False,
                "message": error_msg
            }
            
    except Exception as e:
        error_msg = f"Error resetting AD password: {str(e)}"
        print(error_msg)
        return {
            "success": False,
            "message": error_msg
        }
