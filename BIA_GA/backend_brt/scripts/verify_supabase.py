#!/usr/bin/env python3
"""
Supabase Connectivity Verification Script
Tests Supabase database and storage functionality for the POC implementation.
"""

import logging
import sys
from pathlib import Path

# Add the parent directory to sys.path to import the app
script_dir = Path(__file__).parent.parent
if str(script_dir) not in sys.path:
    sys.path.insert(0, str(script_dir))

def test_supabase_client():
    """Test Supabase client initialization."""
    try:
        from app.core.supabase_client import get_supabase_client
        client = get_supabase_client()
        print("✅ Supabase client initialized successfully")
        return client
    except Exception as e:
        print(f"❌ Supabase client initialization failed: {e}")
        return None

def test_database_connection(supabase):
    """Test database connectivity - try to fetch organization table."""
    try:
        response = supabase.table("organization").select("*").limit(1).execute()
        print(f"✅ Database query successful - found {len(response.data)} records in organization table")
        return True
    except Exception as e:
        print(f"⚠️ Database query failed (expected for POC without schema): {e}")
        return False

def test_storage_bucket(supabase):
    """Test storage bucket access."""
    try:
        # Try to list files in the crisis-management bucket
        bucket_files = supabase.storage.from_('crisis-management').list()
        print("✅ Storage bucket access successful")
        print(f"   Found {len(bucket_files)} files in crisis-management bucket")
        return True
    except Exception as e:
        print(f"❌ Storage bucket access failed: {e}")
        return False

def test_organization_fallback():
    """Test the organization listing fallback mechanism."""
    try:
        from app.routers.organization_router import list_organizations
        # This will try Supabase first, then fallback
        result = list_organizations(skip=0, limit=5, auth_check=True)
        print(f"✅ Organization fallback test successful - returned {len(result)} organizations")
        return True
    except Exception as e:
        print(f"❌ Organization fallback test failed: {e}")
        return False

def main():
    print("=" * 60)
    print("🔍 SUPABASE POC VERIFICATION")
    print("=" * 60)
    print()

    # Step 1: Test client initialization
    print("1️⃣ Testing Supabase Client Initialization...")
    supabase = test_supabase_client()
    if not supabase:
        print("\n❌ POC FAILED - Cannot initialize Supabase client")
        return False
    print()

    # Step 2: Test database connection
    print("2️⃣ Testing Database Connection...")
    db_ok = test_database_connection(supabase)
    print()

    # Step 3: Test storage access
    print("3️⃣ Testing Storage Bucket Access...")
    storage_ok = test_storage_bucket(supabase)
    print()

    # Step 4: Test fallback logic
    print("4️⃣ Testing Organization Router with Fallback...")
    fallback_ok = test_organization_fallback()
    print()

    # Summary
    print("=" * 60)
    print("📊 VERIFICATION SUMMARY")
    print("=" * 60)

    checks = [
        ("Supabase Client", supabase is not None),
        ("Database Query", db_ok),
        ("Storage Bucket", storage_ok),
        ("Fallback Logic", fallback_ok)
    ]

    all_passed = True
    for check_name, passed in checks:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{check_name:.<15} {status}")
        if not passed:
            all_passed = False

    print()
    if all_passed:
        print("🎉 POC SUCCESS! Supabase integration is ready for expansion.")
        print("   Next step: Paste supabase_schema.sql into Supabase SQL Editor")
        print("   Then expand POC to full implementation across all routers.")
        return True
    else:
        print("⚠️ POC PARTIAL SUCCESS - Some components need attention")
        if not db_ok:
            print("   Note: Database queries will fail until schema is applied")
        if not storage_ok:
            print("   Note: Storage bucket may need permission setup")
        return False

if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

    success = main()
    sys.exit(0 if success else 1)
