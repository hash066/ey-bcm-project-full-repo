import RecoveryStrategyDashboard from './RecoveryStrategyDashboard.jsx';

const RecoveryStrategyTabs = () => {
  return (
    <div style={{
      position: 'relative',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      background: '#121212',
    }}>
      <RecoveryStrategyDashboard />
    </div>
  );
};

export default RecoveryStrategyTabs; 