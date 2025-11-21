import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaGoogle, FaMicrosoft } from 'react-icons/fa';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider, useMsal } from '@azure/msal-react';
import { login } from '../../../services/authService';

// Replace with your real client IDs
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const MSAL_CONFIG = {
  auth: {
    clientId: 'YOUR_MICROSOFT_CLIENT_ID',
    authority: 'https://login.microsoftonline.com/YOUR_TENANT_ID',
    redirectUri: window.location.origin,
  },
};

// Google OAuth 2.0 configuration
const GOOGLE_OAUTH_CONFIG = {
  scope: 'openid email profile',
  access_type: 'offline',
  prompt: 'consent'
};

function MicrosoftLoginButton({ onSuccess }) {
  const { instance } = useMsal();
  const handleMicrosoftLogin = async () => {
    try {
      const loginResponse = await instance.loginPopup({ scopes: ['user.read'] });
      if (loginResponse.account) {
        onSuccess();
      }
    } catch (err) {
      alert('Microsoft login failed');
    }
  };
  return (
    <button
      onClick={handleMicrosoftLogin}
      style={{
        width: '100%',
        background: 'linear-gradient(90deg, #fff 0%, #0078d4 100%)',
        color: '#222',
        fontWeight: 700,
        border: 'none',
        borderRadius: 12,
        padding: 'clamp(12px, 2vw, 14px) 0',
        fontSize: 'clamp(14px, 2.5vw, 17px)',
        cursor: 'pointer',
        marginBottom: 28,
        boxShadow: '0 2px 8px #0078d422',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12
      }}
    >
      <FaMicrosoft style={{ color: '#0078d4', fontSize: 'clamp(18px, 3vw, 22px)' }} /> Sign in with Microsoft
    </button>
  );
}

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Use the authService login function that sends credentials to localhost:8000/auth/token
      const userData = await login(username, password);
      
      // Check if user is an administrator and redirect accordingly
      if (userData.is_admin) {
        // Redirect to admin page
        navigate('/admin');
      } else {
        // Regular user - redirect to home
        navigate('/home');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = (credentialResponse) => {
    // You can verify credentialResponse.credential with your backend if needed
    navigate('/home');
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Login</h2>
        <div style={{ color: '#aaa', textAlign: 'center', marginBottom: 18, fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
          Login with username and password
        </div>
        <form onSubmit={handleLogin} className="auth-form" style={{ gap: 18 }}>
          <input 
            type="text" 
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}
          />
          <input 
            type="password" 
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}
          />
          <button 
            type="submit" 
            style={{ 
              fontSize: 'clamp(0.9rem, 2vw, 1rem)',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }} 
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div style={{ height: 24 }} />
        <div style={{ color: '#aaa', textAlign: 'center', marginBottom: 12, fontSize: 'clamp(0.8rem, 1.8vw, 0.9rem)' }}>
          or sign in with
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => alert('Google login failed')}
            width="100%"
            useOneTap
            theme="filled_blue"
            text="signin_with"
            shape="pill"
            logo_alignment="left"
          />
          <MicrosoftLoginButton onSuccess={() => navigate('/home')} />
        </div>
        {error && <div style={{ color: '#FFD700', marginTop: 18, textAlign: 'center', fontWeight: 600, fontSize: 'clamp(0.8rem, 1.8vw, 0.9rem)' }}>{error}</div>}
        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <span style={{ color: '#aaa', fontSize: 'clamp(0.8rem, 1.8vw, 0.9rem)' }}>Don't have an account? </span>
          <Link to="/signup" style={{ color: '#FFD700', fontWeight: 700, textDecoration: 'underline', fontSize: 'clamp(0.8rem, 1.8vw, 0.9rem)' }}>Sign Up</Link>
        </div>
      </div>
    </div>
  );
};

const Login = () => (
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <MsalProvider instance={new PublicClientApplication(MSAL_CONFIG)}>
      <LoginForm />
    </MsalProvider>
  </GoogleOAuthProvider>
);

export default Login;