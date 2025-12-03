import React, { useEffect, useState } from 'react';
import '../../../index.css';

const statConfig = [
  { key: 'totalDepartments', label: 'Total Departments', icon: '🏢', description: 'Number of departments in your organization.' },
  { key: 'totalSubDepartments', label: 'Total Sub-Departments', icon: '🗂️', description: 'Number of sub-departments under all departments.' },
  { key: 'totalProcesses', label: 'Total Processes', icon: '🔄', description: 'Number of business processes mapped.' },
  { key: 'totalSubProcesses', label: 'Total Sub-Processes', icon: '🧩', description: 'Number of sub-processes mapped.' },
  { key: 'totalBCMCoordinators', label: 'Total BCM Coordinators', icon: '👤', description: 'Number of BCM coordinators assigned.' },
];

const StatModal = ({ open, onClose, stat, value }) => {
  if (!open || !stat) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.55)',
      zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#181818',
        borderRadius: 16,
        boxShadow: '0 8px 32px #FFD70044',
        padding: '36px 32px 28px 32px',
        minWidth: 320,
        maxWidth: 400,
        color: '#FFD700',
        position: 'relative',
        textAlign: 'center',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16, right: 20,
            background: 'none',
            border: 'none',
            color: '#FFD700',
            fontSize: 28,
            cursor: 'pointer',
            fontWeight: 700,
            opacity: 0.7,
          }}
          aria-label="Close"
        >
          ×
        </button>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{stat.icon}</div>
        <h2 style={{ color: '#FFD700', fontWeight: 900, fontSize: 26, marginBottom: 8 }}>{stat.label}</h2>
        <div style={{ color: '#fff', fontWeight: 900, fontSize: 38, marginBottom: 12 }}>{value}</div>
        <div style={{ color: '#FFD700bb', fontSize: 16, marginBottom: 18 }}>{stat.description}</div>
        <div style={{ color: '#fff', fontSize: 15, opacity: 0.85 }}>
          {/* Placeholder for more details, can be replaced with a list or table */}
          More details coming soon...
        </div>
      </div>
    </div>
  );
};

const ProcessServiceMaps = () => {
  const [dashboardData, setDashboardData] = useState({
    totalDepartments: 0,
    totalSubDepartments: 0,
    totalProcesses: 0,
    totalSubProcesses: 0,
    totalBCMCoordinators: 0,
  });
  const [openStat, setOpenStat] = useState(null);

  useEffect(() => {
    fetch('/details.json')
      .then((response) => response.json())
      .then((data) => {
        setDashboardData({
          totalDepartments: data.totalDepartments || 0,
          totalSubDepartments: data.totalSubDepartments || 0,
          totalProcesses: data.totalProcesses || 0,
          totalSubProcesses: data.totalSubProcesses || 0,
          totalBCMCoordinators: data.totalBCMCoordinators || 0,
        });
      })
      .catch((error) => {
        console.error('Error fetching dashboard data:', error);
      });
  }, []);

  return (
    <div style={{
      width: '100%',
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: 'linear-gradient(120deg, #181818 0%, #232526 100%)',
      borderRadius: 16,
      boxShadow: '0 8px 32px #FFD70022',
      padding: '32px 0 48px 0',
      margin: '0 auto',
      maxWidth: 1100,
    }}>
      <h1 style={{
        color: '#FFD700',
        fontWeight: 900,
        fontSize: 32,
        letterSpacing: 1,
        marginBottom: 8,
        textShadow: '0 2px 12px #FFD70044',
      }}>
        Process & Service Mapping Dashboard
      </h1>
      <p style={{
        color: '#f1f1f1',
        fontSize: 18,
        marginBottom: 32,
        opacity: 0.85,
        fontWeight: 400,
        textAlign: 'center',
        maxWidth: 700,
      }}>
        Get a quick overview of your organization's structure and BCM coordination. All stats are live and reflect your current data.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 32,
          width: '100%',
          maxWidth: 900,
        }}
      >
        {statConfig.map((stat) => (
          <div
            key={stat.key}
            style={{
              background: 'linear-gradient(135deg, #232526 60%, #FFD700 200%)',
              borderRadius: 18,
              boxShadow: '0 4px 24px #FFD70022',
              padding: '32px 24px 24px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transition: 'transform 0.18s, box-shadow 0.18s',
              border: '2px solid #FFD70044',
              position: 'relative',
              cursor: 'pointer',
            }}
            onMouseOver={e => {
              e.currentTarget.style.transform = 'translateY(-6px) scale(1.03)';
              e.currentTarget.style.boxShadow = '0 8px 32px #FFD70066';
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 4px 24px #FFD70022';
            }}
            onClick={() => setOpenStat(stat)}
          >
            <div style={{
              fontSize: 38,
              marginBottom: 12,
              color: '#FFD700',
              filter: 'drop-shadow(0 2px 8px #FFD70088)',
            }}>{stat.icon}</div>
            <div style={{
              color: '#FFD700',
              fontWeight: 700,
              fontSize: 22,
              marginBottom: 8,
              letterSpacing: 0.5,
              textAlign: 'center',
            }}>{stat.label}</div>
            <div style={{
              color: '#fff',
              fontWeight: 900,
              fontSize: 36,
              textShadow: '0 2px 12px #FFD70044',
              marginTop: 2,
            }}>{dashboardData[stat.key]}</div>
          </div>
        ))}
      </div>
      <StatModal
        open={!!openStat}
        onClose={() => setOpenStat(null)}
        stat={openStat}
        value={openStat ? dashboardData[openStat.key] : 0}
      />
    </div>
  );
};

export default ProcessServiceMaps; 