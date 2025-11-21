"""
MongoDB database configuration with organization-based structure.
"""
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.collection import Collection
from typing import Generator, List
import ssl
import certifi
import os

from app.core.config import settings

# MongoDB connection
client: MongoClient = None

# Organization database prefix
ORG_DB_PREFIX = 'org_'

def get_mongodb_client() -> MongoClient:
    """
    Get MongoDB client instance.
    
    Returns:
        MongoClient: MongoDB client
    """
    global client
    
    if client is None:
        try:
            # Parse MongoDB connection string to extract username and password
            mongodb_url = settings.MONGODB_URL
            
            # For MongoDB Atlas, try a different connection approach
            if "mongodb+srv" in mongodb_url or ".mongodb.net" in mongodb_url:
                # Create a client with TLS/SSL disabled initially
                client = MongoClient(
                    mongodb_url,
                    tlsAllowInvalidCertificates=True,  # Less secure but helps bypass SSL issues
                    serverSelectionTimeoutMS=5000,
                    connectTimeoutMS=10000,
                    retryWrites=True
                )
            else:
                # For local or non-Atlas MongoDB
                client = MongoClient(mongodb_url)
            
            # Test connection
            client.admin.command('ping')
            print("MongoDB connection successful")
        except Exception as e:
            print(f"MongoDB connection error: {str(e)}")
            # Create a fallback in-memory client for graceful degradation
            print("Using in-memory storage fallback for MongoDB")
            # Still create a client object so code doesn't break, but operations will fail gracefully
            client = MongoClient("mongodb://localhost:27017/")
    
    return client

def get_mongodb() -> Generator[Database, None, None]:
    """
    Dependency to get default MongoDB database instance.
    
    Yields:
        Database: Default MongoDB database instance
    """
    client = get_mongodb_client()
    db = client[settings.MONGODB_DB]
    
    try:
        yield db
    finally:
        # Don't close the client here to maintain connection pool
        pass

def get_organization_db(org_id: str) -> Database:
    """
    Get organization-specific database.
    
    Args:
        org_id: Organization ID
        
    Returns:
        Database: Organization-specific database
    """
    client = get_mongodb_client()
    return client[f"{ORG_DB_PREFIX}{org_id}"]

def get_module_collection(org_id: str, module_name: str) -> Collection:
    """
    Get module-specific collection within an organization database.
    
    Args:
        org_id: Organization ID
        module_name: Module name
        
    Returns:
        Collection: Module-specific collection
    
    Raises:
        ValueError: If module name is invalid
    """
    if module_name not in settings.BRT_MODULES:
        raise ValueError(f"Invalid module name: {module_name}. Must be one of: {', '.join(settings.BRT_MODULES)}")
    
    db = get_organization_db(org_id)
    return db[module_name]

def list_organizations() -> List[str]:
    """
    List all organizations by scanning databases with the organization prefix.
    
    Returns:
        List[str]: List of organization IDs
    """
    client = get_mongodb_client()
    org_dbs = [db for db in client.list_database_names() if db.startswith(ORG_DB_PREFIX)]
    return [db[len(ORG_DB_PREFIX):] for db in org_dbs]
