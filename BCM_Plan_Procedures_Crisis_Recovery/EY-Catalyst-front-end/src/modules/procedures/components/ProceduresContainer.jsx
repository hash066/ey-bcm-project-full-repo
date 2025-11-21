import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProceduresDashboard from './ProceduresDashboard';
import BIAProcedure from './BIAProcedure';
import RiskAssessmentProcedure from './RiskAssessmentProcedure';
import BcmPlanProcedure from './BcmPlanProcedure';
import CrisisCommunicationProcedure from './CrisisCommunicationProcedure';
import NonconformityProcedure from './NonconformityProcedure';
import PerformanceMonitoringProcedure from './PerformanceMonitoringProcedure';
import TestingExercisingProcedure from './TestingExercisingProcedure';
import TrainingAwarenessProcedure from './TrainingAwarenessProcedure';

/**
 * Procedures Container Component
 * Handles routing for the Procedures module
 */
const ProceduresContainer = () => {
  return (
    <div className="procedures-container" style={{ minHeight: '100vh' }}>
      <Routes>
        <Route path="/" element={<ProceduresDashboard />} />
        <Route path="bia-procedures" element={<BIAProcedure />} />
        <Route path="risk-assessment-procedures" element={<RiskAssessmentProcedure />} />
        <Route path="bcm-plan-procedures" element={<BcmPlanProcedure />} />
        <Route path="crisis-communication-procedures" element={<CrisisCommunicationProcedure />} />
        <Route path="nonconformity-procedures" element={<NonconformityProcedure />} />
        <Route path="performance-monitoring-procedures" element={<PerformanceMonitoringProcedure />} />
        <Route path="testing-exercising-procedures" element={<TestingExercisingProcedure />} />
        <Route path="training-awareness-procedures" element={<TrainingAwarenessProcedure />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

/**
 * Coming Soon Component
 * Placeholder for procedure pages that are under development
 */
const ComingSoon = ({ title }) => {
  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1 style={{ 
        color: '#FFD700', 
        marginBottom: '20px',
        fontSize: '28px',
        fontWeight: '700'
      }}>
        {title}
      </h1>
      
      <div style={{
        background: 'linear-gradient(135deg, #181818 80%, #232323 100%)',
        borderRadius: '12px',
        padding: '40px',
        border: '1.5px solid #232323',
        marginTop: '30px'
      }}>
        <div style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#FFD700',
          marginBottom: '20px'
        }}>
          Coming Soon
        </div>
        
        <p style={{
          color: '#FFFFFF',
          fontSize: '16px',
          lineHeight: '1.6'
        }}>
          This section is currently under development. Check back soon for detailed procedures and guidelines.
        </p>
        
        <div style={{
          marginTop: '30px'
        }}>
          <button 
            onClick={() => window.history.back()}
            style={{
              background: '#FFD700',
              color: '#232323',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProceduresContainer;