import React, { useState } from 'react';
import EnhancedProcedureGenerator from './EnhancedProcedureGenerator';

/**
 * Enhanced Procedure Dashboard
 * Main dashboard for enhanced procedure generation
 */
const EnhancedProcedureDashboard = () => {
  const [selectedProcedureType, setSelectedProcedureType] = useState('bia');

  const procedureTypes = [
    { value: 'bia', label: 'Business Impact Analysis (BIA)' },
    { value: 'bcm_plan', label: 'BCM Plan Development' },
    { value: 'risk_assessment', label: 'Risk Assessment' }
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1 style={{ color: '#FFD700', fontSize: '32px', marginBottom: '10px' }}>
          🚀 Enhanced Procedure Generator
        </h1>
        <p style={{ color: '#ccc', fontSize: '18px', marginBottom: '20px' }}>
          Complete AI-powered procedure generation with database integration
        </p>
        
        {/* Procedure Type Selector */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ color: '#FFD700', fontSize: '16px', marginRight: '15px' }}>
            Select Procedure Type:
          </label>
          <select
            value={selectedProcedureType}
            onChange={(e) => setSelectedProcedureType(e.target.value)}
            style={{
              padding: '10px 15px',
              borderRadius: '5px',
              border: '2px solid #FFD700',
              background: '#232323',
              color: '#fff',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            {procedureTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Features Overview */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '15px', 
          marginBottom: '30px' 
        }}>
          <div style={{ background: '#232323', padding: '15px', borderRadius: '8px', border: '1px solid #FFD700' }}>
            <h3 style={{ color: '#4CAF50', marginBottom: '10px' }}>✨ AI Generation</h3>
            <p style={{ color: '#ccc', fontSize: '14px' }}>
              Complete procedures using your organization's data + Groq AI
            </p>
          </div>
          
          <div style={{ background: '#232323', padding: '15px', borderRadius: '8px', border: '1px solid #FFD700' }}>
            <h3 style={{ color: '#FF9800', marginBottom: '10px' }}>🔄 Regenerate & Refine</h3>
            <p style={{ color: '#ccc', fontSize: '14px' }}>
              Regenerate with fresh AI or refine with custom instructions
            </p>
          </div>
          
          <div style={{ background: '#232323', padding: '15px', borderRadius: '8px', border: '1px solid #FFD700' }}>
            <h3 style={{ color: '#9C27B0', marginBottom: '10px' }}>📊 Gap Analysis</h3>
            <p style={{ color: '#ccc', fontSize: '14px' }}>
              Upload existing procedures for AI-powered gap analysis
            </p>
          </div>
          
          <div style={{ background: '#232323', padding: '15px', borderRadius: '8px', border: '1px solid #FFD700' }}>
            <h3 style={{ color: '#2196F3', marginBottom: '10px' }}>📁 Version Control</h3>
            <p style={{ color: '#ccc', fontSize: '14px' }}>
              Full version management with DOCX export capabilities
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced Procedure Generator */}
      <EnhancedProcedureGenerator procedureType={selectedProcedureType} />
    </div>
  );
};

export default EnhancedProcedureDashboard;