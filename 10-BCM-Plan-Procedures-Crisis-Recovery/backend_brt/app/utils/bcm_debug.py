"""
BCM Debug Utility
Provides debugging tools and utilities for BCM modules
"""
import logging
import time
import functools
import json
import traceback
from typing import Dict, Any, Callable, Optional
import os

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if os.environ.get("BCM_DEBUG") == "1" else logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Create BCM logger
bcm_logger = logging.getLogger("bcm")

# Set debug mode based on environment variable
DEBUG_MODE = os.environ.get("BCM_DEBUG", "0") == "1"

def set_debug_mode(enabled: bool = True):
    """Enable or disable debug mode globally"""
    global DEBUG_MODE
    DEBUG_MODE = enabled
    level = logging.DEBUG if enabled else logging.INFO
    bcm_logger.setLevel(level)
    return DEBUG_MODE

def get_debug_mode() -> bool:
    """Get current debug mode status"""
    return DEBUG_MODE

def debug_log(message: str, data: Optional[Dict[str, Any]] = None):
    """Log debug message with optional data"""
    if DEBUG_MODE:
        if data:
            bcm_logger.debug(f"{message} | Data: {json.dumps(data, default=str)}")
        else:
            bcm_logger.debug(message)

def error_log(message: str, error: Optional[Exception] = None):
    """Log error message with optional exception details"""
    if error:
        error_details = {
            "error_type": type(error).__name__,
            "error_message": str(error),
            "traceback": traceback.format_exc()
        }
        bcm_logger.error(f"{message} | Error: {json.dumps(error_details, default=str)}")
    else:
        bcm_logger.error(message)

def performance_timer(func):
    """Decorator to measure and log function execution time"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        if not DEBUG_MODE:
            return func(*args, **kwargs)
        
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        
        execution_time = end_time - start_time
        bcm_logger.debug(f"Performance: {func.__name__} executed in {execution_time:.4f} seconds")
        
        return result
    return wrapper

def async_performance_timer(func):
    """Decorator to measure and log async function execution time"""
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        if not DEBUG_MODE:
            return await func(*args, **kwargs)
        
        start_time = time.time()
        result = await func(*args, **kwargs)
        end_time = time.time()
        
        execution_time = end_time - start_time
        bcm_logger.debug(f"Performance: {func.__name__} executed in {execution_time:.4f} seconds")
        
        return result
    return wrapper

class DebugContext:
    """Context manager for debugging code blocks"""
    def __init__(self, context_name: str):
        self.context_name = context_name
        self.start_time = None
    
    def __enter__(self):
        if DEBUG_MODE:
            self.start_time = time.time()
            bcm_logger.debug(f"Starting: {self.context_name}")
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if DEBUG_MODE:
            if exc_type:
                error_log(f"Error in {self.context_name}", exc_val)
            else:
                execution_time = time.time() - self.start_time
                bcm_logger.debug(f"Completed: {self.context_name} in {execution_time:.4f} seconds")
        return False  # Don't suppress exceptions

class AsyncDebugContext:
    """Async context manager for debugging code blocks"""
    def __init__(self, context_name: str):
        self.context_name = context_name
        self.start_time = None
    
    async def __aenter__(self):
        if DEBUG_MODE:
            self.start_time = time.time()
            bcm_logger.debug(f"Starting: {self.context_name}")
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if DEBUG_MODE:
            if exc_type:
                error_log(f"Error in {self.context_name}", exc_val)
            else:
                execution_time = time.time() - self.start_time
                bcm_logger.debug(f"Completed: {self.context_name} in {execution_time:.4f} seconds")
        return False  # Don't suppress exceptions

def log_api_call(endpoint: str, method: str, params: Optional[Dict[str, Any]] = None):
    """Log API call details"""
    if DEBUG_MODE:
        log_data = {
            "endpoint": endpoint,
            "method": method
        }
        if params:
            log_data["params"] = params
        bcm_logger.debug(f"API Call: {json.dumps(log_data, default=str)}")

def log_api_response(endpoint: str, status_code: int, response_time: float, response_data: Optional[Any] = None):
    """Log API response details"""
    if DEBUG_MODE:
        log_data = {
            "endpoint": endpoint,
            "status_code": status_code,
            "response_time_ms": response_time * 1000
        }
        if response_data and isinstance(response_data, dict):
            # Truncate response data to avoid huge logs
            truncated_data = {k: str(v)[:100] + "..." if isinstance(v, str) and len(str(v)) > 100 else v 
                             for k, v in response_data.items()}
            log_data["response_data"] = truncated_data
        bcm_logger.debug(f"API Response: {json.dumps(log_data, default=str)}")