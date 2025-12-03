/**
 * Authentication service for handling API calls to the backend
 */

// API base URL - should be configured based on environment
// This should match your FastAPI backend URL
const API_URL = 'http://localhost:8000';

/**
 * MAIN LOGIN: Authenticate against ADDS/LDAP server for production use
 * Connects to actual Active Directory server with certificate validation
 *
 * @param {string} username - ADDS username
 * @param {string} password - ADDS password
 * @returns {Promise} - Promise with user data and token
 */
export const login = async (username, password) => {
  try {
    // Create form data in x-www-form-urlencoded format
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    console.log('Sending ADDS auth request to:', `${API_URL}/auth/token`);
    console.log('ADDS credentials - Username:', username, 'Password:', password);

    const response = await fetch(`${API_URL}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(), // Ensure proper serialization
      credentials: 'include', // Include cookies if needed for CORS
    });

    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = 'ADDS authentication failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = `${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('ADDS authentication successful, received token data');
    console.log('User role:', data.user.roles[0]);

    // Store token and user info in localStorage
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user_id', data.user.id || '');
    localStorage.setItem('username', data.user.username || '');

    return data;
  } catch (error) {
    console.error('ADDS login error:', error);
    throw error;
  }
};

/**
 * DEMO LOGIN: Works with hardcoded demo credentials that bypass authentication
 * Perfect for evaluation demos showing RBAC functionality!
 *
 * Available demo users:
 * - process_user / demo123 → process_owner role
 * - subdept_user / demo123 → sub_department_head role
 * - depthead / demo123 → department_head role
 * - bcmcoord / demo123 → bcm_coordinator role
 * - ceo / demo123 → ceo role
 * - admin / demo123 → ey_admin role
 *
 * @param {string} username - Demo username
 * @param {string} password - Demo password (always "demo123")
 * @returns {Promise} - Promise with user data and token
 */
export const demoLogin = async (username, password) => {
  try {
    // Create form data in x-www-form-urlencoded format
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    console.log('Sending demo auth request to:', `${API_URL}/auth/simple-demo`);
    console.log('Demo credentials - Username:', username, 'Password:', password);

    const response = await fetch(`${API_URL}/auth/simple-demo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(), // Ensure proper serialization
      credentials: 'include', // Include cookies if needed for CORS
    });

    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = 'Demo login failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = `${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Demo login successful, received token data');
    console.log('User role:', data.user.roles[0]);

    // Store token and user info in localStorage
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user_id', data.user.id || '');
    localStorage.setItem('username', data.user.username || '');

    return data;
  } catch (error) {
    console.error('Demo login error:', error);
    throw error;
  }
};

/**
 * Get current user information
 * @returns {Promise} - Promise with user data
 */
export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }

    return await response.json();
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
};

/**
 * Decode JWT token to get user roles and other information
 * @returns {Object} - Decoded token payload
 */
export const decodeToken = () => {
  const token = localStorage.getItem('access_token');

  if (!token || !token.includes('.') || token.split('.').length < 2) {
    return null;
  }

  try {
    // Split the token and get the payload part
    const tokenParts = token.split('.');
    const base64Url = tokenParts[1];

    if (!base64Url) {
      console.error('Invalid token format: missing payload');
      return null;
    }

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
};

/**
 * Check if user has specific role
 * @param {string} roleName - Role to check
 * @returns {boolean} - True if user has role
 */
export const hasRole = (role) => {
  const decodedToken = decodeToken();
  if (!decodedToken || !decodedToken.roles) return false;
  return decodedToken.roles.includes(role);
};

// Logout function is defined below

/**
 * Get user's highest role in the hierarchy
 * @returns {string} - Highest role name
 */
export const getHighestRole = () => {
  const roleHierarchy = {
    'System Admin': 5,
    'Client Head': 4,
    'Department Head': 3,
    'SubDepartment Head': 2,
    'Process Owner': 1
  };
  
  const decodedToken = decodeToken();
  
  if (!decodedToken || !decodedToken.roles || decodedToken.roles.length === 0) {
    return null;
  }
  
  // Find the highest role by hierarchy value
  let highestRole = null;
  let highestValue = 0;
  
  decodedToken.roles.forEach(role => {
    if (roleHierarchy[role] && roleHierarchy[role] > highestValue) {
      highestValue = roleHierarchy[role];
      highestRole = role;
    }
  });
  
  return highestRole;
};

/**
 * Check if user can access a specific level in the hierarchy
 * @param {string} requiredLevel - Required level name
 * @returns {boolean} - True if user can access level
 */
export const canAccessLevel = (requiredLevel) => {
  const hierarchyLevels = {
    'System Admin': 5,
    'Client Head': 4,
    'Department Head': 3,
    'SubDepartment Head': 2,
    'Process Owner': 1,
    'User': 0
  };
  
  const highestRole = getHighestRole();
  
  if (!highestRole) {
    return false;
  }
  
  const userLevel = hierarchyLevels[highestRole] || 0;
  const requiredLevelValue = hierarchyLevels[requiredLevel] || 0;
  
  return userLevel >= requiredLevelValue;
};

/**
 * Logout user
 */
export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('username');
  localStorage.removeItem('user_roles');
  console.log('User logged out successfully');
  // Redirect to login page or refresh the application
  window.location.href = '/';
};
