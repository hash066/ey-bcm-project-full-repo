"""
Authentication utilities for JWT tokens and password hashing.
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.config_settings import settings
from app.database import get_db
from app.models import User

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configure bcrypt to avoid version issues
import bcrypt
try:
    # Try to use bcrypt directly if passlib has issues
    def get_password_hash_simple(password: str) -> str:
        """Simple password hashing using bcrypt directly."""
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def verify_password_simple(password: str, hashed: str) -> bool:
        """Simple password verification using bcrypt directly."""
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

except Exception as e:
    # Fallback to a simple hash if bcrypt fails
    import hashlib
    def get_password_hash_simple(password: str) -> str:
        """Fallback password hashing."""
        return hashlib.sha256(password.encode()).hexdigest()

    def verify_password_simple(password: str, hashed: str) -> bool:
        """Fallback password verification."""
        return hashlib.sha256(password.encode()).hexdigest() == hashed

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against its hash.

    Args:
        plain_password: The plain text password
        hashed_password: The hashed password

    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Hash a password for storing.

    Args:
        password: The plain text password

    Returns:
        Hashed password
    """
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Create a JWT access token.

    Args:
        data: Data to encode in the token
        expires_delta: Token expiration time

    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=settings.jwt_expiration_hours)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    """
    Verify and decode a JWT token.

    Args:
        token: The JWT token to verify

    Returns:
        Decoded token data or None if invalid
    """
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError:
        return None

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """
    Get the current authenticated user.

    Args:
        token: JWT token from request
        db: Database session

    Returns:
        User object

    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = verify_token(token)
    if payload is None:
        raise credentials_exception

    user_email: str = payload.get("sub")
    if user_email is None:
        raise credentials_exception

    user = db.query(User).filter(User.email == user_email).first()
    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Get the current active user (alias for get_current_user).

    Args:
        current_user: Current authenticated user

    Returns:
        User object
    """
    return current_user

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """
    Authenticate a user with email and password.

    Args:
        db: Database session
        email: User email
        password: Plain text password

    Returns:
        User object if authenticated, None otherwise
    """
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def check_role_hierarchy(user: User, required_role: str) -> bool:
    """
    Check if user has sufficient role level for an operation.

    Args:
        user: User object
        required_role: Required role level

    Returns:
        True if user has sufficient privileges
    """
    from app.models import ROLE_HIERARCHY

    user_level = ROLE_HIERARCHY.get(user.role, 0)
    required_level = ROLE_HIERARCHY.get(required_role, 0)

    return user_level >= required_level

def check_approval_permission(user: User, target_role: str) -> bool:
    """
    Check if user can approve requests for a specific role.

    Args:
        user: User object
        target_role: Role to approve for

    Returns:
        True if user can approve for the target role
    """
    from app.models import ROLE_HIERARCHY

    user_level = ROLE_HIERARCHY.get(user.role, 0)
    target_level = ROLE_HIERARCHY.get(target_role, 0)

    return user_level > target_level
