import React from 'react';
import { FaArrowLeft, FaBuilding, FaChartBar } from 'react-icons/fa';

const DepartmentList = ({ departments, onSelectDepartment, onBack }) => {
  const cardStyle = {
    background: 'rgba(32,32,32,0.75)',
    color: '#FFD700',
    borderRadius: 16,
    padding: '24px',
    margin: '12px 0',
    boxShadow: '0 0 0 2px #FFD70033, 0 4px 16px #000a',
    border: '1px solid #FFD70033',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  return (
    <div style={{
      padding: '48px 0',
      background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
      minHeight: '100vh',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
          <button
            onClick={onBack}
            style={{
              background: 'transparent',
              color: '#FFD700',
              border: '2px solid #FFD700',
              borderRadius: 12,
              padding: '12px 24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginRight: '24px'
            }}
          >
            <FaArrowLeft /> Back to Dashboard
          </button>
          <h1 style={{ color: '#FFD700', fontSize: 32, margin: 0 }}>Departments</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {departments && departments.length > 0 ? (
            departments.map(dept => (
              <div
                key={dept.id}
                style={cardStyle}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                  <FaBuilding size={24} style={{ marginRight: 12 }} />
                  <h3 style={{ margin: 0, fontSize: 20 }}>{dept.name}</h3>
                </div>
                <div style={{ color: '#fff' }}>
                  <div>Total Processes: {dept.total_processes || 0}</div>
                  <div>Completed BIA: {dept.completed_bia || 0}</div>
                  <div>Critical Processes: {dept.critical_processes || 0}</div>
                  <div style={{ marginTop: 8, color: '#FFD700' }}>
                    Completion: {dept.completion_rate || 0}%
                  </div>
                </div>
                <div style={{ display: 'flex', marginTop: 16, gap: 10 }}>
                  <button
                    onClick={() => onSelectDepartment(dept)}
                    style={{
                      background: 'transparent',
                      color: '#FFD700',
                      border: '1px solid #FFD700',
                      borderRadius: 8,
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: 14
                    }}
                  >
                    Department Dashboard
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/departmental-bcm-plan/${dept.id}`;
                    }}
                    style={{
                      background: '#FFD700',
                      color: '#000',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: 14
                    }}
                  >
                    View BCM Plan
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '48px',
              background: 'rgba(32,32,32,0.75)',
              borderRadius: 16,
              color: '#ccc'
            }}>
              <FaBuilding size={48} style={{ marginBottom: 24, color: '#FFD700', opacity: 0.5 }} />
              <h3 style={{ color: '#FFD700', marginBottom: 16 }}>No Departments Found</h3>
              <p>There are no departments available. Please check your database connection or add departments to your organization.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepartmentList;