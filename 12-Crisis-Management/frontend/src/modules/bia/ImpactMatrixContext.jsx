import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { decodeToken } from '../../services/authService';

// Context for sharing impact matrix data across components
const ImpactMatrixContext = createContext();

// Custom hook to use the impact matrix context
export const useImpactMatrix = () => {
  const context = useContext(ImpactMatrixContext);
  if (!context) {
    throw new Error('useImpactMatrix must be used within an ImpactMatrixProvider');
  }
  return context;
};

// Provider component for impact matrix synchronization
export const ImpactMatrixProvider = ({ children }) => {
  // Central state for organization impact matrix
  const [organizationMatrix, setOrganizationMatrix] = useState({
    impactTypes: [],
    impactLevels: [],
    cells: [],
    sector: '',
    lastUpdated: null
  });

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync status
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'synced', 'error'

  // Get organization ID from token
  const getOrganizationId = () => {
    const decodedToken = decodeToken();
    return decodedToken?.organization_id || null;
  };

  // Load organization impact matrix
  const loadOrganizationMatrix = useCallback(async () => {
    const orgId = getOrganizationId();
    if (!orgId) {
      setError('No organization ID found');
      return;
    }

    setLoading(true);
    setSyncStatus('syncing');

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/organizations/${orgId}/impact-matrix/frontend`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load organization matrix: ${response.status}`);
      }

      const result = await response.json();

      if (result.success !== false && result.data) {
        const matrixData = result.data;
        setOrganizationMatrix({
          impactTypes: matrixData.impact_types || [],
          impactLevels: matrixData.impact_levels || [],
          cells: matrixData.cells || [],
          sector: matrixData.sector || '',
          lastUpdated: new Date()
        });
        setSyncStatus('synced');
      } else {
        // Initialize empty matrix if none exists
        setOrganizationMatrix({
          impactTypes: [],
          impactLevels: [],
          cells: [],
          sector: '',
          lastUpdated: null
        });
        setSyncStatus('idle');
      }

      setError(null);
    } catch (err) {
      console.error('Error loading organization matrix:', err);
      setError(err.message);
      setSyncStatus('error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Save organization impact matrix
  const saveOrganizationMatrix = useCallback(async (matrixData) => {
    const orgId = getOrganizationId();
    if (!orgId) {
      setError('No organization ID found');
      return false;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/organizations/${orgId}/impact-matrix/frontend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(matrixData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to save organization matrix: ${response.status}`);
      }

      // Reload matrix to get updated data
      await loadOrganizationMatrix();
      setError(null);
      return true;
    } catch (err) {
      console.error('Error saving organization matrix:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadOrganizationMatrix]);

  // Force sync all views that use this matrix
  const forceSync = useCallback(async () => {
    await loadOrganizationMatrix();
  }, [loadOrganizationMatrix]);

  // Initialize context on mount
  useEffect(() => {
    loadOrganizationMatrix();
  }, [loadOrganizationMatrix]);

  const value = {
    organizationMatrix,
    loading,
    error,
    syncStatus,
    loadOrganizationMatrix,
    saveOrganizationMatrix,
    forceSync,
    clearError: () => setError(null)
  };

  return (
    <ImpactMatrixContext.Provider value={value}>
      {children}
    </ImpactMatrixContext.Provider>
  );
};

export default ImpactMatrixContext;
