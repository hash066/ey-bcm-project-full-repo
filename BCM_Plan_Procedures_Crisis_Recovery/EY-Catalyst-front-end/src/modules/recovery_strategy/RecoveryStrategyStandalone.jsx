import React from 'react';
import RecoveryStrategyDashboard from './RecoveryStrategyDashboard.jsx';

const RecoveryStrategyStandalone = () => {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#121212',
      overflow: 'hidden'
    }}>
      <RecoveryStrategyDashboard />
    </div>
  );
};

export default RecoveryStrategyStandalone;