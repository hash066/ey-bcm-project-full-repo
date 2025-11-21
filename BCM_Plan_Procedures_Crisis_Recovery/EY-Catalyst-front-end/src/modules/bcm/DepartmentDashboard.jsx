import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaChartBar, FaCogs, FaUsers, FaExclamationTriangle } from 'react-icons/fa';

// ✅ FIXED: Changed from port 8000 to 8002
const API_BASE_URL = 'http://localhost:8002';

const DepartmentDashboard = ({ department, onBack }) => {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProcesses = async () => {
      try {
        console.log(`Loading processes for department ${department.id}...`);
        
        // ✅ FIXED: Using correct port 8002
        const response = await fetch(`${API_BASE_URL}/bcm/departments/${department.id}/processes`);
        
        if (response.ok) {
          const processData = await response.json();
          setProcesses(processData);
          console.log(`✅ Loaded ${processData.length} processes for ${department.name}`);
          setError(null);
        } else {
          const errorText = await response.text();
          console.warn('Failed to load processes:', response.status, errorText);
          setProcesses([]);
          setError(`Failed to load processes (Status: ${response.status})`);
        }
      } catch (error) {
        console.error('Error loading processes:', error);
        setProcesses([]);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (department && department.id) {
      loadProcesses();
    }
  }, [department.id]);

  const cardStyle = {
    background: 'rgba(32,32,32,0.75)',
    color: '#FFD700',
    borderRadius: 16,
    padding: '24px',
    margin: '12px 0',
    boxShadow: '0 0 0 2px #FFD70033, 0 4px 16px #000a',
    border: '1px solid #FFD70033',
  };

  return (
    <div style={{
      padding: '48px 0',
      background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
      minHeight: '100vh',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
          <button
            onClick={onBack}
            style={{
              background: 'transparent',
              color: '#FFD700',
              border: '2px solid #FFD700',
              borderRadius: 12,
              padding: '12px 24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginRight: '24px',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#FFD700';
              e.target.style.color = '#000';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = '#FFD700';
            }}
          >
            <FaArrowLeft /> Back
          </button>
          <h1 style={{ color: '#FFD700', fontSize: 32, margin: 0 }}>{department.name} Dashboard</h1>
        </div>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 32 }}>
          <div style={{ ...cardStyle, flex: '1 1 200px' }}>
            <FaChartBar size={24} style={{ marginBottom: 12 }} />
            <h3 style={{ margin: '8px 0', fontSize: '18px' }}>BIA Progress</h3>
            <div style={{ color: '#fff', fontSize: '14px' }}>
              <div style={{ marginBottom: '4px' }}>Completed: {department.completed_bia || 0}</div>
              <div style={{ marginBottom: '4px' }}>Total: {department.total_processes || 0}</div>
              <div>Rate: {department.completion_rate || 0}%</div>
            </div>
          </div>

          <div style={{ ...cardStyle, flex: '1 1 200px' }}>
            <FaExclamationTriangle size={24} style={{ marginBottom: 12 }} />
            <h3 style={{ margin: '8px 0', fontSize: '18px' }}>Critical Processes</h3>
            <div style={{ color: '#fff', fontSize: 32, fontWeight: 'bold' }}>
              {department.critical_processes || 0}
            </div>
          </div>

          <div style={{ ...cardStyle, flex: '1 1 200px' }}>
            <FaCogs size={24} style={{ marginBottom: 12 }} />
            <h3 style={{ margin: '8px 0', fontSize: '18px' }}>Total Processes</h3>
            <div style={{ color: '#fff', fontSize: 32, fontWeight: 'bold' }}>
              {processes.length}
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ marginBottom: 16, fontSize: '20px' }}>Department Processes</h3>
          {loading ? (
            <div style={{ color: '#fff', textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: '16px' }}>Loading processes...</div>
            </div>
          ) : error ? (
            <div style={{ 
              color: '#ff6b6b', 
              textAlign: 'center', 
              padding: '40px 20px',
              background: 'rgba(255, 107, 107, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 107, 107, 0.3)'
            }}>
              <FaExclamationTriangle size={32} style={{ marginBottom: '12px' }} />
              <div style={{ fontSize: '16px', marginBottom: '8px' }}>Error Loading Processes</div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>{error}</div>
              <button
                onClick={() => window.location.reload()}
                style={{
                  marginTop: '16px',
                  padding: '8px 16px',
                  background: '#FFD700',
                  color: '#000',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Retry
              </button>
            </div>
          ) : processes.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #FFD700' }}>
                    <th style={{ padding: 12, textAlign: 'left', color: '#FFD700', fontSize: '14px' }}>Process Name</th>
                    <th style={{ padding: 12, textAlign: 'left', color: '#FFD700', fontSize: '14px' }}>Criticality</th>
                    <th style={{ padding: 12, textAlign: 'left', color: '#FFD700', fontSize: '14px' }}>Status</th>
                    <th style={{ padding: 12, textAlign: 'left', color: '#FFD700', fontSize: '14px' }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {processes.map((process, index) => (
                    <tr 
                      key={process.id} 
                      style={{ 
                        borderBottom: '1px solid #333',
                        background: index % 2 === 0 ? 'rgba(255, 215, 0, 0.03)' : 'transparent'
                      }}
                    >
                      <td style={{ padding: 12, color: '#fff', fontSize: '14px' }}>{process.name}</td>
                      <td style={{ padding: 12, fontSize: '14px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          background: process.criticality === 'Critical' ? 'rgba(255, 107, 107, 0.2)' : 'rgba(100, 200, 100, 0.2)',
                          color: process.criticality === 'Critical' ? '#ff6b6b' : '#64c864',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {process.criticality || 'Normal'}
                        </span>
                      </td>
                      <td style={{ padding: 12, color: '#fff', fontSize: '14px' }}>
                        {process.status || 'Not Started'}
                      </td>
                      <td style={{ padding: 12, color: '#aaa', fontSize: '13px' }}>
                        {process.description || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ 
              color: '#aaa', 
              textAlign: 'center', 
              padding: '40px 20px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '8px'
            }}>
              <FaCogs size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <div style={{ fontSize: '16px' }}>No processes found for this department.</div>
              <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7 }}>
                Processes will appear here once they are added to the system.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepartmentDashboard;
