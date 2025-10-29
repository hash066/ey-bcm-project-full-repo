"""
Quick script to add BCM endpoints to the existing running server.
"""
import requests
import json

def test_and_add_bcm_endpoints():
    """Test existing server and add BCM endpoints if needed."""
    
    base_url = "http://localhost:8000"
    
    # Test if server is running
    try:
        response = requests.get(f"{base_url}/")
        print("✅ Server is running")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"❌ Server not accessible: {e}")
        return
    
    # Test BCM endpoints
    bcm_endpoints = [
        "/bcm/dashboard/stats",
        "/bcm/departments", 
        "/bcm/test-connection"
    ]
    
    print("\n🧪 Testing BCM endpoints...")
    for endpoint in bcm_endpoints:
        try:
            response = requests.get(f"{base_url}{endpoint}")
            if response.status_code == 200:
                print(f"✅ {endpoint}: Working")
            else:
                print(f"❌ {endpoint}: {response.status_code}")
        except Exception as e:
            print(f"❌ {endpoint}: {str(e)}")
    
    # Check what endpoints are available
    try:
        response = requests.get(f"{base_url}/openapi.json")
        if response.status_code == 200:
            openapi = response.json()
            paths = list(openapi.get("paths", {}).keys())
            
            print(f"\n📋 Available endpoints ({len(paths)}):")
            bcm_paths = [p for p in paths if "bcm" in p.lower()]
            
            if bcm_paths:
                print("BCM endpoints found:")
                for path in bcm_paths:
                    print(f"  - {path}")
            else:
                print("❌ No BCM endpoints found")
                print("Available endpoints:")
                for path in paths[:10]:  # Show first 10
                    print(f"  - {path}")
                if len(paths) > 10:
                    print(f"  ... and {len(paths) - 10} more")
                    
    except Exception as e:
        print(f"❌ Could not get OpenAPI spec: {e}")

if __name__ == "__main__":
    test_and_add_bcm_endpoints()