import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBuilding, FaUpload, FaArrowLeft, FaSave, FaSpinner, FaExclamationTriangle, FaCheck } from 'react-icons/fa';
import { createMinimalOrganization, setupOrganizationFromFile, invalidateUsersCache } from '../services/adminService';
import './OrganizationsManagement.css';

/**
 * Add Organization Component
 * Form for creating a new organization
 */
const AddOrganization = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [step, setStep] = useState(1); // 1: Basic Info, 2: HRMS Data
  
  // Form data
  const [orgName, setOrgName] = useState('');
  const [orgDescription, setOrgDescription] = useState({
    location: '',
    purpose: '',
    established: '',
    employee_count: '',
    website: '',
    additional_contacts: {
      technical: '',
      support: ''
    },
    other_details: {
      industry_focus: ''
    }
  });
  const [hrmsFile, setHrmsFile] = useState(null);
  const [defaultPassword, setDefaultPassword] = useState('');
  
  // Handle organization name change
  const handleNameChange = (e) => {
    setOrgName(e.target.value);
  };
  
  // Handle description field changes
  const handleDescriptionChange = (field, value) => {
    if (field.includes('.')) {
      // Handle nested fields
      const [parent, child] = field.split('.');
      setOrgDescription(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      // Handle top-level fields
      setOrgDescription(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };
  
  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setHrmsFile(e.target.files[0]);
    }
  };
  
  // Handle default password change
  const handlePasswordChange = (e) => {
    setDefaultPassword(e.target.value);
  };
  
  // Navigate to next step
  const handleNextStep = async () => {
    // Validate step 1
    if (!orgName.trim()) {
      setError('Organization name is required');
      return;
    }
    
    setError(null);
    
    // Create minimal organization
    try {
      setLoading(true);
      const result = await createMinimalOrganization(orgName, orgDescription);
      setSuccessMessage(`Organization ${orgName} created successfully!`);
      
      // Move to step 2 with the created organization ID
      setStep(2);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error creating organization:', err);
      setError(`Failed to create organization: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Submit HRMS data
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate step 2
    if (!hrmsFile) {
      setError('HRMS data file is required');
      return;
    }
    
    if (!defaultPassword) {
      setError('Default password is required');
      return;
    }
    
    setError(null);
    
    // Upload HRMS data
    try {
      setLoading(true);
      await setupOrganizationFromFile(hrmsFile, defaultPassword);
      
      // Invalidate the cache to ensure new organization appears in the list
      try {
        await invalidateUsersCache();
        console.log('Successfully invalidated users cache');
      } catch (cacheError) {
        console.warn('Failed to invalidate cache:', cacheError);
        // Don't fail the operation if cache invalidation fails
      }
      
      setSuccessMessage('Organization setup completed successfully!');
      
      // Redirect to organizations list after 2 seconds
      setTimeout(() => {
        navigate('/admin/organizations');
      }, 2000);
    } catch (err) {
      console.error('Error setting up organization:', err);
      setError(`Failed to setup organization: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Go back to previous step or organizations list
  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      navigate('/admin/organizations');
    }
  };
  
  return (
    <div className="organizations-management">
      <div className="header">
        <h2>
          <FaBuilding /> {step === 1 ? 'Add New Organization' : 'Upload HRMS Data'}
        </h2>
      </div>
      
      {/* Back button */}
      <button className="back-button" onClick={handleBack}>
        <FaArrowLeft /> {step === 1 ? 'Back to Organizations' : 'Back to Organization Details'}
      </button>
      
      {/* Success message */}
      {successMessage && (
        <div className="success-message">
          <FaCheck /> {successMessage}
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="error-message">
          <FaExclamationTriangle /> {error}
        </div>
      )}
      
      <div className="org-detail">
        {step === 1 ? (
          /* Step 1: Basic Organization Info */
          <div className="organization-form">
            <h3>Organization Details</h3>
            <p className="form-description">
              Enter the basic information about the organization. You'll be able to upload HRMS data in the next step.
            </p>
            
            <div className="form-group">
              <label htmlFor="orgName">Organization Name *</label>
              <input
                id="orgName"
                type="text"
                value={orgName}
                onChange={handleNameChange}
                placeholder="Enter organization name"
                required
              />
            </div>
            
            <h4>Organization Description</h4>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  id="location"
                  type="text"
                  value={orgDescription.location}
                  onChange={(e) => handleDescriptionChange('location', e.target.value)}
                  placeholder="City, Country"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="established">Established Year</label>
                <input
                  id="established"
                  type="text"
                  value={orgDescription.established}
                  onChange={(e) => handleDescriptionChange('established', e.target.value)}
                  placeholder="YYYY"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="purpose">Purpose</label>
                <input
                  id="purpose"
                  type="text"
                  value={orgDescription.purpose}
                  onChange={(e) => handleDescriptionChange('purpose', e.target.value)}
                  placeholder="Organization's main purpose"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="employeeCount">Employee Count</label>
                <input
                  id="employeeCount"
                  type="number"
                  value={orgDescription.employee_count}
                  onChange={(e) => handleDescriptionChange('employee_count', e.target.value)}
                  placeholder="Number of employees"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="website">Website</label>
              <input
                id="website"
                type="url"
                value={orgDescription.website}
                onChange={(e) => handleDescriptionChange('website', e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            
            <h4>Additional Contacts</h4>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="technicalContact">Technical Contact</label>
                <input
                  id="technicalContact"
                  type="email"
                  value={orgDescription.additional_contacts.technical}
                  onChange={(e) => handleDescriptionChange('additional_contacts.technical', e.target.value)}
                  placeholder="tech@example.com"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="supportContact">Support Contact</label>
                <input
                  id="supportContact"
                  type="email"
                  value={orgDescription.additional_contacts.support}
                  onChange={(e) => handleDescriptionChange('additional_contacts.support', e.target.value)}
                  placeholder="support@example.com"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="industryFocus">Industry Focus</label>
              <input
                id="industryFocus"
                type="text"
                value={orgDescription.other_details.industry_focus}
                onChange={(e) => handleDescriptionChange('other_details.industry_focus', e.target.value)}
                placeholder="e.g. Banking, Healthcare, Technology"
              />
            </div>
            
            <div className="form-actions">
              <button
                className="save-button"
                onClick={handleNextStep}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FaSpinner className="spinner" /> Creating...
                  </>
                ) : (
                  <>
                    <FaSave /> Continue to HRMS Data
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: HRMS Data Upload */
          <div className="organization-form">
            <h3>Upload HRMS Data</h3>
            <p className="form-description">
              Upload a CSV file containing the organization's HRMS data. This will be used to set up the organization structure.
            </p>
            
            <div className="file-upload-container">
              <label htmlFor="hrmsFile" className="file-upload-label">
                <FaUpload /> {hrmsFile ? hrmsFile.name : 'Select HRMS Data File (.csv)'}
              </label>
              <input
                id="hrmsFile"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="file-upload-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="defaultPassword">Default Password for Users *</label>
              <input
                id="defaultPassword"
                type="password"
                value={defaultPassword}
                onChange={handlePasswordChange}
                placeholder="Enter default password for users"
                required
              />
              <p className="input-help-text">
                This password will be set for all users created from the HRMS data.
              </p>
            </div>
            
            <div className="form-actions">
              <button
                className="save-button"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FaSpinner className="spinner" /> Processing...
                  </>
                ) : (
                  <>
                    <FaSave /> Complete Organization Setup
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddOrganization;
