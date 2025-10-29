import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaDownload, 
  FaBuilding, 
  FaChartBar, 
  FaExclamationTriangle,
  FaUsers,
  FaCheckCircle
} from 'react-icons/fa';
import bcmService from './services/bcmService';

const BCMDashboard = () => {
  const navigate = useNavigate();
  const [dashboardStats, setDashboardStats] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const organizationId = localStorage.getItem('organizationId') || '11110413-8907-4b2a-a44e-58b43a172788';
      
      const [stats, depts] = await Promise.all([
        bcmService.getDashboardStats(organizationId),
        bcmService.getDepartments(organizationId)
      ]);
      
      setDashboardStats(stats);
      setDepartments(depts);
      setError(null);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadOrganizationPDF = async () => {
    try {
      console.log('📥 Starting Organization PDF download...');
      setShowExportDropdown(false);
      const organizationId = localStorage.getItem('organizationId') || '11110413-8907-4b2a-a44e-58b43a172788';
      
      const blob = await bcmService.generateBCMPDF(organizationId, 'organization', null);
      
      if (!blob || blob.size === 0) {
        throw new Error('Received empty PDF');
      }
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `organization_bcm_plan_${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      console.log('✅ PDF downloaded successfully!');
      
    } catch (error) {
      console.error('PDF generation error:', error);
      alert(`Failed to generate PDF: ${error.message}`);
    }
  };

  const downloadOrganizationDOC = async () => {
    try {
      console.log('📝 Starting Organization DOC download...');
      setShowExportDropdown(false);
      window.print();
    } catch (error) {
      console.error('DOC generation error:', error);
      alert(`Failed to generate DOC: ${error.message}`);
    }
  };

  const navigateToOrganizationPlan = () => {
    navigate('/bcm/organization-plan');
  };

  const navigateToDepartmentPlan = (departmentId) => {
    navigate(`/bcm/department-plan/${departmentId}`);
  };

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
          <button
            onClick={loadDashboardData}
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

  return (
    <div style={{
      padding: '48px 0',
      background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
      minHeight: '100vh',
      width: '100%',
    }}>
      {/* Header */}
      <div style={{
        maxWidth: 1400,
        margin: '0 auto 36px auto',
        padding: '0 32px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h1 style={{
              color: '#FFD700',
              fontWeight: 900,
              fontSize: 36,
              margin: 0,
              letterSpacing: 1,
              textShadow: '0 2px 16px #FFD70033',
            }}>
              Business Continuity Management
            </h1>
            <div style={{
              color: '#ccc',
              fontSize: 16,
              marginTop: 8
            }}>
              Comprehensive BCM Planning & Oversight
            </div>
          </div>

          {/* Export Dropdown */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              style={{
                background: 'linear-gradient(90deg, #FFD700 0%, #facc15 100%)',
                color: '#232323',
                border: 'none',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 16,
                padding: '14px 24px',
                cursor: 'pointer',
                boxShadow: '0 4px 24px #FFD70055',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                transition: 'all 0.2s',
              }}
            >
              <FaDownload size={18} /> Export
              <span style={{ fontSize: 12 }}>▼</span>
            </button>

            {showExportDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                backgroundColor: '#1a1a1a',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                minWidth: '220px',
                overflow: 'hidden',
                zIndex: 1000,
                border: '1px solid #FFD70033'
              }}>
                <button
                  onClick={downloadOrganizationPDF}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    backgroundColor: 'transparent',
                    color: '#fff',
                    border: 'none',
                    textAlign: 'left',
                    fontSize: '15px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFD70015'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span style={{ fontSize: '20px' }}>📄</span>
                  <div>
                    <div style={{ fontWeight: '600', color: '#FFD700' }}>Export as PDF</div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                      Download in PDF format
                    </div>
                  </div>
                </button>

                <div style={{ height: '1px', backgroundColor: '#333' }} />

                <button
                  onClick={downloadOrganizationDOC}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    backgroundColor: 'transparent',
                    color: '#fff',
                    border: 'none',
                    textAlign: 'left',
                    fontSize: '15px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFD70015'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span style={{ fontSize: '20px' }}>📝</span>
                  <div>
                    <div style={{ fontWeight: '600', color: '#FFD700' }}>Export as Word</div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                      Download in DOC format
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards - REMOVED COMPLETION RATE */}
      <div style={{
        maxWidth: 1400,
        margin: '0 auto 36px auto',
        padding: '0 32px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24,
        }}>
          <div style={{
            background: 'rgba(32,32,32,0.75)',
            borderRadius: 16,
            padding: '24px',
            border: '1px solid #FFD70033',
            boxShadow: '0 4px 16px #0004',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <FaChartBar size={28} color="#FFD700" />
              <h3 style={{ color: '#FFD700', margin: 0, fontSize: 16 }}>Total Processes</h3>
            </div>
            <div style={{ color: '#fff', fontSize: 36, fontWeight: 800 }}>
              {dashboardStats?.total_processes || 0}
            </div>
          </div>

          <div style={{
            background: 'rgba(32,32,32,0.75)',
            borderRadius: 16,
            padding: '24px',
            border: '1px solid #4CAF5033',
            boxShadow: '0 4px 16px #0004',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <FaCheckCircle size={28} color="#4CAF50" />
              <h3 style={{ color: '#4CAF50', margin: 0, fontSize: 16 }}>Completed BIA</h3>
            </div>
            <div style={{ color: '#fff', fontSize: 36, fontWeight: 800 }}>
              {dashboardStats?.completed_bia || 0}
            </div>
          </div>

          <div style={{
            background: 'rgba(32,32,32,0.75)',
            borderRadius: 16,
            padding: '24px',
            border: '1px solid #ff6b6b33',
            boxShadow: '0 4px 16px #0004',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <FaExclamationTriangle size={28} color="#ff6b6b" />
              <h3 style={{ color: '#ff6b6b', margin: 0, fontSize: 16 }}>Critical Processes</h3>
            </div>
            <div style={{ color: '#fff', fontSize: 36, fontWeight: 800 }}>
              {dashboardStats?.critical_processes || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        maxWidth: 1400,
        margin: '0 auto 36px auto',
        padding: '0 32px',
      }}>
        <h2 style={{
          color: '#FFD700',
          fontSize: 24,
          fontWeight: 800,
          marginBottom: 20,
        }}>
          BCM Plans
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: 20,
        }}>
          <div
            onClick={navigateToOrganizationPlan}
            style={{
              background: 'rgba(32,32,32,0.75)',
              borderRadius: 16,
              padding: '28px',
              border: '2px solid #FFD70033',
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: '0 4px 16px #0004',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = '2px solid #FFD700';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 32px #FFD70033';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = '2px solid #FFD70033';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px #0004';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <FaBuilding size={36} color="#FFD700" />
              <h3 style={{ color: '#FFD700', margin: 0, fontSize: 22, fontWeight: 800 }}>
                Organization-Level BCM Plan
              </h3>
            </div>
            <p style={{ color: '#ccc', margin: 0, lineHeight: 1.6 }}>
              View and manage the organization-wide business continuity plan including crisis management frameworks, emergency procedures, and executive-level protocols.
            </p>
          </div>
        </div>
      </div>

      {/* Departments - REMOVED COMPLETION RATE */}
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        padding: '0 32px',
      }}>
        <h2 style={{
          color: '#FFD700',
          fontSize: 24,
          fontWeight: 800,
          marginBottom: 20,
        }}>
          Department BCM Plans
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20,
        }}>
          {departments.map((dept) => (
            <div
              key={dept.id}
              onClick={() => navigateToDepartmentPlan(dept.id)}
              style={{
                background: 'rgba(32,32,32,0.75)',
                borderRadius: 16,
                padding: '24px',
                border: '1px solid #FFD70033',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 4px 16px #0004',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = '1px solid #FFD700';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 32px #FFD70033';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border = '1px solid #FFD70033';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px #0004';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <FaUsers size={24} color="#FFD700" />
                <h3 style={{ color: '#FFD700', margin: 0, fontSize: 18, fontWeight: 700 }}>
                  {dept.name}
                </h3>
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr 1fr', 
                gap: 12,
                marginTop: 16,
                fontSize: 14,
                color: '#ccc'
              }}>
                <div>
                  <div style={{ color: '#999', fontSize: 12 }}>Total Processes</div>
                  <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>
                    {dept.total_processes || 0}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: 12 }}>Critical</div>
                  <div style={{ color: '#ff6b6b', fontSize: 20, fontWeight: 700 }}>
                    {dept.critical_processes || 0}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: 12 }}>Completed BIA</div>
                  <div style={{ color: '#4CAF50', fontSize: 20, fontWeight: 700 }}>
                    {dept.completed_bia || 0}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BCMDashboard;
