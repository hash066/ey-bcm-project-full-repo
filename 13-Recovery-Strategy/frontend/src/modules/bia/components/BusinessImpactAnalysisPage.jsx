import React from 'react';
import BusinessImpactAnalysis from './BusinessImpactAnalysis.jsx';
import Chatbot from '../../../components/Chatbot.jsx';
import '../../../index.css';

function BusinessImpactAnalysisPage() {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      {/* Business Impact Analysis Content */}
      <BusinessImpactAnalysis />
      {/* Chatbot - appears on BIA pages */}
      <Chatbot />
    </div>
  );
}

export default BusinessImpactAnalysisPage;
