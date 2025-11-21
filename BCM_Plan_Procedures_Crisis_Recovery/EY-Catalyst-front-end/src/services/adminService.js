/**
 * Admin service for managing organizations, departments, and subdepartments
 */

import { decodeToken } from './authService';

// API base URL - should be configured based on environment
const API_URL = 'http://localhost:8000';

/**
 * Get all clients/organizations
 * @returns {Promise} - Promise with clients data
 */
export const getClients = async () => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_URL}/rbac/clients`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch clients');
    }

    return await response.json();
  } catch (error) {
    console.error('Get clients error:', error);
    throw error;
  }
};

/**
 * Create a new client/organization
 * @param {Object} clientData - Client data
 * @returns {Promise} - Promise with created client data
 */
export const createClient = async (clientData) => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_URL}/rbac/clients`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(clientData)
    });

    if (!response.ok) {
      throw new Error('Failed to create client');
    }

    return await response.json();
  } catch (error) {
    console.error('Create client error:', error);
    throw error;
  }
};

/**
 * Get departments for a client
 * @param {number} clientId - Client ID
 * @returns {Promise} - Promise with departments data
 */
export const getDepartments = async (clientId) => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_URL}/rbac/clients/${clientId}/departments`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch departments');
    }

    return await response.json();
  } catch (error) {
    console.error('Get departments error:', error);
    throw error;
  }
};

/**
 * Create a new department
 * @param {number} clientId - Client ID
 * @param {Object} departmentData - Department data
 * @returns {Promise} - Promise with created department data
 */
export const createDepartment = async (clientId, departmentData) => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_URL}/rbac/clients/${clientId}/departments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(departmentData)
    });

    if (!response.ok) {
      throw new Error('Failed to create department');
    }

    return await response.json();
  } catch (error) {
    console.error('Create department error:', error);
    throw error;
  }
};

/**
 * Get subdepartments for a department
 * @param {number} departmentId - Department ID
 * @returns {Promise} - Promise with subdepartments data
 */
export const getSubdepartments = async (departmentId) => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_URL}/rbac/departments/${departmentId}/subdepartments`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch subdepartments');
    }

    return await response.json();
  } catch (error) {
    console.error('Get subdepartments error:', error);
    throw error;
  }
};

/**
 * Create a new subdepartment
 * @param {number} departmentId - Department ID
 * @param {Object} subdepartmentData - Subdepartment data
 * @returns {Promise} - Promise with created subdepartment data
 */
export const createSubdepartment = async (departmentId, subdepartmentData) => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_URL}/rbac/departments/${departmentId}/subdepartments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subdepartmentData)
    });

    if (!response.ok) {
      throw new Error('Failed to create subdepartment');
    }

    return await response.json();
  } catch (error) {
    console.error('Create subdepartment error:', error);
    throw error;
  }
};

/**
 * Get all users
 * @returns {Promise} - Promise with users data
 */
export const getUsers = async () => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_URL}/rbac/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    return await response.json();
  } catch (error) {
    console.error('Get users error:', error);
    throw error;
  }
};

/**
 * Assign role to user
 * @param {number} userId - User ID
 * @param {number} roleId - Role ID
 * @param {number} validDays - Valid days for role
 * @returns {Promise} - Promise with role assignment data
 */
export const assignRole = async (userId, roleId, validDays = 365) => {
  try {
    const token = localStorage.getItem('access_token');
    const decodedToken = decodeToken();
    
    if (!token || !decodedToken) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_URL}/rbac/roles/assign/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        role_id: roleId,
        assigned_by: decodedToken.user_id,
        valid_days: validDays
      })
    });

    if (!response.ok) {
      throw new Error('Failed to assign role');
    }

    return await response.json();
  } catch (error) {
    console.error('Assign role error:', error);
    throw error;
  }
};
