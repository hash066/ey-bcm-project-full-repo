import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/BIAStyles.css';
import { updateOrganizationCriticality } from '../services/biaService';
import { decodeToken } from '../../../services/authService';

const CriticalityAssessment = () => {
  const navigate = useNavigate();
  const [criticalityThreshold, setCriticalityThreshold] = useState(4); // Default threshold of 4 hours
  const [organizationId, setOrganizationId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Get organization ID from token
  useEffect(() => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        const decodedToken = decodeToken();
        if (decodedToken && decodedToken.organization_id) {
          setOrganizationId(decodedToken.organization_id);
        }
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      setError('Failed to get organization ID. Please log in again.');
    }
  }, []);

  const handleThresholdChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setCriticalityThreshold(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!organizationId) {
      setError('Organization ID not found. Please log in again.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await updateOrganizationCriticality(organizationId, criticalityThreshold);
      setSuccess(true);
      setTimeout(() => {
        navigate('/bia');
      }, 2000);
    } catch (error) {
      console.error('Error updating criticality threshold:', error);
      setError(error.message || 'Failed to update organization criticality threshold');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bia-container">
      <div className="bia-form-container" style={{ maxWidth: '600px', margin: '40px auto' }}>
        <h1 style={{ color: '#FFD700', marginBottom: '24px', textAlign: 'center' }}>
          RTO Criticality Threshold
        </h1>
        
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <p style={{ color: '#fff', fontSize: '16px', lineHeight: '1.6' }}>
            Set the Recovery Time Objective (RTO) threshold for critical processes. Any process with an RTO less than this value will be considered critical.
          </p>
        </div>

        {error && (
          <div style={{ 
            backgroundColor: 'rgba(220, 53, 69, 0.1)', 
            color: '#dc3545', 
            padding: '12px', 
            borderRadius: '4px', 
            marginBottom: '20px',
            border: '1px solid rgba(220, 53, 69, 0.3)'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ 
            backgroundColor: 'rgba(40, 167, 69, 0.1)', 
            color: '#28a745', 
            padding: '12px', 
            borderRadius: '4px', 
            marginBottom: '20px',
            border: '1px solid rgba(40, 167, 69, 0.3)'
          }}>
            RTO threshold updated successfully! Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', marginBottom: '12px', color: '#FFD700', fontWeight: '600', fontSize: '18px' }}>
              Set RTO Threshold (in hours):
            </label>
            
            <div style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '24px',
              borderRadius: '8px',
              border: '1px solid #444'
            }}>
              <div style={{ marginBottom: '20px' }}>
                <input
                  type="range"
                  min="1"
                  max="72"
                  value={criticalityThreshold}
                  onChange={handleThresholdChange}
                  style={{ 
                    width: '100%', 
                    height: '6px',
                    appearance: 'none',
                    background: 'linear-gradient(to right, #FFD700, #FF8E53)',
                    outline: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                />
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginTop: '8px',
                  color: '#aaa',
                  fontSize: '14px'
                }}>
                  <span>1 hour</span>
                  <span>24 hours</span>
                  <span>72 hours</span>
                </div>
              </div>
              
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <input
                  type="number"
                  min="1"
                  max="72"
                  value={criticalityThreshold}
                  onChange={handleThresholdChange}
                  style={{ 
                    width: '80px',
                    padding: '12px',
                    fontSize: '20px',
                    fontWeight: '700',
                    textAlign: 'center',
                    backgroundColor: 'rgba(255, 215, 0, 0.1)',
                    color: '#FFD700',
                    border: '2px solid #FFD700',
                    borderRadius: '6px',
                    marginRight: '12px'
                  }}
                />
                <span style={{ color: '#fff', fontSize: '18px' }}>hours</span>
              </div>
              
              <div style={{ 
                marginTop: '24px',
                padding: '16px',
                backgroundColor: 'rgba(255, 215, 0, 0.05)',
                borderRadius: '6px',
                border: '1px solid rgba(255, 215, 0, 0.2)'
              }}>
                <p style={{ color: '#FFD700', margin: '0 0 8px', fontWeight: '600' }}>What this means:</p>
                <p style={{ color: '#ddd', margin: '0', fontSize: '14px', lineHeight: '1.5' }}>
                  Processes with an RTO of <strong style={{ color: '#FFD700' }}>{criticalityThreshold} hours or less</strong> will be flagged as critical processes requiring immediate recovery planning.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '32px' }}>
            <button 
              type="button" 
              onClick={() => navigate('/bia')}
              style={{ 
                background: 'transparent', 
                color: '#FFD700', 
                border: '1.5px solid #FFD700', 
                borderRadius: '8px', 
                fontWeight: '700', 
                fontSize: '16px', 
                padding: '12px 24px', 
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              style={{ 
                background: '#FFD700', 
                color: '#232323', 
                border: 'none', 
                borderRadius: '8px', 
                fontWeight: '700', 
                fontSize: '16px', 
                padding: '12px 32px', 
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              {isSubmitting ? 'Saving...' : 'Save RTO Threshold'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CriticalityAssessment;
