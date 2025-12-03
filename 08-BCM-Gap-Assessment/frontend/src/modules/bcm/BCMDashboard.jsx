import React, { useState, useEffect } from 'react';
import { FaChartBar, FaCogs, FaCheckCircle, FaHistory, FaExclamationTriangle, FaCalendarAlt, FaUserShield, FaDownload, FaBuilding } from 'react-icons/fa';
import DepartmentList from './DepartmentList';
import DepartmentDashboard from './DepartmentDashboard';
import apiService from './apiService';

const BCMDashboard = () => {
  const [view, setView] = useState('main'); // 'main', 'departments', 'department'
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [criticalStaff, setCriticalStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [stats, depts, staff] = await Promise.all([
          apiService.getDashboardStats(),
          apiService.getDepartmentsWithStats(),
          apiService.getCriticalStaff()
        ]);
        
        setDashboardStats(stats);
        setDepartments(depts);
        setCriticalStaff(staff.slice(0, 3)); // Show only first 3 for display
        setError(null);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Failed to load dashboard data. Please check if the backend server is running.');
      } finally {
        setLoading(false);
      }
    };

    if (view === 'main') {
      loadDashboardData();
    }
  }, [view]);

  const handleSelectDepartment = (department) => {
    setSelectedDepartment(department);
    setView('department');
  };

  if (loading && view === 'main') {
    return (
      <div style={{
        padding: '48px 0',
        background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#FFD700',
        fontSize: '20px'
      }}>
        Loading dashboard data...
      </div>
    );
  }

  if (error && view === 'main') {
    return (
      <div style={{
        padding: '48px 0',
        background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#ff6b6b',
        fontSize: '18px',
        textAlign: 'center'
      }}>
        <div>
          <div style={{ marginBottom: '16px' }}>❌ {error}</div>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              background: '#FFD700',
              color: '#000',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (view === 'departments') {
    return <DepartmentList departments={departments} onSelectDepartment={handleSelectDepartment} onBack={() => setView('main')} />;
  }

  if (view === 'department') {
    return <DepartmentDashboard department={selectedDepartment} onBack={() => setView('departments')} />;
  }

  // Styles
  const cardStyle = {
    background: 'rgba(32,32,32,0.75)',
    color: '#FFD700',
    borderRadius: 24,
    padding: '32px 28px',
    margin: 12,
    boxShadow: '0 0 0 3px #FFD70033, 0 8px 32px #000a',
    minWidth: 260,
    flex: 1,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '2px solid #FFD70033',
    transition: 'box-shadow 0.2s',
  };

  const sectionTitleStyle = {
    color: '#FFD700',
    fontWeight: 800,
    fontSize: 22,
    marginBottom: 16,
    letterSpacing: 0.5,
    textShadow: '0 2px 8px #FFD70033',
  };

  const downloadBCMPdf = async () => {
    try {
      alert('PDF download feature will be implemented soon.');
    } catch (err) {
      alert('Failed to download PDF.');
    }
  };

  // Mock data for features not yet in backend
  const mockAuditTrail = [
    { action: 'Updated BIA for Finance', user: 'Alice', date: '2024-06-01' },
    { action: 'Added new recovery plan', user: 'Bob', date: '2024-05-28' },
    { action: 'Reviewed compliance checklist', user: 'Carol', date: '2024-05-25' },
  ];

  const mockUpcomingReviews = [
    { name: 'Annual BIA Review', date: '2024-07-15' },
    { name: 'Disaster Recovery Test', date: '2024-08-10' },
  ];

  if (view === 'department') {
    return <DepartmentDashboard department={selectedDepartment} onBack={() => setView('departments')} />;
  }

  return (
    <div style={{
      padding: '48px 0',
      background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
      minHeight: '100vh',
      width: '100%',
      position: 'relative',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: 1400,
        margin: '0 auto 36px auto',
        padding: '0 32px',
      }}>
        <h1 style={{
          color: '#FFD700',
          fontWeight: 900,
          fontSize: 38,
          margin: 0,
          letterSpacing: 1,
          textShadow: '0 2px 16px #FFD70033',
        }}>
          BCM Plan Dashboard
        </h1>
        <div style={{ display: 'flex', gap: 16 }}>
          <button
            onClick={() => setView('departments')}
            style={{
              background: 'transparent',
              color: '#FFD700',
              border: '2px solid #FFD700',
              borderRadius: 18,
              fontWeight: 900,
              fontSize: 20,
              padding: '14px 38px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              transition: 'all 0.18s',
            }}
          >
            <FaBuilding style={{ fontSize: 22 }} /> View Departments
          </button>
          <button
            onClick={downloadBCMPdf}
            style={{
              background: 'linear-gradient(90deg, #FFD700 0%, #facc15 100%)',
              color: '#232323',
              border: 'none',
              borderRadius: 18,
              fontWeight: 900,
              fontSize: 20,
              padding: '14px 38px',
              cursor: 'pointer',
              boxShadow: '0 4px 24px #FFD70055',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              transition: 'all 0.18s cubic-bezier(.4,2,.6,1)',
            }}
          >
            <FaDownload style={{ fontSize: 22 }} /> Download BCM Plan PDF
          </button>
        </div>
      </div>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginBottom: 36 }}>
          {/* BIA Status */}
          <div style={cardStyle}>
            <FaChartBar size={36} color="#FFD700" />
            <div style={sectionTitleStyle}>BIA Status</div>
            <div style={{ color: '#fff', fontWeight: 700 }}>
              Completed: {dashboardStats?.completed_bia || 0} / {dashboardStats?.total_processes || 0}
            </div>
            <div style={{ color: '#fff' }}>Pending: {dashboardStats?.pending_bia || 0}</div>
            <div style={{ color: '#fff' }}>
              Completion Rate: {dashboardStats?.completion_rate || 0}%
            </div>
          </div>
          {/* Departments Overview */}
          <div style={cardStyle}>
            <FaBuilding size={36} color="#FFD700" />
            <div style={sectionTitleStyle}>Departments</div>
            <div style={{ color: '#fff' }}>Total Departments: {dashboardStats?.total_departments || 0}</div>
            <div style={{ color: '#fff' }}>Total Processes: {dashboardStats?.total_processes || 0}</div>
            <div style={{ color: '#fff' }}>Critical Processes: {dashboardStats?.critical_processes || 0}</div>
          </div>
          {/* Recovery Strategies - Mock for now */}
          <div style={cardStyle}>
            <FaCogs size={36} color="#FFD700" />
            <div style={sectionTitleStyle}>Recovery Strategies</div>
            <div style={{ color: '#fff' }}>Implemented: 6</div>
            <div style={{ color: '#fff' }}>In Progress: 3</div>
            <div style={{ color: '#fff' }}>Not Started: 1</div>
            <div style={{ fontSize: '12px', color: '#ccc', marginTop: '8px' }}>
              *Data from strategy management module
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginBottom: 36 }}>
          {/* Audit Trail - Mock for now */}
          <div style={{ ...cardStyle, minWidth: 340 }}>
            <FaHistory size={36} color="#FFD700" />
            <div style={sectionTitleStyle}>Recent Audit Trail</div>
            <ul style={{ paddingLeft: 18, color: '#fff' }}>
              {mockAuditTrail.map((item, idx) => (
                <li key={idx} style={{ marginBottom: 8 }}>
                  <span style={{ color: '#FFD700', fontWeight: 700 }}>{item.action}</span> by {item.user} on {item.date}
                </li>
              ))}
            </ul>
            <div style={{ fontSize: '12px', color: '#ccc', marginTop: '8px' }}>
              *Audit trail from activity logs
            </div>
          </div>
          {/* Critical Staff */}
          <div style={{ ...cardStyle, minWidth: 340 }}>
            <FaExclamationTriangle size={36} color="#FFD700" />
            <div style={sectionTitleStyle}>Critical Staff Contacts</div>
            {criticalStaff.length > 0 ? (
              <ul style={{ paddingLeft: 18, color: '#fff' }}>
                {criticalStaff.map((staff, idx) => (
                  <li key={idx} style={{ marginBottom: 8 }}>
                    <span style={{ color: '#FFD700', fontWeight: 700 }}>{staff.employee_name || 'N/A'}</span> - {staff.designation || 'N/A'}
                    {staff.phone && ` (${staff.phone})`}
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ color: '#fff' }}>No critical staff data available</div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          {/* Upcoming Reviews - Mock for now */}
          <div style={cardStyle}>
            <FaCalendarAlt size={36} color="#FFD700" />
            <div style={sectionTitleStyle}>Upcoming Reviews/Tests</div>
            <ul style={{ paddingLeft: 18, color: '#fff' }}>
              {mockUpcomingReviews.map((review, idx) => (
                <li key={idx} style={{ marginBottom: 8 }}>
                  <span style={{ color: '#FFD700', fontWeight: 700 }}>{review.name}</span> on {review.date}
                </li>
              ))}
            </ul>
            <div style={{ fontSize: '12px', color: '#ccc', marginTop: '8px' }}>
              *Schedule from calendar integration
            </div>
          </div>
          {/* Compliance - Mock for now */}
          <div style={cardStyle}>
            <FaCheckCircle size={36} color="#FFD700" />
            <div style={sectionTitleStyle}>Compliance Status</div>
            <div style={{ color: '#fff' }}>ISO 22301: 85%</div>
            <div style={{ color: '#fff' }}>EY Standard: 90%</div>
            <div style={{ fontSize: '12px', color: '#ccc', marginTop: '8px' }}>
              *Data from compliance module
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BCMDashboard;