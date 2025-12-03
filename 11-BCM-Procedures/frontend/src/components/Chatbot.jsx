import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBestRouteMatch } from '../utils/routeIndexer';
import './Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [faqData, setFaqData] = useState([]);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Load FAQ data and routes on component mount
  useEffect(() => {
    console.log('Chatbot component mounted and rendering');
    loadFaqData();
    loadRoutes();
    loadChatHistory();
  }, []);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadFaqData = async () => {
    try {
      const response = await fetch('/faqData.json');
      const data = await response.json();
      setFaqData(data);
    } catch (error) {
      console.error('Error loading FAQ data:', error);
    }
  };

  const loadRoutes = () => {
    // Static routes matching your app structure
    const staticRoutes = [
      { path: '/', name: 'Home', description: 'Main dashboard and overview', keywords: ['home', 'dashboard', 'main'] },
      { path: '/business-impact-analysis', name: 'Business Impact Analysis', description: 'Analyze and assess business impact', keywords: ['bia', 'business impact analysis', 'impact analysis'] },
      { path: '/bia/bia-matrix', name: 'Risk Matrix', description: 'Visual risk assessment matrix', keywords: ['risk matrix', 'matrix', 'risk'] },
      { path: '/bia/application-bia/matrix', name: 'Application BIA Matrix', description: 'Application-specific impact analysis', keywords: ['application bia', 'app matrix'] },
      { path: '/process-service-mapping', name: 'Process Service Mapping', description: 'Map processes and services', keywords: ['process', 'service', 'mapping'] },
      { path: '/reports', name: 'Reports', description: 'Generate and view reports', keywords: ['reports', 'export', 'download'] },
      { path: '/admin', name: 'Admin', description: 'Administrative functions', keywords: ['admin', 'administration', 'management'] },
      { path: '/profile', name: 'Profile', description: 'User profile management', keywords: ['profile', 'account', 'user'] }
    ];
    setRoutes(staticRoutes);
  };

  const loadChatHistory = () => {
    const history = localStorage.getItem('chatbot_history');
    if (history) {
      try {
        const parsedMessages = JSON.parse(history);
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsedMessages.map(message => ({
          ...message,
          timestamp: new Date(message.timestamp)
        }));
        setMessages(messagesWithDates);
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    }
  };

  const saveChatHistory = (newMessages) => {
    localStorage.setItem('chatbot_history', JSON.stringify(newMessages));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFaqClick = (faq) => {
    const userMessage = { type: 'user', content: faq.question, timestamp: new Date() };
    const botMessage = { type: 'bot', content: faq.answer, timestamp: new Date() };

    const newMessages = [...messages, userMessage, botMessage];
    setMessages(newMessages);
    saveChatHistory(newMessages);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = { type: 'user', content: inputMessage, timestamp: new Date() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    saveChatHistory(newMessages);

    setInputMessage('');
    setIsTyping(true);

    try {
      // First, try to find a matching route
      const routeMatch = getBestRouteMatch(inputMessage, routes);

      if (routeMatch && routeMatch.score < 0.4) {
        // Found a good route match
        const botMessage = {
          type: 'bot',
          content: `You can find it under the '${routeMatch.name}' section. ${routeMatch.description}`,
          link: routeMatch.path,
          timestamp: new Date()
        };
        const updatedMessages = [...newMessages, botMessage];
        setMessages(updatedMessages);
        saveChatHistory(updatedMessages);
      } else {
        // No route match, use Gemini API
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: inputMessage }),
        });

        if (response.ok) {
          const data = await response.json();
          const botMessage = {
            type: 'bot',
            content: data.response,
            timestamp: new Date()
          };
          const updatedMessages = [...newMessages, botMessage];
          setMessages(updatedMessages);
          saveChatHistory(updatedMessages);
        } else {
          throw new Error('API request failed');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        type: 'bot',
        content: 'Sorry, I encountered an error. Please try again later.',
        timestamp: new Date()
      };
      const updatedMessages = [...newMessages, errorMessage];
      setMessages(updatedMessages);
      saveChatHistory(updatedMessages);
    } finally {
      setIsTyping(false);
    }
  };

  const handleLinkClick = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('chatbot_history');
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <div className="chatbot-button-container">
        <button
          onClick={() => {
            console.log('Chatbot button clicked!');
            setIsOpen(!isOpen);
          }}
          className="chatbot-button"
        >
          <span className="chatbot-button-text">
            {isOpen ? '×' : '💬'}
          </span>
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div>
              <h3>BIA Assistant</h3>
              <p>How can I help you?</p>
            </div>
            <button
              onClick={clearChat}
              className="chatbot-clear-btn"
              title="Clear chat"
            >
              🗑️
            </button>
          </div>

          {/* FAQ Buttons Removed */}

          {/* Messages */}
          <div className="chatbot-messages">
            {/* Initial message removed */}

            {messages.map((message, index) => (
              <div key={index} className={`message-container ${message.type}`}>
                <div className={`message-bubble ${message.type}`}>
                  <p className="text-sm">{message.content}</p>
                  {message.link && (
                    <button
                      onClick={() => handleLinkClick(message.link)}
                      className="mt-2 text-xs bg-white text-blue-500 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                    >
                      Go to {message.link === '/' ? 'Home' : message.link.split('/').pop().replace('-', ' ')}
                    </button>
                  )}
                </div>
                <div className={`message-timestamp ${message.type}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="message-container bot">
                <div className="message-bubble bot">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="chatbot-input-form">
            <div className="chatbot-input">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me anything about BIA..."
                className="chatbot-input-field"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isTyping}
                className="chatbot-send-btn"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default Chatbot;
