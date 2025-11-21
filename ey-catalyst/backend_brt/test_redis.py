#!/usr/bin/env python
"""
Redis Connection Test Script
----------------------------
This script tests the connection to the Redis server and verifies basic caching functionality.
"""

import os
import sys
import logging
import json
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Add the project directory to the path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import our Redis utilities
try:
    from app.utils.redis_utils import get_redis, cache_set, cache_get, cache_delete, reset_connection_error
    from app.core.config import settings
except ImportError as e:
    logger.error(f"Import error: {e}")
    logger.error("Make sure you're running this script from the project root directory")
    sys.exit(1)

def test_redis_connection():
    """Test basic Redis connection"""
    logger.info("Testing Redis connection...")
    
    # Get Redis client
    redis_client = get_redis()
    
    if redis_client is None:
        logger.error("Failed to get Redis client")
        return False
    
    try:
        # Test ping
        response = redis_client.ping()
        logger.info(f"Redis ping response: {response}")
        
        # Get Redis info
        info = redis_client.info()
        logger.info(f"Redis version: {info.get('redis_version', 'unknown')}")
        logger.info(f"Connected clients: {info.get('connected_clients', 'unknown')}")
        
        return True
    except Exception as e:
        logger.error(f"Redis connection test failed: {e}")
        return False

def test_redis_caching():
    """Test Redis caching functionality"""
    logger.info("Testing Redis caching...")
    
    # Test key
    test_key = "test_key"
    
    # Test data with various types
    test_data = {
        "string": "Hello Redis",
        "number": 42,
        "float": 3.14,
        "boolean": True,
        "list": [1, 2, 3, 4, 5],
        "dict": {"name": "Redis Test", "purpose": "Testing"},
        "datetime": datetime.now().isoformat(),
        "null": None
    }
    
    # Delete the key if it exists
    cache_delete(test_key)
    
    # Set the test data
    logger.info(f"Setting test data: {test_data}")
    result = cache_set(test_key, test_data)
    
    if not result:
        logger.error("Failed to set test data")
        return False
    
    # Get the test data
    retrieved_data = cache_get(test_key)
    logger.info(f"Retrieved test data: {retrieved_data}")
    
    # Compare the data
    if retrieved_data != test_data:
        logger.error("Retrieved data does not match original data")
        logger.error(f"Original: {test_data}")
        logger.error(f"Retrieved: {retrieved_data}")
        return False
    
    # Delete the test data
    result = cache_delete(test_key)
    
    if not result:
        logger.error("Failed to delete test data")
        return False
    
    # Verify deletion
    retrieved_data = cache_get(test_key)
    
    if retrieved_data is not None:
        logger.error("Test data was not deleted")
        return False
    
    logger.info("Redis caching test passed")
    return True

def main():
    """Main function"""
    logger.info("Starting Redis connection test")
    logger.info(f"Redis URL: {settings.REDIS_URL}")
    
    # Test Redis connection
    if not test_redis_connection():
        logger.error("Redis connection test failed")
        sys.exit(1)
    
    # Test Redis caching
    if not test_redis_caching():
        logger.error("Redis caching test failed")
        sys.exit(1)
    
    logger.info("All Redis tests passed!")

if __name__ == "__main__":
    main()
