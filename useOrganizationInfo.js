import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const getOrganizationCriticality = async (organizationId) => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No access token found');
    }
    // Using relative path assuming a proxy is set up, which is better practice
    const response = await fetch(`/api/organizations/${organizationId}/criticality`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch organization criticality');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching organization criticality:', error);
    return null;
  }
};

export const useOrganizationInfo = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [criticalityThreshold, setCriticalityThreshold] = useState('12');
    const [organizationName, setOrganizationName] = useState('Your Organization');
    const [organizationId, setOrganizationId] = useState(null);

    useEffect(() => {
        const fetchOrganizationData = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('access_token');
                if (!token) {
                    throw new Error('No access token found');
                }

                const decodedToken = jwtDecode(token);
                if (decodedToken && decodedToken.organization_id) {
                    const orgId = decodedToken.organization_id;
                    setOrganizationId(orgId);
                    
                    const orgCriticalityData = await getOrganizationCriticality(orgId);
                    
                    if (orgCriticalityData) {
                        if (orgCriticalityData.criticality !== undefined) {
                            setCriticalityThreshold(orgCriticalityData.criticality.toString());
                        } else if (orgCriticalityData.rto_threshold !== undefined) {
                            setCriticalityThreshold(orgCriticalityData.rto_threshold.toString());
                        }
                        
                        if (orgCriticalityData.name) {
                            setOrganizationName(orgCriticalityData.name);
                        } else if (orgCriticalityData.organization_name) {
                            setOrganizationName(orgCriticalityData.organization_name);
                        }
                    }
                } else {
                    throw new Error('Organization ID not found in token');
                }
            } catch (err) {
                setError('Failed to load organization data: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOrganizationData();
    }, []);

    return { loading, error, criticalityThreshold, organizationName, organizationId, setError };
};