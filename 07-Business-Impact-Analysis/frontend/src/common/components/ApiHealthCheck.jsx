import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import './ApiHealthCheck.css';

const ApiHealthCheck = () => {
  const [healthStatus, setHealthStatus] = useState('checking');
  const [lastChecked, setLastChecked] = useState(null);

  const checkApiHealth = async () => {
    try {
      const response = await fetch('http://localhost:8001/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setHealthStatus('healthy');
      } else {
        setHealthStatus('unhealthy');
      }
    } catch (error) {
      console.error('API health check failed:', error);
      setHealthStatus('unhealthy');
    }
    
    setLastChecked(new Date());
  };

  useEffect(() => {
    checkApiHealth();
    
    // Check health every 30 seconds
    const interval = setInterval(checkApiHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (healthStatus) {
      case 'healthy':
        return <FaCheckCircle className="status-icon" style={{ color: '#27ae60' }} />;
      case 'unhealthy':
        return <FaTimesCircle className="status-icon" style={{ color: '#e74c3c' }} />;
      case 'checking':
        return <FaSpinner className="status-icon spinning" style={{ color: '#f39c12' }} />;
      default:
        return <FaSpinner className="status-icon spinning" style={{ color: '#f39c12' }} />;
    }
  };

  const getStatusText = () => {
    switch (healthStatus) {
      case 'healthy':
        return 'API Connected';
      case 'unhealthy':
        return 'API Disconnected';
      case 'checking':
        return 'Checking...';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="api-health-check">
      {getStatusIcon()}
      <span className="status-text">{getStatusText()}</span>
      {lastChecked && (
        <span className="last-checked">
          {lastChecked.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

export default ApiHealthCheck;