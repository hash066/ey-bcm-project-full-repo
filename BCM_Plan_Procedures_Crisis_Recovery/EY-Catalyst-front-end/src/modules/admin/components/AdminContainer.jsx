import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { FaUsers, FaBuilding, FaSitemap, FaProjectDiagram, FaCog, FaChartBar, FaServer, FaTachometerAlt, FaSignOutAlt, FaArchive } from 'react-icons/fa';
import AdminDashboard from './AdminDashboard';
import OrganizationsManagement from './OrganizationsManagement';
import UsersManagement from './UsersManagement';
import AddOrganization from './AddOrganization';
import ArchivedOrganizations from './ArchivedOrganizations';

/**
 * Admin Container Component
 * Main container for admin panel with sidebar navigation
 */
const AdminContainer = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  // Admin sidebar menu items
  const adminMenuItems = [
    { name: "Dashboard", path: "/admin", icon: <FaTachometerAlt /> },
    { name: "Organizations", path: "/admin/organizations", icon: <FaBuilding /> },
    { name: "Archived Organizations", path: "/admin/archived-organizations", icon: <FaArchive /> },
    { name: "Users", path: "/admin/users", icon: <FaUsers /> },
  ];

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  };

  return (
    <div className="admin-layout" style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      {/* Admin Sidebar */}
      <div 
        className="admin-sidebar"
        style={{
          width: isCollapsed ? '80px' : '250px',
          minWidth: isCollapsed ? '80px' : '250px',
          backgroundColor: '#1a1a1a',
          height: '100%',
          transition: 'width 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #333'
        }}
      >
        {/* Admin Logo/Header */}
        <div 
          className="admin-sidebar-header"
          style={{
            padding: isCollapsed ? '1rem 0.5rem' : '1rem 1.5rem',
            borderBottom: '1px solid #333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between'
          }}
        >
          {!isCollapsed && (
            <div style={{ color: '#FFD700', fontWeight: 'bold', fontSize: '18px' }}>
              Admin Panel
            </div>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: 'none',
              border: 'none',
              color: '#FFD700',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            ☰
          </button>
        </div>

        {/* Admin Navigation */}
        <div 
          className="admin-nav"
          style={{
            padding: '1rem 0',
            flex: 1,
            overflowY: 'auto'
          }}
        >
          {adminMenuItems.map((item, index) => {
            const isActive = location.pathname === item.path || 
                            (item.path !== '/admin' && location.pathname.startsWith(item.path));
            
            return (
              <Link 
                key={index}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: isCollapsed ? '1rem 0' : '1rem 1.5rem',
                  color: isActive ? '#FFD700' : '#f1f1f1',
                  textDecoration: 'none',
                  borderLeft: isActive ? '4px solid #FFD700' : '4px solid transparent',
                  backgroundColor: isActive ? '#252525' : 'transparent',
                  transition: 'background-color 0.2s',
                  justifyContent: isCollapsed ? 'center' : 'flex-start'
                }}
              >
                <div style={{ fontSize: '18px', marginRight: isCollapsed ? '0' : '1rem' }}>
                  {item.icon}
                </div>
                {!isCollapsed && (
                  <span>{item.name}</span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Logout Button */}
        <div 
          className="admin-sidebar-footer"
          style={{
            padding: isCollapsed ? '1rem 0' : '1rem 1.5rem',
            borderTop: '1px solid #333'
          }}
        >
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#333',
              color: '#f1f1f1',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            <FaSignOutAlt style={{ marginRight: isCollapsed ? '0' : '0.5rem' }} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Admin Content Area */}
      <div 
        className="admin-content"
        style={{
          flex: 1,
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Admin Header */}
        <header 
          className="admin-header"
          style={{
            backgroundColor: '#1e1e1e',
            padding: '1rem 2rem',
            borderBottom: '1px solid #333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <h1 style={{ fontSize: '20px', color: '#FFD700' }}>
            EY-Catalyst Admin
          </h1>
          <div className="admin-user-info" style={{ display: 'flex', alignItems: 'center' }}>
            <div 
              className="admin-avatar"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#FFD700',
                color: '#121212',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                marginRight: '0.75rem'
              }}
            >
              A
            </div>
            <div>Administrator</div>
          </div>
        </header>

        {/* Admin Content */}
        <div 
          className="admin-content-area"
          style={{
            flex: 1,
            padding: '2rem',
            overflowY: 'auto',
            backgroundColor: '#121212'
          }}
        >
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/organizations" element={<OrganizationsManagement />} />
            <Route path="/organizations/add" element={<AddOrganization />} />
            <Route path="/archived-organizations" element={<ArchivedOrganizations />} />
            <Route path="/users" element={<UsersManagement />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AdminContainer;
