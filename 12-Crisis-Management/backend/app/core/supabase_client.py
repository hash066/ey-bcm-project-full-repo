"""
Supabase client configuration for the Business Resilience Tool.
This is now the PRIMARY database client.
"""
import os
from typing import Optional, Any

# Import Supabase client with proper error handling
try:
    from supabase import create_client
except ImportError:
    try:
        from supabase._sync.client import create_client
    except ImportError:
        # Fallback for different versions
        try:
            import supabase
            create_client = supabase.create_client
        except ImportError:
            # Create a mock client for development
            def create_client(url: str, key: str) -> Any:
                print("⚠️ Supabase not available, using mock client")
                return None

def get_supabase_client():
    """
    Create and return Supabase client.
    This is now the primary database client.
    """
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")

    if not url or not key:
        print("⚠️ SUPABASE_URL and SUPABASE_KEY not set, using fallback mode")
        return None

    try:
        # Create Supabase client with the latest API
        # Try without proxy first, as newer versions may not support it
        return create_client(url, key)  # type: ignore
    except TypeError as e:
        if "proxy" in str(e):
            print("⚠️ Supabase client proxy parameter not supported, trying alternative initialization")
            try:
                # Try creating client without any additional parameters
                return create_client(url, key)  # type: ignore
            except Exception as e2:
                print(f"⚠️ Supabase client initialization failed (alternative): {e2}")
                return None
        else:
            print(f"⚠️ Supabase client initialization failed: {e}")
            return None
    except Exception as e:
        print(f"⚠️ Supabase client initialization failed: {e}")
        return None

def get_supabase_service_client():
    """
    Create and return Supabase service role client for admin operations.
    """
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")

    if not url or not key:
        print("⚠️ SUPABASE_URL and SUPABASE_SERVICE_KEY not set, using fallback mode")
        return None

    try:
        return create_client(url, key)
    except TypeError as e:
        if "proxy" in str(e):
            print("⚠️ Supabase service client proxy parameter not supported, trying alternative initialization")
            try:
                # Try creating client without any additional parameters
                return create_client(url, key)
            except Exception as e2:
                print(f"⚠️ Supabase service client initialization failed (alternative): {e2}")
                return None
        else:
            print(f"⚠️ Supabase service client initialization failed: {e}")
            return None
    except Exception as e:
        print(f"⚠️ Supabase service client initialization failed: {e}")
        return None

# Global client instances
supabase = None
supabase_service = None

def init_supabase_clients():
    """
    Initialize global Supabase clients.
    Call this during app startup.
    """
    global supabase, supabase_service
    try:
        supabase = get_supabase_client()
        supabase_service = get_supabase_service_client()
        if supabase is not None:
            print("✅ Supabase clients initialized successfully")
        else:
            print("⚠️ Supabase clients not available, using fallback mode")
    except Exception as e:
        print(f"❌ Failed to initialize Supabase clients: {e}")
        supabase = None
        supabase_service = None

# Export the clients
__all__ = ['get_supabase_client', 'get_supabase_service_client', 'supabase', 'supabase_service', 'init_supabase_clients']
