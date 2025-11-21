from ldap3 import Server, Connection, Tls, ALL
import ssl, traceback
server_uri = "WIN-1KVPV1LM1SN.in.ey.com"
port = 636
username = "Administrator@in.ey.com"
password = "Ganesha123"
# for quick test allow unverified cert (DEV). If you have working RootCA_fixed.pem, set ca_certs_file accordingly.
tls = Tls(validate=ssl.CERT_NONE)   # DEV only — change to CERT_REQUIRED and ca_certs_file for prod
server = Server(server_uri, port=636, use_ssl=True, get_info=ALL, tls=tls)
try:
    conn = Connection(server, user=username, password=password, auto_bind=True)
    print("BIND OK - bound:", conn.bound)
    conn.unbind()
except Exception as e:
    print("BIND ERROR:")
    traceback.print_exc()
