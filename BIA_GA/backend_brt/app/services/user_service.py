"""
User service for managing user operations.
"""
from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.rbac_models import User as UserModel
from app.services.password_service import PasswordService


class UserService:
    """Service for user-related operations."""

    def __init__(self, db: Session):
        self.db = db
        self.password_service = PasswordService()

    def get_user_by_id(self, user_id: int) -> Optional[UserModel]:
        """Get user by ID."""
        return self.db.query(UserModel).filter(UserModel.id == user_id).first()

    def get_user_by_username(self, username: str) -> Optional[UserModel]:
        """Get user by username."""
        return self.db.query(UserModel).filter(UserModel.username == username).first()

    def get_user_by_email(self, email: str) -> Optional[UserModel]:
        """Get user by email."""
        return self.db.query(UserModel).filter(UserModel.email == email).first()

    def get_all_users(self) -> List[UserModel]:
        """Get all users."""
        return self.db.query(UserModel).all()

    def get_active_users(self) -> List[UserModel]:
        """Get all active users."""
        return self.db.query(UserModel).filter(UserModel.is_active == True).all()

    def create_user(self, username: str, email: str, password: str, **kwargs) -> UserModel:
        """Create a new user."""
        hashed_password = self.password_service.hash_password(password)

        user = UserModel(
            username=username,
            email=email,
            hashed_password=hashed_password,
            **kwargs
        )

        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        return user

    def update_user(self, user_id: int, **kwargs) -> Optional[UserModel]:
        """Update user information."""
        user = self.get_user_by_id(user_id)
        if not user:
            return None

        for key, value in kwargs.items():
            if hasattr(user, key) and key != 'id':
                setattr(user, key, value)

        self.db.commit()
        self.db.refresh(user)
        return user

    def deactivate_user(self, user_id: int) -> bool:
        """Deactivate a user."""
        user = self.get_user_by_id(user_id)
        if not user:
            return False

        user.is_active = False
        self.db.commit()
        return True

    def activate_user(self, user_id: int) -> bool:
        """Activate a user."""
        user = self.get_user_by_id(user_id)
        if not user:
            return False

        user.is_active = True
        self.db.commit()
        return True

    def change_password(self, user_id: int, new_password: str) -> bool:
        """Change user password."""
        user = self.get_user_by_id(user_id)
        if not user:
            return False

        user.hashed_password = self.password_service.hash_password(new_password)
        self.db.commit()
        return True

    def authenticate_user(self, username: str, password: str) -> Optional[UserModel]:
        """Authenticate user with username and password."""
        user = self.get_user_by_username(username)
        if not user:
            return None

        if not self.password_service.verify_password(password, user.hashed_password):
            return None

        return user
