#!/usr/bin/env python
"""
Redis Cache Demonstration Script
-------------------------------
This script demonstrates the Redis caching functionality for the /admin/users endpoint.
It makes multiple requests to the endpoint and shows the performance improvement with caching.
"""

import os
import sys
import time
import logging
import requests
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Add the project directory to the path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import Redis utilities for cache inspection
try:
    from app.utils.redis_utils import get_redis, cache_get, cache_delete
    from app.core.config import settings
except ImportError as e:
    logger.error(f"Import error: {e}")
    logger.error("Make sure you're running this script from the project root directory")
    sys.exit(1)

# API endpoint and authentication
API_URL = "http://localhost:8000"  # Change this to your actual API URL
ADMIN_USERNAME = "admin"  # Change to your admin username
ADMIN_PASSWORD = "password"  # Change to your admin password

def get_auth_token():
    """Get authentication token"""
    try:
        response = requests.post(
            f"{API_URL}/api/v1/login",
            data={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        response.raise_for_status()
        token_data = response.json()
        return token_data.get("access_token")
    except Exception as e:
        logger.error(f"Failed to get auth token: {e}")
        return None

def make_request(endpoint, token, params=None):
    """Make an authenticated request to the API"""
    headers = {"Authorization": f"Bearer {token}"}
    start_time = time.time()
    
    try:
        response = requests.get(f"{API_URL}{endpoint}", headers=headers, params=params)
        response.raise_for_status()
        
        elapsed_time = time.time() - start_time
        return response.json(), elapsed_time
    except Exception as e:
        logger.error(f"Request failed: {e}")
        return None, time.time() - start_time

def check_cache_status(key):
    """Check if a key exists in Redis cache"""
    redis_client = get_redis()
    if not redis_client:
        logger.warning("Redis client not available")
        return False
    
    return redis_client.exists(key) > 0

def main():
    """Main function"""
    logger.info("Starting Redis cache demonstration")
    
    # Get authentication token
    token = get_auth_token()
    if not token:
        logger.error("Failed to get authentication token")
        sys.exit(1)
    
    # Cache key for AD users
    cache_key = "ad_users_list"
    
    # Clear cache before demonstration
    logger.info("Clearing cache before demonstration")
    cache_delete(cache_key)
    
    # First request (cache miss)
    logger.info("Making first request (cache miss expected)...")
    data, elapsed_time = make_request("/admin/users", token)
    
    if not data:
        logger.error("First request failed")
        sys.exit(1)
    
    logger.info(f"First request completed in {elapsed_time:.2f} seconds")
    logger.info(f"Total users: {data.get('total_users', 0)}")
    
    # Check cache status
    cache_status = check_cache_status(cache_key)
    logger.info(f"Cache status after first request: {'Hit' if cache_status else 'Miss'}")
    
    # Second request (cache hit)
    logger.info("\nMaking second request (cache hit expected)...")
    data, elapsed_time = make_request("/admin/users", token)
    
    if not data:
        logger.error("Second request failed")
        sys.exit(1)
    
    logger.info(f"Second request completed in {elapsed_time:.2f} seconds")
    logger.info(f"Total users: {data.get('total_users', 0)}")
    
    # Check cache status
    cache_status = check_cache_status(cache_key)
    logger.info(f"Cache status after second request: {'Hit' if cache_status else 'Miss'}")
    
    # Force refresh (cache bypass)
    logger.info("\nMaking request with force_refresh=True (cache bypass)...")
    data, elapsed_time = make_request("/admin/users", token, params={"force_refresh": "true"})
    
    if not data:
        logger.error("Force refresh request failed")
        sys.exit(1)
    
    logger.info(f"Force refresh request completed in {elapsed_time:.2f} seconds")
    logger.info(f"Total users: {data.get('total_users', 0)}")
    
    # Invalidate cache using the API
    logger.info("\nInvalidating cache using API endpoint...")
    response, elapsed_time = make_request("/admin/users/invalidate-cache", token)
    
    if not response:
        logger.error("Cache invalidation request failed")
    else:
        logger.info(f"Cache invalidation response: {response}")
    
    # Final request after invalidation (cache miss)
    logger.info("\nMaking request after cache invalidation (cache miss expected)...")
    data, elapsed_time = make_request("/admin/users", token)
    
    if not data:
        logger.error("Final request failed")
        sys.exit(1)
    
    logger.info(f"Final request completed in {elapsed_time:.2f} seconds")
    logger.info(f"Total users: {data.get('total_users', 0)}")
    
    # Check cache status
    cache_status = check_cache_status(cache_key)
    logger.info(f"Cache status after final request: {'Hit' if cache_status else 'Miss'}")
    
    logger.info("\nCache demonstration completed")

if __name__ == "__main__":
    main()
