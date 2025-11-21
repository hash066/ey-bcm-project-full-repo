
import React from 'react';
import './App.css'; // Import the common CSS file
import MaturityScore from './components/MaturityScore';
import KriPanel from './components/KriPanel';
import AuditSummary from './components/AuditSummary';
import RecentActivity from './components/RecentActivity';

function App() {
  return (
    <div className="dashboard-container">
      <header className="header">
        <h1>EY Governance Dashboard</h1>
      </header>

      <div className="grid-container">
        {/* BCM Maturity Score */}
        <MaturityScore />

        {/* Key Risk Indicators */}
        <KriPanel />
      </div>

      {/* Audit Summary */}
      <AuditSummary />

      {/* Recent Activities */}
      <RecentActivity />
    </div>
  );
}

export default App;