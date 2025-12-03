import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaLock, FaUser, FaShieldAlt } from 'react-icons/fa';

/**
 * Admin Login Component
 * Specialized login for administrator access
 */
const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Admin login API call
      const response = await fetch('http://localhost:8000/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      // Check if the user is an administrator
      if (data.groups && data.groups.includes('Administrators')) {
        // Store token and redirect to admin dashboard
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user_role', 'admin');
        navigate('/admin');
      } else {
        throw new Error('Unauthorized: Administrator access required');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ backgroundColor: '#121212' }}>
      <div className="auth-container" style={{ 
        maxWidth: '400px',
        backgroundColor: '#1e1e1e',
        borderRadius: '8px',
        padding: '2rem',
        boxShadow: '0 8px 20px rgba(255, 215, 0, 0.2)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <FaShieldAlt size={48} color="#FFD700" />
          <h2 style={{ 
            color: '#FFD700', 
            fontSize: '24px', 
            marginTop: '1rem',
            fontWeight: 'bold'
          }}>
            Administrator Access
          </h2>
          <p style={{ color: '#aaa', marginTop: '0.5rem' }}>
            Secure login for system administrators
          </p>
        </div>

        {error && (
          <div style={{ 
            backgroundColor: 'rgba(255, 0, 0, 0.1)', 
            color: '#ff6b6b',
            padding: '0.75rem',
            borderRadius: '4px',
            marginBottom: '1rem',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div style={{ marginBottom: '1.5rem' }}>
            <label 
              htmlFor="username" 
              style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                color: '#f1f1f1',
                fontSize: '14px'
              }}
            >
              Username
            </label>
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#252525',
              borderRadius: '4px',
              border: '1px solid #333',
              padding: '0 1rem'
            }}>
              <FaUser color="#FFD700" style={{ marginRight: '0.75rem' }} />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Administrator"
                required
                style={{ 
                  flex: 1,
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#f1f1f1',
                  padding: '0.75rem 0',
                  fontSize: '16px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label 
              htmlFor="password" 
              style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                color: '#f1f1f1',
                fontSize: '14px'
              }}
            >
              Password
            </label>
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#252525',
              borderRadius: '4px',
              border: '1px solid #333',
              padding: '0 1rem'
            }}>
              <FaLock color="#FFD700" style={{ marginRight: '0.75rem' }} />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                style={{ 
                  flex: 1,
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#f1f1f1',
                  padding: '0.75rem 0',
                  fontSize: '16px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: '#FFD700',
              color: '#121212',
              border: 'none',
              borderRadius: '4px',
              padding: '0.75rem',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.2s',
              width: '100%'
            }}
          >
            {loading ? 'Authenticating...' : 'Access Admin Panel'}
          </button>

          <div style={{ 
            marginTop: '1.5rem',
            textAlign: 'center',
            fontSize: '14px',
            color: '#aaa'
          }}>
            <a 
              href="/login" 
              style={{ 
                color: '#FFD700',
                textDecoration: 'none'
              }}
            >
              Return to regular login
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
