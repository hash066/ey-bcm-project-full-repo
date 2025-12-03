"""
Document Storage Service for handling document uploads and storage in MongoDB.
This service follows the CLIENT->DEPARTMENT->SUBDEPARTMENT->PROCESS hierarchy.
"""
import os
import io
import base64
from typing import List, Dict, Any, Optional, BinaryIO, Union
from datetime import datetime
from bson import ObjectId
from fastapi import UploadFile, HTTPException, status
from pymongo.collection import Collection
from pymongo.database import Database

from app.schemas.document_storage import (
    StorageDocumentCreate,
    StorageDocumentDB,
    StorageDocumentContent,
    StorageDocumentResponse,
    StorageDocumentUpdate,
    StorageDocumentQuery,
    FileFormat
)
from app.db.mongodb import get_mongodb_client
from app.core.config import settings

# Constants
DOCUMENT_STORAGE_COLLECTION = "document_storage"
DOCUMENT_CONTENT_COLLECTION = "document_content"
MAX_MONGODB_SIZE = 16 * 1024 * 1024  # 16MB limit for MongoDB documents

class DocumentStorageService:
    """Service for handling document storage operations"""
    
    @staticmethod
    def _get_db_for_client(client_id: int) -> Database:
        """Get MongoDB database for a specific client"""
        client = get_mongodb_client()
        return client[f"client_{client_id}"]
    
    @staticmethod
    def _get_storage_collection(client_id: int) -> Collection:
        """Get document storage collection for a client"""
        db = DocumentStorageService._get_db_for_client(client_id)
        return db[DOCUMENT_STORAGE_COLLECTION]
    
    @staticmethod
    def _get_content_collection(client_id: int) -> Collection:
        """Get document content collection for a client"""
        db = DocumentStorageService._get_db_for_client(client_id)
        return db[DOCUMENT_CONTENT_COLLECTION]
    
    @staticmethod
    def _detect_file_format(filename: str) -> FileFormat:
        """Detect file format from filename"""
        ext = os.path.splitext(filename)[1].lower().replace('.', '')
        
        if ext in ['pdf']:
            return FileFormat.PDF
        elif ext in ['xls', 'xlsx', 'xlsm']:
            return FileFormat.EXCEL
        elif ext in ['doc', 'docx']:
            return FileFormat.WORD
        elif ext in ['csv']:
            return FileFormat.CSV
        elif ext in ['txt', 'md', 'rtf']:
            return FileFormat.TEXT
        elif ext in ['json']:
            return FileFormat.JSON
        else:
            return FileFormat.OTHER
    
    @staticmethod
    async def upload_document(
        file: UploadFile,
        document_data: StorageDocumentCreate
    ) -> StorageDocumentResponse:
        """
        Upload a document to storage
        
        Args:
            file: The file to upload
            document_data: Document metadata
            
        Returns:
            StorageDocumentResponse: The stored document metadata
        """
        # Read file content
        content = await file.read()
        file_size = len(content)
        
        # Create document metadata
        document = StorageDocumentDB(
            title=document_data.title,
            description=document_data.description,
            tags=document_data.tags,
            document_type=document_data.document_type,
            file_format=document_data.file_format or DocumentStorageService._detect_file_format(file.filename),
            original_filename=file.filename,
            file_size=file_size,
            content_type=file.content_type,
            metadata=document_data.metadata,
            client_id=document_data.client_id,
            department_id=document_data.department_id,
            subdepartment_id=document_data.subdepartment_id,
            process_id=document_data.process_id,
            uploaded_by=document_data.uploaded_by,
            storage_location="mongodb"
        )
        
        # Store content separately if it's large
        if file_size > MAX_MONGODB_SIZE:
            # For large files, we'll store content separately
            content_doc = StorageDocumentContent(
                document_id=document.id,
                content=content
            )
            
            # Insert content document
            content_collection = DocumentStorageService._get_content_collection(document_data.client_id)
            content_result = content_collection.insert_one(content_doc.dict())
            
            # Set content ID reference
            document.content_id = str(content_result.inserted_id)
            document.storage_location = "mongodb_gridfs"
        else:
            # For small files, we'll store content directly in the document
            document.content_id = None
            document.metadata["content"] = base64.b64encode(content).decode('utf-8')
        
        # Insert document metadata
        storage_collection = DocumentStorageService._get_storage_collection(document_data.client_id)
        storage_collection.insert_one(document.dict())
        
        # Return response
        return StorageDocumentResponse(
            id=document.id,
            title=document.title,
            description=document.description,
            document_type=document.document_type,
            file_format=document.file_format,
            original_filename=document.original_filename,
            file_size=document.file_size,
            content_type=document.content_type,
            client_id=document.client_id,
            department_id=document.department_id,
            subdepartment_id=document.subdepartment_id,
            process_id=document.process_id,
            uploaded_by=document.uploaded_by,
            created_at=document.created_at,
            updated_at=document.updated_at,
            tags=document.tags or [],
            metadata={k: v for k, v in document.metadata.items() if k != "content"}
        )
    
    @staticmethod
    def get_document(client_id: int, document_id: str, include_content: bool = False) -> Dict[str, Any]:
        """
        Get document metadata and optionally content
        
        Args:
            client_id: Client ID
            document_id: Document ID
            include_content: Whether to include document content
            
        Returns:
            Dict: Document metadata and optionally content
        """
        # Get document metadata
        storage_collection = DocumentStorageService._get_storage_collection(client_id)
        document = storage_collection.find_one({"id": document_id})
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document with ID {document_id} not found"
            )
        
        # Remove internal MongoDB ID
        document.pop("_id", None)
        
        # Get content if requested
        if include_content:
            if document.get("content_id"):
                # Get content from separate collection
                content_collection = DocumentStorageService._get_content_collection(client_id)
                content_doc = content_collection.find_one({"id": document["content_id"]})
                
                if content_doc:
                    document["content"] = content_doc["content"]
            elif "content" in document.get("metadata", {}):
                # Content is stored in metadata
                document["content"] = base64.b64decode(document["metadata"]["content"])
                document["metadata"] = {k: v for k, v in document["metadata"].items() if k != "content"}
        
        return document
    
    @staticmethod
    def get_document_content(client_id: int, document_id: str) -> bytes:
        """
        Get document content as bytes
        
        Args:
            client_id: Client ID
            document_id: Document ID
            
        Returns:
            bytes: Document content
        """
        document = DocumentStorageService.get_document(client_id, document_id, include_content=True)
        
        if "content" not in document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Content for document with ID {document_id} not found"
            )
        
        return document["content"]
    
    @staticmethod
    def query_documents(client_id: int, query: StorageDocumentQuery) -> List[Dict[str, Any]]:
        """
        Query documents based on criteria
        
        Args:
            client_id: Client ID
            query: Query parameters
            
        Returns:
            List[Dict]: List of documents matching the query
        """
        # Build MongoDB query
        mongo_query = {}
        
        # Add hierarchy filters
        if query.client_id is not None:
            mongo_query["client_id"] = query.client_id
        if query.department_id is not None:
            mongo_query["department_id"] = query.department_id
        if query.subdepartment_id is not None:
            mongo_query["subdepartment_id"] = query.subdepartment_id
        if query.process_id is not None:
            mongo_query["process_id"] = query.process_id
        
        # Add other filters
        if query.document_type:
            mongo_query["document_type"] = query.document_type
        if query.file_format:
            mongo_query["file_format"] = query.file_format
        if query.uploaded_by:
            mongo_query["uploaded_by"] = query.uploaded_by
        
        # Date range filters
        date_query = {}
        if query.created_after:
            date_query["$gte"] = query.created_after
        if query.created_before:
            date_query["$lte"] = query.created_before
        if date_query:
            mongo_query["created_at"] = date_query
        
        # Tag filter
        if query.tags:
            mongo_query["tags"] = {"$all": query.tags}
        
        # Text search
        if query.search_text:
            mongo_query["$text"] = {"$search": query.search_text}
        
        # Execute query
        storage_collection = DocumentStorageService._get_storage_collection(client_id)
        
        # Create text index if it doesn't exist
        storage_collection.create_index([
            ("title", "text"),
            ("description", "text"),
            ("original_filename", "text")
        ])
        
        # Execute query with pagination
        cursor = storage_collection.find(mongo_query).skip(query.skip).limit(query.limit)
        
        # Process results
        results = []
        for doc in cursor:
            doc.pop("_id", None)
            # Remove content from metadata if present
            if "metadata" in doc and "content" in doc["metadata"]:
                doc["metadata"] = {k: v for k, v in doc["metadata"].items() if k != "content"}
            results.append(doc)
        
        return results
    
    @staticmethod
    def update_document(client_id: int, document_id: str, update_data: StorageDocumentUpdate) -> Dict[str, Any]:
        """
        Update document metadata
        
        Args:
            client_id: Client ID
            document_id: Document ID
            update_data: Data to update
            
        Returns:
            Dict: Updated document
        """
        # Get document metadata
        storage_collection = DocumentStorageService._get_storage_collection(client_id)
        document = storage_collection.find_one({"id": document_id})
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document with ID {document_id} not found"
            )
        
        # Build update query
        update_query = {"$set": {"updated_at": datetime.now()}}
        
        # Add fields to update
        if update_data.title is not None:
            update_query["$set"]["title"] = update_data.title
        if update_data.description is not None:
            update_query["$set"]["description"] = update_data.description
        if update_data.tags is not None:
            update_query["$set"]["tags"] = update_data.tags
        if update_data.metadata is not None:
            # Preserve content if it exists
            if "metadata" in document and "content" in document["metadata"]:
                content = document["metadata"]["content"]
                update_data.metadata["content"] = content
            update_query["$set"]["metadata"] = update_data.metadata
        
        # Update document
        storage_collection.update_one({"id": document_id}, update_query)
        
        # Return updated document
        return DocumentStorageService.get_document(client_id, document_id)
    
    @staticmethod
    def delete_document(client_id: int, document_id: str) -> bool:
        """
        Delete a document and its content
        
        Args:
            client_id: Client ID
            document_id: Document ID
            
        Returns:
            bool: True if document was deleted
        """
        # Get document metadata
        storage_collection = DocumentStorageService._get_storage_collection(client_id)
        document = storage_collection.find_one({"id": document_id})
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document with ID {document_id} not found"
            )
        
        # Delete content if stored separately
        if document.get("content_id"):
            content_collection = DocumentStorageService._get_content_collection(client_id)
            content_collection.delete_one({"id": document["content_id"]})
        
        # Delete document metadata
        storage_collection.delete_one({"id": document_id})
        
        return True
    
    @staticmethod
    def get_documents_by_hierarchy(
        client_id: int,
        department_id: Optional[int] = None,
        subdepartment_id: Optional[int] = None,
        process_id: Optional[int] = None,
        limit: int = 100,
        skip: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Get documents by hierarchy level
        
        Args:
            client_id: Client ID
            department_id: Optional Department ID
            subdepartment_id: Optional Subdepartment ID
            process_id: Optional Process ID
            limit: Maximum number of documents to return
            skip: Number of documents to skip
            
        Returns:
            List[Dict]: List of documents
        """
        query = StorageDocumentQuery(
            client_id=client_id,
            department_id=department_id,
            subdepartment_id=subdepartment_id,
            process_id=process_id,
            limit=limit,
            skip=skip
        )
        
        return DocumentStorageService.query_documents(client_id, query)


