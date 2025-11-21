/**
 * LLM Service for BIA Procedure
 * Handles API calls to the LLM endpoints for generating BIA procedure content
 */

import groqService from './groqWrapper';

const LLM_API_URL = 'https://inchara20-procedures-llm-endpoints.hf.space';
const HF_API_KEY = 'your_huggingface_api_key_here';

// Procedure generation functions using Groq
export const generateBCMProcedure = async (orgName, criticalityThreshold) => {
  try {
    const content = await groqService.generateBCMProcedure(orgName, criticalityThreshold);
    return parseGeneratedContent(content);
  } catch (error) {
    console.error('Error generating BCM procedure:', error);
    throw new Error('Failed to generate BCM procedure');
  }
};

export const generateBIAContent = async (orgName, criticalityThreshold) => {
  try {
    const content = await groqService.generateBIAProcedure(orgName, criticalityThreshold);
    return parseGeneratedContent(content);
  } catch (error) {
    console.error('Error generating BIA content:', error);
    throw new Error('Failed to generate BIA content');
  }
};

export const generateTrainingContent = async (orgName) => {
  try {
    const content = await groqService.generateTrainingProcedure(orgName);
    return parseGeneratedContent(content);
  } catch (error) {
    console.error('Error generating training content:', error);
    throw new Error('Failed to generate training content');
  }
};

export const generateTestingContent = async (orgName) => {
  try {
    const content = await groqService.generateTestingProcedure(orgName);
    return parseGeneratedContent(content);
  } catch (error) {
    console.error('Error generating testing content:', error);
    throw new Error('Failed to generate testing content');
  }
};

export const generateCrisisContent = async (orgName) => {
  try {
    const content = await groqService.generateCrisisProcedure(orgName);
    return parseGeneratedContent(content);
  } catch (error) {
    console.error('Error generating crisis content:', error);
    throw new Error('Failed to generate crisis content');
  }
};

export const generateRiskContent = async (orgName) => {
  try {
    const content = await groqService.generateRiskAssessmentProcedure(orgName);
    return parseGeneratedContent(content);
  } catch (error) {
    console.error('Error generating risk content:', error);
    throw new Error('Failed to generate risk content');
  }
};

// Helper function to parse generated content into structured format
const parseGeneratedContent = (content) => {
  try {
    const sections = {
      introduction: extractSection(content, 'introduction', 'scope'),
      scope: extractSection(content, 'scope', 'objective'),
      objective: extractSection(content, 'objective', 'methodology'),
      methodology: extractSection(content, 'methodology', 'process flow'),
      processFlow: extractSection(content, 'process flow', 'roles and responsibilities'),
      rolesResponsibilities: extractSection(content, 'roles and responsibilities', 'review frequency'),
      reviewFrequency: extractSection(content, 'review frequency', null)
    };
    return sections;
  } catch (error) {
    console.error('Error parsing generated content:', error);
    throw new Error('Failed to parse generated content');
  }
};

// Helper function to extract sections from content
const extractSection = (content, startSection, endSection) => {
  const lowerContent = content.toLowerCase();
  const start = lowerContent.indexOf(startSection.toLowerCase());
  
  if (start === -1) return '';
  
  const end = endSection ? lowerContent.indexOf(endSection.toLowerCase()) : content.length;
  if (end === -1) return content.slice(start).trim();
  
  return content.slice(start, end).trim();
};

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