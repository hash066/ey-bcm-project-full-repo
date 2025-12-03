#!/usr/bin/env python3
"""
Simple LDAP connection test to verify Active Directory integration.
"""
import sys
import os

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(__file__))

print('🔍 TESTING LDAP BIND CONNECTION')
print('=' * 50)

try:
    from app.services.ldap_auth_service import ldap_auth_service
    print('✓ LDAP service imported successfully')

    print('Creating LDAP connection...')
    conn = ldap_auth_service._create_ldap_connection()

    if conn:
        if conn.bound:
            status = 'SUCCESS ✅'
        else:
            status = 'FAILED ❌'

        print(f'LDAP Bind Status: {status}')
        print(f'Server: {conn.server.host}:{conn.server.port}')

        try:
            conn.unbind()
            print('Connection closed successfully')
        except:
            pass

        print('')
        if conn.bound:
            print('✅ CONCLUSION: Active Directory LDAP server is reachable via LDAPS!')
            print('   The application can authenticate users against ADDS.')
            sys.exit(0)
        else:
            print('❌ ISSUE: Cannot bind to LDAP server - check credentials or certificate.')
            print('   Check certificate file, credentials, or network connectivity.')
            sys.exit(1)
    else:
        print('❌ ERROR: Could not create connection object')
        sys.exit(1)

except ImportError as e:
    print(f'❌ IMPORT ERROR: Could not import LDAP service: {e}')
    sys.exit(1)
except Exception as e:
    print(f'❌ EXCEPTION: {str(e)}')
    sys.exit(1)
