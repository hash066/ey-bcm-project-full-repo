#!/usr/bin/env python3
"""
Test script to verify Supabase connection and basic operations.
"""
import os
import sys
sys.path.append('.')

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Use the same client initialization as the main app
from app.core.supabase_client import get_supabase_client

def test_supabase_connection():
    """Test basic Supabase connection and operations."""
    try:
        print("🔄 Testing Supabase connection...")

        # Get credentials directly
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")

        print(f"URL: {url}")
        print(f"Key present: {bool(key)}")

        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables are required")

        # Create client using the same method as the main app
        supabase = get_supabase_client()
        if not supabase:
            raise Exception("Failed to create Supabase client")
        print("✅ Supabase client created")

        # Test basic query - try to select from organizations table
        print("🔄 Testing basic query...")
        response = supabase.table('organizations').select('*').limit(1).execute()

        print(f"✅ Query successful! Found {len(response.data)} records")
        print(f"Response data: {response.data}")

        # Test table existence by trying to describe a few key tables
        tables_to_test = ['organizations', 'process', 'bia_process_info', 'users']

        print("\n🔄 Testing table accessibility...")
        for table in tables_to_test:
            try:
                response = supabase.table(table).select('*').limit(1).execute()
                print(f"✅ Table '{table}' is accessible")
            except Exception as e:
                print(f"❌ Table '{table}' error: {e}")

        print("\n🎉 Supabase connection test completed successfully!")

    except Exception as e:
        print(f"❌ Supabase connection test failed: {e}")
        return False

    return True

if __name__ == "__main__":
    success = test_supabase_connection()
    sys.exit(0 if success else 1)
