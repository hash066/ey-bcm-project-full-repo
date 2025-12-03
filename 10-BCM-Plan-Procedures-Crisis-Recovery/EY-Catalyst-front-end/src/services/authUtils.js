/**
 * Authentication utility functions
 */

export const logout = () => {
  localStorage.removeItem('access_token');
  // Clear any other auth-related storage
  localStorage.removeItem('user_role');
  // Redirect to login if needed
  window.location.href = '/login';
};