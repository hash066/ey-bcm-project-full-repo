import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { FaSync } from 'react-icons/fa';
import BIAInformation from './BIAInformation';
import ImpactAnalysis from './ImpactAnalysis';
import ImpactScale from './ImpactScale';
import '../styles/BIAStyles.css';
import UserProfile from '../../../common/components/UserProfile';
import CriticalVendorDetails from './CriticalVendorDetails';
import MinimumOperatingRequirements from './MinimumOperatingRequirements';
import CriticalStaffDetails from './CriticalStaffDetails';
import ResourcesForResumption from './ResourcesForResumption';
import VitalRecords from './VitalRecords';
import TimelineSummary from './TimelineSummary';
import CriticalityAssessment from './CriticalityAssessment';
import { BIADataProvider } from '../BIADataContext';
import { AuditTrailProvider } from '../AuditTrailContext';
import { RoleProvider } from '../RoleContext';
import Chatbot from '../../../components/Chatbot.jsx';

const steps = [
  { label: 'BIA Information', path: 'bia-information' },
  { label: 'Impact Scale', path: 'impact-scale' },
  { label: 'Impact Analysis', path: 'impact-analysis' },
  { label: 'Critical Vendor Details', path: 'critical-vendor-details' },
  { label: 'Minimum Operating Requirements', path: 'min-operating-requirements' },
  { label: 'Critical Staff Details', path: 'critical-staff-details' },
  { label: 'Resources for Resumption', path: 'resources-for-resumption' },
  { label: 'Vital Records', path: 'vital-records' },
  { label: 'Timeline Summary', path: 'timeline-summary' },
];

const BIAContainer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Gmail-style scrolling state
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const contentRef = useRef(null);
  
  // Find the current step index
  const currentStep = steps.findIndex((step) => location.pathname.endsWith('/' + step.path));

  // Gmail-style smooth scrolling
  const handleScroll = useCallback((event) => {
    const { scrollTop } = event.target;
    setScrollPosition(scrollTop);
  }, []);

  // Optimized loading with faster transitions
  useEffect(() => {
    // Show loading briefly on route change for better UX
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 150); // Reduced from typical 300-500ms to 150ms for faster loading

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <RoleProvider>
      <AuditTrailProvider>
        <BIADataProvider>
          <div style={{ 
            position: 'relative', 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: '#121212',
          }}>
            {/* Back button - outside scrollable container */}
            <div style={{ 
              padding: '6px 16px',
              background: '#181818',
              borderBottom: '1px solid #FFD700',
              flexShrink: 0,
            }}>
              <button
                onClick={() => navigate('/business-impact-analysis')}
                style={{ 
                  background: 'none', 
                  color: '#FFD700', 
                  border: 'none', 
                  fontWeight: 700, 
                  cursor: 'pointer', 
                  fontSize: 14, 
                  textDecoration: 'underline' 
                }}
              >
                ← Back to BIA Dashboard
              </button>
            </div>

            {/* Progress Bar Navigation - outside scrollable container */}
            <div style={{
              background: '#181818',
              borderBottom: '3px solid #FFD700',
              padding: '10px 12px 12px',
              flexShrink: 0,
            }}>
              <h1 style={{ color: '#FFD700', margin: 0, fontSize: '18px', textAlign: 'center' }}>Business Impact Analysis</h1>
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
            </div>

            {/* Gmail-style scrollable content area */}
            <div 
              ref={contentRef}
              className="tab-content" 
              style={{ 
                flex: 1, 
                minHeight: 0, 
                overflowY: 'auto',
                padding: '0',
                position: 'relative',
                background: '#121212',
                // Gmail-style smooth scrolling
                scrollBehavior: 'smooth',
                // Custom scrollbar styling
                scrollbarWidth: 'thin',
                scrollbarColor: '#FFD700 #232323',
              }}
              onScroll={handleScroll}
            >
              {/* Custom scrollbar styles */}
              <style>{`
                .tab-content::-webkit-scrollbar {
                  width: 8px;
                }
                .tab-content::-webkit-scrollbar-track {
                  background: #232323;
                  border-radius: 4px;
                }
                .tab-content::-webkit-scrollbar-thumb {
                  background: #FFD700;
                  border-radius: 4px;
                  transition: background 0.3s ease;
                }
                .tab-content::-webkit-scrollbar-thumb:hover {
                  background: #facc15;
                }
              `}</style>

              {/* Optimized Loading overlay */}
              {isLoading && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: '#232323',
                  color: '#FFD700',
                  padding: '12px 20px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  boxShadow: '0 4px 16px #FFD70022',
                  border: '1px solid #FFD700',
                  zIndex: 1000,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  animation: 'fadeInOut 0.15s ease-in-out',
                }}>
                  <FaSync style={{ animation: 'spin 0.6s linear infinite' }} />
                  Loading...
                </div>
              )}

              {/* Main content with optimized animations */}
              <div style={{
                opacity: isLoading ? 0.8 : 1,
                transition: 'opacity 0.15s ease',
                animation: 'fadeIn 0.3s ease-in-out',
              }}>
            <Routes>
              <Route index element={<Navigate to="bia-information" replace />} />
              <Route path="bia-information" element={<BIAInformation />} />
              <Route path="impact-scale" element={<ImpactScale />} />
              <Route path="impact-analysis" element={<ImpactAnalysis />} />
              <Route path="critical-vendor-details" element={<CriticalVendorDetails />} />
              <Route path="min-operating-requirements" element={<MinimumOperatingRequirements />} />
              <Route path="critical-staff-details" element={<CriticalStaffDetails />} />
              <Route path="resources-for-resumption" element={<ResourcesForResumption />} />
              <Route path="vital-records" element={<VitalRecords />} />
              <Route path="timeline-summary" element={<TimelineSummary />} />
              <Route path="*" element={<Navigate to="bia-information" replace />} />
            </Routes>
              </div>

              {/* Optimized CSS Animations */}
              <style>{`
                @keyframes fadeIn {
                  from { opacity: 0; transform: translateY(10px); }
                  to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeInOut {
                  from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
                  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          </div>
          {/* Chatbot - appears on all BIA pages */}
          <Chatbot />
        </BIADataProvider>
      </AuditTrailProvider>
    </RoleProvider>
  );
};

export default BIAContainer;
