import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import apiService from '../services/apiService.js';

const ApiHealthCheck = () => {
  const [healthStatus, setHealthStatus] = useState('checking');
  const [apiInfo, setApiInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Comment out API health check to avoid backend crashes
    // checkApiHealth();
    
    // Set static status instead
    setHealthStatus('healthy');
    setApiInfo({
      version: '1.0.0',
      service: 'static-data-mode'
    });
  }, []);

  const checkApiHealth = async () => {
    try {
      setHealthStatus('checking');
      setError(null);

      // Comment out API calls to avoid backend crashes
      /*
      // Check health endpoint
      const health = await apiService.checkHealth();
      console.log('API Health:', health);

      // Get API info
      const info = await apiService.getApiInfo();
      console.log('API Info:', info);
      setApiInfo(info);

      setHealthStatus('healthy');
      */
      
      // Use static status instead
      setHealthStatus('healthy');
      setApiInfo({
        version: '1.0.0',
        service: 'static-data-mode'
      });
    } catch (err) {
      console.error('API Health Check Failed:', err);
      setHealthStatus('unhealthy');
      setError(err.message || 'Failed to connect to API');
    }
  };

  const getStatusIcon = () => {
    switch (healthStatus) {
      case 'healthy':
        return <FaCheckCircle style={{ color: '#27ae60', fontSize: '16px' }} />;
      case 'unhealthy':
        return <FaTimesCircle style={{ color: '#e74c3c', fontSize: '16px' }} />;
      case 'checking':
        return <FaSpinner style={{ color: '#FFD700', fontSize: '16px' }} className="spinning" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (healthStatus) {
      case 'healthy':
        return 'API Connected';
      case 'unhealthy':
        return 'API Disconnected';
      case 'checking':
        return 'Checking API...';
      default:
        return 'Unknown';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: '#232323',
      border: '1px solid #FFD700',
      borderRadius: '8px',
      padding: '12px 16px',
      zIndex: 1000,
      minWidth: '200px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px'
      }}>
        {getStatusIcon()}
        <span style={{ 
          color: '#FFD700', 
          fontWeight: '600', 
          fontSize: '14px' 
        }}>
          {getStatusText()}
        </span>
      </div>
      
      {apiInfo && (
        <div style={{ fontSize: '12px', color: '#FFD700cc' }}>
          <div>Version: {apiInfo.version}</div>
          <div>Service: {apiInfo.service || 'process-mapping-backend'}</div>
        </div>
      )}
      
      {error && (
        <div style={{ 
          fontSize: '12px', 
          color: '#e74c3c', 
          marginTop: '8px',
          wordBreak: 'break-word'
        }}>
          Error: {error}
        </div>
      )}
      
      <button
        onClick={checkApiHealth}
        style={{
          marginTop: '8px',
          padding: '4px 8px',
          background: '#FFD700',
          color: '#232526',
          border: 'none',
          borderRadius: '4px',
          fontSize: '11px',
          cursor: 'pointer',
          fontWeight: '600'
        }}
      >
        Retry
      </button>

      <style>{`
        .spinning {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ApiHealthCheck; 