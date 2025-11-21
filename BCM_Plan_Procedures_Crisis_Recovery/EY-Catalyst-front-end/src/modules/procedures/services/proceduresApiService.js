
import { ensureValidToken, refreshToken } from '../../../services/authService';
import { logout } from '../../../services/authUtils';
import { API_URL } from '../../../config.js';

/**
 * Make an authenticated API request
 * @param {string} url - The API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise} - Promise with the response
 */
const checkAuthentication = () => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  return token;
};

const makeAuthenticatedRequest = async (url, options = {}) => {
  try {
    const token = checkAuthentication();
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      // Token might be expired, try to refresh
      try {
        await refreshToken();
        // Retry the request with new token
        const newToken = localStorage.getItem('access_token');
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${newToken}`
          }
        });
      } catch (refreshError) {
        // If refresh fails, throw original error
        throw new Error('Session expired. Please login again.');
      }
    }

    return response;
  } catch (error) {
    console.error('Request error:', error);
    throw error;
  }
};

/**
 * Handle API response with authentication error handling
 */
const handleResponse = async (response) => {
  if (response.status === 401) {
    // Try to refresh token
    try {
      await refreshToken();
      throw new Error('Token refreshed, please retry your request');
    } catch (refreshError) {
      // If refresh fails, logout user
      logout();
      throw new Error('Session expired. Please login again.');
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

/**
 * Generate complete procedure
 * @param {string} procedureType - Type of procedure (e.g., 'bia')
 * @param {Object} options - Generation options
 * @returns {Promise} - Promise with generated procedure
 */
export const generateCompleteProcedure = async (procedureType, options = {}) => {
  try {
    await ensureValidToken();
    
    const response = await makeAuthenticatedRequest(`${API_URL}/procedures/${procedureType}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(options)
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Generate complete procedure error:', error);
    throw error;
  }
};

/**
 * Analyze existing procedure
 * @param {string} procedureType - Type of procedure (e.g., 'bia')
 * @param {string} existingContent - Existing procedure content
 * @returns {Promise} - Promise with analysis results
 */
export const analyzeExistingProcedure = async (procedureType, existingContent) => {
  try {
    await ensureValidToken();
    
    const response = await makeAuthenticatedRequest(`${API_URL}/procedures/${procedureType}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        existing_content: existingContent
      })
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Analyze procedure error:', error);
    throw error;
  }
};

/**
 * Refine existing procedure with instructions
 * @param {string} procedureType - Type of procedure (e.g., 'bia')
 * @param {string} instructions - Refinement instructions
 * @param {string} currentContent - Current procedure content
 * @returns {Promise} - Promise with refined procedure
 */
export const refineProcedure = async (procedureType, instructions, currentContent) => {
  try {
    await ensureValidToken();
    
    const response = await makeAuthenticatedRequest(`${API_URL}/procedures/${procedureType}/refine`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instructions: instructions,
        current_content: currentContent
      })
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Refine procedure error:', error);
    throw error;
  }
};

/**
 * Regenerate procedure from scratch
 * @param {string} procedureType - Type of procedure (e.g., 'bia')
 * @returns {Promise} - Promise with regenerated procedure
 */
export const regenerateProcedure = async (procedureType) => {
  try {
    await ensureValidToken();
    
    const response = await makeAuthenticatedRequest(`${API_URL}/procedures/${procedureType}/regenerate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Regenerate procedure error:', error);
    throw error;
  }
};

/**
 * Load procedure document
 * @param {string} procedureType - Type of procedure (e.g., 'bia')
 * @param {number} organizationId - Organization ID
 * @returns {Promise} - Promise with procedure document
 */
export const loadProcedureDocument = async (procedureType, organizationId) => {
  try {
    await ensureValidToken();
    
    const response = await makeAuthenticatedRequest(
      `${API_URL}/procedures/${procedureType}/document?organization_id=${organizationId}`
    );

    return await handleResponse(response);
  } catch (error) {
    console.error('Load procedure document error:', error);
    throw error;
  }
};

/**
 * Save procedure document
 * @param {string} procedureType - Type of procedure (e.g., 'bia')
 * @param {number} organizationId - Organization ID
 * @param {Object} documentData - Document data to save
 * @returns {Promise} - Promise with saved document
 */
export const saveProcedureDocument = async (procedureType, organizationId, documentData) => {
  try {
    await ensureValidToken();
    
    const response = await makeAuthenticatedRequest(
      `${API_URL}/procedures/${procedureType}/document?organization_id=${organizationId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(documentData)
      }
    );

    return await handleResponse(response);
  } catch (error) {
    console.error('Save procedure document error:', error);
    throw error;
  }
};

/**
 * Get all procedures
 * @returns {Promise} - Promise with procedures data
 */
export const getProcedures = async () => {
  try {
    await ensureValidToken();
    
    const response = await makeAuthenticatedRequest(`${API_URL}/procedures`);
    return await handleResponse(response);
  } catch (error) {
    console.error('Get procedures error:', error);
    throw error;
  }
};

/**
 * Get procedure by ID
 * @param {number} procedureId - Procedure ID
 * @returns {Promise} - Promise with procedure data
 */
export const getProcedureById = async (procedureId) => {
  try {
    await ensureValidToken();
    
    const response = await makeAuthenticatedRequest(`${API_URL}/procedures/${procedureId}`);
    return await handleResponse(response);
  } catch (error) {
    console.error('Get procedure by ID error:', error);
    throw error;
  }
};

/**
 * Create new procedure
 * @param {Object} procedureData - Procedure data
 * @returns {Promise} - Promise with created procedure data
 */
export const createProcedure = async (procedureData) => {
  try {
    await ensureValidToken();
    
    const response = await makeAuthenticatedRequest(`${API_URL}/procedures`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(procedureData)
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Create procedure error:', error);
    throw error;
  }
};

/**
 * Update procedure
 * @param {number} procedureId - Procedure ID
 * @param {Object} procedureData - Updated procedure data
 * @returns {Promise} - Promise with updated procedure data
 */
export const updateProcedure = async (procedureId, procedureData) => {
  try {
    await ensureValidToken();
    
    const response = await makeAuthenticatedRequest(`${API_URL}/procedures/${procedureId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(procedureData)
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Update procedure error:', error);
    throw error;
  }
};

/**
 * Delete procedure
 * @param {number} procedureId - Procedure ID
 * @returns {Promise} - Promise with deletion confirmation
 */
export const deleteProcedure = async (procedureId) => {
  try {
    await ensureValidToken();
    
    const response = await makeAuthenticatedRequest(`${API_URL}/procedures/${procedureId}`, {
      method: 'DELETE'
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Delete procedure error:', error);
    throw error;
  }
};

/**
 * Search procedures
 * @param {string} query - Search query
 * @returns {Promise} - Promise with search results
 */
export const searchProcedures = async (query) => {
  try {
    await ensureValidToken();
    
    const response = await makeAuthenticatedRequest(`${API_URL}/procedures/search?q=${encodeURIComponent(query)}`);
    return await handleResponse(response);
  } catch (error) {
    console.error('Search procedures error:', error);
    throw error;
  }
};

/**
 * Get procedure templates
 * @returns {Promise} - Promise with templates data
 */
export const getProcedureTemplates = async () => {
  try {
    await ensureValidToken();
    
    const response = await makeAuthenticatedRequest(`${API_URL}/procedures/templates`);
    return await handleResponse(response);
  } catch (error) {
    console.error('Get procedure templates error:', error);
    throw error;
  }
};

/**
 * Validate procedure
 * @param {Object} procedureData - Procedure data to validate
 * @returns {Promise} - Promise with validation results
 */
export const validateProcedure = async (procedureData) => {
  try {
    await ensureValidToken();
    
    const response = await makeAuthenticatedRequest(`${API_URL}/procedures/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(procedureData)
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Validate procedure error:', error);
    throw error;
  }
};

export { checkAuthentication, makeAuthenticatedRequest, handleResponse, ensureValidToken, refreshToken, logout };
