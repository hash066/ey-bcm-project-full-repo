/**
 * Admin Service
 * Handles API calls for the admin panel
 */

const API_URL = 'http://localhost:8000';

/**
 * Get the authorization header with JWT token
 * @returns {Object} Headers object with Authorization
 */
const getAuthHeader = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

/**
 * Get system statistics for the admin dashboard
 * @returns {Promise} Promise with system statistics
 */
export const getSystemStats = async () => {
  try {
    const response = await fetch(`${API_URL}/admin/stats`, {
      method: 'GET',
      headers: getAuthHeader()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch system statistics');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching system statistics:', error);
    throw error;
  }
};

/**
 * Get all organizations from users data
 * @returns {Promise} Promise with organizations data as an array
 */
export const getOrganizationsFromUsers = async () => {
  try {
    // Get all users
    const response = await getUsers();
    
    // Check if the response has the expected structure
    if (!response || !response.users || !Array.isArray(response.users)) {
      throw new Error('Users data is not in expected format');
    }
    
    const users = response.users;
    
    // Extract unique organization names
    const organizationMap = {};
    users.forEach(user => {
      if (user.organization && typeof user.organization === 'string' && user.organization.trim() !== '') {
        organizationMap[user.organization] = true;
      }
    });
    
    const uniqueOrganizationNames = Object.keys(organizationMap);
    
    // Create organization objects with available data
    const organizations = [];
    
    // For each unique organization name, try to get its ID
    for (const orgName of uniqueOrganizationNames) {
      try {
        // Try to get organization details including ID
        const orgDetails = await searchOrganizationByName(orgName);
        
        if (orgDetails && orgDetails.id) {
          organizations.push({
            id: orgDetails.id,
            name: orgName,
            description: orgDetails.description || '',
            industry: orgDetails.industry || '',
            size: orgDetails.size || '',
            location: orgDetails.location || ''
          });
        } else {
          // If we couldn't get the ID, still add the organization with just the name
          organizations.push({
            name: orgName,
            description: '',
            industry: '',
            size: '',
            location: ''
          });
        }
      } catch (error) {
        console.error(`Error fetching details for organization ${orgName}:`, error);
        // Still add the organization with just the name
        organizations.push({
          name: orgName,
          description: '',
          industry: '',
          size: '',
          location: ''
        });
      }
    }
    
    return organizations;
  } catch (error) {
    console.error('Error getting organizations from users:', error);
    throw error;
  }
};

/**
 * Get all organizations
 * @returns {Promise} Promise with organizations data as an array
 */
export const getOrganizations = async () => {
  try {
    // Use the new approach to get organizations from users data
    return await getOrganizationsFromUsers();
    
    /* Original implementation commented out
    const response = await fetch(`${API_URL}/organizations`, {
      method: 'GET',
      headers: getAuthHeader()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch organizations');
    }

    const data = await response.json();
    // Ensure we always return an array
    return Array.isArray(data) ? data : (data.organizations || []);
    */
  } catch (error) {
    console.error('Error fetching organizations:', error);
    throw error;
  }
};

/**
 * Get all departments
 * @returns {Promise} Promise with departments data
 */
export const getDepartments = async () => {
  try {
    const response = await fetch(`${API_URL}/departments`, {
      method: 'GET',
      headers: getAuthHeader()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch departments');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching departments:', error);
    throw error;
  }
};

/**
 * Get all users
 * @param {boolean} forceRefresh - Whether to bypass the cache and force a refresh
 * @returns {Promise} Promise with users data
 */
export const getUsers = async (forceRefresh = false) => {
  try {
    const url = new URL(`${API_URL}/admin/users`);
    if (forceRefresh) {
      url.searchParams.append('force_refresh', 'true');
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeader()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

/**
 * Invalidate the AD users cache to force a fresh fetch on next request
 * @returns {Promise} Promise with invalidation result
 */
export const invalidateUsersCache = async () => {
  try {
    console.log('Invalidating users cache...');
    const response = await fetch(`${API_URL}/admin/users/invalidate-cache`, {
      method: 'POST',
      headers: getAuthHeader()
    });

    if (!response.ok) {
      throw new Error('Failed to invalidate users cache');
    }

    const result = await response.json();
    console.log('Cache invalidation result:', result);
    return result;
  } catch (error) {
    console.error('Error invalidating users cache:', error);
    throw error;
  }
};

/**
 * Get all processes
 * @returns {Promise} Promise with processes data
 */
export const getProcesses = async () => {
  try {
    const response = await fetch(`${API_URL}/processes`, {
      method: 'GET',
      headers: getAuthHeader()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch processes');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching processes:', error);
    throw error;
  }
};

/**
 * Get all BIA reports
 * @returns {Promise} Promise with BIA reports data
 */
export const getBIAReports = async () => {
  try {
    const response = await fetch(`${API_URL}/bia-reports`, {
      method: 'GET',
      headers: getAuthHeader()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch BIA reports');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching BIA reports:', error);
    throw error;
  }
};

/**
 * Get recent system activity
 * @param {number} limit - Number of activities to fetch
 * @returns {Promise} Promise with recent activity data
 */
export const getRecentActivity = async (limit = 10) => {
  try {
    const response = await fetch(`${API_URL}/admin/activity?limit=${limit}`, {
      method: 'GET',
      headers: getAuthHeader()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch recent activity');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    throw error;
  }
};

/**
 * Get system settings
 * @returns {Promise} Promise with system settings data
 */
export const getSystemSettings = async () => {
  try {
    const response = await fetch(`${API_URL}/admin/settings`, {
      method: 'GET',
      headers: getAuthHeader()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch system settings');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching system settings:', error);
    throw error;
  }
};

/**
 * Update system settings
 * @param {Object} settings - Settings to update
 * @returns {Promise} Promise with updated settings
 */
export const updateSystemSettings = async (settings) => {
  try {
    const response = await fetch(`${API_URL}/admin/settings`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(settings)
    });

    if (!response.ok) {
      throw new Error('Failed to update system settings');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating system settings:', error);
    throw error;
  }
};

/**
 * Create a new organization
 * @param {Object} organization - Organization data
 * @returns {Promise} Promise with created organization
 */
export const createOrganization = async (organization) => {
  try {
    const response = await fetch(`${API_URL}/organizations`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(organization)
    });

    if (!response.ok) {
      throw new Error('Failed to create organization');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating organization:', error);
    throw error;
  }
};

/**
 * Create a new user
 * @param {Object} user - User data
 * @returns {Promise} Promise with created user
 */
export const createUser = async (user) => {
  try {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(user)
    });

    if (!response.ok) {
      throw new Error('Failed to create user');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Search for an organization by name
 * @param {string} name - Organization name to search for
 * @returns {Promise} Promise with organization data including ID
 */
export const searchOrganizationByName = async (name) => {
  try {
    console.log(`Searching for organization with name: ${name}`);
    const response = await fetch(`${API_URL}/organizations/search-by-name?name=${encodeURIComponent(name)}`, {
      method: 'GET',
      headers: getAuthHeader()
    });

    // Log the response status for debugging
    console.log(`Search response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to search for organization: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Search result:', data);
    
    // Handle array response - if data is an array, take the first item
    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }
    
    // If it's not an array or empty array, return the data as is
    return data;
  } catch (error) {
    console.error(`Error searching for organization "${name}":`, error);
    // Return a default object with null ID to prevent errors in calling code
    return { id: null, name: name };
  }
};

/**
 * Update an organization by ID
 * @param {string} id - Organization ID
 * @param {Object} organizationData - Updated organization data
 * @returns {Promise<Object>} - Updated organization
 */
export const updateOrganization = async (id, organizationData) => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${API_URL}/organizations/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(organizationData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update organization');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating organization:', error);
    throw error;
  }
};

/**
 * Get organization modules (licensed features)
 * @param {string} organizationId - Organization ID
 * @returns {Promise} Promise with organization modules data including module_id, is_licensed, start_date, and expiry_date
 */
export const getOrganizationModules = async (organizationId) => {
  try {
    const response = await fetch(`${API_URL}/organizations/${organizationId}/modules`, {
      method: 'GET',
      headers: getAuthHeader()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get organization modules: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error getting organization modules:`, error);
    throw error;
  }
};

/**
 * Update organization modules (licensed features)
 * @param {string} organizationId - Organization ID
 * @param {Array} modules - Array of module objects with module_id, is_licensed, optional start_date, and optional expiry_date
 * @returns {Promise} Promise with updated organization modules data
 */
export const updateOrganizationModules = async (organizationId, modules) => {
  try {
    // Ensure each module has the correct structure with start_date and expiry_date if provided
    const formattedModules = modules.map(module => ({
      module_id: module.module_id,
      is_licensed: module.is_licensed,
      ...(module.start_date && { start_date: module.start_date }),
      ...(module.expiry_date && { expiry_date: module.expiry_date })
    }));

    const response = await fetch(`${API_URL}/organizations/${organizationId}/modules`, {
      method: 'PUT',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ modules: formattedModules })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update organization modules: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating organization modules:`, error);
    throw error;
  }
};

/**
 * Update organization license expiry date
 * @param {string} organizationName - Organization name
 * @param {string} expiryDate - ISO date string for expiry
 * @returns {Promise} Promise with response data
 */
export const updateOrganizationLicenseExpiry = async (organizationName, expiryDate) => {
  try {
    const response = await fetch(`${API_URL}/admin/organizations/update-license-expiry`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        organization_name: organizationName,
        expiry_date: expiryDate
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update license expiry: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating license expiry for ${organizationName}:`, error);
    throw error;
  }
};

/**
 * Create a new organization with minimal information (name and description)
 * @param {string} name - Organization name
 * @param {Object} description - Organization description as structured JSON data
 * @returns {Promise} Promise with created organization
 */
export const createMinimalOrganization = async (name, description) => {
  try {
    const response = await fetch(`${API_URL}/organizations/create-minimal`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ name, description })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to create organization');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating minimal organization:', error);
    throw error;
  }
};

/**
 * Setup organization from HRMS data file
 * @param {File} file - CSV file with HRMS data
 * @param {string} defaultPassword - Default password for users
 * @returns {Promise} Promise with setup result
 */
export const setupOrganizationFromFile = async (file, defaultPassword) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('default_password', defaultPassword);

    const headers = getAuthHeader();
    // Remove Content-Type as FormData will set it with boundary
    delete headers['Content-Type'];

    const response = await fetch(`${API_URL}/admin/organizations/setup-from-file`, {
      method: 'POST',
      headers: {
        'Authorization': headers.Authorization
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to setup organization from file');
    }

    return await response.json();
  } catch (error) {
    console.error('Error setting up organization from file:', error);
    throw error;
  }
};

/**
 * Get organization description
 * @param {string} organizationId - Organization ID
 * @returns {Promise} Promise with organization description
 */
export const getOrganizationDescription = async (organizationId) => {
  try {
    const response = await fetch(`${API_URL}/organizations/${organizationId}/description`, {
      method: 'GET',
      headers: getAuthHeader()
    });

    if (!response.ok) {
      throw new Error('Failed to get organization description');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting organization description:', error);
    throw error;
  }
};

/**
 * Update organization description
 * @param {string} organizationId - Organization ID
 * @param {Object} description - Updated description as structured JSON
 * @returns {Promise} Promise with updated description
 */
export const updateOrganizationDescription = async (organizationId, description) => {
  try {
    const response = await fetch(`${API_URL}/organizations/${organizationId}/description`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(description)
    });

    if (!response.ok) {
      throw new Error('Failed to update organization description');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating organization description:', error);
    throw error;
  }
};

/**
 * Delete an organization by ID
 * @param {string} organizationId - Organization ID to delete
 * @returns {Promise} Promise with deletion result
 */
export const deleteOrganization = async (organizationId) => {
  try {
    const response = await fetch(`${API_URL}/organizations/${organizationId}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to delete organization');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting organization:', error);
    throw error;
  }
};

/**
 * Archive an organization by ID
 * @param {string} organizationId - Organization ID to archive
 * @returns {Promise} Promise with archive result
 */
export const archiveOrganization = async (organizationId) => {
  try {
    const response = await fetch(`${API_URL}/admin/organizations/${organizationId}/archive`, {
      method: 'POST',
      headers: getAuthHeader()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to archive organization');
    }

    return await response.json();
  } catch (error) {
    console.error('Error archiving organization:', error);
    throw error;
  }
};

/**
 * Get archived users
 * @param {boolean} forceRefresh - Whether to bypass the cache and force a refresh
 * @returns {Promise} Promise with archived users data
 */
export const getArchivedUsers = async (forceRefresh = false) => {
  try {
    const url = new URL(`${API_URL}/admin/users/archived`);
    if (forceRefresh) {
      url.searchParams.append('force_refresh', 'true');
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeader()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch archived users');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching archived users:', error);
    throw error;
  }
};

/**
 * Upload document to vector store using Hugging Face Space endpoint
 * @param {File} file - Document file (PDF, DOCX, or TXT)
 * @returns {Promise} Promise with upload result
 */
export const uploadDocumentToVectorStore = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('https://Prithivi-nanda-EY-catalyst.hf.space/upload-doc-to-vector/', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer your_huggingface_api_key_here'
        // Note: Content-Type is automatically set by the browser when using FormData
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload document: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading document to vector store:', error);
    throw error;
  }
};

/**
 * Upload multiple documents to vector store with sequential processing and cooldown
 * @param {File[]} files - Array of document files (PDF, DOCX, or TXT)
 * @param {Object} callbacks - Callback functions for progress tracking
 * @param {Function} callbacks.onProgress - Called with (currentIndex, totalFiles, currentFile)
 * @param {Function} callbacks.onFileComplete - Called with (file, result, index)
 * @param {Function} callbacks.onFileError - Called with (file, error, index)
 * @param {number} cooldownMs - Cooldown period between uploads in milliseconds (default: 2000)
 * @returns {Promise} Promise with upload results summary
 */
export const uploadMultipleDocuments = async (files, callbacks = {}, cooldownMs = 2000) => {
  const {
    onProgress = () => {},
    onFileComplete = () => {},
    onFileError = () => {}
  } = callbacks;

  const results = {
    total: files.length,
    successful: 0,
    failed: 0,
    successfulFiles: [],
    failedFiles: [],
    extractionFailures: []
  };

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Update progress
    onProgress(i, files.length, file);

    try {
      // Upload the current file
      const result = await uploadDocumentToVectorStore(file);
      
      // Mark as successful
      results.successful++;
      results.successfulFiles.push({
        file: file.name,
        result: result
      });
      
      // Notify completion
      onFileComplete(file, result, i);
      
    } catch (error) {
      console.error(`Error uploading ${file.name}:`, error);
      
      // Categorize the error
      if (error.message && error.message.includes("Failed to extract text")) {
        results.extractionFailures.push({
          file: file.name,
          error: error.message
        });
      } else {
        results.failedFiles.push({
          file: file.name,
          error: error.message
        });
      }
      
      results.failed++;
      
      // Notify error
      onFileError(file, error, i);
    }

    // Add cooldown delay between uploads (except for the last file)
    if (i < files.length - 1) {
      await new Promise(resolve => setTimeout(resolve, cooldownMs));
    }
  }

  // Final progress update
  onProgress(files.length, files.length, null);

  return results;
};

/**
 * Utility function to create a delay
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after the delay
 */
export const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Create a module request
 * @param {Object} requestData - Request data with module_id, module_name, request_reason
 * @returns {Promise} Promise with created request
 */
export const createModuleRequest = async (requestData) => {
  try {
    const response = await fetch(`${API_URL}/module-requests/`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to create module request');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating module request:', error);
    throw error;
  }
};

/**
 * Get user's own module requests
 * @returns {Promise} Promise with user's requests
 */
export const getMyModuleRequests = async () => {
  try {
    const response = await fetch(`${API_URL}/module-requests/my-requests`, {
      method: 'GET',
      headers: getAuthHeader()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch module requests');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching module requests:', error);
    throw error;
  }
};

/**
 * Get pending approvals for Client Head/Project Sponsor
 * @returns {Promise} Promise with pending requests
 */
export const getPendingApprovals = async () => {
  try {
    const response = await fetch(`${API_URL}/module-requests/pending-approvals`, {
      method: 'GET',
      headers: getAuthHeader()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch pending approvals');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    throw error;
  }
};

/**
 * Client Head approval for module request
 * @param {string} requestId - Request ID
 * @param {Object} approvalData - Approval data with action and comments
 * @returns {Promise} Promise with updated request
 */
export const clientHeadApproval = async (requestId, approvalData) => {
  try {
    const response = await fetch(`${API_URL}/module-requests/${requestId}/client-head-approval`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(approvalData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to process client head approval');
    }

    return await response.json();
  } catch (error) {
    console.error('Error processing client head approval:', error);
    throw error;
  }
};

/**
 * Project Sponsor approval for module request
 * @param {string} requestId - Request ID
 * @param {Object} approvalData - Approval data with action and comments
 * @returns {Promise} Promise with updated request
 */
export const projectSponsorApproval = async (requestId, approvalData) => {
  try {
    const response = await fetch(`${API_URL}/module-requests/${requestId}/project-sponsor-approval`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(approvalData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to process project sponsor approval');
    }

    return await response.json();
  } catch (error) {
    console.error('Error processing project sponsor approval:', error);
    throw error;
  }
};

/**
 * Get module request details
 * @param {string} requestId - Request ID
 * @returns {Promise} Promise with request details
 */
export const getModuleRequestDetails = async (requestId) => {
  try {
    const response = await fetch(`${API_URL}/module-requests/${requestId}`, {
      method: 'GET',
      headers: getAuthHeader()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch request details');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching request details:', error);
    throw error;
  }
};

/**
 * Get organization module requests (Client Head/Project Sponsor only)
 * @param {string} organizationId - Organization ID
 * @returns {Promise} Promise with organization requests
 */
export const getOrganizationModuleRequests = async (organizationId) => {
  try {
    const response = await fetch(`${API_URL}/module-requests/organization/${organizationId}`, {
      method: 'GET',
      headers: getAuthHeader()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch organization requests');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching organization requests:', error);
    throw error;
  }
};

/**
 * Change user password
 * @param {Object} passwordData - Password change data
 * @returns {Promise} Promise with password change result
 */
export const changePassword = async (passwordData) => {
  try {
    const response = await fetch(`${API_URL}/passwords/change`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(passwordData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || 'Failed to change password');
    }

    return await response.json();
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};

/**
 * Get user password information
 * @returns {Promise} Promise with user password info
 */
export const getPasswordInfo = async () => {
  try {
    const response = await fetch(`${API_URL}/passwords/my-info`, {
      method: 'GET',
      headers: getAuthHeader()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch password info');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching password info:', error);
    throw error;
  }
};

/**
 * Get all users' password information (Admin only)
 * @returns {Promise} Promise with all users' password info
 */
export const getAllUsersPasswords = async () => {
  try {
    const response = await fetch(`${API_URL}/passwords/admin/all-users`, {
      method: 'GET',
      headers: getAuthHeader()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch users passwords');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching users passwords:', error);
    throw error;
  }
};

/**
 * Get specific user's password information (Admin only)
 * @param {string} username - Username to get password info for
 * @returns {Promise} Promise with user's password info
 */
export const getUserPassword = async (username) => {
  try {
    const response = await fetch(`${API_URL}/passwords/admin/user/${username}`, {
      method: 'GET',
      headers: getAuthHeader()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch user password');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user password:', error);
    throw error;
  }
};

/**
 * Reset user password (Admin only)
 * @param {Object} resetData - Password reset data
 * @returns {Promise} Promise with reset result
 */
export const resetUserPassword = async (resetData) => {
  try {
    const response = await fetch(`${API_URL}/passwords/admin/reset`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(resetData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || 'Failed to reset password');
    }

    return await response.json();
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

/**
 * Get users with default passwords (Admin only)
 * @returns {Promise} Promise with users who have default passwords
 */
export const getDefaultPasswordUsers = async () => {
  try {
    const response = await fetch(`${API_URL}/passwords/admin/default-users`, {
      method: 'GET',
      headers: getAuthHeader()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch default password users');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching default password users:', error);
    throw error;
  }
};

export default {
  getSystemStats,
  getOrganizations,
  getDepartments,
  getUsers,
  getProcesses,
  getBIAReports,
  getRecentActivity,
  getSystemSettings,
  updateSystemSettings,
  createOrganization,
  createUser,
  searchOrganizationByName,
  updateOrganization,
  getOrganizationModules,
  updateOrganizationModules,
  updateOrganizationLicenseExpiry,
  createMinimalOrganization,
  setupOrganizationFromFile,
  getOrganizationDescription,
  updateOrganizationDescription,
  deleteOrganization,
  archiveOrganization,
  getArchivedUsers,
  uploadDocumentToVectorStore,
  uploadMultipleDocuments,
  invalidateUsersCache,
  createModuleRequest,
  getMyModuleRequests,
  getPendingApprovals,
  clientHeadApproval,
  projectSponsorApproval,
  getModuleRequestDetails,
  getOrganizationModuleRequests,
  changePassword,
  getPasswordInfo,
  getAllUsersPasswords,
  getUserPassword,
  resetUserPassword,
  getDefaultPasswordUsers
};
