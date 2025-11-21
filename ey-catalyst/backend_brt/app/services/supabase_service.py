"""
Supabase storage service for handling file uploads and retrievals.
"""
import os
import base64
from typing import Optional
import requests
from fastapi import HTTPException

from app.core.config import settings

def upload_file_to_supabase(
    file_path: str,
    storage_path: str,
    content_type: str
) -> str:
    """
    Upload a file to Supabase storage.
    
    Args:
        file_path: Local path to the file
        storage_path: Path where the file should be stored in Supabase
        content_type: MIME type of the file
        
    Returns:
        URL to the uploaded file
    """
    try:
        # Read file as binary
        with open(file_path, 'rb') as f:
            file_data = f.read()
        
        # Extract bucket and object path from storage_path
        parts = storage_path.split('/', 1)
        bucket = parts[0] if len(parts) > 0 else 'default'
        object_path = parts[1] if len(parts) > 1 else storage_path
        
        # Prepare headers
        headers = {
            'Authorization': f'Bearer {settings.SUPABASE_KEY}',
            'Content-Type': content_type
        }
        
        # Construct URL
        url = f"{settings.SUPABASE_URL}/storage/v1/object/{bucket}/{object_path}"
        
        # Upload file
        response = requests.post(url, headers=headers, data=file_data)
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to upload file to Supabase: {response.text}"
            )
        
        # Return the public URL
        return f"{settings.SUPABASE_URL}/storage/v1/object/public/{bucket}/{object_path}"
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error uploading file to Supabase: {str(e)}"
        )

def get_file_from_supabase(storage_path: str) -> bytes:
    """
    Get a file from Supabase storage.
    
    Args:
        storage_path: Path to the file in Supabase storage
        
    Returns:
        File content as bytes
    """
    try:
        # Extract bucket and object path from storage_path
        parts = storage_path.split('/', 1)
        bucket = parts[0] if len(parts) > 0 else 'default'
        object_path = parts[1] if len(parts) > 1 else storage_path
        
        # Prepare headers
        headers = {
            'Authorization': f'Bearer {settings.SUPABASE_KEY}'
        }
        
        # Construct URL
        url = f"{settings.SUPABASE_URL}/storage/v1/object/{bucket}/{object_path}"
        
        # Get file
        response = requests.get(url, headers=headers)
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to get file from Supabase: {response.text}"
            )
        
        return response.content
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting file from Supabase: {str(e)}"
        )

def delete_file_from_supabase(storage_path: str) -> bool:
    """
    Delete a file from Supabase storage.
    
    Args:
        storage_path: Path to the file in Supabase storage
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Extract bucket and object path from storage_path
        parts = storage_path.split('/', 1)
        bucket = parts[0] if len(parts) > 0 else 'default'
        object_path = parts[1] if len(parts) > 1 else storage_path
        
        # Prepare headers
        headers = {
            'Authorization': f'Bearer {settings.SUPABASE_KEY}'
        }
        
        # Construct URL
        url = f"{settings.SUPABASE_URL}/storage/v1/object/{bucket}/{object_path}"
        
        # Delete file
        response = requests.delete(url, headers=headers)
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to delete file from Supabase: {response.text}"
            )
        
        return True
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting file from Supabase: {str(e)}"
        )
