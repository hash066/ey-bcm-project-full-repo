"""
Password service for handling password hashing and validation.
"""
from passlib.context import CryptContext
import secrets
import string

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class PasswordService:
    """Service for password-related operations."""

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt.

        Args:
            password: Plain text password

        Returns:
            Hashed password
        """
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash.

        Args:
            plain_password: Plain text password
            hashed_password: Hashed password

        Returns:
            True if passwords match
        """
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def generate_random_password(length: int = 12) -> str:
        """Generate a random password.

        Args:
            length: Length of the password

        Returns:
            Random password string
        """
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        return ''.join(secrets.choice(alphabet) for i in range(length))


def hash_password_simple(password: str) -> str:
    """Simple password hashing function for backwards compatibility.

    Args:
        password: Plain text password

    Returns:
        Hashed password
    """
    return PasswordService.hash_password(password)


def verify_password_simple(plain_password: str, hashed_password: str) -> bool:
    """Simple password verification function for backwards compatibility.

    Args:
        plain_password: Plain text password
        hashed_password: Hashed password

    Returns:
        True if passwords match
    """
    return PasswordService.verify_password(plain_password, hashed_password)


# Export the service instance
password_service = PasswordService()
