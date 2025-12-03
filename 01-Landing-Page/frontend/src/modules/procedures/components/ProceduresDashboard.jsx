import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFileAlt, FaClipboardCheck, FaFileContract } from 'react-icons/fa';

/**
 * Procedures Dashboard Component
 * Displays the main dashboard for the Procedures module
 */
const ProceduresDashboard = () => {
  const navigate = useNavigate();

  // Procedure options data
  const procedureOptions = [
    {
      id: 'bia',
      title: 'BIA Procedures',
      description: 'Business Impact Analysis procedures for identifying critical processes and recovery priorities',
      icon: <FaFileAlt size={40} />,
      path: '/procedures/bia-procedures'
    },
    {
      id: 'risk',
      title: 'Risk Assessment Procedures',
      description: 'Procedures for identifying, analyzing, and evaluating business continuity risks',
      icon: <FaClipboardCheck size={40} />,
      path: '/procedures/risk-assessment-procedures'
    },
    {
      id: 'bcm',
      title: 'BCM Plan Development Procedures',
      description: 'Procedures for developing and implementing business continuity management plans',
      icon: <FaFileContract size={40} />,
      path: '/procedures/bcm-plan-procedures'
    }
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#FFD700', marginBottom: '30px' }}>Procedures</h1>
      
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '20px'
      }}>
        {procedureOptions.map((option) => (
          <div 
            key={option.id}
            onClick={() => navigate(option.path)}
            style={{
              background: '#232323',
              borderRadius: '10px',
              padding: '25px',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              border: '1px solid #333',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.2)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ marginBottom: '20px', color: '#FFD700' }}>
              {option.icon}
            </div>
            <h2 style={{ color: '#FFD700', marginBottom: '15px', fontSize: '20px' }}>
              {option.title}
            </h2>
            <p style={{ color: '#ccc', marginBottom: '20px', flex: 1 }}>
              {option.description}
            </p>
            <div style={{
              background: '#FFD700',
              color: '#232323',
              padding: '8px 15px',
              borderRadius: '5px',
              display: 'inline-block',
              fontWeight: 'bold',
              textAlign: 'center',
              marginTop: 'auto'
            }}>
              View Procedures
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProceduresDashboard;