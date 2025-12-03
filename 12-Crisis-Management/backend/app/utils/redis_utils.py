import json
import logging
from typing import Any, Dict, List, Optional, TypeVar, Generic, Type
from datetime import datetime, timedelta, timezone
import redis
from pydantic import BaseModel

from app.core.config import settings

# Configure logging
logger = logging.getLogger(__name__)

# Type variable for generic caching
T = TypeVar('T', bound=BaseModel)

# Redis connection string from environment variable or use the provided one
# Use rediss:// protocol for SSL connection
REDIS_URL = getattr(settings, "REDIS_URL", "redis://default:AUaLAAIncDEwOGYzYTZjY2FjMDg0MDgyYTA2OTQyYmJlOWY0YTVhMHAxMTgwNTk@sweeping-duckling-18059.upstash.io:6379")
# Redis connection string from environment variable or use the provided one
REDIS_SSL = getattr(settings, "REDIS_SSL", True)

# Cache TTL in seconds (default: 5 minutes)
DEFAULT_CACHE_TTL = getattr(settings, "CACHE_TTL", 300)

# Custom JSON encoder to handle datetime objects
class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

class RedisClient:
    _instance = None
    _connection_error = False
    
    @classmethod
    def get_instance(cls) -> Optional[redis.Redis]:
        """Get or create a Redis client instance (singleton pattern)"""
        # If we've already tried and failed to connect, don't keep trying
        if cls._connection_error:
            return None
            
        if cls._instance is None:
            try:
                # For Upstash Redis, convert to SSL URL if needed
                connection_url = REDIS_URL
                if REDIS_URL.startswith('redis://') and REDIS_SSL:
                    # Convert redis:// to rediss:// for SSL
                    connection_url = REDIS_URL.replace('redis://', 'rediss://', 1)
                
                cls._instance = redis.from_url(
                    url=connection_url,
                    decode_responses=True,
                    socket_connect_timeout=10,
                    socket_timeout=10
                )
                
                # Test connection
                cls._instance.ping()
                logger.info("Successfully connected to Redis")
            except Exception as e:
                logger.error(f"Failed to connect to Redis: {str(e)}")
                cls._instance = None
                cls._connection_error = True
                # Don't raise the exception, just return None
                
        return cls._instance

def get_redis() -> Optional[redis.Redis]:
    """Get Redis client instance"""
    return RedisClient.get_instance()

def cache_set(key: str, value: Any, ttl: int = DEFAULT_CACHE_TTL) -> bool:
    """
    Set a value in Redis cache
    
    Args:
        key: Cache key
        value: Value to cache (will be JSON serialized)
        ttl: Time to live in seconds
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        redis_client = get_redis()
        if not redis_client:
            logger.warning("Redis client not available, skipping cache set")
            return False
            
        serialized = json.dumps(value, cls=DateTimeEncoder)
        redis_client.set(key, serialized, ex=ttl)
        logger.debug(f"Cached data with key: {key}, TTL: {ttl}s")
        return True
    except Exception as e:
        logger.error(f"Error caching data: {str(e)}")
        return False

def cache_get(key: str) -> Optional[Any]:
    """
    Get a value from Redis cache
    
    Args:
        key: Cache key
        
    Returns:
        Cached value or None if not found
    """
    try:
        redis_client = get_redis()
        if not redis_client:
            logger.warning("Redis client not available, skipping cache get")
            return None
            
        data = redis_client.get(key)
        
        if data:
            logger.debug(f"Cache hit for key: {key}")
            return json.loads(data)
        
        logger.debug(f"Cache miss for key: {key}")
        return None
    except Exception as e:
        logger.error(f"Error retrieving cached data: {str(e)}")
        return None

def cache_delete(key: str) -> bool:
    """
    Delete a value from Redis cache
    
    Args:
        key: Cache key
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        redis_client = get_redis()
        if not redis_client:
            logger.warning("Redis client not available, skipping cache delete")
            return False
            
        redis_client.delete(key)
        logger.debug(f"Deleted cache key: {key}")
        return True
    except Exception as e:
        logger.error(f"Error deleting cached data: {str(e)}")
        return False

def cache_model_list(key: str, model_class: Type[T], data: List[Dict]) -> List[T]:
    """
    Cache and return a list of Pydantic models
    
    Args:
        key: Cache key
        model_class: Pydantic model class
        data: List of dictionaries to convert to models
        
    Returns:
        List of Pydantic models
    """
    try:
        # Cache the raw data
        cache_set(key, data)
        
        # Convert to Pydantic models
        return [model_class(**item) for item in data]
    except Exception as e:
        logger.error(f"Error caching model list: {str(e)}")
        return [model_class(**item) for item in data]  # Return models without caching

def reset_connection_error():
    """Reset the connection error flag to allow reconnection attempts"""
    RedisClient._connection_error = False
    RedisClient._instance = None
    logger.info("Redis connection error flag reset, will attempt reconnection on next request")

# BIA-Specific Cache Functions

def get_bia_cached_data(key_pattern: str, org_id: str, default_data: Any = None, ttl: int = None) -> Optional[Any]:
    """
    Get BIA-specific cached data with versioning support.

    Args:
        key_pattern: Cache key pattern (e.g., "bia:impact-matrix" or "bia:business-function:{id}")
        org_id: Organization identifier
        default_data: Default data to return if cache miss
        ttl: Optional custom TTL, defaults to DEFAULT_CACHE_TTL

    Returns:
        Cached data with metadata, or None/default_data if not found
    """
    # Always set 30min TTL for BIA data
    if ttl is None:
        ttl = 1800  # 1800 seconds = 30 minutes

    # Try versioned keys first, then fallback to unversioned
    base_key = f"bia:{org_id}:{key_pattern}"

    # Try latest version first (assume v1 for now - can be enhanced)
    versioned_key = f"{base_key}:v1"

    cached_data = cache_get(versioned_key)
    if cached_data:
        logger.debug(f"BIA cache hit for key: {versioned_key}")
        return cached_data

    # Try unversioned key as fallback
    cached_data = cache_get(base_key)
    if cached_data:
        logger.debug(f"BIA cache hit for unversioned key: {base_key}")
        # Migrate to versioned key
        cache_set(versioned_key, cached_data, ttl)
        return cached_data

    logger.debug(f"BIA cache miss for org {org_id}, key pattern: {key_pattern}")
    return default_data

def set_bia_cached_data(key_pattern: str, data: Any, org_id: str, version: int = 1, ttl: int = None) -> bool:
    """
    Set BIA-specific cached data with versioning and metadata.

    Args:
        key_pattern: Cache key pattern
        data: Data to cache
        org_id: Organization identifier
        version: Version number (default: 1)
        ttl: Optional custom TTL, defaults to 30 minutes

    Returns:
        bool: True if successful, False otherwise
    """
    # Always set 30min TTL for BIA data
    if ttl is None:
        ttl = 1800  # 1800 seconds = 30 minutes

    versioned_key = f"bia:{org_id}:{key_pattern}:v{version}"

    # Add metadata to cached data
    cached_payload = {
        "data": data,
        "metadata": {
            "org_id": org_id,
            "version": version,
            "cached_at": datetime.utcnow().isoformat(),
            "source": "cache"
        }
    }

    success = cache_set(versioned_key, cached_payload, ttl)
    if success:
        logger.debug(f"BIA data cached with key: {versioned_key}, TTL: {ttl}s")
    return success

def invalidate_bia_cache(pattern: str, affected_org_ids: List[str]) -> int:
    """
    Invalidate BIA cache keys matching a pattern for specific organizations.

    Args:
        pattern: Key pattern to match (e.g., "impact-matrix:*")
        affected_org_ids: List of organization IDs to invalidate

    Returns:
        int: Number of keys deleted
    """
    redis_client = get_redis()
    if not redis_client:
        logger.warning("Redis client not available for BIA cache invalidation")
        return 0

    total_deleted = 0

    for org_id in affected_org_ids:
        try:
            # Use SCAN to find keys matching the pattern for this org
            cursor = 0
            base_pattern = f"bia:{org_id}:{pattern}"

            while True:
                cursor, keys = redis_client.scan(cursor, match=f"{base_pattern}*", count=100)
                if keys:
                    deleted = redis_client.delete(*keys)
                    total_deleted += deleted
                    logger.debug(f"Invalidated {deleted} cache keys for pattern: {base_pattern}")

                if cursor == 0:
                    break

        except Exception as e:
            logger.error(f"Error invalidating BIA cache for org {org_id}: {str(e)}")
            continue

    logger.info(f"Total BIA cache keys invalidated: {total_deleted} for pattern: {pattern}")
    return total_deleted

def get_bia_cache_keys(org_id: str, pattern: str = "*") -> List[str]:
    """
    List all BIA cache keys for an organization.

    Args:
        org_id: Organization identifier
        pattern: Optional pattern filter

    Returns:
        List of cache keys
    """
    redis_client = get_redis()
    if not redis_client:
        return []

    keys = []
    cursor = 0
    search_pattern = f"bia:{org_id}:{pattern}"

    try:
        while True:
            cursor, batch_keys = redis_client.scan(cursor, match=f"{search_pattern}*", count=100)
            keys.extend(batch_keys)

            if cursor == 0:
                break

        return keys

    except Exception as e:
        logger.error(f"Error retrieving BIA cache keys for org {org_id}: {str(e)}")
        return []
