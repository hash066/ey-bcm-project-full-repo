import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ThreatDashboard from './components/ThreatDashboard';
import ProcessRiskAssessment from './components/ProcessRiskAssessment';
import SiteRiskAssessment from './components/SiteRiskAssessment';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ThreatDashboard />} />
        <Route path="/process-risk" element={<ProcessRiskAssessment />} />
        <Route path="/site-risk" element={<SiteRiskAssessment />} />
      </Routes>
    </Router>
  );
}

export default App; 