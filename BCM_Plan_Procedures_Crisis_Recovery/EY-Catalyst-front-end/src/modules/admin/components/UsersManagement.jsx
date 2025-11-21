import React, { useState, useEffect } from 'react';
import { getUsers, getAllUsersPasswords, resetUserPassword } from '../services/adminService';
import { FaSearch, FaUserPlus, FaEdit, FaTrash, FaSpinner, FaChevronDown, FaChevronRight, FaBuilding, FaSitemap, FaProjectDiagram, FaUsers, FaUser, FaEye, FaEyeSlash, FaLock, FaExclamationTriangle, FaSync } from 'react-icons/fa';
import './UsersManagement.css';

/**
 * Users Management Component
 * Displays and manages users from the AD DS server in a hierarchical structure
 */
const UsersManagement = () => {
  const [userData, setUserData] = useState({ users: [], total_users: 0 });
  const [passwordData, setPasswordData] = useState({});
  const [loading, setLoading] = useState(true);
  const [passwordsLoading, setPasswordsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedOrgs, setExpandedOrgs] = useState({});
  const [expandedDepts, setExpandedDepts] = useState({});
  const [expandedSubdepts, setExpandedSubdepts] = useState({});
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [resetingPasswords, setResetingPasswords] = useState({});

  // Fetch users data on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await getUsers();
        setUserData(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load users. Please try again later.');
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Fetch password data
  const fetchPasswordData = async () => {
    try {
      setPasswordsLoading(true);
      console.log('Fetching password data...');
      const data = await getAllUsersPasswords();
      console.log('Password data received:', data);
      
      // Convert array to object for easy lookup
      const passwordMap = {};
      
      // Handle different possible response formats
      if (data && Array.isArray(data)) {
        // If data is directly an array
        data.forEach(user => {
          passwordMap[user.username] = user;
        });
      } else if (data && data.users && Array.isArray(data.users)) {
        // If data has a users property
        data.users.forEach(user => {
          passwordMap[user.username] = user;
        });
      } else if (data && typeof data === 'object') {
        // If data is an object with usernames as keys
        Object.keys(data).forEach(username => {
          passwordMap[username] = data[username];
        });
      }
      
      console.log('Password map created:', passwordMap);
      setPasswordData(passwordMap);
    } catch (err) {
      console.error('Failed to load password data:', err);
      // Set empty object to show "No password data" instead of loading
      setPasswordData({});
    } finally {
      setPasswordsLoading(false);
    }
  };

  // Fetch passwords when component mounts
  useEffect(() => {
    fetchPasswordData();
  }, []);

  // Toggle password visibility
  const togglePasswordVisibility = (username) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [username]: !prev[username]
    }));
  };

  // Reset user password
  const handleResetPassword = async (username) => {
    if (!window.confirm(`Are you sure you want to reset password for ${username}?`)) {
      return;
    }

    try {
      setResetingPasswords(prev => ({ ...prev, [username]: true }));
      
      // Generate a temporary password
      const tempPassword = `Temp${Math.random().toString(36).substring(2, 8)}@123`;
      
      await resetUserPassword({
        username: username,
        new_password: tempPassword,
        is_default: true
      });

      // Refresh password data
      await fetchPasswordData();
      
      alert(`Password reset successfully for ${username}. New temporary password: ${tempPassword}`);
    } catch (err) {
      alert(`Failed to reset password: ${err.message}`);
    } finally {
      setResetingPasswords(prev => ({ ...prev, [username]: false }));
    }
  };

  // Toggle organization expansion
  const toggleOrganization = (orgName) => {
    setExpandedOrgs(prev => ({
      ...prev,
      [orgName]: !prev[orgName]
    }));
  };

  // Toggle department expansion
  const toggleDepartment = (orgName, deptName) => {
    const key = `${orgName}-${deptName}`;
    setExpandedDepts(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Toggle subdepartment expansion
  const toggleSubdepartment = (orgName, deptName, subdeptName) => {
    const key = `${orgName}-${deptName}-${subdeptName}`;
    setExpandedSubdepts(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Render user card
  const renderUserCard = (user) => {
    // Format expiration date
    const formatDate = (dateString) => {
      if (!dateString || dateString.includes('9999')) return 'Never expires';
      const date = new Date(dateString);
      return date.toLocaleDateString();
    };

    // Determine user role based on null attributes
    const determineRole = () => {
      const { department, subdepartment, process } = user;
      
      if (!department) {
        return { role: 'Organization Head', className: 'organization-head-badge' };
      } else if (!subdepartment) {
        return { role: 'Department Head', className: 'department-head-badge' };
      } else if (!process) {
        return { role: 'Subdepartment Head', className: 'subdepartment-head-badge' };
      } else {
        return { role: 'Process Owner', className: 'process-owner-badge' };
      }
    };

    const userRole = determineRole();
    const passwordInfo = passwordData[user.username];
    const isPasswordVisible = visiblePasswords[user.username];
    const isResetting = resetingPasswords[user.username];

    return (
      <div key={user.username} className="user-card">
        <div className="user-info">
          <div className="user-avatar">
            <FaUser />
          </div>
          <div className="user-details">
            <div className="user-name">{user.display_name || user.username}</div>
            {user.email && <div className="user-email">{user.email}</div>}
            <div className="user-email">
              <span style={{ color: '#aaa' }}>Expires: </span>
              {formatDate(user.account_expires)}
            </div>
            <span className={`user-role ${userRole.className}`}>{userRole.role}</span>
          </div>
        </div>
        
        {/* Password Section */}
        <div className="user-password-section">
          <div className="password-header">
            <FaLock className="password-icon" />
            <span className="password-label">Password</span>
            {passwordInfo?.is_default_password && (
              <FaExclamationTriangle className="default-password-warning" title="Default password" />
            )}
          </div>
          
          {passwordsLoading ? (
            <div className="password-loading">
              <FaSpinner className="spinner" />
              <span>Loading...</span>
            </div>
          ) : passwordInfo ? (
            <div className="password-content">
              <div className="password-field">
                <input
                  type={isPasswordVisible ? 'text' : 'password'}
                  value={passwordInfo.decrypted_password || ''}
                  readOnly
                  className="password-input"
                />
                <button
                  className="password-toggle-btn"
                  onClick={() => togglePasswordVisibility(user.username)}
                  title={isPasswordVisible ? 'Hide password' : 'Show password'}
                >
                  {isPasswordVisible ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              
              <div className="password-actions">
                <button
                  className="reset-password-btn"
                  onClick={() => handleResetPassword(user.username)}
                  disabled={isResetting}
                  title="Reset password"
                >
                  {isResetting ? <FaSpinner className="spinner" /> : <FaSync />}
                  {isResetting ? 'Resetting...' : 'Reset'}
                </button>
              </div>
              
              {passwordInfo.password_changed_at && (
                <div className="password-meta">
                  <span className="password-changed">
                    Changed: {new Date(passwordInfo.password_changed_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="password-not-found">
              <span>No password data</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Process user data into hierarchical structure
  const processUserData = () => {
    const hierarchy = {};
    
    if (!userData.users) return hierarchy;
    
    userData.users.forEach(user => {
      const { organization, department, subdepartment, process } = user;
      
      // Skip users with no organization (like system accounts)
      if (!organization) return;
      
      // Create organization if it doesn't exist
      if (!hierarchy[organization]) {
        hierarchy[organization] = { departments: {}, users: [] };
      }
      
      // Determine user role based on null attributes
      // Case 1: If department is null - User is at the organization head level
      if (!department) {
        hierarchy[organization].users.push(user);
        return;
      }
      
      // Create department if it doesn't exist
      if (!hierarchy[organization].departments[department]) {
        hierarchy[organization].departments[department] = { subdepartments: {}, users: [] };
      }
      
      // Case 2: If subdepartment is null - User is a department head
      if (!subdepartment) {
        hierarchy[organization].departments[department].users.push(user);
        return;
      }
      
      // Create subdepartment if it doesn't exist
      if (!hierarchy[organization].departments[department].subdepartments[subdepartment]) {
        hierarchy[organization].departments[department].subdepartments[subdepartment] = { processes: {}, users: [] };
      }
      
      // Case 3: If process is null - User is a subdepartment head
      if (!process) {
        hierarchy[organization].departments[department].subdepartments[subdepartment].users.push(user);
        return;
      }
      
      // Case 4: If nothing is null - User is a process owner
      // Create process if it doesn't exist
      if (!hierarchy[organization].departments[department].subdepartments[subdepartment].processes[process]) {
        hierarchy[organization].departments[department].subdepartments[subdepartment].processes[process] = { users: [] };
      }
      
      // Add user to process
      hierarchy[organization].departments[department].subdepartments[subdepartment].processes[process].users.push(user);
    });
    
    return hierarchy;
  };

  // Render hierarchical view
  const renderHierarchy = () => {
    const hierarchy = processUserData();
    
    if (Object.keys(hierarchy).length === 0) {
      return (
        <div className="empty-state">
          <FaUsers className="empty-icon" />
          <div className="empty-text">No users found</div>
        </div>
      );
    }
    
    return Object.entries(hierarchy).map(([orgName, org]) => {
      const isOrgExpanded = expandedOrgs[orgName];
      
      return (
        <div key={orgName} className="organization-container">
          {/* Organization Header */}
          <div 
            className="organization-header"
            onClick={() => toggleOrganization(orgName)}
          >
            <div className="org-info">
              <span className="chevron-icon">
                {isOrgExpanded ? <FaChevronDown /> : <FaChevronRight />}
              </span>
              <div className="org-icon-container">
                <FaBuilding className="org-icon" />
              </div>
              <div className="org-name">{orgName || 'Unknown Organization'}</div>
            </div>
            <div className="org-meta">
              {Object.keys(org.departments).length} {Object.keys(org.departments).length === 1 ? 'department' : 'departments'}
            </div>
          </div>
          
          {/* Organization Users */}
          {isOrgExpanded && org.users && org.users.length > 0 && (
            <div className="organization-users-container">
              <div className="users-section-header">
                <div className="users-section-icon">
                  <FaUsers />
                </div>
                <div className="users-section-title">Organization Management</div>
              </div>
              <div className="users-container">
                {org.users.map(user => renderUserCard(user))}
              </div>
            </div>
          )}
          
          {/* Departments */}
          {isOrgExpanded && (
            <div className="departments-container">
              {Object.entries(org.departments).map(([deptName, dept]) => {
                const deptKey = `${orgName}-${deptName}`;
                const isDeptExpanded = expandedDepts[deptKey];
                
                return (
                  <div key={deptKey} className="department-container">
                    {/* Department Header */}
                    <div 
                      className="department-header"
                      onClick={() => toggleDepartment(orgName, deptName)}
                    >
                      <div className="dept-info">
                        <span className="chevron-icon">
                          {isDeptExpanded ? <FaChevronDown /> : <FaChevronRight />}
                        </span>
                        <div className="dept-icon-container">
                          <FaSitemap className="dept-icon" />
                        </div>
                        <div className="dept-name">{deptName || 'Unknown Department'}</div>
                      </div>
                      <div className="dept-meta">
                        {Object.keys(dept.subdepartments).length} {Object.keys(dept.subdepartments).length === 1 ? 'subdepartment' : 'subdepartments'}
                      </div>
                    </div>
                    
                    {/* Department Users */}
                    {isDeptExpanded && dept.users && dept.users.length > 0 && (
                      <div className="department-users-container">
                        <div className="users-section-header">
                          <div className="users-section-icon">
                            <FaUsers />
                          </div>
                          <div className="users-section-title">Department Management</div>
                        </div>
                        <div className="users-container">
                          {dept.users.map(user => renderUserCard(user))}
                        </div>
                      </div>
                    )}
                    
                    {/* Subdepartments */}
                    {isDeptExpanded && (
                      <div className="subdepartments-container">
                        {Object.entries(dept.subdepartments).map(([subdeptName, subdept]) => {
                          const subdeptKey = `${orgName}-${deptName}-${subdeptName}`;
                          const isSubdeptExpanded = expandedSubdepts[subdeptKey];
                          
                          return (
                            <div key={subdeptKey} className="subdepartment-container">
                              {/* Subdepartment Header */}
                              <div 
                                className="subdepartment-header"
                                onClick={() => toggleSubdepartment(orgName, deptName, subdeptName)}
                              >
                                <div className="subdept-info">
                                  <span className="chevron-icon">
                                    {isSubdeptExpanded ? <FaChevronDown /> : <FaChevronRight />}
                                  </span>
                                  <div className="subdept-icon-container">
                                    <FaSitemap className="subdept-icon" />
                                  </div>
                                  <div className="subdept-name">{subdeptName || 'Unknown Subdepartment'}</div>
                                </div>
                                <div className="subdept-meta">
                                  {Object.keys(subdept.processes).length} {Object.keys(subdept.processes).length === 1 ? 'process' : 'processes'}
                                </div>
                              </div>
                              
                              {/* Subdepartment Users */}
                              {isSubdeptExpanded && subdept.users && subdept.users.length > 0 && (
                                <div className="subdepartment-users-container">
                                  <div className="users-section-header">
                                    <div className="users-section-icon">
                                      <FaUsers />
                                    </div>
                                    <div className="users-section-title">Subdepartment Management</div>
                                  </div>
                                  <div className="users-container">
                                    {subdept.users.map(user => renderUserCard(user))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Processes */}
                              {isSubdeptExpanded && (
                                <div className="processes-container">
                                  {Object.entries(subdept.processes).map(([processName, process]) => {
                                    return (
                                      <div key={processName} className="process-container">
                                        {/* Process Header */}
                                        <div className="process-header">
                                          <div className="process-info">
                                            <div className="process-icon-container">
                                              <FaProjectDiagram className="process-icon" />
                                            </div>
                                            <div className="process-name">{processName || 'Unknown Process'}</div>
                                          </div>
                                        </div>
                                        
                                        {/* Users */}
                                        <div className="users-container">
                                          {process.users.map(user => renderUserCard(user))}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="app-container">
      {/* Header */}
      <div className="header-container">
        <h1 className="header-title">
          <FaUsers className="header-icon" /> 
          Users Management
        </h1>
      </div>

      {/* Stats Card */}
      <div className="stats-card">
        <div className="stats-icon-container">
          <FaUsers className="stats-icon" />
        </div>
        <div className="stats-info">
          <div className="stats-title">Total Users</div>
          <div className="stats-value">{userData.total_users || 0}</div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <div className="error-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="error-text">{error}</div>
        </div>
      )}

      {/* Hierarchical View */}
      <div className="hierarchy-container">
        {loading ? (
          <div className="loading-indicator">
            <FaSpinner className="loading-icon" />
            <div className="loading-text">Loading user data...</div>
          </div>
        ) : (
          renderHierarchy()
        )}
      </div>
    </div>
  );
};

export default UsersManagement;
