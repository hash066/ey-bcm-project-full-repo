"""
Password encryption and decryption utilities using AES encryption.
Provides secure password storage that can be decrypted by administrators.
"""
import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


class PasswordCrypto:
    """
    Password encryption/decryption utility using Fernet (AES 128 in CBC mode).
    Uses a master key derived from environment variable for consistent encryption.
    """
    
    def __init__(self):
        # Get master password from environment variable
        master_password = os.getenv("PASSWORD_MASTER_KEY", "default_master_key_change_in_production")
        
        # Use a fixed salt for consistent key derivation
        # In production, consider using a more secure approach
        salt = b"password_salt_brt_system_2024"
        
        # Derive key from master password
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(master_password.encode()))
        self.cipher = Fernet(key)
    
    def encrypt_password(self, password: str) -> str:
        """
        Encrypt a password using AES encryption.
        
        Args:
            password: Plain text password to encrypt
            
        Returns:
            Base64 encoded encrypted password
        """
        try:
            encrypted_bytes = self.cipher.encrypt(password.encode('utf-8'))
            return base64.urlsafe_b64encode(encrypted_bytes).decode('utf-8')
        except Exception as e:
            raise ValueError(f"Failed to encrypt password: {str(e)}")
    
    def decrypt_password(self, encrypted_password: str) -> str:
        """
        Decrypt an encrypted password.
        
        Args:
            encrypted_password: Base64 encoded encrypted password
            
        Returns:
            Plain text password
        """
        try:
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_password.encode('utf-8'))
            decrypted_bytes = self.cipher.decrypt(encrypted_bytes)
            return decrypted_bytes.decode('utf-8')
        except Exception as e:
            raise ValueError(f"Failed to decrypt password: {str(e)}")
    
    def verify_password(self, plain_password: str, encrypted_password: str) -> bool:
        """
        Verify if a plain password matches an encrypted password.
        
        Args:
            plain_password: Plain text password to verify
            encrypted_password: Encrypted password to compare against
            
        Returns:
            True if passwords match, False otherwise
        """
        try:
            decrypted = self.decrypt_password(encrypted_password)
            return plain_password == decrypted
        except:
            return False


# Global instance for use across the application
password_crypto = PasswordCrypto()


def encrypt_password(password: str) -> str:
    """
    Convenience function to encrypt a password.
    
    Args:
        password: Plain text password to encrypt
        
    Returns:
        Encrypted password string
    """
    return password_crypto.encrypt_password(password)


def decrypt_password(encrypted_password: str) -> str:
    """
    Convenience function to decrypt a password.
    
    Args:
        encrypted_password: Encrypted password to decrypt
        
    Returns:
        Plain text password
    """
    return password_crypto.decrypt_password(encrypted_password)


def verify_password(plain_password: str, encrypted_password: str) -> bool:
    """
    Convenience function to verify a password.
    
    Args:
        plain_password: Plain text password to verify
        encrypted_password: Encrypted password to compare against
        
    Returns:
        True if passwords match, False otherwise
    """
    return password_crypto.verify_password(plain_password, encrypted_password)
