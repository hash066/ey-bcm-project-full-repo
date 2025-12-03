"""
Document Storage Router for handling document uploads and storage in MongoDB.
This router provides endpoints for uploading, retrieving, and managing documents
following the CLIENT->DEPARTMENT->SUBDEPARTMENT->PROCESS hierarchy.
"""
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from typing import List, Dict, Any, Optional
import json
import io
from datetime import datetime

from app.schemas.document_storage import (
    StorageDocumentCreate,
    StorageDocumentResponse,
    StorageDocumentUpdate,
    StorageDocumentQuery,
    FileFormat,
    DocumentType
)
from app.services.document_storage_service import DocumentStorageService
from app.middleware.auth import get_current_user as get_current_active_user
from app.models.rbac_models import User

router = APIRouter(
    prefix="/document-storage",
    tags=["document-storage"],
    responses={404: {"description": "Not found"}},
)

@router.post("/upload", response_model=StorageDocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    document_type: DocumentType = Form(...),
    client_id: int = Form(...),
    department_id: int = Form(...),
    subdepartment_id: int = Form(...),
    process_id: int = Form(...),
    tags: str = Form("[]"),  # JSON array of strings
    metadata: str = Form("{}"),  # JSON object
    current_user: User = Depends(get_current_active_user)
):
    """
    Upload a document to storage following the CLIENT->DEPARTMENT->SUBDEPARTMENT->PROCESS hierarchy.
    
    The document will be stored in MongoDB and associated with the specified hierarchy.
    """
    try:
        # Parse JSON fields
        tags_list = json.loads(tags)
        metadata_dict = json.loads(metadata)
        
        # Create document data
        document_data = StorageDocumentCreate(
            title=title,
            description=description,
            document_type=document_type,
            file_format=None,  # Will be auto-detected
            original_filename=file.filename,
            file_size=0,  # Will be set during upload
            content_type=file.content_type,
            client_id=client_id,
            department_id=department_id,
            subdepartment_id=subdepartment_id,
            process_id=process_id,
            uploaded_by=current_user.id,
            tags=tags_list,
            metadata=metadata_dict
        )
        
        # Upload document
        result = await DocumentStorageService.upload_document(file, document_data)
        return result
    
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON format for tags or metadata"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading document: {str(e)}"
        )

@router.get("/documents/{client_id}/{document_id}", response_model=StorageDocumentResponse)
async def get_document(
    client_id: int,
    document_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Get document metadata by ID.
    """
    try:
        document = DocumentStorageService.get_document(client_id, document_id)
        return document
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving document: {str(e)}"
        )

@router.get("/documents/{client_id}/{document_id}/content")
async def get_document_content(
    client_id: int,
    document_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Get document content by ID.
    
    Returns the document content as a file download.
    """
    try:
        # Get document metadata first to get filename and content type
        document = DocumentStorageService.get_document(client_id, document_id)
        
        # Get document content
        content = DocumentStorageService.get_document_content(client_id, document_id)
        
        # Return content as file download
        return StreamingResponse(
            io.BytesIO(content),
            media_type=document.get("content_type", "application/octet-stream"),
            headers={
                "Content-Disposition": f"attachment; filename={document.get('original_filename', 'document')}"
            }
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving document content: {str(e)}"
        )

@router.get("/documents/{client_id}", response_model=List[StorageDocumentResponse])
async def query_documents(
    client_id: int,
    department_id: Optional[int] = None,
    subdepartment_id: Optional[int] = None,
    process_id: Optional[int] = None,
    document_type: Optional[DocumentType] = None,
    file_format: Optional[FileFormat] = None,
    uploaded_by: Optional[int] = None,
    created_after: Optional[datetime] = None,
    created_before: Optional[datetime] = None,
    tags: Optional[str] = None,  # Comma-separated list of tags
    search_text: Optional[str] = None,
    limit: int = Query(100, ge=1, le=1000),
    skip: int = Query(0, ge=0),
    current_user: User = Depends(get_current_active_user)
):
    """
    Query documents based on various criteria.
    
    Documents can be filtered by hierarchy level, document type, file format, etc.
    """
    try:
        # Parse tags if provided
        tags_list = None
        if tags:
            tags_list = [tag.strip() for tag in tags.split(",")]
        
        # Create query
        query = StorageDocumentQuery(
            client_id=client_id,
            department_id=department_id,
            subdepartment_id=subdepartment_id,
            process_id=process_id,
            document_type=document_type,
            file_format=file_format,
            uploaded_by=uploaded_by,
            created_after=created_after,
            created_before=created_before,
            tags=tags_list,
            search_text=search_text,
            limit=limit,
            skip=skip
        )
        
        # Query documents
        documents = DocumentStorageService.query_documents(client_id, query)
        return documents
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error querying documents: {str(e)}"
        )

@router.put("/documents/{client_id}/{document_id}", response_model=StorageDocumentResponse)
async def update_document(
    client_id: int,
    document_id: str,
    update_data: StorageDocumentUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """
    Update document metadata.
    """
    try:
        updated_document = DocumentStorageService.update_document(client_id, document_id, update_data)
        return updated_document
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating document: {str(e)}"
        )

@router.delete("/documents/{client_id}/{document_id}")
async def delete_document(
    client_id: int,
    document_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a document and its content.
    """
    try:
        result = DocumentStorageService.delete_document(client_id, document_id)
        return {"success": result, "message": "Document deleted successfully"}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting document: {str(e)}"
        )

@router.get("/hierarchy/{client_id}", response_model=List[StorageDocumentResponse])
async def get_documents_by_hierarchy(
    client_id: int,
    department_id: Optional[int] = None,
    subdepartment_id: Optional[int] = None,
    process_id: Optional[int] = None,
    limit: int = Query(100, ge=1, le=1000),
    skip: int = Query(0, ge=0),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get documents by hierarchy level.
    
    This endpoint allows retrieving documents at different levels of the
    CLIENT->DEPARTMENT->SUBDEPARTMENT->PROCESS hierarchy.
    """
    try:
        documents = DocumentStorageService.get_documents_by_hierarchy(
            client_id=client_id,
            department_id=department_id,
            subdepartment_id=subdepartment_id,
            process_id=process_id,
            limit=limit,
            skip=skip
        )
        return documents
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving documents by hierarchy: {str(e)}"
        )
