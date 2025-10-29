// services/enhancedProcedureService.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002';

/**
 * Generate LLM content for a procedure
 */
export const generateLLMContent = async (
  procedureType, 
  organizationName = 'Sample Organization',
  organizationId = 1, 
  contentTypes = []  // ✅ DEFAULT TO EMPTY ARRAY
) => {
  try {
    console.log(`🚀 [enhancedProcedureService] Generating ${procedureType}...`);
    console.log(`   Organization: ${organizationName} (ID: ${organizationId})`);
    console.log(`   Content Types: ${contentTypes}`);
    
    const requestBody = {
      procedure_type: procedureType,
      options: {
        organization_name: organizationName,
        organization_id: organizationId,
        content_types: Array.isArray(contentTypes) ? contentTypes : []  // ✅ ENSURE ARRAY
      }
    };
    
    console.log(`📤 Request body:`, JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/api/enhanced-procedures/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Response error: ${response.status} - ${errorText}`);
      throw new Error(`Generation failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ [enhancedProcedureService] Generated successfully:`, result);
    return result;
    
  } catch (error) {
    console.error('❌ [enhancedProcedureService] Generation error:', error);
    throw error;
  }
};

/**
 * Get current procedure from database
 */
export const getCurrentProcedure = async (procedureType) => {
  try {
    console.log(`📡 [enhancedProcedureService] Fetching current: ${procedureType}`);
    
    const response = await fetch(`${API_BASE_URL}/api/enhanced-procedures/current/${procedureType}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ [enhancedProcedureService] Found current procedure`);
      return data;
    } else if (response.status === 404) {
      console.log(`ℹ️ [enhancedProcedureService] No current procedure found for ${procedureType}`);
      return null;
    } else {
      const errorText = await response.text();
      console.error(`❌ Error fetching procedure: ${response.status} - ${errorText}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ [enhancedProcedureService] Error fetching procedure:`, error);
    return null;
  }
};

export default {
  generateLLMContent,
  getCurrentProcedure
};
