import { API_URL } from '../config.js';
import { logout as logoutUtil } from './authUtils';

/**
 * Decode JWT token
 * @returns {Object|null} - Decoded token payload or null if invalid
 */
export const decodeToken = () => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) return null;

    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
};

/**
 * Refresh the access token
 * @returns {Promise} - Promise with new token data
 */
export const refreshToken = async () => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    return data;
  } catch (error) {
    console.error('Token refresh error:', error);
    // If refresh fails, redirect to login
    logoutUtil();
    throw error;
  }
};

/**
 * Check if token is about to expire (within 5 minutes)
 * @returns {boolean} - True if token is about to expire
 */
export const isTokenExpiringSoon = () => {
  const token = localStorage.getItem('access_token');
  if (!token) return true;

  try {
    const decoded = decodeToken();
    if (!decoded || !decoded.exp) return true;

    // Check if token expires in less than 5 minutes (300 seconds)
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp - currentTime < 300;
  } catch (error) {
    console.error('Token validation error:', error);
    return true;
  }
};

/**
 * Proactively refresh token if it's about to expire
 */
export const ensureValidToken = async () => {
  if (isTokenExpiringSoon()) {
    try {
      await refreshToken();
    } catch (error) {
      console.error('Failed to refresh token:', error);
      logoutUtil();
    }
  }
};

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
      throw new Error('Failed to get user data');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
};

export const login = async (credentials) => {
  try {
    // Create form data for OAuth2 compatibility
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    
    const response = await fetch(`${API_URL}/auth/token`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    
    // Store user info
    const userInfo = {
      id: data.user_id,
      username: data.username,
      groups: data.groups,
      role: data.role,
      organization_id: data.organization_id
    };
    localStorage.setItem('user_info', JSON.stringify(userInfo));
    
    return userInfo;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_info');
  // You might also want to call a logout endpoint on the server
};