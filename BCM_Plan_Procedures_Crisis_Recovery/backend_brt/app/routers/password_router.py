"""
Password management router for user password changes and admin password viewing.
"""
from datetime import datetime
from typing import List
from fastapi import APIRouter, HTTPException, Header
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from app.models.global_models import UserPassword
from app.schemas.password import (
    PasswordChangeRequest, 
    PasswordChangeResponse,
    UserPasswordInfo,
    UserPasswordSummary,
    AdminPasswordResetRequest,
    AdminPasswordResetResponse
)
from app.utils.password_utils import encrypt_password, decrypt_password, verify_password
from app.utils.ad_password_utils import change_ad_user_password, reset_ad_user_password
from app.db.postgres import get_db_context
from app.core.config import settings

router = APIRouter(prefix="/passwords", tags=["Password Management"])


# Simple auth check without database dependency
def simple_auth_check(authorization: str = Header(None)):
    """
    Simple auth check using Authorization header without database dependency.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
        
        # Decode token to get user info
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except (ValueError, JWTError) as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


# Simple admin check without database dependency
def simple_admin_check(authorization: str = Header(None)):
    """
    Simple admin check using Authorization header without database dependency.
    """
    user_info = simple_auth_check(authorization)
    
    # Check if user has admin role or is Administrator user
    roles = user_info.get("roles", [])
    username = user_info.get("sub", "")
    
    # Allow access if user has System Admin role OR is Administrator user
    if "System Admin" not in roles and username != "Administrator":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return user_info


@router.post("/change", response_model=PasswordChangeResponse)
async def change_password(
    request: PasswordChangeRequest,
    authorization: str = Header(None)
):
    """
    Allow users to change their password from default to a personal one.
    """
    print("=== CHANGE PASSWORD CALLED ===")
    user_info = simple_auth_check(authorization)
    username = user_info.get("sub")  # JWT standard uses 'sub' for subject/username
    
    if not username:
        raise HTTPException(status_code=400, detail="Username not found in token")
    
    with get_db_context() as db:
        # Get existing password record
        password_record = db.query(UserPassword).filter(
            UserPassword.username == username
        ).first()
        
        if not password_record:
            # Create initial password record using current password
            # This assumes the current password is their AD password
            try:
                initial_encrypted_password = encrypt_password(request.current_password)
                password_record = UserPassword(
                    username=username,
                    encrypted_password=initial_encrypted_password,
                    is_default_password="true",  # Assume it's a default password initially
                    password_changed_at=None
                )
                db.add(password_record)
                db.flush()  # Flush to get the record in session for verification
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to create initial password record: {str(e)}")
        
        # Verify current password
        if not verify_password(request.current_password, password_record.encrypted_password):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        # Encrypt new password for local storage
        try:
            new_encrypted_password = encrypt_password(request.new_password)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to encrypt password: {str(e)}")
        
        # Change Active Directory password first
        ad_result = change_ad_user_password(username, request.new_password)
        if not ad_result["success"]:
            raise HTTPException(status_code=500, detail=f"Failed to change Active Directory password: {ad_result['message']}")
        
        # Update local password record only after AD change succeeds
        password_record.encrypted_password = new_encrypted_password
        password_record.is_default_password = "false"
        password_record.password_changed_at = datetime.utcnow()
        password_record.updated_at = datetime.utcnow()
        
        db.commit()
        
        return PasswordChangeResponse(
            success=True,
            message="Password changed successfully in both Active Directory and local database",
            password_changed_at=password_record.password_changed_at
        )


@router.get("/my-info", response_model=UserPasswordSummary)
async def get_my_password_info(
    authorization: str = Header(None)
):
    """
    Get current user's password information (without decrypted password).
    """
    print("=== GET MY PASSWORD INFO CALLED ===")
    user_info = simple_auth_check(authorization)
    username = user_info.get("sub")  # JWT standard uses 'sub' for subject/username
    
    if not username:
        raise HTTPException(status_code=400, detail="Username not found in token")
    
    with get_db_context() as db:
        password_record = db.query(UserPassword).filter(
            UserPassword.username == username
        ).first()
        
        if not password_record:
            raise HTTPException(status_code=404, detail="Password record not found")
        
        return password_record


@router.get("/admin/all-users", response_model=List[UserPasswordInfo])
async def get_all_user_passwords(
    authorization: str = Header(None)
):
    """
    Admin endpoint to view all user passwords (decrypted).
    """
    print("=== ADMIN GET ALL PASSWORDS CALLED ===")
    simple_admin_check(authorization)
    
    with get_db_context() as db:
        password_records = db.query(UserPassword).order_by(UserPassword.username).all()
        
        # Decrypt passwords for admin view
        result = []
        for record in password_records:
            try:
                decrypted_password = decrypt_password(record.encrypted_password)
                result.append(UserPasswordInfo(
                    id=record.id,
                    username=record.username,
                    decrypted_password=decrypted_password,
                    is_default_password=record.is_default_password,
                    password_changed_at=record.password_changed_at,
                    created_at=record.created_at,
                    updated_at=record.updated_at
                ))
            except Exception as e:
                # If decryption fails, show error in password field
                result.append(UserPasswordInfo(
                    id=record.id,
                    username=record.username,
                    decrypted_password=f"DECRYPTION_ERROR: {str(e)}",
                    is_default_password=record.is_default_password,
                    password_changed_at=record.password_changed_at,
                    created_at=record.created_at,
                    updated_at=record.updated_at
                ))
        
        return result


@router.get("/admin/user/{username}", response_model=UserPasswordInfo)
async def get_user_password(
    username: str,
    authorization: str = Header(None)
):
    """
    Admin endpoint to view a specific user's password (decrypted).
    """
    print("=== ADMIN GET USER PASSWORD CALLED ===")
    simple_admin_check(authorization)
    
    with get_db_context() as db:
        password_record = db.query(UserPassword).filter(
            UserPassword.username == username
        ).first()
        
        if not password_record:
            raise HTTPException(status_code=404, detail="Password record not found")
        
        try:
            decrypted_password = decrypt_password(password_record.encrypted_password)
            return UserPasswordInfo(
                id=password_record.id,
                username=password_record.username,
                decrypted_password=decrypted_password,
                is_default_password=password_record.is_default_password,
                password_changed_at=password_record.password_changed_at,
                created_at=password_record.created_at,
                updated_at=password_record.updated_at
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to decrypt password: {str(e)}")


@router.post("/admin/reset", response_model=AdminPasswordResetResponse)
async def admin_reset_password(
    request: AdminPasswordResetRequest,
    authorization: str = Header(None)
):
    """
    Admin endpoint to reset a user's password.
    """
    print("=== ADMIN RESET PASSWORD CALLED ===")
    simple_admin_check(authorization)
    
    with get_db_context() as db:
        # Get existing password record
        password_record = db.query(UserPassword).filter(
            UserPassword.username == request.username
        ).first()
        
        if not password_record:
            # Create new password record if it doesn't exist
            try:
                encrypted_password = encrypt_password(request.new_password)
                password_record = UserPassword(
                    username=request.username,
                    encrypted_password=encrypted_password,
                    is_default_password="true" if request.is_default else "false",
                    password_changed_at=None if request.is_default else datetime.utcnow()
                )
                db.add(password_record)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to encrypt password: {str(e)}")
        else:
            # Update existing record
            if request.new_password:
                try:
                    password_record.encrypted_password = encrypt_password(request.new_password)
                except Exception as e:
                    raise HTTPException(status_code=500, detail=f"Failed to encrypt password: {str(e)}")
            password_record.is_default_password = "true" if request.is_default else "false"
            password_record.password_changed_at = None if request.is_default else datetime.utcnow()
            password_record.updated_at = datetime.utcnow()
        
        # Reset Active Directory password
        if request.new_password:
            ad_result = reset_ad_user_password(request.username, request.new_password)
            if not ad_result["success"]:
                raise HTTPException(status_code=500, detail=f"Failed to reset Active Directory password: {ad_result['message']}")
        
        db.commit()
        
        return AdminPasswordResetResponse(
            success=True,
            message="Password reset successfully in both Active Directory and local database",
            username=request.username,
            is_default_password=password_record.is_default_password == "true",
            password_changed_at=password_record.password_changed_at
        )


@router.get("/admin/default-users", response_model=List[UserPasswordSummary])
async def get_users_with_default_passwords(
    authorization: str = Header(None)
):
    """
    Admin endpoint to get all users who still have default passwords.
    """
    print("=== ADMIN GET DEFAULT PASSWORD USERS CALLED ===")
    simple_admin_check(authorization)
    
    with get_db_context() as db:
        password_records = db.query(UserPassword).filter(
            UserPassword.is_default_password == "true"
        ).order_by(UserPassword.username).all()
        
        return password_records
