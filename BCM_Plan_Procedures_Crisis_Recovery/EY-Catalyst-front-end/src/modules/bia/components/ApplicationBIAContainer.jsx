import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import '../styles/BIAStyles.css';

// Import the real components for the first 3 steps
import BiaMatrix from './BiaMatrix';
import BusinessInformation from './BusinessInformation';
import TechnicalInfo from './TechnicalInfo';
import ProcessCatalogue from './ProcessCatalogue';
import ApplicationCatalogue from './ApplicationCatalogue';
import CriticalApplicationsSummary from './CriticalApplicationsSummary';
import TechMappingExternalApp from './TechMappingExternalApp';

const headerStyle = {
  background: '#181818',
  color: '#FFD700',
  fontWeight: 800,
  fontSize: 16,
  padding: '18px 10px',
  borderBottom: '2.5px solid #FFD700',
  minWidth: 120,
  textAlign: 'center',
  letterSpacing: 0.5,
};

const cellStyle = {
  background: '#232323',
  color: '#FFD700',
  fontWeight: 700,
  textAlign: 'center',
  borderBottom: '1.5px solid #FFD700',
  minWidth: 120,
  padding: '12px 8px',
  fontSize: 15,
  verticalAlign: 'middle',
};

const inputStyle = {
  width: '100%',
  background: 'transparent',
  border: '1px solid #FFD700',
  color: '#fff',
  fontWeight: 600,
  fontSize: 15,
  borderRadius: 6,
  padding: '6px 8px',
  outline: 'none',
  transition: 'border 0.2s',
};

const steps = [
  { label: 'Matrix', path: 'matrix' },
  { label: 'Business Information Table', path: 'business-information' },
  { label: 'Technical Information Table', path: 'technical-information' },
  { label: 'Critical Applications Summary', path: 'critical-applications-summary' },
  { label: 'Tech Mapping External App', path: 'tech-mapping-external-app' },
];

const ApplicationBIAContainer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const contentRef = useRef(null);
  const currentStep = steps.findIndex((step) => location.pathname.endsWith('/' + step.path));

  // Determine if we are on process-catalogue or application-catalogue
  const hideProgressBar = location.pathname.endsWith('/process-catalogue') || location.pathname.endsWith('/application-catalogue');

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 150);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Animation state for fade-in
  const [fadeKey, setFadeKey] = useState(0);
  useEffect(() => {
    setFadeKey(prev => prev + 1);
  }, [location.pathname]);

  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#121212' }}>
      <div style={{ padding: '6px 16px', background: '#181818', borderBottom: '1px solid #FFD700', flexShrink: 0 }}>
        <button
          onClick={() => navigate('/business-impact-analysis')}
          style={{ background: 'none', color: '#FFD700', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 14, textDecoration: 'underline' }}
        >
          ← Back to BIA Dashboard
        </button>
      </div>
      {/* Conditionally render progress bar */}
      {!hideProgressBar && (
        <div style={{ background: '#181818', borderBottom: '3px solid #FFD700', padding: '10px 12px 12px', flexShrink: 0 }}>
          <h1 style={{ color: '#FFD700', margin: 0, fontSize: '18px', textAlign: 'center' }}>Application BIA</h1>
          <div className="bia-progress-bar">
            {steps.map((step, idx) => (
              <div
                key={step.label}
                className={`bia-step${idx === currentStep ? ' active' : ''}${idx < currentStep ? ' completed' : ''} clickable`}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/bia/application-bia/${step.path}`)}
              >
                <div className="step-circle">{step.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div ref={contentRef} className="tab-content" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0', position: 'relative', background: '#121212', scrollBehavior: 'smooth', scrollbarWidth: 'thin', scrollbarColor: '#FFD700 #232323' }}>
        {/* Fade-in animation style */}
        <style>{`
          .fade-in-anim {
            animation: fadeInAppBia 0.5s cubic-bezier(0.4,0,0.2,1);
          }
          @keyframes fadeInAppBia {
            from { opacity: 0; transform: translateY(16px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        {isLoading && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#232323', color: '#FFD700', padding: '12px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, boxShadow: '0 4px 16px #FFD70022', border: '1px solid #FFD700', zIndex: 1000, display: 'flex', alignItems: 'center', gap: 10 }}>
            Loading...
          </div>
        )}
        <div key={fadeKey} className="fade-in-anim" style={{ opacity: isLoading ? 0.8 : 1, transition: 'opacity 0.15s ease' }}>
          <Routes>
            <Route index element={<Navigate to="matrix" replace />} />
            <Route path="matrix" element={<BiaMatrix />} />
            <Route path="business-information" element={<BusinessInformation />} />
            <Route path="technical-information" element={<TechnicalInfo />} />
            <Route path="process-catalogue" element={<ProcessCatalogue />} />
            <Route path="application-catalogue" element={<ApplicationCatalogue />} />
            <Route path="critical-applications-summary" element={<CriticalApplicationsSummary />} />
            <Route path="tech-mapping-external-app" element={<TechMappingExternalApp />} />
            <Route path="*" element={<Navigate to="matrix" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default ApplicationBIAContainer; 