import os
import json
import base64
import secrets
from typing import Any, Dict, Optional, Union, Tuple
from datetime import datetime, timedelta
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.exceptions import InvalidTag

from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(
    subject: Union[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# BIA Encryption Utilities

def derive_org_data_encryption_key(org_id: str, key_version: int = 1) -> bytes:
    """
    Derive a per-organization data encryption key (DEK) using HKDF from the master key.

    Args:
        org_id: Organization identifier (UUID as string)
        key_version: Key version for rotation support

    Returns:
        bytes: 32-byte AES-256 key
    """
    master_key = settings.BIA_ENCRYPTION_MASTER_KEY.encode('utf-8')

    # Create unique info string for this org and version
    info = f"BIA-DEK-{org_id}-{key_version}".encode('utf-8')

    # Use HKDF to derive the DEK
    hkdf = HKDF(
        algorithm=hashes.SHA256(),
        length=32,  # 256 bits for AES-256
        salt=None,  # No salt - using master key as entropy source
        info=info,
        backend=default_backend()
    )

    return hkdf.derive(master_key)

def encrypt_bia_data(data: Any, org_id: str, key_version: int = 1) -> Dict[str, str]:
    """
    Encrypt BIA data using AES-256-GCM.

    Args:
        data: Data to encrypt (will be JSON serialized)
        org_id: Organization identifier
        key_version: Key version for rotation

    Returns:
        dict: Contains ciphertext, IV, tag, key_version, and other metadata
    """
    # Serialize data to JSON
    if not isinstance(data, str):
        plaintext = json.dumps(data, sort_keys=True)
    else:
        plaintext = data

    plaintext_bytes = plaintext.encode('utf-8')

    # Generate random 96-bit IV (12 bytes)
    iv = secrets.token_bytes(12)

    # Get the DEK for this org
    dek = derive_org_data_encryption_key(org_id, key_version)

    # Create cipher
    encryptor = Cipher(
        algorithms.AES(dek),
        modes.GCM(iv),
        backend=default_backend()
    ).encryptor()

    # Encrypt the data
    ciphertext = encryptor.update(plaintext_bytes) + encryptor.finalize()

    # Get the authentication tag
    tag = encryptor.tag

    # Return encrypted data with metadata
    return {
        "ciphertext": base64.b64encode(ciphertext).decode('utf-8'),
        "iv": base64.b64encode(iv).decode('utf-8'),
        "tag": base64.b64encode(tag).decode('utf-8'),
        "key_version": str(key_version),
        "algorithm": "AES-256-GCM",
        "encrypted_at": datetime.utcnow().isoformat()
    }

def decrypt_bia_data(encrypted_data: Dict[str, Any], org_id: str) -> Any:
    """
    Decrypt BIA data using AES-256-GCM.

    Args:
        encrypted_data: Dict containing encryption metadata and ciphertext
        org_id: Organization identifier

    Returns:
        Decrypted data (JSON parsed if possible)

    Raises:
        InvalidTag: If decryption fails due to tampered data
        ValueError: If encryption metadata is missing or invalid
    """
    required_fields = ["ciphertext", "iv", "tag", "key_version"]
    for field in required_fields:
        if field not in encrypted_data:
            raise ValueError(f"Missing required field: {field}")

    try:
        # Extract encrypted components
        ciphertext = base64.b64decode(encrypted_data["ciphertext"])
        iv = base64.b64decode(encrypted_data["iv"])
        tag = base64.b64decode(encrypted_data["tag"])
        key_version = int(encrypted_data["key_version"])

        # Get the DEK for this org and key version
        dek = derive_org_data_encryption_key(org_id, key_version)

        # Create cipher for decryption
        decryptor = Cipher(
            algorithms.AES(dek),
            modes.GCM(iv, tag),
            backend=default_backend()
        ).decryptor()

        # Decrypt the data
        plaintext_bytes = decryptor.update(ciphertext) + decryptor.finalize()

        # Try to parse as JSON, otherwise return as string
        try:
            return json.loads(plaintext_bytes.decode('utf-8'))
        except json.JSONDecodeError:
            return plaintext_bytes.decode('utf-8')

    except Exception as e:
        raise ValueError(f"Decryption failed: {str(e)}")

def generate_data_checksum(data: Any) -> str:
    """
    Generate a SHA-256 checksum for data integrity verification.

    Args:
        data: Data to checksum

    Returns:
        str: Hex digest of SHA-256 hash
    """
    if not isinstance(data, str):
        data_str = json.dumps(data, sort_keys=True)
    else:
        data_str = data

    digest = hashes.Hash(hashes.SHA256(), backend=default_backend())
    digest.update(data_str.encode('utf-8'))

    return digest.finalize().hex()
