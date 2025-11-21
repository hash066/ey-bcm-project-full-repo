@echo off
echo 🎭 Starting RBAC Login Visibility Demo Setup
echo ===========================================

echo.
echo Step 1: Setting up RBAC demo users...
cd backend_brt
python test_rbac_login_demo.py

echo.
echo Step 2: Starting backend server...
echo 🔄 Starting uvicorn server (press Ctrl+C to stop)...
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

echo.
echo ✅ Demo ready! Server running on http://localhost:8000
echo =====================================================
