import React, { useState, useEffect } from 'react';
import { FaPlus, FaSpinner, FaCheck, FaExclamationTriangle, FaClock, FaUser, FaCalendarAlt, FaComments, FaSync } from 'react-icons/fa';
import { createModuleRequest, getMyModuleRequests } from '../services/adminService';
import './ModuleRequest.css';

// Module definitions with their IDs
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
 * Module Request Component
 * Allows users to request access to modules and view their request status
 */
const ModuleRequest = ({ availableModules = [] }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [requestReason, setRequestReason] = useState('');

  // Fetch user's requests on component mount
  useEffect(() => {
    fetchMyRequests();
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

  // Fetch user's module requests
  const fetchMyRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyModuleRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching module requests:', err);
      setError('Failed to load your module requests. Please try again.');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // Get modules that are not available and not already requested
  const getRequestableModules = () => {
    const availableModuleIds = availableModules.map(m => m.module_id || m.id);
    const requestedModuleIds = requests.map(r => parseInt(r.module_id));
    
    return MODULES.filter(module => 
      !availableModuleIds.includes(module.id) && 
      !requestedModuleIds.includes(module.id)
    );
  };

  // Handle module request submission
  const handleRequestSubmit = async () => {
    if (!selectedModule || !requestReason.trim()) {
      setError('Please select a module and provide a reason for the request.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const requestData = {
        module_id: selectedModule.id.toString(),
        module_name: selectedModule.name,
        request_reason: requestReason.trim()
      };

      await createModuleRequest(requestData);
      setSuccessMessage(`Request for "${selectedModule.name}" has been submitted successfully!`);
      
      // Reset form
      setShowRequestForm(false);
      setSelectedModule(null);
      setRequestReason('');
      
      // Refresh requests
      fetchMyRequests();
    } catch (err) {
      console.error('Error creating module request:', err);
      setError(err.message || 'Failed to submit module request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Get status display information
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { text: 'Awaiting Approval', icon: <FaClock />, className: 'status-pending' };
      case 'client_head_approved':
        return { text: 'Client Head Approved - Awaiting Project Sponsor', icon: <FaCheck />, className: 'status-partial' };
      case 'project_sponsor_approved':
        return { text: 'Project Sponsor Approved - Awaiting Client Head', icon: <FaCheck />, className: 'status-partial' };
      case 'approved':
        return { text: 'Approved - Being Provisioned', icon: <FaCheck />, className: 'status-approved' };
      case 'rejected':
        return { text: 'Rejected', icon: <FaExclamationTriangle />, className: 'status-rejected' };
      default:
        return { text: status, icon: <FaClock />, className: 'status-unknown' };
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const requestableModules = getRequestableModules();

  return (
    <div className="module-request-container">
      <div className="module-request-header">
        <h2>Module Access Requests</h2>
        <div className="header-actions">
          <button 
            className="refresh-button" 
            onClick={fetchMyRequests}
            disabled={loading}
          >
            <FaSync className={loading ? 'spinner' : ''} /> 
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          {requestableModules.length > 0 && (
            <button 
              className="request-button" 
              onClick={() => setShowRequestForm(true)}
              disabled={submitting}
            >
              <FaPlus /> Request Module Access
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="error-message">
          <FaExclamationTriangle /> {error}
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className="success-message">
          <FaCheck /> {successMessage}
        </div>
      )}

      {/* Request Form Modal */}
      {showRequestForm && (
        <div className="modal-overlay">
          <div className="request-form-modal">
            <div className="modal-header">
              <h3>Request Module Access</h3>
              <button 
                className="close-button"
                onClick={() => {
                  setShowRequestForm(false);
                  setSelectedModule(null);
                  setRequestReason('');
                  setError(null);
                }}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label>Select Module:</label>
                <select 
                  value={selectedModule?.id || ''} 
                  onChange={(e) => {
                    const moduleId = parseInt(e.target.value);
                    const module = MODULES.find(m => m.id === moduleId);
                    setSelectedModule(module);
                  }}
                >
                  <option value="">Choose a module...</option>
                  {requestableModules.map(module => (
                    <option key={module.id} value={module.id}>
                      {module.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedModule && (
                <div className="module-description">
                  <strong>Description:</strong> {selectedModule.description}
                </div>
              )}

              <div className="form-group">
                <label>Reason for Request:</label>
                <textarea
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="Please explain why you need access to this module..."
                  rows={4}
                />
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="cancel-button"
                onClick={() => {
                  setShowRequestForm(false);
                  setSelectedModule(null);
                  setRequestReason('');
                  setError(null);
                }}
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                className="submit-button"
                onClick={handleRequestSubmit}
                disabled={!selectedModule || !requestReason.trim() || submitting}
              >
                {submitting ? (
                  <>
                    <FaSpinner className="spinner" /> Submitting...
                  </>
                ) : (
                  <>
                    <FaPlus /> Submit Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Requests List */}
      <div className="requests-section">
        <h3>Your Module Requests</h3>
        
        {loading ? (
          <div className="loading-state">
            <FaSpinner className="spinner" /> Loading your requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <FaComments className="empty-icon" />
            <h4>No Module Requests</h4>
            <p>You haven't submitted any module access requests yet.</p>
            {requestableModules.length > 0 && (
              <button 
                className="request-button"
                onClick={() => setShowRequestForm(true)}
              >
                <FaPlus /> Request Your First Module
              </button>
            )}
          </div>
        ) : (
          <div className="requests-list">
            {requests.map(request => {
              const statusInfo = getStatusInfo(request.status);
              return (
                <div key={request.id} className="request-card">
                  <div className="request-header">
                    <h4>{request.module_name}</h4>
                    <div className={`status-badge ${statusInfo.className}`}>
                      {statusInfo.icon}
                      <span>{statusInfo.text}</span>
                    </div>
                  </div>
                  
                  <div className="request-details">
                    <div className="detail-item">
                      <FaUser />
                      <span>Requested by: {request.requester_display_name}</span>
                    </div>
                    <div className="detail-item">
                      <FaCalendarAlt />
                      <span>Submitted: {formatDate(request.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info Section */}
      {requestableModules.length === 0 && requests.length === 0 && !loading && (
        <div className="info-section">
          <div className="info-card">
            <FaCheck className="info-icon" />
            <h4>All Modules Available</h4>
            <p>You currently have access to all available modules for your organization.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuleRequest;
