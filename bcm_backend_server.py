#!/usr/bin/env python3
"""
Simple BCM Backend Server
Provides mock data for BCM Dashboard development
Run on port 8003 to match the frontend API service
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from datetime import datetime
import random

app = FastAPI(title="BCM Backend Server", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock data
MOCK_ORGANIZATIONS = [
    {"id": 1, "name": "EY Global Services", "criticality": 12},
    {"id": 2, "name": "Tech Solutions Inc", "criticality": 8},
    {"id": 3, "name": "Financial Corp", "criticality": 6}
]

MOCK_DEPARTMENTS = [
    {"id": 1, "name": "Information Technology", "organization_id": 1, "total_processes": 15, "completed_bia": 12, "critical_processes": 8},
    {"id": 2, "name": "Finance", "organization_id": 1, "total_processes": 10, "completed_bia": 8, "critical_processes": 5},
    {"id": 3, "name": "Human Resources", "organization_id": 1, "total_processes": 8, "completed_bia": 6, "critical_processes": 3},
    {"id": 4, "name": "Operations", "organization_id": 1, "total_processes": 12, "completed_bia": 10, "critical_processes": 7}
]

MOCK_CRITICAL_STAFF = [
    {"id": 1, "employee_name": "John Smith", "designation": "IT Director", "phone": "+1-555-0101", "department": "IT"},
    {"id": 2, "employee_name": "Sarah Johnson", "designation": "Finance Manager", "phone": "+1-555-0102", "department": "Finance"},
    {"id": 3, "employee_name": "Mike Wilson", "designation": "Operations Head", "phone": "+1-555-0103", "department": "Operations"},
    {"id": 4, "employee_name": "Lisa Brown", "designation": "HR Director", "phone": "+1-555-0104", "department": "HR"}
]

@app.get("/")
async def root():
    return {"message": "BCM Backend Server", "status": "running", "timestamp": datetime.now().isoformat()}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/organizations/")
async def get_organizations():
    return MOCK_ORGANIZATIONS

@app.post("/organizations/")
async def create_organization(organization: dict):
    new_org = {
        "id": len(MOCK_ORGANIZATIONS) + 1,
        "name": organization.get("name", "New Organization"),
        "criticality": organization.get("criticality", 12)
    }
    MOCK_ORGANIZATIONS.append(new_org)
    return new_org

@app.get("/departments/")
async def get_departments(organization_id: int = None):
    if organization_id:
        return [dept for dept in MOCK_DEPARTMENTS if dept["organization_id"] == organization_id]
    return MOCK_DEPARTMENTS

@app.get("/departments/with-stats/")
async def get_departments_with_stats(organization_id: int = None):
    departments = MOCK_DEPARTMENTS
    if organization_id:
        departments = [dept for dept in MOCK_DEPARTMENTS if dept["organization_id"] == organization_id]
    
    # Add some random stats variation
    for dept in departments:
        dept["completion_rate"] = round((dept["completed_bia"] / dept["total_processes"]) * 100, 1)
        dept["pending_bia"] = dept["total_processes"] - dept["completed_bia"]
    
    return departments

@app.post("/departments/")
async def create_department(department: dict):
    new_dept = {
        "id": len(MOCK_DEPARTMENTS) + 1,
        "name": department.get("name", "New Department"),
        "organization_id": department.get("organization_id", 1),
        "total_processes": random.randint(5, 20),
        "completed_bia": 0,
        "critical_processes": random.randint(1, 5)
    }
    MOCK_DEPARTMENTS.append(new_dept)
    return new_dept

@app.get("/dashboard/stats")
async def get_dashboard_stats(organization_id: int = None):
    departments = MOCK_DEPARTMENTS
    if organization_id:
        departments = [dept for dept in MOCK_DEPARTMENTS if dept["organization_id"] == organization_id]
    
    total_processes = sum(dept["total_processes"] for dept in departments)
    completed_bia = sum(dept["completed_bia"] for dept in departments)
    pending_bia = total_processes - completed_bia
    critical_processes = sum(dept["critical_processes"] for dept in departments)
    completion_rate = round((completed_bia / total_processes) * 100, 1) if total_processes > 0 else 0
    
    return {
        "total_departments": len(departments),
        "total_processes": total_processes,
        "completed_bia": completed_bia,
        "pending_bia": pending_bia,
        "critical_processes": critical_processes,
        "completion_rate": completion_rate
    }

@app.get("/bia-information/")
async def get_bia_information(organization_id: int = None):
    # Mock BIA information
    return {
        "total_processes": 45,
        "completed_assessments": 36,
        "pending_assessments": 9,
        "critical_processes": 23,
        "last_updated": datetime.now().isoformat()
    }

@app.get("/critical-staff/")
async def get_critical_staff(organization_id: int = None):
    return MOCK_CRITICAL_STAFF

@app.get("/processes/")
async def get_processes(subdepartment_id: int = None):
    # Mock process data
    processes = [
        {"id": 1, "name": "Data Backup", "department": "IT", "criticality": "High", "rto": 4, "rpo": 1},
        {"id": 2, "name": "Financial Reporting", "department": "Finance", "criticality": "Critical", "rto": 2, "rpo": 0.5},
        {"id": 3, "name": "Payroll Processing", "department": "HR", "criticality": "High", "rto": 8, "rpo": 4},
        {"id": 4, "name": "Customer Support", "department": "Operations", "criticality": "Medium", "rto": 12, "rpo": 6}
    ]
    return processes

@app.get("/bia-process-info/")
async def get_bia_process_info(process_id: int = None):
    # Mock BIA process information
    return {
        "process_id": process_id or 1,
        "impact_analysis": {
            "financial": "High",
            "operational": "Critical",
            "reputational": "Medium"
        },
        "dependencies": ["Network Infrastructure", "Database Systems", "Third-party APIs"],
        "recovery_requirements": {
            "rto": 4,
            "rpo": 1,
            "minimum_resources": 75
        }
    }

if __name__ == "__main__":
    print("Starting BCM Backend Server on port 8003...")
    print("Access the API docs at: http://localhost:8003/docs")
    uvicorn.run("bcm_backend_server:app", host="0.0.0.0", port=8003, reload=True)