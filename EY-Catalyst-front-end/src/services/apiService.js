/**
 * API Service for Process Service Mapping
 * Handles API calls to the main2.py backend on port 8001
 */

const API_BASE_URL = '/api';

/**
 * Upload and parse PDF file to generate flowchart data
 * @param {File} file - PDF file to upload and parse
 * @returns {Promise} - Promise with flowchart data
 */
export const uploadAndParsePDF = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/parse-pdf/`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to upload and parse PDF');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Upload and parse PDF error:', error);
    throw error;
  }
};

/**
 * List uploaded files
 * @returns {Promise} - Promise with list of uploaded files
 */
export const listUploadedFiles = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/uploaded-files/`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to list uploaded files');
    }

    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('List uploaded files error:', error);
    throw error;
  }
};

/**
 * Delete uploaded file
 * @param {string} filename - Name of file to delete
 * @returns {Promise} - Promise with deletion result
 */
export const deleteUploadedFile = async (filename) => {
  try {
    const response = await fetch(`${API_BASE_URL}/uploaded-files/${filename}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete uploaded file');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Delete uploaded file error:', error);
    throw error;
  }
};

/**
 * Generate flowchart from file
 * @param {string} fileId - ID of the file to generate flowchart from
 * @returns {Promise} - Promise with flowchart data
 */
export const generateFlowchart = async (fileId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-flowchart/${fileId}`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to generate flowchart');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Generate flowchart error:', error);
    throw error;
  }
};

/**
 * Get flowchart data (fallback to static data)
 * @returns {Promise} - Promise with flowchart data
 */
export const getFlowchartData = async () => {
  try {
    // Try to fetch from the API first
    const response = await fetch(`${API_BASE_URL}/flowchart-data/`);
    if (response.ok) {
      return await response.json();
    }
    
    // Fallback to static data
    const staticResponse = await fetch('/structure.json');
    if (staticResponse.ok) {
      return await staticResponse.json();
    }
    
    throw new Error('No flowchart data available');
  } catch (error) {
    console.error('Get flowchart data error:', error);
    throw error;
  }
};

/**
 * Get service mapping data
 * @returns {Promise} - Promise with service mapping data
 */
export const getServiceMappingData = async () => {
  try {
    // Try to fetch from the API first
    const response = await fetch(`${API_BASE_URL}/service-mapping-data/`);
    if (response.ok) {
      return await response.json();
    }
    
    // Fallback to static data
    const staticResponse = await fetch('/serviceMappingData.json');
    if (staticResponse.ok) {
      return await staticResponse.json();
    }
    
    throw new Error('No service mapping data available');
  } catch (error) {
    console.error('Get service mapping data error:', error);
    throw error;
  }
};

/**
 * Get node details by ID
 * @param {string} nodeId - ID of the node to get details for
 * @returns {Promise} - Promise with node details
 */
export const getNodeDetails = async (nodeId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/node-details/${nodeId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to get node details');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get node details error:', error);
    throw error;
  }
};

/**
 * Transform backend node format to React Flow format
 * @param {Object} node - Backend node object
 * @returns {Object} - React Flow compatible node
 */
export const transformNodeToReactFlow = (node) => {
  return {
    id: node.id,
    type: node.type || 'custom',
    position: node.position || { x: 0, y: 0 },
    data: {
      label: node.data?.label || node.label || '',
      role: node.data?.role || node.role || '',
      notes: node.data?.notes || node.notes || '',
      head: node.data?.head || node.head || { name: '', email: '', contact: '' },
      bgColor: node.style?.background || '#232526',
      onNodeEdit: () => {} // Placeholder, will be set by parent component
    },
    sourcePosition: node.sourcePosition || 'bottom',
    targetPosition: node.targetPosition || 'top',
    style: node.style || {
      background: '#232526',
      color: '#FFD700',
      border: '1.5px solid #FFD700',
      borderRadius: '10px',
      padding: '8px',
      minWidth: '140px',
      textAlign: 'center',
      fontWeight: 'bold',
      fontSize: '0.95rem'
    }
  };
};

// Default export for backward compatibility
const apiService = {
  uploadAndParsePDF,
  listUploadedFiles,
  deleteUploadedFile,
  generateFlowchart,
  getFlowchartData,
  getServiceMappingData,
  getNodeDetails,
  transformNodeToReactFlow,
};

export default apiService;