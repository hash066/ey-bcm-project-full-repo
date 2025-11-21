/**
 * Business Impact Analysis (BIA) service for handling API calls to the backend
 */

// API base URL - should be configured based on environment
const API_URL = 'http://localhost:8000';

/**
 * Download impact scale template
 * @returns {Promise} - Promise with blob data
 */
export const downloadImpactScaleTemplate = async () => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_URL}/bia/impact-scale-template`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to download impact scale template');
    }

    return await response.blob();
  } catch (error) {
    console.error('Download template error:', error);
    throw error;
  }
};

/**
 * Upload impact scale
 * @param {File} file - Excel file
 * @param {Object} metadata - Impact scale metadata
 * @returns {Promise} - Promise with uploaded impact scale data
 */
export const uploadImpactScale = async (file, metadata) => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    // Add metadata as JSON string
    formData.append('impact_scale_data', JSON.stringify(metadata));
    
    const response = await fetch(`${API_URL}/bia/impact-scale/${metadata.client_id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to upload impact scale');
    }

    return await response.json();
  } catch (error) {
    console.error('Upload impact scale error:', error);
    throw error;
  }
};

/**
 * Get impact scales for a client
 * @param {number} clientId - Client ID
 * @param {Object} filters - Optional filters
 * @returns {Promise} - Promise with impact scales data
 */
export const getImpactScales = async (clientId, filters = {}) => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    // Build query string from filters
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        queryParams.append(key, value);
      }
    });
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    
    const response = await fetch(`${API_URL}/bia/impact-scales/${clientId}${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch impact scales');
    }

    return await response.json();
  } catch (error) {
    console.error('Get impact scales error:', error);
    throw error;
  }
};

/**
 * Get impact matrix for BIA
 * @param {string} clientId - Client ID
 * @returns {Promise} - Promise with impact matrix data in the old format
 */
export const getImpactMatrix = async (clientId) => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    // Use the standard impact matrix endpoint
    const url = `${API_URL}/bia/impact-matrix/${clientId}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to get impact matrix: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get impact matrix error:', error);
    throw error;
  }
};

/**
 * Create or update impact matrix for BIA
 * @param {string} clientId - Client ID
 * @param {string} sector - Business sector
 * @param {Array} cells - Impact matrix cells
 * @param {Object} impactTypes - Map of impact types
 * @param {Object} impactLevels - Map of impact levels
 * @param {Object} areasOfImpact - Map of areas of impact
 * @returns {Promise} - Promise with created/updated impact matrix
 */
export const createImpactMatrix = async (
  clientId,
  sector,
  cells,
  impactTypes,
  impactLevels,
  areasOfImpact
) => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    // Format the data according to the old endpoint expectations
    const requestBody = {
      client_id: clientId,
      title: "BIA Impact Scale",
      description: "Business impact scale matrix",
      sector: sector,
      cells: cells.map(cell => ({
        impact_type: cell.impact_type,
        impact_level: cell.impact_level,
        description: cell.description
      })),
      impact_types: Object.keys(impactTypes),
      impact_levels: Object.keys(impactLevels),
      areas_of_impact: areasOfImpact
    };
    
    // Use the standard impact matrix endpoint
    const url = `${API_URL}/bia/impact-matrix/${clientId}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to create impact matrix: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Create impact matrix error:', error);
    throw error;
  }
};

/**
 * Create or update impact matrix
 * @param {number} clientId - Client ID
 * @param {string} sector - Business sector
 * @param {Array} cells - Impact matrix cells
 * @returns {Promise} - Promise with created/updated impact matrix
 */
export const createImpactMatrixNew = async (clientId, sector, cells) => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const payload = {
      client_id: clientId,
      sector: sector,
      cells: cells
    };
    
    const response = await fetch(`${API_URL}/bia/impact-matrix/${clientId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create impact matrix');
    }

    return await response.json();
  } catch (error) {
    console.error('Create impact matrix error:', error);
    throw error;
  }
};

/**
 * Get impact matrix for a client
 * @param {number} clientId - Client ID
 * @param {string} sector - Optional sector filter
 * @returns {Promise} - Promise with impact matrix data
 */
export const getImpactMatrixNew = async (clientId, sector = null) => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    // Add sector as query param if provided
    const queryString = sector ? `?sector=${encodeURIComponent(sector)}` : '';
    
    const response = await fetch(`${API_URL}/bia/impact-matrix/${clientId}${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Return null if not found instead of throwing error
        return null;
      }
      throw new Error('Failed to fetch impact matrix');
    }

    return await response.json();
  } catch (error) {
    console.error('Get impact matrix error:', error);
    throw error;
  }
};

/**
 * Get LLM suggestions for impact matrix cell
 * @param {string} processName - Process name
 * @param {string} impactType - Impact type
 * @param {string} impactLevel - Impact level
 * @param {string} sector - Business sector
 * @returns {Promise} - Promise with suggestion choices
 */
export const getImpactMatrixSuggestions = async (processName, impactType, impactLevel, sector) => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const payload = {
      process_name: processName,
      impact_type: impactType,
      impact_level: impactLevel,
      sector: sector
    };
    
    const response = await fetch(`${API_URL}/bia/impact-matrix-suggestions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to get suggestions');
    }

    const data = await response.json();
    return data.choices || [];
  } catch (error) {
    console.error('Get impact matrix suggestions error:', error);
    throw error;
  }
};

/**
 * Get organization impact matrix
 * @param {string} organizationId - Organization UUID
 * @param {string} sector - Optional sector filter
 * @returns {Promise} - Promise with organization impact matrix data
 */
export const getOrganizationImpactMatrix = async (organizationId, sector = null) => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    // Use the frontend-friendly endpoint
    const url = `${API_URL}/organizations/${organizationId}/impact-matrix/frontend`;
    console.log('Calling API endpoint:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API error response:', errorData);
      throw new Error(errorData.detail || `Failed to get organization impact matrix: ${response.status}`);
    }

    const data = await response.json();
    console.log('Raw API response:', data);
    
    // The response data structure matches what the OrganizationImpactScale component expects
    // {
    //   cells: Array<{description, impact_type, impact_level}>,
    //   metadata: {title, description, created_by, updated_at, impact_types, impact_levels},
    //   impact_types: Array<string>,
    //   impact_levels: Array<string>,
    //   areas_of_impact: {[impact_type]: area_of_impact}
    // }
    
    // Return the data property from the response if it exists, otherwise return the whole response
    const result = data.data || data;
    console.log('Processed response data:', result);
    return result;
  } catch (error) {
    console.error('Get organization impact matrix error:', error);
    throw error;
  }
};

/**
 * Create or update organization impact matrix
 * @param {string} organizationId - Organization UUID
 * @param {string} sector - Business sector
 * @param {Array} cells - Impact matrix cells
 * @param {Object} impactTypes - Map of impact type IDs to names
 * @param {Object} impactLevels - Map of impact level IDs to names
 * @param {Object} processNames - Map of impact type IDs to process names
 * @returns {Promise} - Promise with created/updated organization impact matrix
 */
export const createOrganizationImpactMatrix = async (
  organizationId,
  sector,
  cells,
  impactTypes,
  impactLevels,
  processNames
) => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    // Convert to the format expected by the backend
    const frontendCells = cells.map(cell => {
      return {
        impact_type_id: cell.impact_type,
        impact_level_id: cell.impact_level,
        description: cell.description
      };
    });
    
    // Convert impact types to the format expected by the backend
    const frontendImpactTypes = Object.entries(impactTypes).map(([id, name]) => {
      return {
        id,
        name,
        area_of_impact: processNames[id] || ''
      };
    });
    
    // Convert impact levels to the format expected by the backend
    const frontendImpactLevels = Object.entries(impactLevels).map(([id, name]) => {
      // Extract value from level name if possible (e.g., "Major - 3" -> 3)
      let value = null;
      if (name.includes(' - ')) {
        const valuePart = name.split(' - ')[1];
        if (!isNaN(parseInt(valuePart))) {
          value = parseInt(valuePart);
        }
      }
      
      return {
        id,
        name,
        value
      };
    });
    
    // Construct the request body
    const requestBody = {
      organization_id: organizationId,
      title: "BIA Impact Scale",
      description: "Organization impact scale matrix",
      sector,
      impact_types: frontendImpactTypes,
      impact_levels: frontendImpactLevels,
      cells: frontendCells
    };
    
    // Use the frontend-friendly endpoint
    const url = `${API_URL}/organizations/${organizationId}/impact-matrix/frontend`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to create organization impact matrix: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Create organization impact matrix error:', error);
    throw error;
  }
};

/**
 * Get impact scale matrix for a given process and impact type
 * @param {string} processName - Process name
 * @param {string} impactName - Impact name (Financial, Operational, etc.)
 * @returns {Promise} - Promise with impact scale matrix
 */
export const getImpactScaleMatrix = async (processName, impactName) => {
  try {
    console.log('Fetching impact scale matrix for:', { processName, impactName });
    
    const response = await fetch(`https://Prithivi-nanda-EY-catalyst.hf.space/get-impact-scale-matrix`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer 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`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        process_name: processName,
        impact_name: impactName
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch impact scale matrix');
    }

    const data = await response.json();
    console.log('Impact scale matrix response:', data);
    return data;
  } catch (error) {
    console.error('Fetch impact scale matrix error:', error);
    throw error;
  }
};

/**
 * Get critical vendors - placeholder until endpoint is implemented
 * @returns {Promise} - Promise with critical vendor data
 */
export async function getCriticalVendors() {
  // Return mock data until backend endpoint is implemented
  const mockData = [
    {
      id: 1,
      name: 'Vendor A',
      criticality: 'High',
      contact_person: 'John Doe',
      contact_email: 'john@vendor-a.com'
    },
    {
      id: 2,
      name: 'Vendor B',
      criticality: 'Medium',
      contact_person: 'Jane Smith',
      contact_email: 'jane@vendor-b.com'
    }
  ];

  console.log('⚠️ Using mock data for critical vendors - endpoint not yet implemented');
  return mockData;
}

/**
 * Get organization sector
 * @param {string} organizationId - Organization UUID
 * @returns {Promise} - Promise with organization sector
 */
export const getOrganizationSector = async (organizationId) => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_URL}/organizations/${organizationId}/sector`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get organization sector');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get organization sector error:', error);
    throw error;
  }
};

/**
 * Get AI-generated description for a process or department
 * @param {string} queryType - Type of query ('process' or 'department')
 * @param {string} queryName - Name of the process or department
 * @returns {Promise} - Promise with generated description
 */
export const getAIDescription = async (queryType, queryName) => {
  try {
    const response = await fetch('https://Prithivi-nanda-EY-catalyst.hf.space/get-description', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer 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',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query_type: queryType,
        query_name: queryName
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get AI description');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get AI description error:', error);
    throw error;
  }
};

/**
 * Get AI-predicted peak period for a process
 * @param {string} department - Department name
 * @param {string} processName - Process name
 * @param {string} sector - Business sector
 * @returns {Promise} - Promise with predicted peak period
 */
export const getAIPeakPeriod = async (department, processName, sector) => {
  try {
    const response = await fetch('https://Prithivi-nanda-EY-catalyst.hf.space/get-peak-period/', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer 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',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        department,
        process_name: processName,
        sector
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get AI peak period prediction');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get AI peak period error:', error);
    throw error;
  }
};

/**
 * Update organization criticality threshold
 * @param {string} organizationId - Organization UUID
 * @param {number} rtoThreshold - RTO threshold value in hours
 * @returns {Promise} - Promise with updated organization data
 */
export const updateOrganizationCriticality = async (organizationId, rtoThreshold) => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_URL}/organizations/${organizationId}/criticality`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ criticality: rtoThreshold.toString() })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to update organization RTO threshold');
    }

    return await response.json();
  } catch (error) {
    console.error('Update organization RTO threshold error:', error);
    throw error;
  }
};

/**
 * Get organization criticality threshold
 * @param {string} organizationId - Organization ID
 * @returns {Promise} - Promise with organization criticality
 */
export const getOrganizationCriticality = async (organizationId) => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch(`${API_URL}/organizations/${organizationId}/criticality`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch organization criticality');
    }

    // Try to parse as JSON first, fall back to text if that fails
    try {
      const data = await response.json();
      console.log('Organization criticality response (JSON):', data);
      return data;
    } catch (parseError) {
      // If JSON parsing fails, try to get as text
      const textData = await response.text();
      console.log('Organization criticality response (text):', textData);
      return textData;
    }
  } catch (error) {
    console.error('Fetch organization criticality error:', error);
    throw error;
  }
};

/**
 * Fetch processes by department and subdepartment
 * @param {string} organizationId - Organization UUID
 * @param {string} departmentName - Department name
 * @param {string} subdepartmentName - Subdepartment name
 * @returns {Promise} - Promise with list of processes and their owners
 */
export const getProcessesByDepartment = async (organizationId, departmentName, subdepartmentName) => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_URL}/organizations/processes/filter`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        organization_id: organizationId,
        department_name: departmentName,
        subdepartment_name: subdepartmentName
      })
    });
    console.log(response)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch processes');
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch processes error:', error);
    throw error;
  }
};

/**
 * Get processes for BIA based on organization ID, department name, and subdepartment name
 * @param {string} organizationId - Organization UUID
 * @param {string} departmentName - Department name
 * @param {string} subdepartmentName - Subdepartment name
 * @returns {Promise} - Promise with list of processes with their BIA info
 */
export const getBIAProcesses = async (organizationId, departmentName, subdepartmentName) => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_URL}/bia/processes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        organization_id: organizationId,
        department_name: departmentName,
        subdepartment_name: subdepartmentName
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch BIA processes');
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch BIA processes error:', error);
    throw error;
  }
};

/**
 * Send process impact data to LLM for analysis
 * @param {Object} processData - Process data with impact information
 * @returns {Promise} - Promise with LLM analysis response
 */
export const sendProcessToLLM = async (processData) => {
  try {
    console.log('Sending process data to LLM:', processData);
    
    // Use the same endpoint as the impact scale matrix since that's the one that works
    const response = await fetch(`https://Prithivi-nanda-EY-catalyst.hf.space/get-impact-scale-matrix`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer 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`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        process_name: processData.process_name,
        impact_name: "Analysis" // Special keyword to trigger analysis mode
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to get LLM analysis');
    }

    const data = await response.json();
    console.log('LLM analysis response:', data);
    return data;
  } catch (error) {
    console.error('LLM analysis error:', error);
    throw error;
  }
};

/**
 * Manually fetch impact data for a process
 * @param {Object} process - Process object
 * @returns {Promise} - Promise with impact data for all impact types
 */
export const fetchProcessImpactData = async (process) => {
  try {
    const impactTypes = [
      "Financial Impact",
      "Operational Impact",
      "Legal and Regulatory Impact",
      "Reputational Impact",
      "Customer Impact"
    ];
    
    const results = {};
    
    // Fetch impact data for each impact type
    for (const impactType of impactTypes) {
      const impactName = impactType.split(' ')[0]; // Extract first word (Financial, Operational, etc.)
      try {
        const response = await getImpactScaleMatrix(process.name, impactName);
        results[impactType] = response;
      } catch (error) {
        console.error(`Error fetching ${impactType} for ${process.name}:`, error);
        results[impactType] = { error: error.message };
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error fetching process impact data:', error);
    throw error;
  }
};

export const saveBIAInformation = async (data) => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_URL}/bia/information`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : undefined,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to save BIA Information');
  }
  return await response.json();
};

export const saveBIAProcesses = async (processPayload) => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_URL}/bia/processes/new`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : undefined,
    },
    body: JSON.stringify({ processes: processPayload }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to save BIA Processes');
  }
  return await response.json();
};

// Add saveImpactAnalysis function
export const saveImpactAnalysis = async (organizationId, departmentName, subdepartmentName, impactAnalysisData) => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_URL}/bia/impact-analysis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : undefined,
    },
    body: JSON.stringify({
      organization_id: organizationId,
      department_name: departmentName,
      subdepartment_name: subdepartmentName,
      impact_analysis: impactAnalysisData
    }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to save impact analysis');
  }
  return await response.json();
};

export const saveBulkImpactAnalysis = async (analyses) => {
  const token = localStorage.getItem('access_token');
  console.log({ analyses });
  const response = await fetch(`http://localhost:8000/bia/impact-analysis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : undefined,
    },
    body: JSON.stringify({ analyses }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to save bulk impact analysis');
  }
  return await response.json();
};

export const saveVendorDetail = async (vendorDetail) => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_URL}/bia/vendor-detail`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : undefined,
    },
    body: JSON.stringify(vendorDetail),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to save vendor detail');
  }
  return await response.json();
};

export const getVendorDetails = async () => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_URL}/bia/vendor-detail`, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : undefined,
    }
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch vendor details');
  }
  return await response.json();
};

// Save a minimum operating requirement row
export const saveMinimumOperatingRequirement = async (mor) => {
  const token = localStorage.getItem('access_token');
  const response = await fetch('http://localhost:8000/bia/minimum-operating-requirement', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : undefined,
    },
    body: JSON.stringify(mor),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to save minimum operating requirement');
  }
  return await response.json();
};

// Fetch all minimum operating requirements
export const getMinimumOperatingRequirements = async () => {
  const token = localStorage.getItem('access_token');
  const response = await fetch('http://localhost:8000/bia/minimum-operating-requirement', {
    headers: {
      'Authorization': token ? `Bearer ${token}` : undefined,
    }
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch minimum operating requirements');
  }
  return await response.json();
};

// Save a critical staff detail
export const saveCriticalStaffDetail = async (staffDetail) => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_URL}/bia/critical-staff-detail`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : undefined,
    },
    body: JSON.stringify(staffDetail),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to save critical staff detail');
  }
  return await response.json();
};

// Fetch all critical staff details
export const getCriticalStaffDetails = async () => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_URL}/bia/critical-staff-detail`, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : undefined,
    }
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch critical staff details');
  }
  return await response.json();
};

// Fetch all organizations
export const getOrganizations = async () => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_URL}/bia/organizations`, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : undefined,
    }
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch organizations');
  }
  return await response.json();
};

// Save resources for resumption
export const saveResourcesForResumption = async (resourcesData) => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_URL}/bia/resources-for-resumption`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : undefined,
    },
    body: JSON.stringify(resourcesData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to save resources for resumption');
  }
  return await response.json();
};

// Fetch all resources for resumption
export const getResourcesForResumption = async () => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_URL}/bia/resources-for-resumption`, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : undefined,
    }
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch resources for resumption');
  }
  return await response.json();
};

// Save vital record
export const saveVitalRecord = async (vitalRecordData) => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_URL}/bia/vital-records`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : undefined,
    },
    body: JSON.stringify(vitalRecordData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to save vital record');
  }
  return await response.json();
};

/**
 * Get vital records from the backend
 * @returns {Promise} - Promise with vital records data
 */
export const getVitalRecords = async () => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_URL}/bia/vital-records`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch vital records');
    }

    return await response.json();
  } catch (error) {
    console.error('Get vital records error:', error);
    throw error;
  }
};

/**
 * Save timeline summary data to the backend
 * @param {Object} timelineData - Timeline summary data
 * @returns {Promise} - Promise with saved timeline summary data
 */
export const saveTimelineSummary = async (timelineData) => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_URL}/bia/timeline-summary`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(timelineData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to save timeline summary');
    }

    return await response.json();
  } catch (error) {
    console.error('Save timeline summary error:', error);
    throw error;
  }
};

/**
 * Get timeline summaries from the backend
 * @returns {Promise} - Promise with timeline summaries data
 */
export const getTimelineSummaries = async () => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_URL}/bia/timeline-summary`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch timeline summaries');
    }

    return await response.json();
  } catch (error) {
    console.error('Get timeline summaries error:', error);
    throw error;
  }
};

/**
 * Get timeline summary with impact data (RTO and MTPD from impact_analysis table)
 * @returns {Promise} - Promise with timeline summary data including impact data
 */
export const getTimelineSummaryWithImpactData = async () => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_URL}/bia/timeline-summary-with-impact-data`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch timeline summary with impact data');
    }

    return await response.json();
  } catch (error) {
    console.error('Get timeline summary with impact data error:', error);
    throw error;
  }
};

export const getProcessById = async (processId) => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`http://localhost:8000/processes/${processId}`, {
    headers: { 'Authorization': token ? `Bearer ${token}` : undefined }
  });
  if (!response.ok) throw new Error('Failed to fetch process');
  return await response.json();
};

export const getSubdepartmentById = async (subdepartmentId) => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`http://localhost:8000/subdepartments/${subdepartmentId}`, {
    headers: { 'Authorization': token ? `Bearer ${token}` : undefined }
  });
  if (!response.ok) throw new Error('Failed to fetch subdepartment');
  return await response.json();
};

export const getDepartmentById = async (departmentId) => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`http://localhost:8000/departments/${departmentId}`, {
    headers: { 'Authorization': token ? `Bearer ${token}` : undefined }
  });
  if (!response.ok) throw new Error('Failed to fetch department');
  return await response.json();
};

export const getBIAProcessFullHierarchy = async (biaProcessInfoId) => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`http://localhost:8000/bia-process-info/${biaProcessInfoId}/full-hierarchy`, {
    headers: { 'Authorization': token ? `Bearer ${token}` : undefined }
  });
  if (!response.ok) throw new Error('Failed to fetch BIA process hierarchy');
  return await response.json();
};

export const getUserMorApplicationsV2 = async (username) => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`http://localhost:8000/user/${username}/mor-applications-v2`, {
    headers: { 'Authorization': token ? `Bearer ${token}` : undefined }
  });
  if (!response.ok) throw new Error('Failed to fetch MOR applications for user');
  return await response.json();
};

export const getOrganizationMorApplications = async (organizationId) => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`http://localhost:8000/organization/${organizationId}/mor-applications`, {
    headers: { 'Authorization': token ? `Bearer ${token}` : undefined }
  });
  if (!response.ok) throw new Error('Failed to fetch MOR applications for organization');
  return await response.json();
};
