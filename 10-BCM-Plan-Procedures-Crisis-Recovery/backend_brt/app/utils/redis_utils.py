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

# Redis connection string from environment variables
REDIS_URL = getattr(settings, "REDIS_URL", None)
# Whether to use SSL for Redis
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
                if not REDIS_URL:
                    logger.info("Redis URL not configured; caching disabled")
                    cls._connection_error = True
                    return None
                # Convert to SSL URL if needed
                connection_url = REDIS_URL
                if REDIS_URL.startswith('redis://') and REDIS_SSL:
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
