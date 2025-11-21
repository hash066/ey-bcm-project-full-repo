import React, { useState, useEffect, useRef } from 'react';
import { FaUserCircle, FaLock, FaExclamationTriangle } from 'react-icons/fa';
import { logout } from '../../services/authService';
import { getPasswordInfo } from '../../modules/admin/services/adminService';
import { jwtDecode } from 'jwt-decode';
import PasswordChange from './PasswordChange';

const UserProfile = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInfo, setPasswordInfo] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleLogout = () => {
    logout();
    // The logout function should handle the redirect
  };

  // Check if user is admin and fetch password info
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setIsAdmin(decoded.groups && decoded.groups.includes('Administrators'));
        
        // Only fetch password info for non-admin users
        if (!decoded.groups || !decoded.groups.includes('Administrators')) {
          fetchPasswordInfo();
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  const fetchPasswordInfo = async () => {
    try {
      const info = await getPasswordInfo();
      setPasswordInfo(info);
    } catch (error) {
      console.error('Error fetching password info:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handlePasswordChange = () => {
    setShowPasswordModal(true);
    setDropdownOpen(false);
  };

  const handlePasswordModalClose = () => {
    setShowPasswordModal(false);
    // Refresh password info after modal closes
    if (!isAdmin) {
      fetchPasswordInfo();
    }
  };

  // Get user info from localStorage or use default
  const user = {
    name: localStorage.getItem('username') || "John Doe",
    email: localStorage.getItem('user_email') || "john.doe@example.com",
  };

  return (
    <>
      <div ref={dropdownRef}>
        <FaUserCircle className="profile-icon" onClick={toggleDropdown} />
        {dropdownOpen && (
          <div className="profile-dropdown">
            <div className="profile-info">
              <p><strong>{user.name}</strong></p>
              <p>{user.email}</p>
            </div>
            
            {/* Password Change Option for Non-Admin Users */}
            {!isAdmin && (
              <div className="profile-actions">
                <button 
                  className="password-change-btn"
                  onClick={handlePasswordChange}
                >
                  <FaLock />
                  <span>Change Password</span>
                  {passwordInfo?.is_default_password && (
                    <FaExclamationTriangle className="warning-icon" title="Using default password" />
                  )}
                </button>
              </div>
            )}
            
            <div className="profile-logout">
              <button onClick={handleLogout}>Logout</button>
            </div>
          </div>
        )}
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <PasswordChange 
          showAsModal={true}
          onClose={handlePasswordModalClose}
        />
      )}
    </>
  );
};

export default UserProfile;