import React, { useState, useEffect } from 'react';
import { FaUsers, FaBuilding, FaSitemap } from 'react-icons/fa';
import { jwtDecode } from 'jwt-decode';
import { getSystemStats, getUsers, getOrganizations } from '../services/adminService';

/**
 * Admin Dashboard Component
 * Main dashboard for administrator access
 */
const AdminDashboard = () => {
  const [adminInfo, setAdminInfo] = useState({
    username: '',
    groups: [],
    accountExpires: ''
  });
  const [stats, setStats] = useState({
    organizations: 0,
    departments: 0,
    users: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get admin information from token
    const fetchAdminInfo = () => {
      try {
        const token = localStorage.getItem('access_token');
        if (token) {
          const decodedToken = jwtDecode(token);
          console.log('Decoded token:', decodedToken);
          
          // Fetch admin data from token
          setAdminInfo({
            username: decodedToken.sub || 'Administrator',
            groups: decodedToken.groups || [],
            accountExpires: decodedToken.account_expires_on || 'Not specified'
          });
        }
      } catch (error) {
        console.error('Error fetching admin info:', error);
        setError('Failed to load admin information');
      }
    };

    // Fetch real statistics data from API
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Try to get system stats from the dedicated endpoint
        try {
          const systemStats = await getSystemStats();
          if (systemStats) {
            // Only keep the stats we need
            setStats({
              organizations: systemStats.organizations || 0,
              departments: systemStats.departments || 0,
              users: systemStats.users || 0
            });
            setLoading(false);
            return;
          }
        } catch (statsError) {
          console.error('Error fetching system stats, falling back to individual endpoints:', statsError);
        }
        
        // If system stats endpoint fails, collect stats from individual endpoints
        const statsData = {
          organizations: 0,
          departments: 0,
          users: 0
        };
        
        // Get organizations count
        try {
          const orgsData = await getOrganizations();
          if (Array.isArray(orgsData)) {
            statsData.organizations = orgsData.length;
          }
        } catch (orgError) {
          console.error('Error fetching organizations:', orgError);
        }
        
        // Get users count
        try {
          const usersData = await getUsers();
          if (usersData && usersData.users && Array.isArray(usersData.users)) {
            statsData.users = usersData.users.length;
            
            // Extract departments from users data
            const uniqueDepartments = new Set();
            usersData.users.forEach(user => {
              if (user.department) {
                uniqueDepartments.add(user.department);
              }
            });
            statsData.departments = uniqueDepartments.size;
          }
        } catch (usersError) {
          console.error('Error fetching users:', usersError);
        }
        
        setStats(statsData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching statistics:', error);
        setError('Failed to load dashboard statistics');
        setLoading(false);
      }
    };

    fetchAdminInfo();
    fetchStats();
  }, []);

  // Admin panel cards
  const adminCards = [
    {
      title: 'Organizations',
      count: stats.organizations,
      icon: <FaBuilding size={24} />,
      color: '#FFD700',
      path: '/admin/organizations'
    },
    {
      title: 'Departments',
      count: stats.departments,
      icon: <FaSitemap size={24} />,
      color: '#4CAF50',
      path: '/admin/departments'
    },
    {
      title: 'Users',
      count: stats.users,
      icon: <FaUsers size={24} />,
      color: '#2196F3',
      path: '/admin/users'
    }
  ];

  return (
    <div className="admin-dashboard">
      {error && (
        <div style={{ 
          backgroundColor: '#ff3333', 
          color: 'white', 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '1rem' 
        }}>
          {error}
        </div>
      )}
      
      {/* Admin welcome section */}
      <div className="admin-welcome" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '24px', color: '#FFD700', marginBottom: '1rem' }}>
          Admin Control Panel
        </h1>
        <div className="admin-info" style={{ 
          backgroundColor: '#1e1e1e', 
          padding: '1.5rem', 
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(255, 215, 0, 0.15)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '18px', marginBottom: '0.5rem' }}>Welcome, {adminInfo.username}</h2>
              <p style={{ fontSize: '14px', color: '#aaa' }}>Account expires: {adminInfo.accountExpires}</p>
            </div>
            <div style={{ 
              backgroundColor: '#FFD700', 
              color: '#121212', 
              padding: '0.5rem 1rem', 
              borderRadius: '4px',
              fontWeight: 'bold'
            }}>
              Administrator
            </div>
          </div>
          
          {adminInfo.groups && adminInfo.groups.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <p style={{ fontSize: '14px', marginBottom: '0.5rem' }}>Security Groups:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {adminInfo.groups.map((group, index) => (
                  <span key={index} style={{ 
                    backgroundColor: '#333', 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {group}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin cards grid */}
      <div className="admin-cards" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1.5rem'
      }}>
        {loading ? (
          // Loading skeleton
          Array(3).fill(0).map((_, index) => (
            <div key={index} style={{ 
              backgroundColor: '#1e1e1e', 
              borderRadius: '8px',
              padding: '1.5rem',
              height: '180px',
              animation: 'pulse 1.5s infinite ease-in-out',
              opacity: '0.7'
            }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                backgroundColor: '#333',
                marginBottom: '1rem'
              }}></div>
              <div style={{ width: '60%', height: '24px', backgroundColor: '#333', marginBottom: '1rem' }}></div>
              <div style={{ width: '40%', height: '18px', backgroundColor: '#333' }}></div>
            </div>
          ))
        ) : (
          // Actual cards
          adminCards.map((card, index) => (
            <div 
              key={index} 
              className="admin-card" 
              style={{ 
                backgroundColor: '#1e1e1e', 
                borderRadius: '8px',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                border: `1px solid ${card.color}20`,
                position: 'relative',
                overflow: 'hidden'
              }}
              onClick={() => console.log(`Navigate to ${card.path}`)}
            >
              <div style={{ 
                position: 'absolute',
                top: '0',
                right: '0',
                width: '100px',
                height: '100px',
                background: `${card.color}10`,
                borderRadius: '0 0 0 100%',
                zIndex: '0'
              }}></div>
              
              <div style={{ 
                backgroundColor: card.color, 
                color: '#121212', 
                width: '50px', 
                height: '50px', 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                position: 'relative',
                zIndex: '1'
              }}>
                {card.icon}
              </div>
              
              <h3 style={{ 
                fontSize: '18px', 
                marginBottom: '0.5rem',
                position: 'relative',
                zIndex: '1'
              }}>
                {card.title}
              </h3>
              
              <p style={{ 
                fontSize: '24px', 
                fontWeight: 'bold',
                color: card.color,
                position: 'relative',
                zIndex: '1'
              }}>
                {card.count}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
