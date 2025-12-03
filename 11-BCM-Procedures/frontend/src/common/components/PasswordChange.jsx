import React, { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash, FaLock, FaCheck, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import { changePassword, getPasswordInfo } from '../../modules/admin/services/adminService';
import './PasswordChange.css';

/**
 * Password Change Component
 * Allows users to change their default password
 */
const PasswordChange = ({ onClose, showAsModal = false }) => {
  const [passwordInfo, setPasswordInfo] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingInfo, setFetchingInfo] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Fetch password info on component mount
  useEffect(() => {
    fetchPasswordInfo();
  }, []);

  const fetchPasswordInfo = async () => {
    try {
      setFetchingInfo(true);
      const info = await getPasswordInfo();
      setPasswordInfo(info);
    } catch (err) {
      console.error('Error fetching password info:', err);
      setError('Failed to load password information');
    } finally {
      setFetchingInfo(false);
    }
  };

  // Password validation
  const validatePassword = (password) => {
    const errors = {};
    
    if (password.length < 8) {
      errors.length = 'Password must be at least 8 characters long';
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      errors.lowercase = 'Password must contain at least one lowercase letter';
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.uppercase = 'Password must contain at least one uppercase letter';
    }
    
    if (!/(?=.*\d)/.test(password)) {
      errors.number = 'Password must contain at least one number';
    }
    
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.special = 'Password must contain at least one special character (@$!%*?&)';
    }
    
    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setValidationErrors({});

    // Validate inputs
    if (!currentPassword.trim()) {
      setError('Current password is required');
      return;
    }

    if (!newPassword.trim()) {
      setError('New password is required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match');
      return;
    }

    // Validate new password strength
    const passwordErrors = validatePassword(newPassword);
    if (Object.keys(passwordErrors).length > 0) {
      setValidationErrors(passwordErrors);
      setError('Please fix the password requirements below');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setLoading(true);

    try {
      const result = await changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });

      setSuccess(result.message || 'Password changed successfully!');
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Refresh password info
      await fetchPasswordInfo();
      
      // Auto-close modal after success
      if (showAsModal && onClose) {
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password) => {
    const errors = validatePassword(password);
    const strength = 5 - Object.keys(errors).length;
    
    if (strength <= 1) return { level: 'weak', color: '#e74c3c', text: 'Weak' };
    if (strength <= 3) return { level: 'medium', color: '#f39c12', text: 'Medium' };
    return { level: 'strong', color: '#27ae60', text: 'Strong' };
  };

  const passwordStrength = newPassword ? getPasswordStrength(newPassword) : null;

  const content = (
    <div className="password-change-container">
      <div className="password-change-header">
        <FaLock className="header-icon" />
        <div className="header-text">
          <h2>Change Password</h2>
          {passwordInfo && (
            <p className="password-status">
              {passwordInfo.is_default_password 
                ? "You're using a default password. Please change it for security." 
                : `Last changed: ${new Date(passwordInfo.password_changed_at).toLocaleDateString()}`
              }
            </p>
          )}
        </div>
        {showAsModal && onClose && (
          <button className="close-button" onClick={onClose}>×</button>
        )}
      </div>

      {fetchingInfo ? (
        <div className="loading-state">
          <FaSpinner className="spinner" />
          <span>Loading password information...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="password-change-form">
          {/* Current Password */}
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <div className="password-input-container">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                disabled={loading}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <div className="password-input-container">
              <input
                type={showNewPassword ? 'text' : 'password'}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
                disabled={loading}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {newPassword && passwordStrength && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div 
                    className="strength-fill" 
                    style={{ 
                      width: `${(5 - Object.keys(validatePassword(newPassword)).length) * 20}%`,
                      backgroundColor: passwordStrength.color 
                    }}
                  ></div>
                </div>
                <span className="strength-text" style={{ color: passwordStrength.color }}>
                  {passwordStrength.text}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                disabled={loading}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          {newPassword && Object.keys(validationErrors).length > 0 && (
            <div className="password-requirements">
              <h4>Password Requirements:</h4>
              <ul>
                <li className={validationErrors.length ? 'invalid' : 'valid'}>
                  At least 8 characters long
                </li>
                <li className={validationErrors.lowercase ? 'invalid' : 'valid'}>
                  One lowercase letter
                </li>
                <li className={validationErrors.uppercase ? 'invalid' : 'valid'}>
                  One uppercase letter
                </li>
                <li className={validationErrors.number ? 'invalid' : 'valid'}>
                  One number
                </li>
                <li className={validationErrors.special ? 'invalid' : 'valid'}>
                  One special character (@$!%*?&)
                </li>
              </ul>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <FaExclamationTriangle />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="success-message">
              <FaCheck />
              <span>{success}</span>
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            className="submit-button"
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
          >
            {loading ? (
              <>
                <FaSpinner className="spinner" />
                Changing Password...
              </>
            ) : (
              <>
                <FaLock />
                Change Password
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );

  if (showAsModal) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default PasswordChange;
