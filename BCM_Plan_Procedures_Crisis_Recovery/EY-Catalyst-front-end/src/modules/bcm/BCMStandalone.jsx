import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaChartBar, FaCogs, FaBuilding, FaDownload, FaFilePdf, FaFileWord, FaHistory, FaCalendarAlt } from 'react-icons/fa';
import { API_BASE_URL } from '../../config';

const BCMStandalone = () => {
  const [view, setView] = useState('main');
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [recoveryStats, setRecoveryStats] = useState(null);
  const [auditTrail, setAuditTrail] = useState([]);
  const [upcomingReviews, setUpcomingReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log("Loading BCM data from API...");
        
        // First test database connection to see what tables exist
        try {
          const testResponse = await fetch(`${API_BASE_URL}/bcm/test-connection`);
          if (testResponse.ok) {
            const testData = await testResponse.json();
            console.log("📊 Database connection test:", testData);
            console.log("📋 Available tables:", testData.available_tables);
            console.log("📈 Table row counts:", testData.table_row_counts);
          }
        } catch (testError) {
          console.warn("Could not test database connection:", testError);
        }
        
        const [statsResponse, deptsResponse, recoveryResponse, auditResponse, reviewsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/bcm/dashboard/stats`),
          fetch(`${API_BASE_URL}/bcm/departments`),
          fetch(`${API_BASE_URL}/bcm/recovery-strategies/stats`),
          fetch(`${API_BASE_URL}/bcm/audit-trail`),
          fetch(`${API_BASE_URL}/bcm/upcoming-reviews`)
        ]);
        
        if (!statsResponse.ok || !deptsResponse.ok) {
          throw new Error('Failed to fetch data from API');
        }
        
        const stats = await statsResponse.json();
        const depts = await deptsResponse.json();
        const recovery = recoveryResponse.ok ? await recoveryResponse.json() : null;
        const audit = auditResponse.ok ? await auditResponse.json() : [];
        const reviews = reviewsResponse.ok ? await reviewsResponse.json() : [];
        
        setDashboardStats(stats);
        setDepartments(depts);
        setRecoveryStats(recovery);
        setAuditTrail(audit);
        setUpcomingReviews(reviews);
        setError(null);
        
        console.log('✅ BCM data loaded successfully');
        
      } catch (err) {
        console.error('❌ BCM API error:', err);
        setError(`Failed to load BCM data: ${err.message}`);
        
        const emptyStats = {
          completed_bia: 0,
          total_processes: 0,
          pending_bia: 0,
          completion_rate: 0,
          total_departments: 0,
          critical_processes: 0
        };
        
        setDashboardStats(emptyStats);
        setDepartments([]);
        setRecoveryStats(null);
        setAuditTrail([]);
        setUpcomingReviews([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const cardStyle = {
    background: 'rgba(32,32,32,0.75)',
    color: '#FFD700',
    borderRadius: 24,
    padding: '32px 28px',
    margin: 12,
    boxShadow: '0 0 0 3px #FFD70033, 0 8px 32px #000a',
    minWidth: 260,
    flex: 1,
    border: '2px solid #FFD70033',
    transition: 'box-shadow 0.2s',
  };

  const sectionTitleStyle = {
    color: '#FFD700',
    fontWeight: 800,
    fontSize: 22,
    marginBottom: 16,
    letterSpacing: 0.5,
  };

  const downloadBCMPdf = async (format) => {
    try {
      const response = await fetch(`${API_BASE_URL}/bcm/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: format
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`BCM Plan generated successfully! ${result.message}`);
      } else {
        throw new Error(`Failed to generate ${format.toUpperCase()}`);
      }
    } catch (err) {
      console.error(`${format.toUpperCase()} generation error:`, err);
      alert(`Failed to generate BCM Plan ${format.toUpperCase()}. Please try again.`);
    }
  };

  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Department List View
  const renderDepartmentList = () => (
    <div style={{
      padding: '48px 0',
      background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
      minHeight: '100vh',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
          <button
            onClick={() => setView('main')}
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
          {departments.map(dept => (
            <div
              key={dept.id}
              style={{
                ...cardStyle,
                cursor: 'pointer'
              }}
              onClick={() => {
                setSelectedDepartment(dept);
                setView('department');
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                <FaBuilding size={24} style={{ marginRight: 12 }} />
                <h3 style={{ margin: 0, fontSize: 20 }}>{dept.name}</h3>
              </div>
              <div style={{ color: '#fff' }}>
                <div>Total Processes: {dept.processes}</div>
                <div>Completed BIA: {dept.completed}</div>
                <div>Critical Processes: {dept.critical_processes || 0}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Department Detail View
  const renderDepartmentDetail = () => (
    <div style={{
      padding: '48px 0',
      background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
      minHeight: '100vh',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
          <button
            onClick={() => setView('departments')}
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
            <FaArrowLeft /> Back
          </button>
          <h1 style={{ color: '#FFD700', fontSize: 32, margin: 0 }}>
            {selectedDepartment?.name} Dashboard
          </h1>
        </div>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 32 }}>
          <div style={cardStyle}>
            <FaChartBar size={24} style={{ marginBottom: 12 }} />
            <h3>BIA Progress</h3>
            <div style={{ color: '#fff' }}>
              <div>Completed: {selectedDepartment?.completed}</div>
              <div>Total: {selectedDepartment?.processes}</div>
            </div>
          </div>

          <div style={cardStyle}>
            <FaCogs size={24} style={{ marginBottom: 12 }} />
            <h3>Critical Processes</h3>
            <div style={{ color: '#fff', fontSize: 24 }}>
              {selectedDepartment?.critical_processes || 0}
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ marginBottom: 16 }}>Department Processes</h3>
          <div style={{ color: '#ccc', fontSize: 14 }}>
            Process details will be loaded from the department-specific API endpoint.
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
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
        Loading BCM Dashboard...
      </div>
    );
  }

  if (error) {
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
          <div style={{ marginBottom: '16px', color: '#ccc', fontSize: '14px' }}>
            Make sure the backend server is running on port 8000
          </div>
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
    return renderDepartmentList();
  }

  if (view === 'department') {
    return renderDepartmentDetail();
  }

  // Main Dashboard View
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
            onClick={() => setShowExportDropdown(!showExportDropdown)}
            style={{
              background: 'linear-gradient(90deg, #FFD700 0%, #facc15 100%)',
              color: '#232323',
              border: 'none',
              borderRadius: '18px 18px 0 0',
              fontWeight: 900,
              fontSize: 20,
              padding: '14px 38px',
              cursor: 'pointer',
              boxShadow: '0 4px 24px #FFD70055',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              transition: 'all 0.18s cubic-bezier(.4,2,.6,1)',
              position: 'relative',
            }}
          >
            <FaDownload style={{ fontSize: 22 }} /> Export BCM Plan
          </button>
          {showExportDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              background: '#232323',
              borderRadius: '0 0 12px 12px',
              overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
              zIndex: 10,
            }}>
              <button
                onClick={() => {
                  downloadBCMPdf('pdf');
                  setShowExportDropdown(false);
                }}
                style={{
                  background: 'transparent',
                  color: '#FFD700',
                  border: 'none',
                  padding: '12px 38px',
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'background 0.2s',
                  ':hover': {
                    background: '#2a2a2a'
                  }
                }}
              >
                <FaFilePdf /> Export as PDF
              </button>
              <button
                onClick={() => {
                  downloadBCMPdf('doc');
                  setShowExportDropdown(false);
                }}
                style={{
                  background: 'transparent',
                  color: '#FFD700',
                  border: 'none',
                  padding: '12px 38px',
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'background 0.2s',
                  ':hover': {
                    background: '#2a2a2a'
                  }
                }}
              >
                <FaFileWord /> Export as DOC
              </button>
            </div>
          )}
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
          </div>
          
          {/* Departments Overview */}
          <div style={cardStyle}>
            <FaBuilding size={36} color="#FFD700" />
            <div style={sectionTitleStyle}>Departments</div>
            <div style={{ color: '#fff' }}>Total Departments: {dashboardStats?.total_departments || 0}</div>
            <div style={{ color: '#fff' }}>Total Processes: {dashboardStats?.total_processes || 0}</div>
            <div style={{ color: '#fff' }}>Critical Processes: {dashboardStats?.critical_processes || 0}</div>
          </div>
          
          {/* Recovery Strategies */}
          <div style={cardStyle}>
            <FaCogs size={36} color="#FFD700" />
            <div style={sectionTitleStyle}>Recovery Strategies</div>
            <div style={{ color: '#fff' }}>Implemented: {recoveryStats?.implemented || 0}</div>
            <div style={{ color: '#fff' }}>In Progress: {recoveryStats?.in_progress || 0}</div>
            <div style={{ color: '#fff' }}>Not Started: {recoveryStats?.not_started || 0}</div>
            <div style={{ fontSize: '12px', color: '#ccc', marginTop: '8px' }}>
              Total: {recoveryStats?.total || 0} strategies
            </div>
          </div>
        </div>
        
        {/* Audit Trail and Reviews */}
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginTop: 36 }}>
          <div style={{ ...cardStyle, minWidth: 340 }}>
            <FaHistory size={36} color="#FFD700" />
            <div style={sectionTitleStyle}>Recent Activity</div>
            {auditTrail.length > 0 ? (
              <ul style={{ paddingLeft: 18, color: '#fff' }}>
                {auditTrail.map((item, index) => (
                  <li key={index} style={{ marginBottom: 8, fontSize: 14 }}>
                    <strong>{item.user}</strong> {item.action} ({item.date})
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ color: '#ccc', fontSize: 14 }}>No recent activities found</div>
            )}
          </div>
          
          <div style={{ ...cardStyle, minWidth: 340 }}>
            <FaCalendarAlt size={36} color="#FFD700" />
            <div style={sectionTitleStyle}>Upcoming Reviews</div>
            {upcomingReviews.length > 0 ? (
              <ul style={{ paddingLeft: 18, color: '#fff' }}>
                {upcomingReviews.map((item, index) => (
                  <li key={index} style={{ marginBottom: 8, fontSize: 14 }}>
                    <strong>{item.name}</strong> - {item.date}
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ color: '#ccc', fontSize: 14 }}>No upcoming reviews scheduled</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BCMStandalone;