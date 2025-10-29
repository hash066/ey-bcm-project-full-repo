import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Play, Clock, Users, Award, BookOpen, Settings, Search, Filter, Download, MessageCircle, AlertTriangle, CheckCircle, X, Menu, User, Bell, LogOut } from 'lucide-react';
import './training.css';

// More realistic dummy data
const trainingModules = [
  { id: 1, title: "Introduction to BCM", duration: "45 min", progress: 70, description: "Learn the fundamentals of Business Continuity Management, including key concepts, terminology, and the importance of BCM in modern organizations." },
  { id: 2, title: "Business Impact Analysis", duration: "60 min", progress: 45, description: "Understand how to assess business impact, identify critical functions, and prioritize recovery strategies." },
  { id: 3, title: "Risk Assessment Matrix", duration: "30 min", progress: 90, description: "Master risk evaluation techniques, including qualitative and quantitative risk assessment, and mitigation planning." },
  { id: 4, title: "Crisis Communication", duration: "40 min", progress: 0, description: "Effective communication during emergencies, including stakeholder management and media handling." },
  { id: 5, title: "IT Disaster Recovery", duration: "50 min", progress: 20, description: "Explore IT-specific disaster recovery planning, backup strategies, and system restoration." },
  { id: 6, title: "Supply Chain Resilience", duration: "35 min", progress: 0, description: "Learn how to ensure continuity in supply chain operations during disruptions." },
];

const tests = [
  { id: 1, title: "BCM Fundamentals", status: "Completed", score: 85, timeLimit: "30 min" },
  { id: 2, title: "BIA Assessment", status: "In Progress", score: 62, timeLimit: "45 min" },
  { id: 3, title: "Risk Management", status: "Not Started", score: null, timeLimit: "35 min" },
  { id: 4, title: "Crisis Communication Quiz", status: "Not Started", score: null, timeLimit: "25 min" },
  { id: 5, title: "IT Disaster Recovery Test", status: "Completed", score: 91, timeLimit: "40 min" },
];

const ttxScenarios = [
  { id: 1, name: "Ransomware Attack - Finance Dept", description: "Simulate response to ransomware affecting financial systems and payroll." },
  { id: 2, name: "Natural Disaster - Office Evacuation", description: "Practice emergency evacuation procedures for a major earthquake scenario." },
  { id: 3, name: "Cyber Security Breach", description: "Handle data breach, customer notification, and regulatory reporting." },
  { id: 4, name: "Pandemic Outbreak", description: "Coordinate remote work and business continuity during a health crisis." },
  { id: 5, name: "Supply Chain Disruption", description: "Respond to a sudden loss of a key supplier and manage alternative sourcing." },
];

const users = [
  { id: 1, name: "Sanika Sharma", email: "sanika@company.com", modulesCompleted: 5, avgScore: 87 },
  { id: 2, name: "John Smith", email: "john@company.com", modulesCompleted: 4, avgScore: 92 },
  { id: 3, name: "Mary Johnson", email: "mary@company.com", modulesCompleted: 6, avgScore: 78 },
  { id: 4, name: "Alex Lee", email: "alex@company.com", modulesCompleted: 3, avgScore: 81 },
  { id: 5, name: "Priya Patel", email: "priya@company.com", modulesCompleted: 6, avgScore: 95 },
  { id: 6, name: "Carlos Gomez", email: "carlos@company.com", modulesCompleted: 2, avgScore: 68 },
  { id: 7, name: "Fatima Noor", email: "fatima@company.com", modulesCompleted: 5, avgScore: 89 },
];

// Simulated current user with more details
const currentUser = {
  name: 'Sanika Sharma',
  avatar: 'S',
  certificates: [
    { id: 1, title: "Certified BCM Professional", date: "2023-11-15" },
    { id: 2, title: "Crisis Communication Expert", date: "2024-01-10" }
  ],
  leaderboardRank: 3,
  recentActivity: [
    { type: 'test', title: 'Completed BCM Fundamentals Test', score: 85, time: '2 hours ago' },
    { type: 'module', title: 'Started Risk Assessment Module', progress: 45, time: 'Yesterday' },
    { type: 'ttx', title: 'Participated in TTX Exercise', scenario: 'Ransomware Response', time: '3 days ago' },
    { type: 'certificate', title: 'Earned Certified BCM Professional', time: 'Last week' },
    { type: 'test', title: 'Completed IT Disaster Recovery Test', score: 91, time: '2 weeks ago' },
  ]
};

// Main App Component
const BCMTrainingPlatform = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentUser] = useState({ name: 'Sanika', avatar: 'S' });
  const [modules, setModules] = useState(trainingModules);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Admin add module form state
  const [newModule, setNewModule] = useState({
    title: '',
    duration: '',
    description: '',
  });

  const handleTitleChange = (e) => {
    setNewModule(prev => ({ ...prev, title: e.target.value }));
  };

  const handleDurationChange = (e) => {
    setNewModule(prev => ({ ...prev, duration: e.target.value }));
  };

  const handleDescriptionChange = (e) => {
    setNewModule(prev => ({ ...prev, description: e.target.value }));
  };

  const handleAddModule = (e) => {
    e.preventDefault();
    if (!newModule.title || !newModule.duration || !newModule.description) return;
    setModules([
      ...modules,
      {
        id: modules.length + 1,
        title: newModule.title,
        duration: newModule.duration,
        progress: 0,
        description: newModule.description,
      },
    ]);
    setNewModule({ title: '', duration: '', description: '' });
  };

  // Tabletop Exercise timer state
  const [ttxTimer, setTtxTimer] = useState(0); // seconds
  const [ttxRunning, setTtxRunning] = useState(false);
  const [ttxLog, setTtxLog] = useState([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { sender: "Crisis Manager", message: "Initiating emergency protocol", time: "10:30 AM" },
    { sender: "IT Lead", message: "Systems are secure, investigating breach source", time: "10:32 AM" },
    { sender: "You", message: "Preparing stakeholder communications", time: "10:35 AM" }
  ]);
  const [chatInput, setChatInput] = useState("");

  // Separate useEffect for timer to avoid interference with form
  useEffect(() => {
    if (ttxRunning) {
      const interval = setInterval(() => {
        setTtxTimer(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [ttxRunning]);

  const handleStartTtx = () => {
    if (!selectedScenarioId) return;
    setTtxRunning(true);
  };
  const handlePauseTtx = () => {
    setTtxRunning(false);
  };
  const handleEndTtx = () => {
    setTtxRunning(false);
    if (ttxTimer > 0 && selectedScenarioId) {
      const scenario = ttxScenarios.find(s => String(s.id) === String(selectedScenarioId));
      setTtxLog([
        ...ttxLog,
        {
          time: new Date().toLocaleTimeString(),
          duration: ttxTimer,
          scenario: scenario ? scenario.name : "Unknown Scenario",
        },
      ]);
    }
    setTtxTimer(0);
  };
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const newMessage = {
      sender: "You",
      message: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setChatMessages([...chatMessages, newMessage]);
    setChatInput("");
  };
  function formatSeconds(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // Components
  const Navbar = () => (
    <nav className="navbar">
      <div className="navbar-left">
        <div className="logo">EY BCM Training</div>
        <ul className="nav-links">
          <li><a className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentPage('dashboard')}>Dashboard</a></li>
          <li><a className={`nav-link ${currentPage === 'training' ? 'active' : ''}`} onClick={() => setCurrentPage('training')}>Training</a></li>
          <li><a className={`nav-link ${currentPage === 'testing' ? 'active' : ''}`} onClick={() => setCurrentPage('testing')}>Testing</a></li>
          <li><a className={`nav-link ${currentPage === 'ttx' ? 'active' : ''}`} onClick={() => setCurrentPage('ttx')}>Tabletop</a></li>
          <li><a className={`nav-link ${currentPage === 'admin' ? 'active' : ''}`} onClick={() => setCurrentPage('admin')}>Admin</a></li>
        </ul>
      </div>
      {/* Removed navbar-right with Bell and profile-avatar */}
    </nav>
  );

  const ProgressBar = ({ progress }) => (
    <div className="progress-container">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="progress-text">{progress}% Complete</div>
    </div>
  );

  const Modal = ({ children, onClose }) => (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Details</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );

  // Page Components
  const Dashboard = () => (
    <div>
      <h1 className="mb-3">Hi, {currentUser.name} 👋</h1>
      
      <div className="card mb-3">
        <h3 className="card-title">Overall Training Progress</h3>
        <ProgressBar progress={68} />
      </div>

      <div className="card-grid">
        <div className="card">
          <div className="flex flex-between mb-2">
            <h3 className="card-title">Training Modules</h3>
            <BookOpen size={24} color="#ffcc00" />
          </div>
          <p className="card-desc">3 of 4 modules completed</p>
          <button className="btn btn-primary" onClick={() => setCurrentPage('training')}>
            Continue Learning
          </button>
        </div>

        <div className="card">
          <div className="flex flex-between mb-2">
            <h3 className="card-title">Upcoming Tests</h3>
            <Clock size={24} color="#ffcc00" />
          </div>
          <p className="card-desc">2 assessments pending</p>
          <button className="btn btn-primary" onClick={() => setCurrentPage('testing')}>
            Take Test
          </button>
        </div>

        <div className="card">
          <div className="flex flex-between mb-2">
            <h3 className="card-title">Certificates</h3>
            <Award size={24} color="#ffcc00" />
          </div>
          <p className="card-desc">2 certificates earned</p>
          <button className="btn btn-secondary">
            <Download size={16} />
            Download
          </button>
        </div>

        <div className="card">
          <div className="flex flex-between mb-2">
            <h3 className="card-title">Leaderboard</h3>
            <Users size={24} color="#ffcc00" />
          </div>
          <p className="card-desc">Rank #3 this month</p>
          <button className="btn btn-secondary">View Rankings</button>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title mb-2">Recent Activity</h3>
        <div className="timeline">
          <div className="timeline-item">
            <h4>Completed BCM Fundamentals Test</h4>
            <p>Score: 85% • 2 hours ago</p>
          </div>
          <div className="timeline-item">
            <h4>Started Risk Assessment Module</h4>
            <p>Progress: 45% • Yesterday</p>
          </div>
          <div className="timeline-item">
            <h4>Participated in TTX Exercise</h4>
            <p>Scenario: Ransomware Response • 3 days ago</p>
          </div>
        </div>
      </div>
    </div>
  );

  const Training = () => (
    <div>
      <div className="flex flex-between mb-3">
        <h1>Training Modules</h1>
        <button className="btn btn-primary">
          <Search size={16} />
          Search Modules
        </button>
      </div>

      <div className="card-grid">
        {modules.map(module => (
          <div key={module.id} className="card">
            <h3 className="card-title">{module.title}</h3>
            <p className="card-desc">{module.description}</p>
            <div className="flex gap-2 mb-2">
              <Clock size={16} />
              <span>{module.duration}</span>
            </div>
            <ProgressBar progress={module.progress} />
            <div className="flex gap-2 mt-2">
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setActiveTab(0); // Always start with Overview tab
                  setModalContent(
                    <TrainingModuleDetail module={module} />
                  );
                  setShowModal(true);
                }}
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const TrainingModuleDetail = ({ module }) => {
    const tabs = ['Overview', 'Videos', 'Documents', 'Quiz'];
    
    return (
      <div>
        <h2 className="mb-2">{module.title}</h2>
        <p className="mb-3">{module.description}</p>
        
        <div className="tabs">
          <ul className="tab-list">
            {tabs.map((tab, index) => (
              <li 
                key={index}
                className={`tab ${activeTab === index ? 'active' : ''}`}
                onClick={() => setActiveTab(index)}
              >
                {tab}
              </li>
            ))}
          </ul>
        </div>

        <div className="tab-content">
          {activeTab === 0 && (
            <div>
              <h3 className="text-yellow mb-2">Module Overview</h3>
              <p>This comprehensive module covers the essential concepts of {module.title.toLowerCase()}. You'll learn practical applications and real-world scenarios.</p>
              <ProgressBar progress={module.progress} />
            </div>
          )}
          {activeTab === 1 && (
            <div>
              <h3 className="text-yellow mb-2">Video Content</h3>
              <div className="card">
                <p>Video placeholder - Interactive learning content would be embedded here</p>
                <button className="btn btn-primary mt-2">
                  <Play size={16} />
                  Play Video
                </button>
              </div>
            </div>
          )}
          {activeTab === 2 && (
            <div>
              <h3 className="text-yellow mb-2">Documents & Resources</h3>
              <div className="card">
                <p>PDF Handbook: {module.title}</p>
                <button className="btn btn-secondary">
                  <Download size={16} />
                  Download PDF
                </button>
              </div>
            </div>
          )}
          {activeTab === 3 && (
            <div>
              <h3 className="text-yellow mb-2">Knowledge Check</h3>
              <div className="card">
                <p><strong>Question 1:</strong> What is the primary goal of BCM?</p>
                <div className="mt-2">
                  <label><input type="radio" name="q1" /> Prevent all disasters</label><br />
                  <label><input type="radio" name="q1" /> Ensure business continuity</label><br />
                  <label><input type="radio" name="q1" /> Reduce costs</label>
                </div>
                <button className="btn btn-primary mt-2">Submit Answer</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const Testing = () => (
    <div>
      <h1 className="mb-3">Assessments & Testing</h1>
      
      <table className="table">
        <thead>
          <tr>
            <th>Assessment</th>
            <th>Status</th>
            <th>Time Limit</th>
            <th>Score</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {tests.map(test => (
            <tr key={test.id}>
              <td>{test.title}</td>
              <td>
                <span className={`status ${test.status.toLowerCase().replace(' ', '-')}`}>
                  {test.status === 'Completed' && <CheckCircle size={16} />}
                  {test.status === 'In Progress' && <Clock size={16} />}
                  {test.status === 'Not Started' && <AlertTriangle size={16} />}
                  {test.status}
                </span>
              </td>
              <td>{test.timeLimit}</td>
              <td>{test.score ? `${test.score}%` : '-'}</td>
              <td>
                <button className="btn btn-primary">
                  {test.status === 'Completed' ? 'Review' : test.status === 'In Progress' ? 'Continue' : 'Start'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const TabletopExercise = () => (
    <div>
      <h1 className="mb-3">Tabletop Exercises</h1>
      
      <div className="card mb-3">
        <h3 className="card-title">Scenario Selection</h3>
        <select
          className="form-select"
          value={selectedScenarioId}
          onChange={e => {
            setSelectedScenarioId(e.target.value);
            setTtxTimer(0);
            setTtxRunning(false);
          }}
        >
          <option value="">Select a scenario...</option>
          {ttxScenarios.map(scenario => (
            <option key={scenario.id} value={scenario.id}>{scenario.name}</option>
          ))}
        </select>
      </div>

      <div className="card-grid">
        <div className="card">
          <h3 className="card-title">Role Assignments</h3>
          <div className="mb-2">
            <strong>Crisis Manager:</strong> John Smith
          </div>
          <div className="mb-2">
            <strong>IT Lead:</strong> Sarah Wilson
          </div>
          <div className="mb-2">
            <strong>Communications:</strong> {currentUser.name}
          </div>
          <button className="btn btn-secondary">Reassign Roles</button>
        </div>

        <div className="card">
          <h3 className="card-title">Exercise Control</h3>
          <div className="mb-2">
            <strong>Timer: </strong>
            <span style={{ fontFamily: 'monospace', fontSize: '1.2em' }}>{formatSeconds(ttxTimer)}</span>
            {ttxRunning && <span className="text-success ml-2">Running</span>}
            {!ttxRunning && ttxTimer > 0 && <span className="text-warning ml-2">Paused</span>}
          </div>
          <button className="btn btn-primary mb-2" onClick={handleStartTtx} disabled={ttxRunning || !selectedScenarioId}>Start Exercise</button>
          <button className="btn btn-secondary mb-2" onClick={handlePauseTtx} disabled={!ttxRunning}>Pause</button>
          <button className="btn btn-danger" onClick={handleEndTtx} disabled={ttxTimer === 0}>End Exercise</button>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Team Communication</h3>
        <div className="chat-window">
          <div className="chat-messages">
            {chatMessages.map((msg, index) => (
              <div key={index} className={`chat-message ${msg.sender === 'You' ? 'sent' : 'received'}`}>
                <div className="message-header">
                  <strong>{msg.sender}</strong>
                  <span className="message-time">{msg.time}</span>
                </div>
                <p>{msg.message}</p>
              </div>
            ))}
          </div>
          <form className="chat-input" onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder="Type your message..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">Send</button>
          </form>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Decision Log</h3>
        <div className="timeline">
          <div className="timeline-item">
            <h4>Activated Crisis Team</h4>
            <p>Decision made by: Crisis Manager • 10:30 AM</p>
          </div>
          <div className="timeline-item">
            <h4>Isolated Affected Systems</h4>
            <p>Decision made by: IT Lead • 10:35 AM</p>
          </div>
          {ttxLog.map((log, idx) => (
            <div className="timeline-item" key={idx}>
              <h4>Tabletop Exercise Ended: {log.scenario}</h4>
              <p>Duration: {formatSeconds(log.duration)} • Ended at {log.time}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Exercise History</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Scenario</th>
              <th>Time Spent</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {ttxLog.map((log, idx) => (
              <tr key={idx}>
                <td>{log.scenario}</td>
                <td>{formatSeconds(log.duration)}</td>
                <td>{log.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const Admin = () => (
    <div>
      <h1 className="mb-3">Admin Dashboard</h1>

      {/* Add Module Form */}
      <div className="card mb-3">
        <h3 className="card-title">Add New Training Module</h3>
        <form onSubmit={handleAddModule}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              className="form-input"
              type="text"
              value={newModule.title}
              onChange={(e) => setNewModule(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Duration</label>
            <input
              className="form-input"
              type="text"
              value={newModule.duration}
              onChange={(e) => setNewModule(prev => ({ ...prev, duration: e.target.value }))}
              placeholder="e.g. 45 min"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={newModule.description}
              onChange={(e) => setNewModule(prev => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>
          <button className="btn btn-primary" type="submit">Add Module</button>
        </form>
      </div>

      <div className="card-grid">
        <div className="card">
          <h3 className="card-title">User Analytics</h3>
          <p>Total Users: 156</p>
          <p>Active This Month: 89</p>
          <p>Avg Completion Rate: 78%</p>
        </div>

        <div className="card">
          <h3 className="card-title">Quick Actions</h3>
          <button className="btn btn-primary mb-2">Add New Module</button>
          <button className="btn btn-primary mb-2">Create Test</button>
          <button className="btn btn-primary">Design TTX Scenario</button>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">User Management</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Modules Completed</th>
              <th>Avg Score</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.modulesCompleted}</td>
                <td>{user.avgScore}%</td>
                <td>
                  <button className="btn btn-secondary">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'training': return <Training />;
      case 'testing': return <Testing />;
      case 'ttx': return <TabletopExercise />;
      case 'admin': return <Admin />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <Navbar />
      <div className="main-content">
        <div className="content">
          {renderCurrentPage()}
        </div>
      </div>
      
      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          {modalContent}
        </Modal>
      )}
    </div>
  );
};

export default BCMTrainingPlatform;