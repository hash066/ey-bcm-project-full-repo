import React, { useState, useEffect } from 'react';
import { FaBuilding, FaSearch, FaSpinner, FaUsers, FaArrowLeft, FaSync, FaArchive, FaCheck } from 'react-icons/fa';
import { getArchivedUsers, invalidateUsersCache } from '../services/adminService';
import './OrganizationsManagement.css';

/**
 * Archived Organizations Component
 * Admin panel component for viewing archived organizations and users
 */
const ArchivedOrganizations = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [orgUsers, setOrgUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch archived organizations on component mount
  useEffect(() => {
    fetchArchivedOrganizations();
  }, []);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Fetch archived organizations from API
  const fetchArchivedOrganizations = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get archived users data
      const data = await getArchivedUsers();
      
      // Check if the response has the expected structure
      if (!data || !data.users || !Array.isArray(data.users)) {
        throw new Error('Archived users data is not in expected format');
      }
      
      const users = data.users;
      
      // Extract unique organization names from archived users
      const organizationMap = {};
      users.forEach(user => {
        if (user.organization && typeof user.organization === 'string' && user.organization.trim() !== '') {
          if (!organizationMap[user.organization]) {
            organizationMap[user.organization] = {
              name: user.organization,
              userCount: 0,
              users: []
            };
          }
          organizationMap[user.organization].userCount++;
          organizationMap[user.organization].users.push(user);
        }
      });
      
      // Convert to array format
      const orgs = Object.values(organizationMap);
      
      setOrganizations(orgs);
      setError(null);
    } catch (err) {
      console.error('Error fetching archived organizations:', err);
      setError('Failed to load archived organizations. Please try again later.');
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  // Refresh data with force_refresh parameter
  const handleRefreshData = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    setError(null);
    setSuccessMessage('');
    
    try {
      // Invalidate the cache first
      try {
        await invalidateUsersCache();
        console.log('Successfully invalidated users cache');
      } catch (cacheError) {
        console.warn('Failed to invalidate cache:', cacheError);
      }
      
      // Refetch archived organizations based on fresh data
      await fetchArchivedOrganizations();
      
      setSuccessMessage('Archived data refreshed successfully from server!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error refreshing archived data:', err);
      setError(`Failed to refresh archived data: ${err.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle organization card click
  const handleOrgClick = (org) => {
    setSelectedOrg(org);
    setOrgUsers(org.users || []);
  };

  // Go back to organizations list
  const handleBackClick = () => {
    setSelectedOrg(null);
    setOrgUsers([]);
  };

  // Render organization detail view
  const renderOrgDetail = () => {
    if (!selectedOrg) return null;

    return (
      <div className="org-detail">
        <div className="org-detail-header">
          <button className="back-button" onClick={handleBackClick}>
            <FaArrowLeft /> Back to Archived Organizations
          </button>
          <h2>{selectedOrg.name} (Archived)</h2>
        </div>

        {/* Success message */}
        {successMessage && (
          <div className="success-message">
            <FaCheck /> {successMessage}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="tab-content">
          <div className="users-tab">
            <h3>Archived Organization Users</h3>
            
            <h4>Users List ({orgUsers.length} users)</h4>
            {loadingUsers ? (
              <div className="loading">
                <FaSpinner className="spinner" /> Loading users...
              </div>
            ) : orgUsers.length > 0 ? (
              <div className="users-list">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Display Name</th>
                      <th>Email</th>
                      <th>Department</th>
                      <th>Subdepartment</th>
                      <th>Process</th>
                      <th>Account Status</th>
                      <th>Account Expires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgUsers.map((user, index) => (
                      <tr key={`user-${index}`}>
                        <td>{user.username}</td>
                        <td>{user.display_name || '-'}</td>
                        <td>{user.email || '-'}</td>
                        <td>{user.department || '-'}</td>
                        <td>{user.subdepartment || '-'}</td>
                        <td>{user.process || '-'}</td>
                        <td>
                          <span className={`role-badge ${user.account_active ? 'active' : 'inactive'}`}>
                            {user.account_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>{user.account_expires || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-data">No users found for this archived organization</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render empty state when no archived organizations are available
  const renderEmptyState = () => (
    <div className="empty-state">
      <FaArchive className="empty-icon" />
      <h3>No Archived Organizations Found</h3>
      <p>There are no archived organizations in the system.</p>
    </div>
  );

  // Filter organizations based on search term
  const filteredOrganizations = Array.isArray(organizations) 
    ? organizations.filter(org => 
        org.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <div className="organizations-management">
      {/* Header */}
      {!selectedOrg && (
        <>
          <div className="header">
            <h2><FaArchive /> Archived Organizations</h2>
            <div className="header-actions">
              <button 
                className="refresh-button" 
                onClick={handleRefreshData}
                disabled={refreshing || loading}
                title="Refresh archived data from server (bypass cache)"
              >
                <FaSync className={refreshing ? 'spinner' : ''} /> 
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Success message */}
          {successMessage && (
            <div className="success-message">
              <FaCheck /> {successMessage}
            </div>
          )}

          {/* Search bar */}
          <div className="search-bar">
            <FaSearch />
            <input
              type="text"
              placeholder="Search archived organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Organizations list */}
          {loading ? (
            <div className="organizations-list">
              {[1, 2, 3].map((item) => (
                <div
                  key={`skeleton-${item}`}
                  className="organization-card skeleton"
                >
                  <div className="skeleton-title"></div>
                  <div className="skeleton-text"></div>
                  <div className="skeleton-text short"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="organizations-list">
              {filteredOrganizations.length === 0 ? (
                renderEmptyState()
              ) : (
                filteredOrganizations.map((org, index) => (
                  <div 
                    key={`org-${index}`}
                    className="organization-card clickable"
                    onClick={() => handleOrgClick(org)}
                  >
                    <h3 className="org-name">{org.name}</h3>
                    <div className="org-industry">Status: Archived</div>
                    <div className="org-sector">Users: {org.userCount}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Organization detail view */}
      {selectedOrg && renderOrgDetail()}
    </div>
  );
};

export default ArchivedOrganizations;
