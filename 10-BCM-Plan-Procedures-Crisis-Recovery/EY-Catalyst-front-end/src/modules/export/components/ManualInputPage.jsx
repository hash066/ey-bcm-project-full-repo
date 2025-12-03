import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaKeyboard, FaChevronUp, FaChevronDown, FaSync } from 'react-icons/fa';

const ManualInputPage = () => {
  const [form, setForm] = useState({
    type: 'process',
    label: '',
    description: '',
    owner: '',
    email: '',
    subProcesses: '',
  });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Gmail-style scrolling state
  const [scrollPosition, setScrollPosition] = useState(0);
  const [autoScroll, setAutoScroll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const contentRef = useRef(null);

  // Tab configuration
  const tabConfig = [
    { key: 'process', label: 'Process Entry' },
    { key: 'service', label: 'Service Entry' },
    { key: 'validation', label: 'Validation' },
    { key: 'submit', label: 'Submit' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');
    try {
      const response = await fetch('/api/manual-input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          subProcesses: form.subProcesses.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      });
      if (response.ok) {
        setStatus('Data submitted successfully!');
        setForm({ type: 'process', label: '', description: '', owner: '', email: '', subProcesses: '' });
      } else {
        setStatus('Submission failed. Please try again.');
      }
    } catch (err) {
      setStatus('An error occurred during submission.');
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = () => {
    if (contentRef.current) {
      setScrollPosition(contentRef.current.scrollTop);
    }
  };

  const scrollToTop = () => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const startAutoScroll = () => {
    setAutoScroll(!autoScroll);
  };

  useEffect(() => {
    let interval;
    if (autoScroll && contentRef.current) {
      interval = setInterval(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop += 2;
          if (contentRef.current.scrollTop >= contentRef.current.scrollHeight - contentRef.current.clientHeight) {
            setAutoScroll(false);
          }
        }
      }, 50);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoScroll]);

  return (
    <div style={{ 
      position: 'relative', 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: '#121212',
    }}>
      {/* Gmail-style static navigation tabs */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 18,
          background: '#181818',
          borderBottom: '3px solid #FFD700',
          borderRadius: 0,
          boxShadow: '0 2px 16px #FFD70022',
          padding: '10px 18px',
          margin: 0,
          minHeight: 60,
          flexShrink: 0,
        }}
      >
        {tabConfig.map(tab => (
          <button
            key={tab.key}
            onClick={() => setForm({...form, type: tab.key})}
            style={{
              background: form.type === tab.key
                ? 'linear-gradient(90deg, #FFD700 40%, #facc15 100%)'
                : 'transparent',
              color: form.type === tab.key ? '#232323' : '#FFD700',
              fontWeight: 700,
              fontSize: 17,
              border: 'none',
              borderRadius: 999,
              padding: '10px 28px',
              margin: '0 2px',
              boxShadow: form.type === tab.key
                ? '0 2px 12px #FFD70044'
                : 'none',
              transition: 'all 0.18s',
              cursor: 'pointer',
              outline: 'none',
              position: 'relative',
              letterSpacing: 0.5,
              zIndex: 1,
            }}
            onMouseOver={e => {
              if (form.type !== tab.key) {
                e.currentTarget.style.background = 'rgba(255, 215, 0, 0.08)';
                e.currentTarget.style.color = '#FFD700';
              }
            }}
            onMouseOut={e => {
              if (form.type !== tab.key) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#FFD700';
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Gmail-style scrollable content area */}
      <div 
        ref={contentRef}
        style={{ 
          flex: 1, 
          minHeight: 0, 
          overflowY: 'auto',
          padding: '20px',
          position: 'relative',
          background: '#121212',
          scrollBehavior: 'smooth',
          scrollbarWidth: 'thin',
          scrollbarColor: '#FFD700 #232323',
        }}
        onScroll={handleScroll}
      >
        {/* Custom scrollbar styles */}
        <style>{`
          div::-webkit-scrollbar {
            width: 8px;
          }
          div::-webkit-scrollbar-track {
            background: #232323;
            border-radius: 4px;
          }
          div::-webkit-scrollbar-thumb {
            background: #FFD700;
            border-radius: 4px;
            transition: background 0.3s ease;
          }
          div::-webkit-scrollbar-thumb:hover {
            background: #facc15;
          }
        `}</style>

        {/* Optimized Loading overlay */}
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#232323',
            color: '#FFD700',
            padding: '12px 20px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 4px 16px #FFD70022',
            border: '1px solid #FFD700',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            animation: 'fadeInOut 0.15s ease-in-out',
          }}>
            <FaSync style={{ animation: 'spin 0.6s linear infinite' }} />
            Loading...
          </div>
        )}

        {/* Main content with optimized animations */}
        <div style={{
          opacity: isLoading ? 0.8 : 1,
          transition: 'opacity 0.15s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100%',
          background: 'linear-gradient(120deg, #181818 0%, #232526 100%)',
          position: 'relative',
          overflow: 'hidden',
          padding: '3vw 0',
        }}>
          {/* Background Pattern */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 80%, rgba(255, 215, 0, 0.08) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(106, 48, 147, 0.08) 0%, transparent 60%)',
            pointerEvents: 'none',
            zIndex: 0,
          }} />
          <div style={{
            width: '100%',
            maxWidth: 600,
            background: 'rgba(24,24,24,0.98)',
            borderRadius: 18,
            boxShadow: '0 8px 32px #FFD70022',
            border: '1.5px solid #FFD70044',
            color: '#FFD700',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1,
            padding: '2.5rem 2rem',
            margin: '0 2vw',
          }}>
      <button
        onClick={() => navigate('/home')}
        style={{
          background: 'none',
          color: '#FFD700',
                border: '1.5px solid #FFD700',
          borderRadius: 10,
          padding: '10px 0',
          fontWeight: 600,
          fontSize: 15,
          cursor: 'pointer',
          marginBottom: 24,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: 120,
                transition: 'background 0.2s, color 0.2s',
                zIndex: 1,
        }}
              onMouseOver={e => { e.currentTarget.style.background = '#FFD700'; e.currentTarget.style.color = '#232323'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#FFD700'; }}
      >
        <FaArrowLeft /> Back
      </button>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 18, zIndex: 1 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(90deg, #00c3ff 0%, #ffff1c 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10,
                color: '#222', fontSize: 26, boxShadow: '0 2px 8px #00c3ff44',
              }}>
                <FaKeyboard />
              </div>
              <h2 style={{ color: '#FFD700', textAlign: 'center', marginBottom: 0, fontWeight: 800, letterSpacing: 1, fontSize: 26, textShadow: '0 2px 12px #FFD70044' }}>Manual Data Entry</h2>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22, width: '100%', zIndex: 1 }}>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 8 }}>
                <label style={{ color: '#FFD700', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input
              type="radio"
              name="type"
              value="process"
              checked={form.type === 'process'}
              onChange={handleChange}
                    style={{ marginRight: 8, accentColor: '#FFD700' }}
            />
            Process
          </label>
                <label style={{ color: '#FFD700', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input
              type="radio"
              name="type"
              value="service"
              checked={form.type === 'service'}
              onChange={handleChange}
                    style={{ marginRight: 8, accentColor: '#FFD700' }}
            />
            Service
          </label>
        </div>
        <input
          type="text"
          name="label"
          placeholder="Name (Process/Service)"
          value={form.label}
          onChange={handleChange}
          required
                style={{ padding: 14, borderRadius: 10, border: '1.5px solid #FFD700', fontSize: 16, background: '#232323', color: '#FFD700', fontWeight: 600, marginBottom: 6 }}
        />
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          rows={3}
                style={{ padding: 14, borderRadius: 10, border: '1.5px solid #FFD700', fontSize: 16, background: '#232323', color: '#FFD700', fontWeight: 500, marginBottom: 6 }}
        />
        <input
          type="text"
          name="owner"
          placeholder="Owner Name"
          value={form.owner}
          onChange={handleChange}
                style={{ padding: 14, borderRadius: 10, border: '1.5px solid #FFD700', fontSize: 16, background: '#232323', color: '#FFD700', fontWeight: 500, marginBottom: 6 }}
        />
        <input
          type="email"
          name="email"
          placeholder="Owner Email"
          value={form.email}
          onChange={handleChange}
                style={{ padding: 14, borderRadius: 10, border: '1.5px solid #FFD700', fontSize: 16, background: '#232323', color: '#FFD700', fontWeight: 500, marginBottom: 6 }}
        />
        <input
          type="text"
          name="subProcesses"
          placeholder="Sub-Processes (comma separated)"
          value={form.subProcesses}
          onChange={handleChange}
                style={{ padding: 14, borderRadius: 10, border: '1.5px solid #FFD700', fontSize: 16, background: '#232323', color: '#FFD700', fontWeight: 500, marginBottom: 6 }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            background: 'linear-gradient(90deg, #FFD700 0%, #ffe066 100%)',
            color: '#222',
            fontWeight: 700,
            border: 'none',
            borderRadius: 12,
            padding: '14px 0',
            fontSize: 17,
            cursor: 'pointer',
            marginTop: 8,
            boxShadow: '0 2px 8px #FFD70022',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  transition: 'background 0.2s, color 0.2s',
          }}
                onMouseOver={e => { e.currentTarget.style.background = '#FFD700'; e.currentTarget.style.color = '#232323'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'linear-gradient(90deg, #FFD700 0%, #ffe066 100%)'; e.currentTarget.style.color = '#222'; }}
        >
          {loading ? 'Submitting...' : <><FaCheckCircle /> Submit</>}
        </button>
      </form>
      {status && (
              <div style={{ color: status.includes('success') ? '#28a745' : '#FFD700', marginTop: 24, textAlign: 'center', fontWeight: 600, fontSize: 16, zIndex: 1 }}>
          {status}
        </div>
      )}
          </div>
        </div>

        {/* Gmail-style scroll indicators */}
        {scrollPosition > 200 && (
          <button
            onClick={scrollToTop}
            style={{
              position: 'fixed',
              bottom: 100,
              right: 30,
              background: '#232323',
              color: '#FFD700',
              border: '1px solid #FFD700',
              borderRadius: '50%',
              width: 50,
              height: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 1000,
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 16px #FFD70022',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#FFD700';
              e.currentTarget.style.color = '#232323';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#232323';
              e.currentTarget.style.color = '#FFD700';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <FaChevronUp />
          </button>
        )}

        {/* Auto-scroll button */}
        <button
          onClick={startAutoScroll}
          style={{
            position: 'fixed',
            bottom: 30,
            right: 30,
            background: autoScroll ? '#FFD700' : '#232323',
            color: autoScroll ? '#232323' : '#FFD700',
            border: '1px solid #FFD700',
            borderRadius: '50%',
            width: 50,
            height: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 1000,
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 16px #FFD70022',
          }}
          onMouseEnter={(e) => {
            if (!autoScroll) {
              e.currentTarget.style.background = '#FFD700';
              e.currentTarget.style.color = '#232323';
              e.currentTarget.style.transform = 'scale(1.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (!autoScroll) {
              e.currentTarget.style.background = '#232323';
              e.currentTarget.style.color = '#FFD700';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          <FaChevronDown />
        </button>

        {/* CSS Animations */}
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes fadeInOut {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default ManualInputPage; 