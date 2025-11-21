from app.services.ldap_auth_service import ldap_auth_service
import traceback

print("\n🔍 Checking LDAP bind using app's real code...")
print("================================================")

try:
    conn = ldap_auth_service._create_ldap_connection()
    if conn and conn.bound:
        print(f"✅ LDAP SERVER CONNECTED: {conn.server.host}:{conn.server.port}")
    else:
        print("❌ Cannot even connect to LDAP server.")

    print("\n🔄 Testing USER BIND (fallback formats)...")
    try:
        test_user = "Administrator"
        test_pass = "Ganesha123"

        c = ldap_auth_service._attempt_user_bind(test_user, test_pass)
        print("🎉 SUCCESS: User bind succeeded!")
        print(f"   Bound as: {c.user}")
        c.unbind()

    except Exception as e:
        print("❌ USER BIND FAILED")
        print("Error:")
        traceback.print_exc()

except Exception as e:
    print("\n❌ FATAL ERROR while testing bind:")
    traceback.print_exc()

print("\n🔍 LDAP BIND TEST FINISHED")
