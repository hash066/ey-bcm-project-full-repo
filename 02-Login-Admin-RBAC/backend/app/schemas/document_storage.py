from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field
from uuid import UUID, uuid4
from datetime import datetime
from enum import Enum
from app.schemas.document import DocumentType

class FileFormat(str, Enum):
    PDF = "pdf"
    EXCEL = "excel"
    WORD = "word"
    CSV = "csv"
    TEXT = "text"
    JSON = "json"
    OTHER = "other"

class StorageDocumentBase(BaseModel):
    """Base model for document storage"""
    title: str
    description: Optional[str] = None
    tags: Optional[List[str]] = []
    document_type: DocumentType
    file_format: FileFormat
    original_filename: str
    file_size: int
    content_type: str
    metadata: Dict[str, Any] = {}

class StorageDocumentCreate(StorageDocumentBase):
    """Model for creating a document in storage"""
    client_id: int
    department_id: int
    subdepartment_id: int
    process_id: int
    uploaded_by: int  # User ID
    file_content: Optional[bytes] = None
    file_path: Optional[str] = None  # Path to file if stored on disk

    class Config:
        arbitrary_types_allowed = True

class StorageDocumentDB(StorageDocumentBase):
    """Model for document as stored in MongoDB"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    client_id: int
    department_id: int
    subdepartment_id: int
    process_id: int
    uploaded_by: int  # User ID
    file_path: Optional[str] = None
    storage_location: str  # "mongodb", "filesystem", "s3", etc.
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: datetime = Field(default_factory=lambda: datetime.now())
    
    # MongoDB specific fields
    content_id: Optional[str] = None  # ID of the content document if stored separately

class StorageDocumentContent(BaseModel):
    """Model for document content stored in MongoDB"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    document_id: str
    content: Union[bytes, str]  # Binary content or text content
    created_at: datetime = Field(default_factory=lambda: datetime.now())

class StorageDocumentResponse(BaseModel):
    """Model for document response"""
    id: str
    title: str
    description: Optional[str]
    document_type: DocumentType
    file_format: FileFormat
    original_filename: str
    file_size: int
    content_type: str
    client_id: int
    department_id: int
    subdepartment_id: int
    process_id: int
    uploaded_by: int
    created_at: datetime
    updated_at: datetime
    tags: List[str]
    metadata: Dict[str, Any]

class StorageDocumentUpdate(BaseModel):
    """Model for updating document metadata"""
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None

class StorageDocumentQuery(BaseModel):
    """Model for querying documents"""
    client_id: Optional[int] = None
    department_id: Optional[int] = None
    subdepartment_id: Optional[int] = None
    process_id: Optional[int] = None
    document_type: Optional[DocumentType] = None
    file_format: Optional[FileFormat] = None
    uploaded_by: Optional[int] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    tags: Optional[List[str]] = None
    search_text: Optional[str] = None
    limit: int = 100
    skip: int = 0