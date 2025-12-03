/**
 * Module service for handling module licensing and access control
 */
import { jwtDecode } from 'jwt-decode';

// API base URL - should be configured based on environment
const API_URL = 'http://localhost:8000';

// Module name mapping to handle different naming conventions
const MODULE_NAME_MAPPING = {
  "Process and Service Mapping": ["Process Mapping", "Service Mapping"],
  "Business Impact Analysis": ["BIA Process"],
  "Risk Analysis": ["Risk Assessment"],
  "Recovery Strategy": ["Recovery Strategy Development"],
  "BCM Plan": ["Business Continuity Plan Development"],
  "Crisis Management": ["Crisis Management & Communication Plan"],
  "Training and Testing": ["Business Resilience Testing"],
  "Procedures": ["Procedures"],
  "Policy": ["Policy Management"],
  "Business Resilience Gap Assessment": ["Gap Assessment", "Compliance Assessment"],
  "KPIs & BCM Maturity": ["BCM Maturity & KPIs"],
  "Continual Improvement": ["Continual Improvement"]
};

// Module ID mapping to sidebar module names
const MODULE_ID_MAPPING = {
  1: "Process and Service Mapping",
  2: "Business Impact Analysis",
  3: "Risk Analysis",
  4: "Recovery Strategy",
  5: "BCM Plan",
  6: "Crisis Management",
  7: "Training and Testing",
  8: "Procedures",
  9: "Policy",
  10: "KPIs & BCM Maturity",
  11: "Continual Improvement"
};

// Get auth header with JWT token
const getAuthHeader = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

/**
 * Get the current user's organization ID from JWT token
 * @returns {string|null} Organization ID or null if not found
 */
export const getCurrentOrganizationId = () => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token || !token.includes('.')) return null;

    const decoded = jwtDecode(token);
    return decoded.organization_id || null;
  } catch (error) {
    console.error('Error getting organization ID from token:', error);
    return null;
  }
};

/**
 * Get licensed modules for the current user's organization
 * @returns {Promise} Promise with organization modules data
 */
export const getUserLicensedModules = async () => {
  try {
    const organizationId = getCurrentOrganizationId();
    if (!organizationId) {
      throw new Error('No organization ID found in user token');
    }
    
    const response = await fetch(`${API_URL}/organizations/${organizationId}/modules`, {
      method: 'GET',
      headers: getAuthHeader()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get organization modules: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Licensed modules data:', data);
    return data;
  } catch (error) {
    console.error(`Error getting user licensed modules:`, error);
    throw error;
  }
};

/**
 * Check if a module is licensed for the current user
 * @param {string} moduleName - Name of the module as shown in sidebar
 * @param {Array} licensedModules - Array of licensed modules from API
 * @returns {boolean} True if module is licensed
 */
export const isModuleLicensed = (moduleName, licensedModules) => {
  // TEMPORARY: Always allow access to Gap Assessment and BIA for demo testing
  if (moduleName === "Business Resilience Gap Assessment" || moduleName === "Business Impact Analysis") {
    console.log(`TEMPORARY: Allowing access to "${moduleName}" for demo testing`);
    return true;
  }

  if (!licensedModules || !licensedModules.modules) {
    console.log(`No licensed modules data available for ${moduleName}`);
    return false;
  }

  console.log(`Checking if module "${moduleName}" is licensed`);
  console.log('Available modules:', licensedModules.modules);

  // Special case for combined Process and Service Mapping
  if (moduleName === "Process and Service Mapping") {
    // Check if either Process Mapping or Service Mapping is licensed
    const processServiceMatch = licensedModules.modules.some(module => {
      const isLicensed = module.is_licensed;
      const nameMatches = 
        (module.name || '').toLowerCase().includes('process mapping') || 
        (module.name || '').toLowerCase().includes('service mapping');
      
      if (isLicensed && nameMatches) {
        console.log(`Combined module "Process and Service Mapping" is licensed via ${module.name}`);
        return true;
      }
      return false;
    });
    
    if (processServiceMatch) return true;
    
    // Also check by ID 1 (for backward compatibility)
    const idMatch = licensedModules.modules.some(module => 
      module.is_licensed && module.module_id === 1
    );
    
    if (idMatch) {
      console.log(`Combined module "Process and Service Mapping" is licensed by ID match`);
      return true;
    }
    
    console.log(`Combined module "Process and Service Mapping" is NOT licensed`);
    return false;
  }
  
  // Get the corresponding module IDs from the mapping
  const possibleModuleNames = MODULE_NAME_MAPPING[moduleName] || [moduleName];
  
  // First check: Match by module name
  const nameMatch = licensedModules.modules.some(module => {
    const isLicensed = module.is_licensed;
    const nameMatches = possibleModuleNames.some(name => 
      name.toLowerCase().replace(/\s+/g, ' ').trim() === 
      (module.name || '').toLowerCase().replace(/\s+/g, ' ').trim()
    );
    
    if (isLicensed && nameMatches) {
      console.log(`Module "${moduleName}" is licensed by name match`);
      return true;
    }
    return false;
  });
  
  if (nameMatch) return true;
  
  // Second check: Match by module ID
  const idMatch = licensedModules.modules.some(module => {
    if (!module.is_licensed || module.module_id === undefined) return false;
    
    const sidebarModuleName = MODULE_ID_MAPPING[module.module_id];
    const matches = sidebarModuleName === moduleName;
    
    if (matches) {
      console.log(`Module "${moduleName}" is licensed by ID match (ID: ${module.module_id})`);
      return true;
    }
    return false;
  });
  
  if (idMatch) return true;
  
  console.log(`Module "${moduleName}" is NOT licensed`);
  return false;
};

/**
 * Check if module is accessible by ID
 * @param {number} moduleId - ID of the module
 * @param {Array} licensedModules - Array of licensed modules from API
 * @returns {boolean} True if module is licensed
 */
export const isModuleLicensedById = (moduleId, licensedModules) => {
  if (!licensedModules || !licensedModules.modules) return false;
  
  // Check if the module with this ID is licensed
  return licensedModules.modules.some(module => 
    module.is_licensed && module.module_id === moduleId
  );
};
