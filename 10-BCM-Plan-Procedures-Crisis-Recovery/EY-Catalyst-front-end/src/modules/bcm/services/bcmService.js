/**
 * BCM Service
 * Handles all BCM-related API calls including dashboard data, organization plans, and departmental plans
 */

import { API_BASE_URL } from '../../../config';

// Helper function to get authentication headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('brt_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

/**
 * Dashboard API calls
 */
export const getDashboardStats = async (organizationId) => {
  try {
    const url = organizationId 
      ? `${API_BASE_URL}/bcm/dashboard/stats?organization_id=${organizationId}`
      : `${API_BASE_URL}/bcm/dashboard/stats`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

export const getDepartments = async (organizationId) => {
  try {
    const url = organizationId 
      ? `${API_BASE_URL}/bcm/departments?organization_id=${organizationId}`
      : `${API_BASE_URL}/bcm/departments`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching departments:', error);
    throw error;
  }
};

export const getCriticalStaff = async (organizationId) => {
  try {
    const url = organizationId 
      ? `${API_BASE_URL}/bcm/critical-staff?organization_id=${organizationId}`
      : `${API_BASE_URL}/bcm/critical-staff`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching critical staff:', error);
    throw error;
  }
};

export const getRecoveryStrategiesStats = async (organizationId) => {
  try {
    const url = organizationId 
      ? `${API_BASE_URL}/bcm/recovery-strategies/stats?organization_id=${organizationId}`
      : `${API_BASE_URL}/bcm/recovery-strategies/stats`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching recovery strategies stats:', error);
    throw error;
  }
};

export const getAuditTrail = async (organizationId, limit = 10) => {
  try {
    const url = organizationId 
      ? `${API_BASE_URL}/bcm/audit-trail?organization_id=${organizationId}&limit=${limit}`
      : `${API_BASE_URL}/bcm/audit-trail?limit=${limit}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    throw error;
  }
};

export const getUpcomingReviews = async (organizationId) => {
  try {
    const url = organizationId 
      ? `${API_BASE_URL}/bcm/upcoming-reviews?organization_id=${organizationId}`
      : `${API_BASE_URL}/bcm/upcoming-reviews`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching upcoming reviews:', error);
    throw error;
  }
};

/**
 * BCM Plan API calls
 */
export const getOrganizationBCMPlan = async (organizationId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/bcm/organization-plan/${organizationId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching organization BCM plan:', error);
    throw error;
  }
};

// Alias for compatibility with OrganizationBCMPlan.jsx
export const getOrganizationPlan = getOrganizationBCMPlan;

export const getDepartmentalBCMPlan = async (departmentId, organizationId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/bcm/department-plan/${departmentId}?organization_id=${organizationId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching departmental BCM plan:', error);
    throw error;
  }
};

// Alias for compatibility with DepartmentalBCMPlan.jsx
export const getDepartmentalPlan = getDepartmentalBCMPlan;

/**
 * Update Organization BCM Plan
 */
export const updateOrganizationBCMPlan = async (organizationId, planData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/bcm/organization-plan/${organizationId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(planData)
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error updating organization BCM plan:', error);
    throw error;
  }
};

// Alias for compatibility
export const updateOrganizationPlan = updateOrganizationBCMPlan;

/**
 * Update Departmental BCM Plan
 */
export const updateDepartmentalBCMPlan = async (departmentId, organizationId, planData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/bcm/department-plan/${departmentId}?organization_id=${organizationId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(planData)
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error updating departmental BCM plan:', error);
    throw error;
  }
};

// Alias for compatibility
export const updateDepartmentalPlan = updateDepartmentalBCMPlan;

/**
 * PDF Generation - FIXED VERSION
 */
export const generateBCMPDF = async (organizationId, planType = 'organization', departmentId = null) => {
  try {
    const requestBody = {
      organization_id: organizationId,
      plan_type: planType
    };
    
    if (departmentId) {
      requestBody.department_id = departmentId;
    }
    
    const response = await fetch(`${API_BASE_URL}/bcm/generate-pdf`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    // Return blob for PDF download
    return await response.blob();
    
  } catch (error) {
    console.error('Error generating BCM PDF:', error);
    throw error;
  }
};

/**
 * Chat API
 */
export const sendChatMessage = async (messages, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/bcm/chat`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        messages: messages,
        options: options
      })
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};

/**
 * Test database connection
 */
export const testConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/bcm/test-connection`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error testing connection:', error);
    throw error;
  }
};

/**
 * Process API calls
 */
export const getProcesses = async (departmentId = null, subdepartmentId = null) => {
  try {
    let url = `${API_BASE_URL}/bcm/processes/`;
    const params = new URLSearchParams();
    
    if (departmentId) params.append('department_id', departmentId);
    if (subdepartmentId) params.append('subdepartment_id', subdepartmentId);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching processes:', error);
    throw error;
  }
};

export const getDepartmentProcesses = async (departmentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/bcm/departments/${departmentId}/processes`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching department processes:', error);
    throw error;
  }
};

// Default export with ALL methods
export default {
  // Dashboard
  getDashboardStats,
  getDepartments,
  getCriticalStaff,
  getRecoveryStrategiesStats,
  getAuditTrail,
  getUpcomingReviews,
  
  // BCM Plans (both naming conventions)
  getOrganizationBCMPlan,
  getOrganizationPlan,  // Alias
  getDepartmentalBCMPlan,
  getDepartmentalPlan,  // Alias
  updateOrganizationBCMPlan,
  updateOrganizationPlan,  // Alias
  updateDepartmentalBCMPlan,
  updateDepartmentalPlan,  // Alias
  
  // PDF Generation
  generateBCMPDF,
  
  // Chat
  sendChatMessage,
  
  // Utility
  testConnection,
  
  // Processes
  getProcesses,
  getDepartmentProcesses
};
