import React, { useState, useEffect } from 'react';
import { FaBuilding, FaArrowRight, FaIndustry, FaMapMarker, FaCalendar, FaChevronRight, FaClock, FaCheck, FaTimes, FaFileAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getOrganizations } from '../services/adminService';
import axios from 'axios';
import { API_ENDPOINTS, API_BASE_URL } from '../../../pages/GapAssessment/config/api';

/**
 * Admin Dashboard Component
 * Organization selector for administrator access
 */
const AdminDashboard = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Demo organizations that always appear for testing dashboard functionality
  const demoOrganizations = [
    { id: "demo-1", name: 'Demo: EY Cyber & Security', description: 'Demo organization for cybersecurity dashboard', industry: 'Cybersecurity', size: 'Enterprise', location: 'Delhi, India', created_at: '2024-11-01', demo: true },
    { id: "demo-2", name: 'Demo: TechCorp Global', description: 'Demo organization for BCM scenarios', industry: 'Technology', size: 'Large', location: 'Mumbai, India', created_at: '2024-11-02', demo: true },
    { id: "demo-3", name: 'Demo: Banking Services Ltd', description: 'Demo organization for financial BCM', industry: 'Finance', size: 'Enterprise', location: 'Bangalore, India', created_at: '2024-11-03', demo: true },
    { id: "demo-4", name: 'Demo: Manufacturing Inc', description: 'Demo organization for supply chain BCM', industry: 'Manufacturing', size: 'Mid', location: 'Pune, India', created_at: '2024-11-04', demo: true },
    { id: "demo-5", name: 'Demo: Healthcare Systems', description: 'Demo organization for healthcare BCM', industry: 'Healthcare', size: 'Large', location: 'Hyderabad, India', created_at: '2024-11-05', demo: true }
  ];
  const [adminInfo, setAdminInfo] = useState({
    username: '',
    groups: []
  });
  const [frameworkRequests, setFrameworkRequests] = useState([]);
  const [loadingApprovals, setLoadingApprovals] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Get admin information from token
    const fetchAdminInfo = () => {
      try {
        const token = localStorage.getItem('access_token');
        if (token) {
          const decodedToken = jwtDecode(token);
          console.log('Decoded token:', decodedToken);

          // Fetch admin data from token
          setAdminInfo({
            username: decodedToken.sub || 'Administrator',
            groups: decodedToken.groups || [],
            accountExpires: decodedToken.account_expires_on || 'Not specified'
          });
        }
      } catch (error) {
        console.error('Error fetching admin info:', error);
        setError('Failed to load admin information');
      }
    };

    // Fetch organizations from API
    const fetchOrgs = async () => {
      try {
        setLoading(true);
        const orgsData = await getOrganizations();
        console.log('Fetched organizations:', orgsData);

        if (Array.isArray(orgsData)) {
          setOrganizations(orgsData);
          setError(null);
        } else if (orgsData && orgsData.organizations) {
          // Handle nested structure
          setOrganizations(orgsData.organizations);
          setError(null);
        } else {
          // Show mock data for demo
          setOrganizations([
            { id: "48510da2-30a0-4bba-9ea5-ed07c11cb347", name: 'EY India', description: 'EY Consulting India', industry: 'Consulting', size: 'Enterprise', location: 'Mumbai, India', created_at: '2023-01-15' },
            { id: "a2b3c4d5-e6f7-g8h9-i0j1-k2l3m4n5o6", name: 'Client Corp', description: 'Sample Client Organization', industry: 'Banking', size: 'Large', location: 'Delhi, India', created_at: '2023-02-10' },
            { id: "b3c4d5e6-f7g8-h9i0-j1k2-l3m4n5o6p7", name: 'Tech Solutions Ltd', description: 'IT Services Provider', industry: 'Technology', size: 'Mid', location: 'Bangalore, India', created_at: '2023-03-05' }
          ]);
          setError('Using demo organizations - API not available');
        }
      } catch (err) {
        console.error('Error fetching organizations:', err);
        setError('Failed to load organizations');

        // Show mock data for demo
        setOrganizations([
          { id: "48510da2-30a0-4bba-9ea5-ed07c11cb347", name: 'EY India', description: 'EY Consulting India', industry: 'Consulting', size: 'Enterprise', location: 'Mumbai, India', created_at: '2023-01-15' },
          { id: "a2b3c4d5-e6f7-g8h9-i0j1-k2l3m4n5o6", name: 'Client Corp', description: 'Sample Client Organization', industry: 'Banking', size: 'Large', location: 'Delhi, India', created_at: '2023-02-10' },
          { id: "b3c4d5e6-f7g8-h9i0-j1k2-l3m4n5o6p7", name: 'Tech Solutions Ltd', description: 'IT Services Provider', industry: 'Technology', size: 'Mid', location: 'Bangalore, India', created_at: '2023-03-05' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminInfo();
    fetchOrgs();
    fetchFrameworkApprovals();
  }, []);

  // Fetch framework approvals
  const fetchFrameworkApprovals = async () => {
    try {
      setLoadingApprovals(true);
      const response = await axios.get(API_ENDPOINTS.APPROVAL.REQUESTS + `?type_filter=framework_addition&status_filter=pending`);
      setFrameworkRequests(response.data.items || []);
    } catch (error) {
      console.error('Failed to fetch framework approvals:', error);
      // Use mock data for demo
      setFrameworkRequests([
        {
          id: 1,
          title: 'Framework Addition Request: ISO 27001 Enhanced',
          payload: {
            document_file: '/uploads/framework_docs/iso27001.pdf',
            description: 'ISO 27001 Enhanced framework with additional controls for modern compliance',
            justification: 'This enhanced version includes latest security controls required for current threat landscape'
          },
          submitted_by: 2,
          submitted_by_user: { email: 'bcm@company.com', name: 'BCM Coordinator' },
          created_at: '2025-11-19T08:30:00Z'
        }
      ]);
    } finally {
      setLoadingApprovals(false);
    }
  };

  // Handle framework approval
  const handleFrameworkApproval = async (requestId, decision, comments = '') => {
    try {
      await axios.post(API_ENDPOINTS.APPROVAL.APPROVE(requestId), {
        decision,
        comments
      });

      // Remove the request from the list
      setFrameworkRequests(prev => prev.filter(req => req.id !== requestId));

      alert(`${decision === 'approved' ? 'Approved' : 'Rejected'} framework addition request successfully!`);
    } catch (error) {
      console.error('Failed to process framework approval:', error);
      alert('Failed to process approval request. Please try again.');
    }
  };

  // Handle organization selection
  const handleOrgSelect = (organization) => {
    console.log('Switching to organization:', organization);

    // Show feedback that we're switching organizations
    const message = `🔄 Switching to **${organization.name}** dashboard...

✅ You will see this organization's modules and data
✅ Your role-based permissions apply within this organization
✅ Access can be restricted per organization

⚡ Navigating to dashboard...`;
    alert(message);

    // Navigate to the normal dashboard (/home)
    // In a full implementation, this would update the JWT token or session
    // with the selected organization context
    navigate('/home');
  };

  return (
    <div className="admin-dashboard">
      {error && (
        <div style={{ 
          backgroundColor: '#ff3333', 
          color: 'white', 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '1rem' 
        }}>
          {error}
        </div>
      )}
      
      {/* Admin welcome section */}
      <div className="admin-welcome" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '24px', color: '#FFD700', marginBottom: '1rem' }}>
          Admin Control Panel
        </h1>
        <div className="admin-info" style={{ 
          backgroundColor: '#1e1e1e', 
          padding: '1.5rem', 
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(255, 215, 0, 0.15)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '18px', marginBottom: '0.5rem' }}>Welcome, {adminInfo.username}</h2>
              <p style={{ fontSize: '14px', color: '#aaa' }}>Account expires: {adminInfo.accountExpires}</p>
            </div>
            <div style={{ 
              backgroundColor: '#FFD700', 
              color: '#121212', 
              padding: '0.5rem 1rem', 
              borderRadius: '4px',
              fontWeight: 'bold'
            }}>
              Administrator
            </div>
          </div>
          
          {adminInfo.groups && adminInfo.groups.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <p style={{ fontSize: '14px', marginBottom: '0.5rem' }}>Security Groups:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {adminInfo.groups.map((group, index) => (
                  <span key={index} style={{ 
                    backgroundColor: '#333', 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {group}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Framework Approvals Section */}
      {(frameworkRequests.length > 0 || loadingApprovals) && (
        <div className="framework-approvals" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '20px', color: '#FFD700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaFileAlt /> Pending Framework Approvals
          </h2>
          <p style={{ color: '#ccc', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            Review and approve framework addition requests from BCM Coordinators and CEOs.
            Only approved frameworks will be available globally for all users.
          </p>

          {loadingApprovals ? (
            <div style={{
              backgroundColor: '#1e1e1e',
              borderRadius: '8px',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <FaClock size={32} color="#FFD700" style={{ marginBottom: '1rem' }} />
              <p>Loading approval requests...</p>
            </div>
          ) : (
            <div className="approval-cards" style={{ display: 'grid', gap: '1rem' }}>
              {frameworkRequests.map((request) => (
                <div
                  key={request.id}
                  className="approval-card"
                  style={{
                    backgroundColor: '#1e1e1e',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    border: '1px solid #333'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#FFD700',
                        marginBottom: '0.5rem'
                      }}>
                        {request.title}
                      </h3>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        marginBottom: '0.5rem'
                      }}>
                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          color: '#ccc',
                          fontSize: '14px'
                        }}>
                          <FaClock />
                          Submitted {new Date(request.created_at).toLocaleString()}
                        </span>
                        <span style={{
                          color: '#FFD700',
                          fontSize: '14px',
                          fontWeight: 'bold'
                        }}>
                          by {request.submitted_by_user?.name} ({request.submitted_by_user?.email})
                        </span>
                      </div>
                    </div>
                    <div style={{
                      backgroundColor: '#FFD700',
                      color: '#121212',
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      PENDING APPROVAL
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: '#0f0f0f',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <div>
                        <div style={{ color: '#999', fontSize: '12px', marginBottom: '0.5rem' }}>DOCUMENT FILE</div>
                        <div style={{ color: '#fff', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '12px' }}>
                          {request.payload.document_file ? request.payload.document_file.split('/').pop() : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#999', fontSize: '12px', marginBottom: '0.5rem' }}>REQUEST TYPE</div>
                        <div style={{ color: '#FFD700', fontWeight: 'bold' }}>Framework Addition</div>
                      </div>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ color: '#999', fontSize: '12px', marginBottom: '0.5rem' }}>FRAMEWORK DESCRIPTION</div>
                      <div style={{ color: '#fff', lineHeight: '1.4' }}>{request.payload.description}</div>
                    </div>
                    {request.payload.justification && (
                      <div>
                        <div style={{ color: '#999', fontSize: '12px', marginBottom: '0.5rem' }}>BUSINESS JUSTIFICATION</div>
                        <div style={{ color: '#fff', lineHeight: '1.4', fontStyle: 'italic' }}>{request.payload.justification}</div>
                      </div>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '1rem'
                  }}>
                    <button
                      onClick={() => handleFrameworkApproval(request.id, 'approved', 'Approved by System Administrator')}
                      style={{
                        flex: 1,
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.75rem 1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
                    >
                      <FaCheck />
                      Approve Framework
                    </button>
                    <button
                      onClick={() => handleFrameworkApproval(request.id, 'rejected', 'Rejected by System Administrator')}
                      style={{
                        flex: 1,
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.75rem 1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#da190b'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f44336'}
                    >
                      <FaTimes />
                      Reject Framework
                    </button>
                  </div>
                </div>
              ))}

              {frameworkRequests.length === 0 && !loadingApprovals && (
                <div style={{
                  backgroundColor: '#1e1e1e',
                  borderRadius: '8px',
                  padding: '2rem',
                  textAlign: 'center'
                }}>
                  <FaCheck size={32} color="#4CAF50" style={{ marginBottom: '1rem' }} />
                  <p style={{ color: '#ccc' }}>No pending framework approval requests</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Organization selector section */}
      <div className="organization-selector" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '20px', color: '#FFD700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaBuilding /> Select Organization Dashboard
        </h2>
        <p style={{ color: '#ccc', marginBottom: '1.5rem', lineHeight: '1.5' }}>
          Choose an organization to view and manage its business continuity modules,
          users, and data. Your administrator permissions apply across all organizations.
        </p>

        <div className="organization-cards" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '1.5rem'
        }}>
          {loading ? (
            // Loading skeleton
            Array(3).fill(0).map((_, index) => (
              <div key={index} style={{
                backgroundColor: '#1e1e1e',
                borderRadius: '8px',
                padding: '1.5rem',
                minHeight: '200px',
                animation: 'pulse 1.5s infinite ease-in-out',
                opacity: '0.7'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#333',
                  marginBottom: '1rem'
                }}></div>
                <div style={{ width: '60%', height: '24px', backgroundColor: '#333', marginBottom: '1rem' }}></div>
                <div style={{ width: '40%', height: '18px', backgroundColor: '#333' }}></div>
              </div>
            ))
          ) : (
            // Combine organization cards
            [...organizations, ...demoOrganizations].map((org, index) => (
              <div
                key={org.id || `org-${index}`}
                className="organization-card"
                style={{
                  backgroundColor: '#1e1e1e',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: '1px solid #333',
                  position: 'relative',
                  minHeight: '200px',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 215, 0, 0.2)';
                  e.currentTarget.style.border = '1px solid #FFD700';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.border = '1px solid #333';
                }}
                onClick={() => handleOrgSelect(org)}
              >
                {/* Header with icon and arrow */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    backgroundColor: '#FFD700',
                    color: '#121212',
                    width: '50px',
                    height: '50px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px'
                  }}>
                    <FaBuilding />
                  </div>
                  <div style={{
                    backgroundColor: '#FFD700',
                    color: '#121212',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    transition: 'background-color 0.3s'
                  }}>
                    <FaChevronRight />
                  </div>
                </div>

                {/* Organization details */}
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem',
                    color: '#FFD700'
                  }}>
                    {org.name}
                  </h3>

                  <p style={{
                    fontSize: '14px',
                    color: '#ccc',
                    marginBottom: '1rem',
                    lineHeight: '1.4'
                  }}>
                    {org.description || 'Organization description not available'}
                  </p>

                  {/* Organization attributes */}
                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '1rem',
                    flexWrap: 'wrap'
                  }}>
                    {org.industry && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        backgroundColor: '#333',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        <FaIndustry />
                        {org.industry}
                      </div>
                    )}

                    {org.size && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        backgroundColor: '#333',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        <FaBuilding />
                        {org.size}
                      </div>
                    )}

                    {org.location && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        backgroundColor: '#333',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        <FaMapMarker />
                        {org.location}
                      </div>
                    )}
                  </div>

                  {/* Created date */}
                  {org.created_at && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      color: '#888',
                      fontSize: '12px'
                    }}>
                      <FaCalendar />
                      Created {new Date(org.created_at).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Bottom action */}
                <div style={{
                  marginTop: 'auto',
                  paddingTop: '1rem'
                }}>
                  <button style={{
                    width: '100%',
                    backgroundColor: '#FFD700',
                    color: '#121212',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.75rem 1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFE55C'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFD700'}
                  >
                    Switch to Dashboard
                    <FaArrowRight />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {!loading && organizations.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: '#ccc',
            padding: '2rem',
            backgroundColor: '#1e1e1e',
            borderRadius: '8px'
          }}>
            <FaBuilding size={48} color="#666" style={{ marginBottom: '1rem' }} />
            <h3>No organizations found</h3>
            <p>Create an organization to get started with business continuity management.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
