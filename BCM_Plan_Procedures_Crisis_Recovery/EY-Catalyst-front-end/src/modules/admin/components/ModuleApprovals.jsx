import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaSpinner, FaExclamationTriangle, FaUser, FaCalendarAlt, FaComments, FaSync, FaClock, FaEye } from 'react-icons/fa';
import { getPendingApprovals, clientHeadApproval, projectSponsorApproval, getOrganizationModuleRequests } from '../services/adminService';
import './ModuleApprovals.css';

/**
 * Module Approvals Component
 * For Client Head and Project Sponsor to approve/reject module requests
 */
const ModuleApprovals = ({ userRole, organizationId }) => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approvalAction, setApprovalAction] = useState('');
  const [comments, setComments] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  // Check if user can approve requests
  const canApprove = userRole === 'Client Head' || userRole === 'Project Sponsor';

  useEffect(() => {
    if (canApprove) {
      fetchRequests();
    }
  }, [canApprove]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Fetch pending approvals and all organization requests
  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pendingData, allData] = await Promise.all([
        getPendingApprovals(),
        organizationId ? getOrganizationModuleRequests(organizationId) : []
      ]);
      
      setPendingRequests(Array.isArray(pendingData) ? pendingData : []);
      setAllRequests(Array.isArray(allData) ? allData : []);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load module requests. Please try again.');
      setPendingRequests([]);
      setAllRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle approval/rejection
  const handleApproval = async () => {
    if (!selectedRequest || !approvalAction || !comments.trim()) {
      setError('Please provide comments for your decision.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Backend expects action: "approve" or "reject"
      const approvalData = {
        action: approvalAction, // "approve" or "reject"
        comments: comments.trim()
      };

      let result;
      if (userRole === 'Client Head') {
        result = await clientHeadApproval(selectedRequest.id, approvalData);
      } else if (userRole === 'Project Sponsor') {
        result = await projectSponsorApproval(selectedRequest.id, approvalData);
      }

      const actionText = approvalAction === 'approve' ? 'approved' : 'rejected';
      setSuccessMessage(`Request for "${selectedRequest.module_name}" has been ${actionText} successfully!`);
      
      // Reset modal
      setShowApprovalModal(false);
      setSelectedRequest(null);
      setApprovalAction('');
      setComments('');
      
      // Refresh requests
      fetchRequests();
    } catch (err) {
      console.error('Error processing approval:', err);
      setError(err.message || 'Failed to process approval. Please try again.');
    } finally {
      setProcessing(false);
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

  // Check if user can approve this specific request
  const canApproveRequest = (request) => {
    if (userRole === 'Client Head') {
      return request.status === 'pending' || request.status === 'project_sponsor_approved';
    } else if (userRole === 'Project Sponsor') {
      return request.status === 'pending' || request.status === 'client_head_approved';
    }
    return false;
  };

  // Get approval status for display
  const getApprovalStatus = (request) => {
    console.log(`Request ${request.id} - All available fields:`, Object.keys(request));
    console.log(`Request ${request.id} - Full object:`, request);
    
    // Use the correct database column names
    const clientHeadStatus = request.client_head_approved;
    const projectSponsorStatus = request.project_sponsor_approved;
    
    console.log(`Request ${request.id} approval status:`);
    console.log(`  Client Head Status: "${clientHeadStatus}" (type: ${typeof clientHeadStatus})`);
    console.log(`  Project Sponsor Status: "${projectSponsorStatus}" (type: ${typeof projectSponsorStatus})`);
    
    return {
      clientHead: clientHeadStatus === null ? 'Pending' : (clientHeadStatus === 'approve' ? 'Approved' : 'Rejected'),
      projectSponsor: projectSponsorStatus === null ? 'Pending' : (projectSponsorStatus === 'approve' ? 'Approved' : 'Rejected')
    };
  };

  if (!canApprove) {
    return (
      <div className="module-approvals-container">
        <div className="access-denied">
          <FaExclamationTriangle className="access-denied-icon" />
          <h3>Access Denied</h3>
          <p>Only Client Head and Project Sponsor can access module approvals.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="module-approvals-container">
      <div className="module-approvals-header">
        <h2>Module Request Approvals</h2>
        <div className="header-actions">
          <button 
            className="refresh-button" 
            onClick={fetchRequests}
            disabled={loading}
          >
            <FaSync className={loading ? 'spinner' : ''} /> 
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="user-role-info">
        <strong>Your Role:</strong> {userRole}
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

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending Approvals ({pendingRequests.length})
          </button>
          <button 
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Requests ({allRequests.length})
          </button>
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="approval-modal">
            <div className="modal-header">
              <h3>
                {approvalAction === 'approve' ? 'Approve' : 'Reject'} Module Request
              </h3>
              <button 
                className="close-button"
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedRequest(null);
                  setApprovalAction('');
                  setComments('');
                  setError(null);
                }}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="request-summary">
                <h4>{selectedRequest.module_name}</h4>
                <p><strong>Requested by:</strong> {selectedRequest.requester_display_name}</p>
                <p><strong>Reason:</strong> {selectedRequest.request_reason}</p>
              </div>

              <div className="form-group">
                <label>Comments:</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder={`Please provide your ${approvalAction === 'approve' ? 'approval' : 'rejection'} comments...`}
                  rows={4}
                />
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="cancel-button"
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedRequest(null);
                  setApprovalAction('');
                  setComments('');
                  setError(null);
                }}
                disabled={processing}
              >
                Cancel
              </button>
              <button 
                className={`submit-button ${approvalAction === 'approve' ? 'approve' : 'reject'}`}
                onClick={handleApproval}
                disabled={!comments.trim() || processing}
              >
                {processing ? (
                  <>
                    <FaSpinner className="spinner" /> Processing...
                  </>
                ) : (
                  <>
                    {approvalAction === 'approve' ? <FaCheck /> : <FaTimes />}
                    {approvalAction === 'approve' ? 'Approve' : 'Reject'} Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="requests-content">
        {loading ? (
          <div className="loading-state">
            <FaSpinner className="spinner" /> Loading requests...
          </div>
        ) : (
          <>
            {/* Pending Approvals Tab */}
            {activeTab === 'pending' && (
              <div className="pending-requests">
                {pendingRequests.length === 0 ? (
                  <div className="empty-state">
                    <FaCheck className="empty-icon" />
                    <h4>No Pending Approvals</h4>
                    <p>There are no module requests waiting for your approval.</p>
                  </div>
                ) : (
                  <div className="requests-list">
                    {pendingRequests.map(request => {
                      const statusInfo = getStatusInfo(request.status);
                      const approvalStatus = getApprovalStatus(request);
                      const canApproveThis = canApproveRequest(request);
                      
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
                            <div className="detail-item">
                              <FaComments />
                              <span>Reason: {request.request_reason}</span>
                            </div>
                          </div>

                          <div className="approval-status">
                            <div className="approval-item">
                              <strong>Client Head:</strong> 
                              <span className={`approval-${approvalStatus.clientHead.toLowerCase()}`}>
                                {approvalStatus.clientHead}
                              </span>
                            </div>
                            <div className="approval-item">
                              <strong>Project Sponsor:</strong> 
                              <span className={`approval-${approvalStatus.projectSponsor.toLowerCase()}`}>
                                {approvalStatus.projectSponsor}
                              </span>
                            </div>
                          </div>

                          {canApproveThis && (
                            <div className="request-actions">
                              <button 
                                className="approve-button"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setApprovalAction('approve');
                                  setShowApprovalModal(true);
                                }}
                                disabled={processing}
                              >
                                <FaCheck /> Approve
                              </button>
                              <button 
                                className="reject-button"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setApprovalAction('reject');
                                  setShowApprovalModal(true);
                                }}
                                disabled={processing}
                              >
                                <FaTimes /> Reject
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* All Requests Tab */}
            {activeTab === 'all' && (
              <div className="all-requests">
                {allRequests.length === 0 ? (
                  <div className="empty-state">
                    <FaComments className="empty-icon" />
                    <h4>No Module Requests</h4>
                    <p>No module requests have been submitted for your organization yet.</p>
                  </div>
                ) : (
                  <div className="requests-list">
                    {allRequests.map(request => {
                      const statusInfo = getStatusInfo(request.status);
                      const approvalStatus = getApprovalStatus(request);
                      
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

                          <div className="approval-status">
                            <div className="approval-item">
                              <strong>Client Head:</strong> 
                              <span className={`approval-${approvalStatus.clientHead.toLowerCase()}`}>
                                {approvalStatus.clientHead}
                              </span>
                            </div>
                            <div className="approval-item">
                              <strong>Project Sponsor:</strong> 
                              <span className={`approval-${approvalStatus.projectSponsor.toLowerCase()}`}>
                                {approvalStatus.projectSponsor}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ModuleApprovals;
