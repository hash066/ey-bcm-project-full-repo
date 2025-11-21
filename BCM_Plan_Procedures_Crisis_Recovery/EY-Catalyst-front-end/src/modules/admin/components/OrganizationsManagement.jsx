import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBuilding, FaPlus, FaSearch, FaSpinner, FaUsers, FaKey, FaTimes, FaArrowLeft, FaSave, FaCheck, FaCalendarAlt, FaTrash, FaExclamationTriangle, FaSync, FaUpload, FaArchive } from 'react-icons/fa';
import { getOrganizations, getUsers, getOrganizationModules, updateOrganizationModules, updateOrganizationLicenseExpiry, deleteOrganization, archiveOrganization, invalidateUsersCache } from '../services/adminService';
import './OrganizationsManagement.css';
import DocumentUpload from './DocumentUpload';

// Module definitions
const MODULES = [
  { id: 1, name: "Process and Service Mapping", description: "Map and document critical business processes and services" },
  { id: 2, name: "Business Impact Analysis", description: "Business Impact Analysis for critical processes" },
  { id: 3, name: "Risk Analysis", description: "Identify and assess risks to business continuity" },
  { id: 4, name: "Recovery Strategy", description: "Develop strategies for business recovery" },
  { id: 5, name: "BCM Plan", description: "Create comprehensive continuity plans" },
  { id: 6, name: "Crisis Management", description: "Plan for crisis response and communication" },
  { id: 7, name: "Training and Testing", description: "Test and validate resilience measures" },
  { id: 8, name: "Procedures", description: "Document operational procedures for business continuity" },
  { id: 9, name: "Policy", description: "Establish business continuity policies" },
  { id: 10, name: "KPIs & BCM Maturity", description: "Measure and track business continuity maturity" },
  { id: 11, name: "Continual Improvement", description: "Continuously improve resilience capabilities" }
];

/**
 * Organizations Management Component
 * Admin panel component for managing organizations
 */
const OrganizationsManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [orgUsers, setOrgUsers] = useState([]);
  const [orgModules, setOrgModules] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingModules, setLoadingModules] = useState(false);
  const [savingModules, setSavingModules] = useState(false);
  const [activeTab, setActiveTab] = useState('licensing');
  const [successMessage, setSuccessMessage] = useState('');
  const [orgLicenseExpiry, setOrgLicenseExpiry] = useState('');
  const [updatingExpiry, setUpdatingExpiry] = useState(false);
  const [organizationIds, setOrganizationIds] = useState({});
  
  // Delete organization state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingOrganization, setDeletingOrganization] = useState(false);

  // Archive organization state
  const [showArchiveConfirmation, setShowArchiveConfirmation] = useState(false);
  const [archiveConfirmText, setArchiveConfirmText] = useState('');
  const [archivingOrganization, setArchivingOrganization] = useState(false);

  // Fetch organizations on component mount
  useEffect(() => {
    fetchOrganizations();
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

  // Fetch organizations from API
  const fetchOrganizations = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get organizations from users data
      const data = await getOrganizations();
      
      // Ensure data is an array
      const orgs = Array.isArray(data) ? data : [];
      
      // Store organization IDs if available
      const idsMap = {};
      orgs.forEach(org => {
        if (org.id && org.name) {
          idsMap[org.name] = org.id;
        }
      });
      
      setOrganizationIds(idsMap);
      setOrganizations(orgs);
      setError(null);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError('Failed to load organizations. Please try again later.');
      
      // Fallback to mock data for development
      const mockData = [
        { id: "48510da2-30a0-4bba-9ea5-ed07c11cb347", name: 'Client1', description: 'Client organization', industry: 'Banking', size: 'Enterprise', location: 'India', created_at: '2023-01-15' },
      ];
      setOrganizations(mockData);
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
        // Continue with refresh even if cache invalidation fails
      }
      
      // Force refresh users data from server (bypass Redis cache)
      await getUsers(true);
      
      // Refetch organizations based on fresh data
      await fetchOrganizations();
      
      setSuccessMessage('Data refreshed successfully from server!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError(`Failed to refresh data: ${err.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle organization card click
  const handleOrgClick = (org) => {
    setSelectedOrg(org);
    setActiveTab('licensing');
    fetchOrgUsers(org);
    fetchOrgModules(org);
  };

  // Fetch users for the selected organization
  const fetchOrgUsers = async (org) => {
    setLoadingUsers(true);
    try {
      const response = await getUsers();
      
      if (!response || !response.users || !Array.isArray(response.users)) {
        throw new Error('Users data is not in expected format');
      }
      
      // Filter users by organization
      const filteredUsers = response.users.filter(user => 
        user.organization === org.name
      );
      
      setOrgUsers(filteredUsers);
    } catch (err) {
      console.error('Error fetching organization users:', err);
      setOrgUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch modules for the selected organization
  const fetchOrgModules = async (org) => {
    if (!org.id) {
      console.error('Cannot fetch modules: Organization ID is missing');
      return;
    }

    setLoadingModules(true);
    try {
      const response = await getOrganizationModules(org.id);
      
      if (!response || !response.modules) {
        throw new Error('Modules data is not in expected format');
      }
      
      // Create a complete modules array with license status
      const modulesWithStatus = MODULES.map(module => {
        const foundModule = response.modules.find(m => m.module_id === module.id);
        return {
          ...module,
          is_licensed: foundModule ? foundModule.is_licensed : false,
          start_date: foundModule ? foundModule.start_date : null,
          expiry_date: foundModule ? foundModule.expiry_date : null
        };
      });
      
      setOrgModules(modulesWithStatus);
    } catch (err) {
      console.error('Error fetching organization modules:', err);
      
      // Fallback to default modules with no licenses
      const defaultModules = MODULES.map(module => ({
        ...module,
        is_licensed: false,
        start_date: null,
        expiry_date: null
      }));
      
      setOrgModules(defaultModules);
    } finally {
      setLoadingModules(false);
    }
  };

  // Handle module license toggle
  const handleModuleToggle = (moduleId) => {
    setOrgModules(prevModules => 
      prevModules.map(module => 
        module.id === moduleId 
          ? { ...module, is_licensed: !module.is_licensed } 
          : module
      )
    );
  };

  // Handle module start date change
  const handleStartDateChange = (moduleId, date) => {
    setOrgModules(prevModules => 
      prevModules.map(module => 
        module.id === moduleId 
          ? { ...module, start_date: date } 
          : module
      )
    );
  };

  // Handle module expiry date change
  const handleExpiryDateChange = (moduleId, date) => {
    setOrgModules(prevModules => 
      prevModules.map(module => 
        module.id === moduleId 
          ? { ...module, expiry_date: date } 
          : module
      )
    );
  };

  // Save module changes
  const saveModuleChanges = async () => {
    if (!selectedOrg.id) {
      setError('Cannot save: Organization ID is missing');
      return;
    }

    setSavingModules(true);
    try {
      // Format modules for API
      const modulesToSave = orgModules
        .filter(module => module.is_licensed)
        .map(module => ({
          module_id: module.id,
          is_licensed: module.is_licensed,
          ...(module.start_date && { start_date: module.start_date }),
          ...(module.expiry_date && { expiry_date: module.expiry_date })
        }));

      await updateOrganizationModules(selectedOrg.id, modulesToSave);
      setSuccessMessage('Module licenses updated successfully!');
    } catch (err) {
      console.error('Error saving module changes:', err);
      setError(`Failed to save module changes: ${err.message}`);
    } finally {
      setSavingModules(false);
    }
  };

  // Go back to organizations list
  const handleBackClick = () => {
    setSelectedOrg(null);
    setOrgUsers([]);
    setOrgModules([]);
  };

  // Format date for input field
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  // Handle organization license expiry date change
  const handleOrgExpiryChange = (e) => {
    setOrgLicenseExpiry(e.target.value);
  };

  // Update organization license expiry
  const updateOrgLicenseExpiry = async () => {
    if (!selectedOrg || !selectedOrg.name || !orgLicenseExpiry) {
      setError('Organization name and expiry date are required');
      return;
    }

    setUpdatingExpiry(true);
    setError(null);
    
    try {
      // Convert date to ISO format with time
      const expiryDate = new Date(orgLicenseExpiry);
      expiryDate.setUTCHours(0, 0, 0, 0);
      const isoDate = expiryDate.toISOString();
      
      await updateOrganizationLicenseExpiry(selectedOrg.name, isoDate);
      setSuccessMessage('Organization license expiry updated successfully!');
    } catch (err) {
      console.error('Error updating organization license expiry:', err);
      setError(`Failed to update license expiry: ${err.message}`);
    } finally {
      setUpdatingExpiry(false);
    }
  };

  // Navigate to add organization page
  const handleAddOrganization = () => {
    navigate('/admin/organizations/add');
  };

  // Handle delete organization button click
  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Prevent triggering the parent click event
    setShowDeleteConfirmation(true);
  };

  // Close delete confirmation dialog
  const closeDeleteConfirmation = () => {
    setShowDeleteConfirmation(false);
    setDeleteConfirmText('');
    setError(null);
  };

  // Handle delete confirmation text change
  const handleDeleteConfirmTextChange = (e) => {
    setDeleteConfirmText(e.target.value);
  };

  // Confirm and execute organization deletion
  const confirmDeleteOrganization = async () => {
    if (deleteConfirmText !== 'confirm') {
      setError('Please type "confirm" to delete the organization');
      return;
    }

    if (!selectedOrg || !selectedOrg.id) {
      setError('Cannot delete organization: Missing organization ID');
      return;
    }

    setDeletingOrganization(true);
    setError(null);

    try {
      await deleteOrganization(selectedOrg.id);
      setSuccessMessage(`Organization ${selectedOrg.name} has been deleted successfully`);
      
      // Close the confirmation dialog
      setShowDeleteConfirmation(false);
      setDeleteConfirmText('');
      
      // Go back to organizations list and refresh the list
      setSelectedOrg(null);
      setOrgUsers([]);
      setOrgModules([]);
      
      // Refresh organizations list
      fetchOrganizations();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error deleting organization:', err);
      setError(`Failed to delete organization: ${err.message}`);
    } finally {
      setDeletingOrganization(false);
    }
  };

  // Handle archive organization button click
  const handleArchiveClick = (e) => {
    e.stopPropagation(); // Prevent triggering the parent click event
    setShowArchiveConfirmation(true);
  };

  // Close archive confirmation dialog
  const closeArchiveConfirmation = () => {
    setShowArchiveConfirmation(false);
    setArchiveConfirmText('');
    setError(null);
  };

  // Handle archive confirmation text change
  const handleArchiveConfirmTextChange = (e) => {
    setArchiveConfirmText(e.target.value);
  };

  // Confirm and execute organization archiving
  const confirmArchiveOrganization = async () => {
    if (archiveConfirmText !== 'confirm') {
      setError('Please type "confirm" to archive the organization');
      return;
    }

    if (!selectedOrg || !selectedOrg.id) {
      setError('Cannot archive organization: Missing organization ID');
      return;
    }

    setArchivingOrganization(true);
    setError(null);

    try {
      await archiveOrganization(selectedOrg.id);
      setSuccessMessage(`Organization ${selectedOrg.name} has been archived successfully`);
      
      // Close the confirmation dialog
      setShowArchiveConfirmation(false);
      setArchiveConfirmText('');
      
      // Go back to organizations list and refresh the list
      setSelectedOrg(null);
      setOrgUsers([]);
      setOrgModules([]);
      
      // Refresh organizations list
      fetchOrganizations();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error archiving organization:', err);
      setError(`Failed to archive organization: ${err.message}`);
    } finally {
      setArchivingOrganization(false);
    }
  };

  // Render organization detail view with tabs
  const renderOrgDetail = () => {
    if (!selectedOrg) return null;

    return (
      <div className="org-detail">
        <div className="org-detail-header">
          <button className="back-button" onClick={handleBackClick}>
            <FaArrowLeft /> Back to Organizations
          </button>
          <h2>{selectedOrg.name}</h2>
          <button className="delete-button" onClick={handleDeleteClick}>
            <FaTrash /> Delete Organization
          </button>
          <button className="archive-button" onClick={handleArchiveClick}>
            <FaArchive /> Archive Organization
          </button>
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

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirmation && (
          <div className="modal-overlay">
            <div className="delete-confirmation-modal">
              <div className="delete-confirmation-header">
                <FaExclamationTriangle className="warning-icon" />
                <h3>Delete Organization</h3>
              </div>
              
              <div className="delete-confirmation-content">
                <p>Are you sure you want to delete <strong>{selectedOrg.name}</strong>?</p>
                <p>This action cannot be undone. All users, data, and settings associated with this organization will be permanently deleted.</p>
                
                <div className="confirmation-input-container">
                  <label htmlFor="deleteConfirmation">Type <strong>confirm</strong> to delete:</label>
                  <input
                    id="deleteConfirmation"
                    type="text"
                    value={deleteConfirmText}
                    onChange={handleDeleteConfirmTextChange}
                    placeholder="confirm"
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="delete-confirmation-actions">
                <button 
                  className="cancel-button" 
                  onClick={closeDeleteConfirmation}
                  disabled={deletingOrganization}
                >
                  Cancel
                </button>
                <button 
                  className="delete-confirm-button" 
                  onClick={confirmDeleteOrganization}
                  disabled={deleteConfirmText !== 'confirm' || deletingOrganization}
                >
                  {deletingOrganization ? (
                    <>
                      <FaSpinner className="spinner" /> Deleting...
                    </>
                  ) : (
                    <>
                      <FaTrash /> Delete Organization
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Archive Confirmation Dialog */}
        {showArchiveConfirmation && (
          <div className="modal-overlay">
            <div className="archive-confirmation-modal">
              <div className="archive-confirmation-header">
                <FaExclamationTriangle className="warning-icon" />
                <h3>Archive Organization</h3>
              </div>
              
              <div className="archive-confirmation-content">
                <p>Are you sure you want to archive <strong>{selectedOrg.name}</strong>?</p>
                <p>This action will remove the organization from the active list and prevent any further modifications.</p>
                
                <div className="confirmation-input-container">
                  <label htmlFor="archiveConfirmation">Type <strong>confirm</strong> to archive:</label>
                  <input
                    id="archiveConfirmation"
                    type="text"
                    value={archiveConfirmText}
                    onChange={handleArchiveConfirmTextChange}
                    placeholder="confirm"
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="archive-confirmation-actions">
                <button 
                  className="cancel-button" 
                  onClick={closeArchiveConfirmation}
                  disabled={archivingOrganization}
                >
                  Cancel
                </button>
                <button 
                  className="archive-confirm-button" 
                  onClick={confirmArchiveOrganization}
                  disabled={archiveConfirmText !== 'confirm' || archivingOrganization}
                >
                  {archivingOrganization ? (
                    <>
                      <FaSpinner className="spinner" /> Archiving...
                    </>
                  ) : (
                    <>
                      <FaArchive /> Archive Organization
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="org-tabs">
          <button 
            className={`tab-button ${activeTab === 'licensing' ? 'active' : ''}`}
            onClick={() => setActiveTab('licensing')}
          >
            <FaKey /> Licensing Information
          </button>
          <button 
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <FaUsers /> Users
          </button>
          <button 
            className={`tab-button ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            <FaUpload /> Upload Documents
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'licensing' && (
            <div className="licensing-tab">
              <div className="licensing-header">
                <h3>Module Licensing</h3>
                <button 
                  className="save-button" 
                  onClick={saveModuleChanges}
                  disabled={savingModules || loadingModules}
                >
                  {savingModules ? <FaSpinner className="spinner" /> : <FaSave />} 
                  {savingModules ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
              
              {loadingModules ? (
                <div className="loading">
                  <FaSpinner className="spinner" /> Loading modules...
                </div>
              ) : (
                <div className="modules-list">
                  {orgModules.map(module => (
                    <div key={`module-${module.id}`} className="module-item">
                      <div className="module-checkbox">
                        <input
                          type="checkbox"
                          id={`module-${module.id}`}
                          checked={module.is_licensed}
                          onChange={() => handleModuleToggle(module.id)}
                        />
                        <label htmlFor={`module-${module.id}`} className="module-name">
                          {module.name}
                        </label>
                      </div>
                      
                      <div className="module-details">
                        <div className="module-description">{module.description}</div>
                        
                        {module.is_licensed && (
                          <div className="module-dates">
                            <div className="module-start-date">
                              <label htmlFor={`start-${module.id}`}>Start Date:</label>
                              <input
                                type="date"
                                id={`start-${module.id}`}
                                value={formatDateForInput(module.start_date)}
                                onChange={(e) => handleStartDateChange(module.id, e.target.value ? new Date(e.target.value).toISOString() : null)}
                              />
                            </div>
                            <div className="module-expiry">
                              <label htmlFor={`expiry-${module.id}`}>Expiry Date:</label>
                              <input
                                type="date"
                                id={`expiry-${module.id}`}
                                value={formatDateForInput(module.expiry_date)}
                                onChange={(e) => handleExpiryDateChange(module.id, e.target.value ? new Date(e.target.value).toISOString() : null)}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="users-tab">
              <h3>Organization Users</h3>
              
              {/* Organization License Expiry Section */}
              <div className="org-license-expiry">
                <h4>Organization License Expiry</h4>
                <div className="expiry-update-container">
                  <div className="expiry-input-group">
                    <label htmlFor="org-expiry-date">
                      <FaCalendarAlt /> Set Organization-wide License Expiry:
                    </label>
                    <input
                      type="date"
                      id="org-expiry-date"
                      value={orgLicenseExpiry}
                      onChange={handleOrgExpiryChange}
                    />
                  </div>
                  <button 
                    className="update-expiry-button"
                    onClick={updateOrgLicenseExpiry}
                    disabled={updatingExpiry || !orgLicenseExpiry}
                  >
                    {updatingExpiry ? <FaSpinner className="spinner" /> : <FaSave />}
                    {updatingExpiry ? 'Updating...' : 'Update Expiry'}
                  </button>
                </div>
                <p className="expiry-help-text">
                  This will set the license expiry date for all users in this organization.
                </p>
              </div>
              
              <h4>Users List</h4>
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
                        <th>Department</th>
                        <th>Subdepartment</th>
                        <th>Process</th>
                        <th>Roles</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orgUsers.map((user, index) => {
                        // Determine user role based on null attributes
                        const determineRole = (user) => {
                          const { department, subdepartment, process } = user;
                          
                          if (!department) {
                            return { role: 'Organization Head', className: 'organization-head' };
                          } else if (!subdepartment) {
                            return { role: 'Department Head', className: 'dept-head' };
                          } else if (!process) {
                            return { role: 'Subdepartment Head', className: 'subdept-head' };
                          } else {
                            return { role: 'Process Owner', className: 'process-owner' };
                          }
                        };
                        
                        const userRole = determineRole(user);
                        
                        return (
                          <tr key={`user-${index}`}>
                            <td>{user.username}</td>
                            <td>{user.display_name || '-'}</td>
                            <td>{user.department || '-'}</td>
                            <td>{user.subdepartment || '-'}</td>
                            <td>{user.process || '-'}</td>
                            <td>
                              <span className={`role-badge ${userRole.className}`}>{userRole.role}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-data">No users found for this organization</p>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="documents-tab">
              <DocumentUpload 
                organizationId={selectedOrg.id} 
                organizationName={selectedOrg.name} 
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render empty state when no organizations are available
  const renderEmptyState = () => (
    <div className="empty-state">
      <FaBuilding className="empty-icon" />
      <h3>No Organizations Found</h3>
      <p>There are no organizations available in the system.</p>
      <button className="add-button" onClick={handleAddOrganization}>
        <FaPlus /> Add Organization
      </button>
    </div>
  );

  // Filter organizations based on search term
  const filteredOrganizations = Array.isArray(organizations) 
    ? organizations.filter(org => 
        org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.location?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <div className="organizations-management">
      {/* Header */}
      {!selectedOrg && (
        <>
          <div className="header">
            <h2><FaBuilding /> Organizations Management</h2>
            <div className="header-actions">
              <button 
                className="refresh-button" 
                onClick={handleRefreshData}
                disabled={refreshing || loading}
                title="Refresh data from server (bypass cache)"
              >
                <FaSync className={refreshing ? 'spinner' : ''} /> 
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button className="add-button" onClick={handleAddOrganization}>
                <FaPlus /> Add Organization
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
              placeholder="Search organizations..."
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
                filteredOrganizations.map(org => (
                  <div 
                    key={org.id || `org-${org.name}`}
                    className="organization-card clickable"
                    onClick={() => handleOrgClick(org)}
                  >
                    <h3 className="org-name">{org.name}</h3>
                    {org.industry && <div className="org-industry">Industry: {org.industry}</div>}
                    {org.sector && <div className="org-sector">Sector: {org.sector}</div>}
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

export default OrganizationsManagement;
