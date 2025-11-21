"""
Database initialization script for creating default users and sample data.
"""

import asyncio
from sqlalchemy.orm import Session
from app.database import SessionLocal, create_tables
from app.models import User, ROLE_PROCESS_OWNER, ROLE_DEPARTMENT_HEAD, ROLE_ORGANIZATION_HEAD, ROLE_EY_ADMIN
from app.auth import get_password_hash_simple as get_password_hash

def create_default_users(db: Session):
    """Create default users for testing and initial setup."""

    # Check if users already exist
    existing_users = db.query(User).count()
    if existing_users > 0:
        print(f"Users already exist ({existing_users} users found). Skipping default user creation.")
        return

    print("Creating default users...")

    # Default users
    default_users = [
        {
            "email": "process.owner@company.com",
            "name": "Process Owner",
            "role": ROLE_PROCESS_OWNER,
            "department": "IT Operations",
            "organization": "Company Corp",
            "password": "pass"
        },
        {
            "email": "dept.head@company.com",
            "name": "Department Head",
            "role": ROLE_DEPARTMENT_HEAD,
            "department": "IT Operations",
            "organization": "Company Corp",
            "password": "pass"
        },
        {
            "email": "org.head@company.com",
            "name": "Organization Head",
            "role": ROLE_ORGANIZATION_HEAD,
            "department": "Executive",
            "organization": "Company Corp",
            "password": "pass"
        },
        {
            "email": "admin@ey.com",
            "name": "EY Administrator",
            "role": ROLE_EY_ADMIN,
            "department": "Consulting",
            "organization": "EY",
            "password": "admin"
        }
    ]

    for user_data in default_users:
        hashed_password = get_password_hash(user_data["password"])
        user = User(
            email=user_data["email"],
            name=user_data["name"],
            role=user_data["role"],
            department=user_data["department"],
            organization=user_data["organization"],
            hashed_password=hashed_password
        )
        db.add(user)
        print(f"Created user: {user_data['email']} ({user_data['role']})")

    db.commit()
    print(f"Created {len(default_users)} default users successfully!")

def create_sample_frameworks(db: Session):
    """Create sample frameworks for testing."""

    from app.models import Framework

    # Check if frameworks already exist
    existing_frameworks = db.query(Framework).count()
    if existing_frameworks > 0:
        print(f"Frameworks already exist ({existing_frameworks} frameworks found). Skipping sample framework creation.")
        return

    print("Creating sample frameworks...")

    sample_frameworks = [
        {
            "name": "RBI Cybersecurity Framework",
            "version": "1.0",
            "description": "Reserve Bank of India Cybersecurity Framework for banks",
            "content": {
                "domains": {
                    "Governance": [
                        {
                            "id": "RBI-GOV-001",
                            "name": "Board oversight and approval of BCP",
                            "description": "The Board fulfils its responsibilities by approving policy on BCP"
                        }
                    ]
                }
            },
            "global_available": True
        },
        {
            "name": "ISO 22301:2019",
            "version": "2019",
            "description": "Business Continuity Management Systems standard",
            "content": {
                "domains": {
                    "Context": [
                        {
                            "id": "ISO22301-001",
                            "name": "Understanding the organization and its context",
                            "description": "Determine external and internal issues relevant to BCMS"
                        }
                    ]
                }
            },
            "global_available": True
        }
    ]

    # Get the first EY Admin user to set as submitter
    admin_user = db.query(User).filter(User.role == ROLE_EY_ADMIN).first()
    if not admin_user:
        print("No EY Admin user found. Cannot create sample frameworks.")
        return

    for framework_data in sample_frameworks:
        framework = Framework(
            name=framework_data["name"],
            version=framework_data["version"],
            description=framework_data["description"],
            content=framework_data["content"],
            submitted_by=admin_user.id,
            approved_by=admin_user.id,  # Auto-approve sample frameworks
            global_available=framework_data["global_available"]
        )
        db.add(framework)
        print(f"Created framework: {framework_data['name']} v{framework_data['version']}")

    db.commit()
    print(f"Created {len(sample_frameworks)} sample frameworks successfully!")

def init_database():
    """Initialize the database with tables and default data."""

    print("Initializing database...")

    # Create tables
    print("Creating database tables...")
    create_tables()
    print("Database tables created successfully!")

    # Create default users
    db = SessionLocal()
    try:
        create_default_users(db)
        create_sample_frameworks(db)
        print("\nDatabase initialization completed successfully!")
        print("\nDefault login credentials:")
        print("Process Owner: process.owner@company.com / pass")
        print("Department Head: dept.head@company.com / pass")
        print("Organization Head: org.head@company.com / pass")
        print("EY Admin: admin@ey.com / admin")

    except Exception as e:
        print(f"Error during database initialization: {str(e)}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_database()
