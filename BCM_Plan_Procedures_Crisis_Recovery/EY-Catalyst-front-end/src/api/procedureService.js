const BASE_URL = '/api/procedures';
const ENHANCED_PROCEDURES_BASE_URL = '/api/enhanced-procedures';

export const getBIAProcedure = async (organizationId) => {
  const response = await fetch(`${BASE_URL}/versions/bia?organization_id=${organizationId}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const getEnhancedProcedure = async (procedureId) => {
  const response = await fetch(`${BASE_URL}/enhanced/${procedureId}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const getProcedureContent = async (procedureId) => {
  const response = await fetch(`${BASE_URL}/${procedureId}/content`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const getProcedureVersions = async (procedureId) => {
  const response = await fetch(`${BASE_URL}/${procedureId}/versions`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const getProcedure = async (procedureType) => {
  const response = await fetch(`${ENHANCED_PROCEDURES_BASE_URL}/current/${procedureType}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};