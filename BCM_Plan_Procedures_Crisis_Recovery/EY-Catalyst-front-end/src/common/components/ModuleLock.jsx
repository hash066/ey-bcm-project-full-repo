import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaLock, FaArrowLeft, FaPlus, FaSpinner, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { createModuleRequest, getMyModuleRequests } from '../../modules/admin/services/adminService';
import './ModuleLock.css';

// Module name to ID mapping
const MODULE_NAME_TO_ID = {
  'Process and Service Mapping': 1,
  'Business Impact Analysis': 2,
  'Risk Analysis': 3,
  'Recovery Strategy': 4,
  'BCM Plan': 5,
  'Crisis Management': 6,
  'Training and Testing': 7,
  'Procedures': 8,
  'Policy': 9,
  'KPIs & BCM Maturity': 10,
  'Continual Improvement': 11
};

/**
 * ModuleLock Component
 * Displayed when a user tries to access a module they don't have a license for
 * Now includes module request functionality
 * @returns {JSX.Element} ModuleLock component
 */
const ModuleLock = () => {
  const { moduleName } = useParams();
  const navigate = useNavigate();
  
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestReason, setRequestReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [existingRequest, setExistingRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const decodedModuleName = moduleName ? decodeURIComponent(moduleName) : 'This module';
  const moduleId = MODULE_NAME_TO_ID[decodedModuleName];
  
  // Check if user already has a request for this module
  useEffect(() => {
    checkExistingRequest();
  }, [moduleId]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const checkExistingRequest = async () => {
    if (!moduleId) {
      setLoading(false);
      return;
    }

    try {
      const requests = await getMyModuleRequests();
      const existing = requests.find(req => parseInt(req.module_id) === moduleId);
      setExistingRequest(existing);
    } catch (err) {
      console.error('Error checking existing requests:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const goBack = () => {
    navigate('/home');
  };

  const handleRequestSubmit = async () => {
    if (!requestReason.trim()) {
      setError('Please provide a reason for requesting access to this module.');
      return;
    }

    if (!moduleId) {
      setError('Unable to identify the module. Please try again.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const requestData = {
        module_id: moduleId.toString(),
        module_name: decodedModuleName,
        request_reason: requestReason.trim()
      };

      await createModuleRequest(requestData);
      setSuccessMessage(`Your request for "${decodedModuleName}" has been submitted successfully!`);
      
      // Reset form and refresh existing request
      setShowRequestForm(false);
      setRequestReason('');
      checkExistingRequest();
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
        return { text: 'Awaiting Approval', className: 'status-pending' };
      case 'client_head_approved':
        return { text: 'Client Head Approved - Awaiting Project Sponsor', className: 'status-partial' };
      case 'project_sponsor_approved':
        return { text: 'Project Sponsor Approved - Awaiting Client Head', className: 'status-partial' };
      case 'approved':
        return { text: 'Approved - Being Provisioned', className: 'status-approved' };
      case 'rejected':
        return { text: 'Request Rejected', className: 'status-rejected' };
      default:
        return { text: status, className: 'status-unknown' };
    }
  };

  return (
    <div className="module-lock-container">
      <div className="module-lock-content">
        <div className="lock-icon-container">
          <FaLock className="lock-icon" />
        </div>
        <h2>Module Access Restricted</h2>
        <p className="module-lock-message">
          <strong>{decodedModuleName}</strong> is not licensed for your organization.
        </p>

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

        {loading ? (
          <div className="loading-state">
            <FaSpinner className="spinner" /> Checking request status...
          </div>
        ) : existingRequest ? (
          <div className="existing-request">
            <h3>Request Status</h3>
            <div className="request-info">
              <p><strong>Module:</strong> {existingRequest.module_name}</p>
              <p><strong>Status:</strong> 
                <span className={`status-badge ${getStatusInfo(existingRequest.status).className}`}>
                  {getStatusInfo(existingRequest.status).text}
                </span>
              </p>
              <p><strong>Submitted:</strong> {new Date(existingRequest.created_at).toLocaleDateString()}</p>
            </div>
            {existingRequest.status === 'rejected' && (
              <p className="module-lock-instruction">
                Your previous request was rejected. You can submit a new request with additional justification.
              </p>
            )}
          </div>
        ) : (
          <p className="module-lock-instruction">
            You can request access to this module. Your request will be reviewed by your Client Head and Project Sponsor.
          </p>
        )}

        {/* Request Form */}
        {showRequestForm && (
          <div className="request-form">
            <h3>Request Module Access</h3>
            <div className="form-group">
              <label>Reason for Request:</label>
              <textarea
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                placeholder="Please explain why you need access to this module..."
                rows={4}
              />
            </div>
            <div className="form-actions">
              <button 
                className="cancel-button"
                onClick={() => {
                  setShowRequestForm(false);
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
                disabled={!requestReason.trim() || submitting}
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
        )}

        {/* Action Buttons */}
        <div className="action-buttons">
          <button className="back-button" onClick={goBack}>
            <FaArrowLeft /> Back to Home
          </button>
          
          {!loading && (!existingRequest || existingRequest.status === 'rejected') && !showRequestForm && (
            <button 
              className="request-access-button" 
              onClick={() => setShowRequestForm(true)}
              disabled={!moduleId}
            >
              <FaPlus /> Request Access
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModuleLock;
