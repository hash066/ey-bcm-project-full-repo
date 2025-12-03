import React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import BIAInformation from './BIAInformation';
import ImpactAnalysis from './ImpactAnalysis';
import ImpactScale from './ImpactScale';
import DepartmentSelection from './DepartmentSelection';
import '../styles/BIAStyles.css';
import UserProfile from '../../../common/components/UserProfile';

const steps = [
  { label: 'Department Selection', path: 'department-selection' },
  { label: 'BIA Information', path: 'bia-information' },
  { label: 'Impact Scale', path: 'impact-scale' },
  { label: 'Impact Analysis', path: 'impact-analysis' },
  { label: 'Critical Vendor Details', path: 'critical-vendor-details' },
  { label: 'Minimum Operating Requirements', path: 'min-operating-requirements' },
  { label: 'Critical Staff Details', path: 'critical-staff-details' },
  { label: 'Vital Records', path: 'vital-records' },
  { label: 'Timeline Summary', path: 'timeline-summary' },
];

const BIAContainer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Find the current step index
  const currentStep = steps.findIndex((step) => location.pathname.endsWith('/' + step.path));

  return (
    <div className="bia-main-container">
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => navigate('/business-impact-analysis')}
          style={{ background: 'none', color: '#FFD700', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 16, textDecoration: 'underline' }}
        >
          ← Back to BIA Dashboard
        </button>
      </div>
      {/* Modern Progress Bar Navigation */}
      <div className="bia-progress-bar">
        {steps.map((step, idx) => (
          <div
            key={step.label}
            className={`bia-step${idx === currentStep ? ' active' : ''}${idx < currentStep ? ' completed' : ''} clickable`}
            style={{ cursor: 'pointer' }}
            onClick={() => {
              navigate(`/bia/${step.path}`);
            }}
          >
            <div className="step-circle">{step.label}</div>
          </div>
        ))}
      </div>
      <Routes>
        <Route index element={<Navigate to="department-selection" replace />} />
        <Route path="department-selection" element={<DepartmentSelection />} />
        <Route path="bia-information" element={<BIAInformation />} />
        <Route path="impact-scale" element={<ImpactScale />} />
        <Route path="impact-analysis" element={<ImpactAnalysis />} />
        <Route path="critical-vendor-details" element={<div className="placeholder-page">Critical Vendor Details (Coming Soon)</div>} />
        <Route path="min-operating-requirements" element={<div className="placeholder-page">Minimum Operating Requirements (Coming Soon)</div>} />
        <Route path="critical-staff-details" element={<div className="placeholder-page">Critical Staff Details (Coming Soon)</div>} />
        <Route path="vital-records" element={<div className="placeholder-page">Vital Records (Coming Soon)</div>} />
        <Route path="timeline-summary" element={<div className="placeholder-page">Timeline Summary (Coming Soon)</div>} />
        <Route path="*" element={<Navigate to="department-selection" replace />} />
      </Routes>
    </div>
  );
};

export default BIAContainer;
