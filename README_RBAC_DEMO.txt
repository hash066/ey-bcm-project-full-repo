================================================================================
                    RBAC DEMO - STEP BY STEP INSTRUCTIONS
================================================================================

WHAT YOU NEED TO DO:
-------------------

1. CREATE DEMO USERS (One-time setup)
   Run this command in PowerShell:
   
   cd "c:\Users\inchara P\new-integration"
   python setup_demo_users.py
   
   This creates 6 demo users with different roles:
   - admin.demo (Password: Admin@123) - System Admin
   - ceo.demo (Password: CEO@123) - CEO
   - depthead.demo (Password: DeptHead@123) - Department Head
   - subdepthead.demo (Password: SubDept@123) - SubDepartment Head
   - processowner.demo (Password: Process@123) - Process Owner
   - bcmcoord.demo (Password: BCM@123) - BCM Coordinator


2. TEST LOGIN FOR ALL ROLES
   Run this command:
   
   python test_rbac_login.py
   
   This will:
   - Login with each demo user
   - Show you the JWT tokens
   - Save tokens to demo_tokens.json


3. TEST ACCESS CONTROL (RBAC)
   Run this command:
   
   python test_rbac_access.py
   
   This will:
   - Test if each role can access their authorized endpoints
   - Show which endpoints are blocked for which roles
   - Prove RBAC is working


4. QUICK DEMO (PowerShell)
   For a quick visual demo, run:
   
   .\quick_rbac_demo.ps1
   
   This shows:
   - Login for 3 different roles
   - Access test for each role
   - Color-coded results (Green=Success, Yellow=Blocked, Red=Error)


================================================================================
                        DEMO TO YOUR SENIOR
================================================================================

SCENARIO 1: Show Different Users Get Different Access
------------------------------------------------------
1. Open PowerShell
2. Run: .\quick_rbac_demo.ps1
3. Point out:
   - System Admin gets GREEN (access granted) for all endpoints
   - Department Head gets YELLOW (blocked) for some endpoints
   - Process Owner gets YELLOW (blocked) for most endpoints
4. Explain: "This proves RBAC is working - each role sees only what they're allowed to see"


SCENARIO 2: Show Login with Different Credentials
--------------------------------------------------
1. Use curl or Postman to login:

   System Admin:
   curl -X POST http://localhost:8002/auth/token -H "Content-Type: application/x-www-form-urlencoded" -d "username=admin.demo&password=Admin@123"
   
   Process Owner:
   curl -X POST http://localhost:8002/auth/token -H "Content-Type: application/x-www-form-urlencoded" -d "username=processowner.demo&password=Process@123"

2. Show the different tokens returned
3. Explain: "Each token contains the user's role information"


SCENARIO 3: Show API Access with Tokens
----------------------------------------
1. Get token for admin.demo (from Scenario 2)
2. Test an endpoint:
   curl http://localhost:8002/recovery-strategies/ -H "Authorization: Bearer ADMIN_TOKEN"
   Result: 200 OK (Success)

3. Get token for processowner.demo
4. Test the same endpoint:
   curl http://localhost:8002/recovery-strategies/ -H "Authorization: Bearer PROCESS_OWNER_TOKEN"
   Result: May be 403 Forbidden (depending on RBAC rules)

5. Explain: "Same endpoint, different tokens, different results - that's RBAC!"


SCENARIO 4: Show Frontend with Different Roles
-----------------------------------------------
1. Open your frontend (http://localhost:5173)
2. Login with admin.demo / Admin@123
3. Show all pages are accessible
4. Logout
5. Login with processowner.demo / Process@123
6. Show limited pages are accessible
7. Explain: "The UI adapts based on user role"


================================================================================
                        TROUBLESHOOTING
================================================================================

Problem: "Login failed" error
Solution: Make sure you ran setup_demo_users.py first

Problem: "401 Unauthorized" on all endpoints
Solution: Token might be expired, login again to get fresh token

Problem: "403 Forbidden" on endpoints
Solution: This is CORRECT! It means RBAC is working - that role doesn't have permission

Problem: Backend not running
Solution: Start backend with: cd backend_brt && uvicorn main:app --host 0.0.0.0 --port 8002 --reload


================================================================================
                        QUICK REFERENCE
================================================================================

Demo User Credentials:
----------------------
admin.demo / Admin@123          - Full access
ceo.demo / CEO@123              - Organization-wide view
depthead.demo / DeptHead@123    - Department access
subdepthead.demo / SubDept@123  - SubDepartment access
processowner.demo / Process@123 - Process access
bcmcoord.demo / BCM@123         - BCM coordination access


Important Files:
----------------
setup_demo_users.py      - Creates demo users in database
test_rbac_login.py       - Tests login for all roles
test_rbac_access.py      - Tests access control for all roles
quick_rbac_demo.ps1      - Quick PowerShell demo script
RBAC_DEMO_GUIDE.md       - Detailed documentation


API Endpoints to Test:
----------------------
POST /auth/token                              - Login (get JWT)
GET  /auth/me                                 - Get current user info
GET  /recovery-strategies/                    - Get recovery strategies
GET  /api/enhanced-procedures/current/bia     - Get BIA procedure
GET  /bcm/department-plans                    - Get BCM department plans


================================================================================
                        AFTER DEMO
================================================================================

To keep demo users for future demos:
- Do nothing, they'll stay in the database

To remove demo users:
- Connect to your database
- Run: DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE username LIKE '%.demo');
- Run: DELETE FROM users WHERE username LIKE '%.demo';


================================================================================
                        NEED HELP?
================================================================================

1. Check RBAC_DEMO_GUIDE.md for detailed instructions
2. Check backend logs for error messages
3. Use Swagger UI at http://localhost:8002/docs for interactive testing
4. Verify backend is running on port 8002

================================================================================
