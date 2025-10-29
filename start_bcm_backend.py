"""
Simple script to start the BCM backend server with all endpoints.
"""
import uvicorn
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend_brt'))

# Import the main app
from backend_brt.main import app

if __name__ == "__main__":
    print("🚀 Starting BCM Backend Server...")
    print("📊 BCM Dashboard will be available at: http://localhost:5173/bcm-standalone")
    print("🔗 API Documentation: http://localhost:8000/docs")
    print("🛑 Press Ctrl+C to stop")
    
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)