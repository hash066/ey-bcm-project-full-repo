import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const location = useLocation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Detect current page for context
  const getCurrentContext = () => {
    const pathname = location.pathname;
    if (pathname.includes('/bia') || pathname.includes('business-impact-analysis')) {
      return 'BIAProcedure';
    } else if (pathname.includes('/procedures')) {
      return 'ProceduresDashboard';
    } else if (pathname.includes('/recovery-strategy')) {
      return 'RecoveryStrategy';
    } else if (pathname.includes('/bcm')) {
      return 'BCMDashboard';
    }
    // Add more contexts as needed
    return 'General';
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Add context to the message if relevant
      const context = getCurrentContext();
      let enhancedInput = input;
      if (context === 'BIAProcedure' && input.toLowerCase().includes('bia') || input.toLowerCase().includes('procedure')) {
        // For BIA analysis, you might want to include procedure text from props or context
        // For now, just add context note
        enhancedInput = `Context: On BIA Procedure page. User query: ${input}`;
      } else if (context !== 'General') {
        enhancedInput = `Context: On ${context} page. User query: ${input}`;
      }

      // Use backend proxy for secure Groq API call with authentication
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }
      
      const response = await fetch(`${apiBaseUrl}/bcm/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: enhancedInput }],
          options: { temperature: 0.7 }
        }),
      });

      if (response.status === 401) {
        // Token expired, try to refresh
        try {
          const refreshResponse = await fetch(`${apiBaseUrl}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            localStorage.setItem('access_token', refreshData.access_token);
            
            // Retry the original request
            const retryResponse = await fetch(`${apiBaseUrl}/bcm/chat`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${refreshData.access_token}`,
              },
              body: JSON.stringify({
                messages: [{ role: 'user', content: enhancedInput }],
                options: { temperature: 0.7 }
              }),
            });
            
            if (!retryResponse.ok) {
              throw new Error(`API error after refresh: ${retryResponse.status}`);
            }
            
            const data = await retryResponse.json();
            const aiMessage = { role: 'assistant', content: data.response };
            setMessages(prev => [...prev, aiMessage]);
            return;
          } else {
            throw new Error('Token refresh failed');
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          localStorage.removeItem('access_token');
          window.location.href = '/login'; // Redirect to login
          return;
        }
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const aiMessage = { role: 'assistant', content: data.response };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage = { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={toggleChat}
        className="chat-toggle-btn"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#FFD700',
          color: '#232323',
          border: 'none',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease'
        }}
        title="Chat with AI Assistant"
      >
        💬
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="chat-window"
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '20px',
            width: '350px',
            height: '500px',
            backgroundColor: '#1e1e1e',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 999,
            border: '1px solid #FFD700'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '15px',
              backgroundColor: '#232323',
              borderRadius: '12px 12px 0 0',
              color: '#FFD700',
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>AI Assistant</span>
            <button
              onClick={toggleChat}
              style={{
                background: 'none',
                border: 'none',
                color: '#FFD700',
                fontSize: '18px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              padding: '15px',
              overflowY: 'auto',
              backgroundColor: '#121212',
              borderRadius: '0 0 12px 12px'
            }}
            className="chat-messages"
          >
            {messages.length === 0 ? (
              <div style={{ color: '#ccc', textAlign: 'center', padding: '20px' }}>
                Ask me about BIA procedures, recovery strategies, or any BCM topic!
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: '15px',
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div
                    style={{
                      maxWidth: '80%',
                      padding: '10px 15px',
                      borderRadius: '18px',
                      backgroundColor: msg.role === 'user' ? '#FFD700' : '#2e2e2e',
                      color: msg.role === 'user' ? '#232323' : '#fff',
                      wordWrap: 'break-word'
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '15px' }}>
                <div
                  style={{
                    padding: '10px 15px',
                    borderRadius: '18px',
                    backgroundColor: '#2e2e2e',
                    color: '#fff'
                  }}
                >
                  Typing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: '15px',
              borderTop: '1px solid #333',
              display: 'flex',
              gap: '10px'
            }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid #555',
                borderRadius: '20px',
                backgroundColor: '#2e2e2e',
                color: '#fff',
                resize: 'none',
                height: '50px',
                outline: 'none'
              }}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#FFD700',
                color: '#232323',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
                opacity: (!input.trim() || isLoading) ? 0.5 : 1
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;