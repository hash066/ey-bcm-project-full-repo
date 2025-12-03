/**
 * LLM Service for BIA Procedure
 * Handles API calls to the LLM endpoints for generating BIA procedure content
 */

const LLM_API_URL = 'https://Prithivi-nanda-EY-catalyst.hf.space';
const HF_API_KEY = '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';

/**
 * Get BIA Matrix Choices
 * @param {string} processName - Process name
 * @param {string} impactType - Impact type
 * @param {string} impactLevel - Impact level
 * @param {string} sector - Business sector
 * @returns {Promise} - Promise with suggestion choices
 */
export const getBIAMatrixChoices = async (processName, impactType, impactLevel, sector) => {
  try {
    const response = await fetch(`${LLM_API_URL}/get-bia-matrix-choices`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        process_name: processName,
        impact_type: impactType,
        impact_level: impactLevel,
        sector: sector
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to get BIA matrix choices');
    }

    const data = await response.json();
    return data.choices || [];
  } catch (error) {
    console.error('Get BIA matrix choices error:', error);
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
    const response = await fetch(`${LLM_API_URL}/get-description`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
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
    const response = await fetch(`${LLM_API_URL}/get-peak-period/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
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
 * Get impact scale matrix for a given process and impact type
 * @param {string} processName - Process name
 * @param {string} impactName - Impact name (Financial, Operational, etc.)
 * @returns {Promise} - Promise with impact scale matrix
 */
export const getImpactScaleMatrix = async (processName, impactName) => {
  try {
    const response = await fetch(`${LLM_API_URL}/get-impact-scale-matrix`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
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
    return data;
  } catch (error) {
    console.error('Fetch impact scale matrix error:', error);
    throw error;
  }
};

/**
 * Generate BCM Policy
 * @param {string} organizationName - Organization name
 * @param {Array} standards - Array of standards
 * @param {string} customNotes - Custom notes
 * @returns {Promise} - Promise with generated BCM policy
 */
export const generateBCMPolicy = async (organizationName, standards = [], customNotes = '') => {
  try {
    const response = await fetch(`${LLM_API_URL}/generate-bcm-policy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        organization_name: organizationName,
        standards: standards,
        custom_notes: customNotes
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate BCM policy');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Generate BCM policy error:', error);
    throw error;
  }
};

/**
 * Generate BCM Policy Questions
 * @returns {Promise} - Promise with generated questions
 */
export const generateBCMQuestions = async () => {
  try {
    const response = await fetch(`${LLM_API_URL}/generate-bcm-questions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to generate BCM questions');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Generate BCM questions error:', error);
    throw error;
  }
};

/**
 * Upload Document to Vector Store
 * @param {File} file - File to upload (.pdf, .docx, .txt)
 * @returns {Promise} - Promise with upload result
 */
export const uploadDocumentToVector = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${LLM_API_URL}/upload-doc-to-vector/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload document to vector store');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Upload document to vector error:', error);
    throw error;
  }
};

/**
 * Process Mapping from Uploaded File
 * @param {File} file - File to process (.pdf, .docx, .csv)
 * @returns {Promise} - Promise with process mapping result
 */
export const processMappingFromFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${LLM_API_URL}/process-maping/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to process mapping from file');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Process mapping from file error:', error);
    throw error;
  }
}; 