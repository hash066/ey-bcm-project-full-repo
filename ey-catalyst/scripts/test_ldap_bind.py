# scripts/test_ldap_bind.py
# Quick LDAP bind test using production settings
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from ldap3 import Server, Connection, Tls, ALL
import ssl
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend_brt', '.env'))

def get_config():
    class Config:
        LDAP_CA_CERT_PATH = os.getenv('LDAP_CA_CERT_PATH')
        AD_SSL_SERVER_URI = os.getenv('AD_SSL_SERVER_URI')
        AD_BIND_USER = os.getenv('AD_BIND_USER')
        AD_BIND_PASSWORD = os.getenv('AD_BIND_PASSWORD')
    return Config()

settings = get_config()

tls = Tls(
    ca_certs_file=settings.LDAP_CA_CERT_PATH,
    validate=ssl.CERT_REQUIRED,
    version=ssl.PROTOCOL_TLSv1_2
)

server = Server(
    settings.AD_SSL_SERVER_URI,  # Production AD Server from config
    use_ssl=True,
    get_info=ALL,
    tls=tls
)

print("Server:", server)

try:
    conn = Connection(server, user="Administrator@in.ey.com", password="Ganesha123", auto_bind=True)
    print("BIND OK - Server Info:", conn.server.info)
    conn.unbind()
except Exception as e:
    print("BIND FAILED:", e)
