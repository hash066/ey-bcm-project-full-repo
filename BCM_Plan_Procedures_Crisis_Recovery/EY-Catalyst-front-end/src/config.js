// Configuration constants for the application
export const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002';

// Export as API_BASE_URL as well for compatibility with BCM module
export const API_BASE_URL = API_URL;

export const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
export const APP_NAME = 'EY Catalyst BCM Platform';

// Default export
export default {
  API_URL,
  API_BASE_URL,
  GROQ_API_KEY,
  APP_NAME
};
