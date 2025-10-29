// src/modules/procedures/services/procedureService.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002';

/**
 * Fetch a procedure from the database
 */
export const getProcedure = async (procedureType) => {
  try {
    console.log(`📡 [procedureService] Fetching procedure: ${procedureType}`);
    
    const response = await fetch(
      `${API_BASE_URL}/api/enhanced-procedures/current/${procedureType}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`ℹ️ Procedure ${procedureType} not found in database`);
        return { versions: [] };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Successfully fetched procedure: ${procedureType}`);
    
    return {
      versions: [{
        id: data.id,
        content: data.generated_content,
        created_at: data.created_at,
        version: data.version
      }]
    };
    
  } catch (error) {
    console.error(`❌ [procedureService] Error fetching ${procedureType}:`, error.message);
    return { versions: [] };
  }
};

/**
 * Save a procedure - Backend already saves during generation
 */
export const saveProcedure = async (procedureType) => {
  console.log(`💾 [procedureService] Saving ${procedureType}`);
  console.log(`✅ Procedure was already saved during generation`);
  return {
    success: true,
    message: 'Procedure saved during generation',
    procedure_type: procedureType
  };
};

/**
 * Get all versions
 */
export const getProcedureVersions = async (procedureType) => {
  const current = await getProcedure(procedureType);
  return current.versions || [];
};

/**
 * Delete procedure (not yet implemented in backend)
 */
export const deleteProcedure = async (procedureType) => {
  console.log(`🗑️ Delete not yet implemented for: ${procedureType}`);
  throw new Error('Delete not yet implemented in backend');
};

export default {
  getProcedure,
  saveProcedure,
  getProcedureVersions,
  deleteProcedure
};
