"""
Supabase Migration Utilities
Helper functions for converting SQLAlchemy operations to Supabase operations.
"""
import json
from typing import Any, Dict, List, Optional, Union
from uuid import UUID
from datetime import datetime

from app.core.supabase_client import supabase


def convert_uuid_to_string(uuid_value: Union[UUID, str, None]) -> Optional[str]:
    """Convert UUID to string for Supabase operations."""
    if isinstance(uuid_value, UUID):
        return str(uuid_value)
    return uuid_value


def convert_datetime_to_iso(datetime_value: Union[datetime, str, None]) -> Optional[str]:
    """Convert datetime to ISO string for Supabase operations."""
    if isinstance(datetime_value, datetime):
        return datetime_value.isoformat()
    return datetime_value


def handle_json_field(json_value: Union[str, dict, list, None]) -> Optional[str]:
    """Ensure JSON fields are properly serialized for Supabase."""
    if json_value is None:
        return None
    if isinstance(json_value, (dict, list)):
        return json.dumps(json_value)
    if isinstance(json_value, str):
        # Try to validate it's valid JSON
        try:
            json.loads(json_value)
            return json_value
        except (json.JSONDecodeError, TypeError):
            return json.dumps(json_value)
    return str(json_value)


def supabase_select(
    table: str,
    columns: str = "*",
    filters: Optional[Dict[str, Any]] = None,
    order_by: Optional[str] = None,
    limit: Optional[int] = None,
    single: bool = False
) -> Union[Dict[str, Any], List[Dict[str, Any]], None]:
    """
    Perform a SELECT operation on Supabase table.

    Args:
        table: Table name
        columns: Columns to select (default: "*")
        filters: Dictionary of filters to apply
        order_by: Column to order by
        limit: Maximum number of records to return
        single: Return single record instead of list

    Returns:
        Query result or None if not found
    """
    if supabase is None:
        print(f"Supabase client not initialized, cannot perform SELECT on table {table}")
        return None if single else []

    try:
        query = supabase.table(table).select(columns)

        # Apply filters
        if filters:
            for key, value in filters.items():
                if value is not None:
                    query = query.eq(key, value)

        # Apply ordering
        if order_by:
            query = query.order(order_by)

        # Apply limit
        if limit:
            query = query.limit(limit)

        # Execute query
        if single:
            result = query.single().execute()
            return result.data if result.data else None
        else:
            result = query.execute()
            return result.data if result.data else []

    except Exception as e:
        print(f"Supabase SELECT error on table {table}: {str(e)}")
        return None if single else []


def supabase_insert(
    table: str,
    data: Union[Dict[str, Any], List[Dict[str, Any]]],
    returning: str = "*"
) -> Union[Dict[str, Any], List[Dict[str, Any]], None]:
    """
    Perform an INSERT operation on Supabase table.

    Args:
        table: Table name
        data: Data to insert (dict or list of dicts)
        returning: Columns to return

    Returns:
        Inserted record(s) or None on error
    """
    if supabase is None:
        print(f"Supabase client not initialized, cannot perform INSERT on table {table}")
        return None

    try:
        # Prepare data for Supabase
        if isinstance(data, dict):
            prepared_data = prepare_record_for_supabase(data)
        elif isinstance(data, list):
            prepared_data = [prepare_record_for_supabase(item) for item in data]
        else:
            raise ValueError("Data must be dict or list of dicts")

        query = supabase.table(table).insert(prepared_data, returning=returning)
        result = query.execute()

        return result.data if result.data else None

    except Exception as e:
        print(f"Supabase INSERT error on table {table}: {str(e)}")
        return None


def supabase_update(
    table: str,
    data: Dict[str, Any],
    filters: Dict[str, Any],
    returning: str = "*"
) -> Union[Dict[str, Any], List[Dict[str, Any]], None]:
    """
    Perform an UPDATE operation on Supabase table.

    Args:
        table: Table name
        data: Data to update
        filters: Filters to identify records to update
        returning: Columns to return

    Returns:
        Updated record(s) or None on error
    """
    if supabase is None:
        print(f"Supabase client not initialized, cannot perform UPDATE on table {table}")
        return None

    try:
        prepared_data = prepare_record_for_supabase(data)

        query = supabase.table(table).update(prepared_data, returning=returning)

        # Apply filters
        for key, value in filters.items():
            if value is not None:
                query = query.eq(key, value)

        result = query.execute()
        return result.data if result.data else None

    except Exception as e:
        print(f"Supabase UPDATE error on table {table}: {str(e)}")
        return None


def supabase_delete(
    table: str,
    filters: Dict[str, Any],
    returning: str = "*"
) -> Union[Dict[str, Any], List[Dict[str, Any]], None]:
    """
    Perform a DELETE operation on Supabase table.

    Args:
        table: Table name
        filters: Filters to identify records to delete
        returning: Columns to return

    Returns:
        Deleted record(s) or None on error
    """
    if supabase is None:
        print(f"Supabase client not initialized, cannot perform DELETE on table {table}")
        return None

    try:
        query = supabase.table(table).delete(returning=returning)

        # Apply filters
        for key, value in filters.items():
            if value is not None:
                query = query.eq(key, value)

        result = query.execute()
        return result.data if result.data else None

    except Exception as e:
        print(f"Supabase DELETE error on table {table}: {str(e)}")
        return None


def supabase_join_query(
    table: str,
    joins: List[Dict[str, Any]],
    columns: str = "*",
    filters: Optional[Dict[str, Any]] = None,
    order_by: Optional[str] = None,
    limit: Optional[int] = None
) -> List[Dict[str, Any]]:
    """
    Perform a JOIN query using Supabase RPC or multiple queries.

    Args:
        table: Main table name
        joins: List of join configurations
        columns: Columns to select
        filters: Filters to apply
        order_by: Column to order by
        limit: Maximum number of records

    Returns:
        Query results
    """
    if supabase is None:
        print(f"Supabase client not initialized, cannot perform JOIN query on table {table}")
        return []

    try:
        # For complex joins, we'll use Supabase's built-in RPC functions
        # or perform multiple queries and join in Python

        # This is a simplified implementation - in practice, you might need
        # custom RPC functions in Supabase for complex joins

        query = supabase.table(table).select(columns)

        # Apply filters
        if filters:
            for key, value in filters.items():
                if value is not None:
                    query = query.eq(key, value)

        # Apply ordering
        if order_by:
            query = query.order(order_by)

        # Apply limit
        if limit:
            query = query.limit(limit)

        result = query.execute()
        return result.data if result.data else []

    except Exception as e:
        print(f"Supabase JOIN query error on table {table}: {str(e)}")
        return []


def prepare_record_for_supabase(record: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepare a record for Supabase insertion/update by converting types.

    Args:
        record: Raw record data

    Returns:
        Prepared record data
    """
    prepared = {}

    for key, value in record.items():
        if isinstance(value, UUID):
            prepared[key] = str(value)
        elif isinstance(value, datetime):
            prepared[key] = value.isoformat()
        elif isinstance(value, (dict, list)):
            prepared[key] = json.dumps(value)
        elif hasattr(value, '__dict__'):  # SQLAlchemy model instance
            # Convert SQLAlchemy model to dict
            prepared[key] = str(value.id) if hasattr(value, 'id') else str(value)
        else:
            prepared[key] = value

    return prepared


def convert_supabase_result_to_dict(result: Any) -> Dict[str, Any]:
    """
    Convert Supabase result to dictionary format.

    Args:
        result: Supabase result object

    Returns:
        Dictionary representation
    """
    if hasattr(result, 'data') and result.data:
        return result.data
    elif isinstance(result, dict):
        return result
    else:
        return {}


def handle_supabase_error(operation: str, table: str, error: Exception) -> None:
    """
    Handle and log Supabase errors.

    Args:
        operation: Operation being performed (SELECT, INSERT, etc.)
        table: Table name
        error: Exception that occurred
    """
    print(f"Supabase {operation} error on table '{table}': {str(error)}")

    # You could add more sophisticated error handling here
    # such as retry logic, fallback to PostgreSQL, etc.


# Table name mappings (SQLAlchemy model names to Supabase table names)
TABLE_MAPPINGS = {
    'GlobalOrganization': 'global_organizations',
    'GlobalDepartment': 'global_departments',
    'GlobalSubdepartment': 'global_subdepartments',
    'GlobalProcess': 'global_processes',
    'BIAProcessInfo': 'bia_process_info',
    'ProcessImpactAnalysis': 'process_impact_analysis',
    'BIASnapshot': 'bia_snapshots',
    'BiaAuditLog': 'bia_audit_logs',
    'User': 'users',
    'Role': 'roles',
    'Permission': 'permissions',
    'ModuleRequest': 'module_requests',
    'UserPassword': 'user_passwords',
    'OrganizationActivityLog': 'organization_activity_logs',
}


def get_table_name(model_class: Any) -> str:
    """
    Get Supabase table name from SQLAlchemy model class.

    Args:
        model_class: SQLAlchemy model class

    Returns:
        Supabase table name
    """
    class_name = model_class.__name__ if hasattr(model_class, '__name__') else str(model_class)
    return TABLE_MAPPINGS.get(class_name, class_name.lower() + 's')
