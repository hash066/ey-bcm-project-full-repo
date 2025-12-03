from ldap3 import Server, Connection, Tls, ALL
import ssl, traceback
server_uri = "WIN-1KVPV1LM1SN.in.ey.com"
username_variants = ["Administrator", "Administrator@in.ey.com", "IN\\Administrator"]
password = "Ganesha123"
tls = Tls(validate=ssl.CERT_NONE)   # DEV only - matches earlier tests
server = Server(server_uri, port=636, use_ssl=True, get_info=ALL, tls=tls)
for u in username_variants:
    try:
        conn = Connection(server, user=u, password=password, auto_bind=True)
        print(f"BIND OK for: {u} (bound={conn.bound})")
        conn.unbind()
    except Exception:
        print(f"BIND FAILED for: {u}")
        traceback.print_exc()
