"""
Setup Demo Users for RBAC Testing
Creates multiple demo users with different roles to demonstrate RBAC functionality.
"""
import os
import sys
from sqlalchemy import create_engine, text
import bcrypt

# Database connection
DATABASE_URL = os.getenv(
    'SQLALCHEMY_DATABASE_URI',
    'postgresql://postgres.oucktnjljscewmgoukzd:Ey-cat$2025@aws-0-ap-south-1.pooler.supabase.com:5432/postgres'
)

def create_demo_users():
    """Create demo users with different roles for RBAC testing"""
    
    engine = create_engine(DATABASE_URL)
    
    # Define demo users with their roles
    demo_users = [
        {
            "username": "admin.demo",
            "email": "admin.demo@example.com",
            "password": "Admin@123",
            "role": "System Admin",
            "role_type": "ADMIN",
            "description": "Full system access - can see and manage everything"
        },
        {
            "username": "ceo.demo",
            "email": "ceo.demo@example.com",
            "password": "CEO@123",
            "role": "CEO",
            "role_type": "CEO",
            "description": "CEO level access - can view all organization data"
        },
        {
            "username": "depthead.demo",
            "email": "depthead.demo@example.com",
            "password": "DeptHead@123",
            "role": "Department Head",
            "role_type": "DEPARTMENT_HEAD",
            "description": "Department Head - can manage their department"
        },
        {
            "username": "subdepthead.demo",
            "email": "subdepthead.demo@example.com",
            "password": "SubDept@123",
            "role": "SubDepartment Head",
            "role_type": "SUBDEPT_HEAD",
            "description": "SubDepartment Head - can manage their subdepartment"
        },
        {
            "username": "processowner.demo",
            "email": "processowner.demo@example.com",
            "password": "Process@123",
            "role": "Process Owner",
            "role_type": "PROCESS_OWNER",
            "description": "Process Owner - can manage their assigned processes"
        },
        {
            "username": "bcmcoord.demo",
            "email": "bcmcoord.demo@example.com",
            "password": "BCM@123",
            "role": "BCM Coordinator",
            "role_type": "BCM_COORDINATOR",
            "description": "BCM Coordinator - can coordinate BCM activities"
        }
    ]
    
    print("[INFO] Creating demo users for RBAC testing...\n")
    
    try:
        with engine.connect() as connection:
            created_users = []
            
            for user_data in demo_users:
                # Generate bcrypt hash for password
                hashed_password = bcrypt.hashpw(
                    user_data["password"].encode('utf-8'), 
                    bcrypt.gensalt()
                ).decode('utf-8')
                
                print(f"[INFO] Creating user: {user_data['username']}")
                print(f"       Role: {user_data['role']}")
                print(f"       Password: {user_data['password']}")
                print(f"       Description: {user_data['description']}")
                
                # Insert or update user
                user_result = connection.execute(text("""
                    INSERT INTO users (username, email, hashed_password, is_active)
                    VALUES (:username, :email, :hashed_password, true)
                    ON CONFLICT (username) 
                    DO UPDATE SET 
                        email = EXCLUDED.email,
                        hashed_password = EXCLUDED.hashed_password,
                        is_active = EXCLUDED.is_active
                    RETURNING id
                """), {
                    "username": user_data["username"],
                    "email": user_data["email"],
                    "hashed_password": hashed_password
                })
                
                user_id = user_result.fetchone()[0]
                print(f"       User ID: {user_id}")
                
                # Ensure role exists
                connection.execute(text("""
                    INSERT INTO roles (name, type)
                    VALUES (:role_name, :role_type)
                    ON CONFLICT (name) DO NOTHING
                """), {"role_name": user_data["role"], "role_type": user_data["role_type"]})
                
                # Get role ID
                role_result = connection.execute(text("""
                    SELECT id FROM roles WHERE name = :role_name
                """), {"role_name": user_data["role"]})
                
                role_id = role_result.fetchone()[0]
                
                # Assign role to user
                connection.execute(text("""
                    INSERT INTO user_roles (user_id, role_id, assigned_by, valid_from, is_active)
                    VALUES (:user_id, :role_id, 1, NOW(), true)
                    ON CONFLICT (user_id, role_id) 
                    DO UPDATE SET is_active = EXCLUDED.is_active
                """), {
                    "user_id": user_id,
                    "role_id": role_id
                })
                
                connection.commit()
                
                created_users.append({
                    "username": user_data["username"],
                    "password": user_data["password"],
                    "role": user_data["role"],
                    "user_id": user_id,
                    "role_id": role_id
                })
                
                print(f"       [SUCCESS] User created and role assigned!\n")
            
            # Print summary
            print("\n" + "="*70)
            print("DEMO USERS CREATED SUCCESSFULLY!")
            print("="*70)
            print("\nYou can now login with these credentials:\n")
            
            for user in created_users:
                print(f"Role: {user['role']}")
                print(f"  Username: {user['username']}")
                print(f"  Password: {user['password']}")
                print(f"  User ID: {user['user_id']}")
                print()
            
            print("="*70)
            print("\nNext Steps:")
            print("1. Run test_rbac_login.py to test login for each role")
            print("2. Run test_rbac_access.py to test endpoint access for each role")
            print("3. Use these credentials in your frontend to demo RBAC")
            print("="*70)
            
    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        engine.dispose()

if __name__ == "__main__":
    create_demo_users()
