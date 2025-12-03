#!/usr/bin/env python3
"""
Script to create demo users for RBAC testing.
Creates the demo users specified in the requirements.
"""

import sys
import os
from pathlib import Path

# Add the backend directory to the path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.db.postgres import SessionLocal, engine
from app.gap_assessment_module.models import User
from app.services.password_service import PasswordService
from sqlalchemy.orm import Session

def create_demo_users(db: Session):
    """Create demo users with specified roles and credentials."""

    demo_users = [
        {
            "email": "admin.demo",
            "name": "System Admin Demo",
            "role": "ey_admin",
            "department": "IT Security",
            "organization": "Demo Corp",
            "password": "Admin@123"
        },
        {
            "email": "ceo.demo",
            "name": "CEO Demo",
            "role": "organization_head",
            "department": "Executive",
            "organization": "Demo Corp",
            "password": "CEO@123"
        },
        {
            "email": "depthead.demo",
            "name": "Department Head Demo",
            "role": "department_head",
            "department": "IT",
            "organization": "Demo Corp",
            "password": "DeptHead@123"
        },
        {
            "email": "subdepthead.demo",
            "name": "SubDepartment Head Demo",
            "role": "department_head",
            "department": "IT Security",
            "organization": "Demo Corp",
            "password": "SubDept@123"
        },
        {
            "email": "processowner.demo",
            "name": "Process Owner Demo",
            "role": "process_owner",
            "department": "IT Security",
            "organization": "Demo Corp",
            "password": "Process@123"
        },
        {
            "email": "bcmcoord.demo",
            "name": "BCM Coordinator Demo",
            "role": "bcm_coordinator",
            "department": "Business Continuity",
            "organization": "Demo Corp",
            "password": "BCM@123"
        }
    ]

    created_users = []

    for user_data in demo_users:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_data["email"]).first()
        if existing_user:
            print(f"User {user_data['email']} already exists, skipping...")
            continue

        # Hash the password
        hashed_password = PasswordService.hash_password(user_data["password"])

        # Create new user
        user = User(
            email=user_data["email"],
            name=user_data["name"],
            role=user_data["role"],
            department=user_data["department"],
            organization=user_data["organization"],
            hashed_password=hashed_password,
            is_active=True
        )

        db.add(user)
        created_users.append(user_data)
        print(f"Created user: {user_data['email']} ({user_data['role']})")

    db.commit()
    return created_users

def main():
    """Main function to create demo users."""
    print("Creating demo users for RBAC testing...")

    # Create database session
    db = SessionLocal()

    try:
        # Create demo users
        created_users = create_demo_users(db)

        print(f"\nSuccessfully created {len(created_users)} demo users:")
        print("\nDemo User Credentials:")
        print("=" * 50)
        for user in created_users:
            print(f"Role: {user['name']}")
            print(f"Email: {user['email']}")
            print(f"Password: {user['password']}")
            print("-" * 30)

        print("\nNote: BCM Coordinator has same visibility level as CEO")
        print("Department Heads can only see requests from their department")
        print("Framework additions are restricted to BCM Coordinator, CEO, and Admin only")

    except Exception as e:
        print(f"Error creating demo users: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
