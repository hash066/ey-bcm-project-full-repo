"""
Authentication middleware configuration.
"""
from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import logging

# Configure logging
logger = logging.getLogger(__name__)

class AuthMiddleware:
    """Authentication middleware for request handling."""
    
    def __init__(self, secret_key: str, algorithm: str = "HS256", token_expire_minutes: int = 30):
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.token_expire_minutes = token_expire_minutes
        self.security = HTTPBearer()
        
    async def authenticate_request(self, request: Request) -> Dict[str, Any]:
        """
        Authenticate the request using JWT token.
        
        Args:
            request: FastAPI request object
            
        Returns:
            Dict: User information from the token
            
        Raises:
            HTTPException: If authentication fails
        """
        try:
            auth: HTTPAuthorizationCredentials = await self.security(request)
            if not auth:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="No authentication credentials provided",
                    headers={"WWW-Authenticate": "Bearer"}
                )
            
            payload = self.decode_token(auth.credentials)
            if not payload:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired token",
                    headers={"WWW-Authenticate": "Bearer"}
                )
                
            return payload
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication failed",
                headers={"WWW-Authenticate": "Bearer"}
            )
    
    def create_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """
        Create a JWT token.
        
        Args:
            data: Data to encode in the token
            expires_delta: Optional expiration time delta
            
        Returns:
            str: Encoded JWT token
        """
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=self.token_expire_minutes))
        to_encode.update({"exp": expire})
        
        try:
            encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
            return encoded_jwt
        except Exception as e:
            logger.error(f"Token creation error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not create access token"
            )
    
    def decode_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Decode and validate a JWT token.
        
        Args:
            token: JWT token to decode
            
        Returns:
            Optional[Dict]: Decoded token data or None if invalid
        """
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except JWTError:
            return None
        except Exception as e:
            logger.error(f"Token decode error: {str(e)}")
            return None
            
    def refresh_token(self, token: str) -> Optional[str]:
        """
        Refresh an existing token.
        
        Args:
            token: Existing token to refresh
            
        Returns:
            Optional[str]: New token or None if refresh fails
        """
        try:
            payload = self.decode_token(token)
            if not payload:
                return None
                
            # Remove expiration from payload
            if "exp" in payload:
                del payload["exp"]
                
            # Create new token
            return self.create_token(payload)
        except Exception as e:
            logger.error(f"Token refresh error: {str(e)}")
            return None