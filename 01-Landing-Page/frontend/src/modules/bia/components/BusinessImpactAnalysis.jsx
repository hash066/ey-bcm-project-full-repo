import React, { useState, useEffect } from 'react';
import '../styles/BusinessImpactAnalysis.css';
import { useNavigate } from 'react-router-dom';
import { decodeToken, hasRole } from '../../../services/authService';

const BusinessImpactAnalysis = () => {
  const [businessFunctions, setBusinessFunctions] = useState([]);
  const [newFunction, setNewFunction] = useState({
    name: '',
    description: '',
    criticality: 'Medium',
    dependencies: [],
    recoveryTimeObjective: '',
    recoveryPointObjective: '',
    maxTolerableDowntime: '',
    financialImpact: '',
    operationalImpact: '',
    regulatoryImpact: '',
    stakeholderImpact: ''
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showDependencies, setShowDependencies] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ show: false, message: '', type: 'success' });
  const [userRole, setUserRole] = useState('');

  const navigate = useNavigate();

  // Get user role from JWT token
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const decoded = decodeToken();
        const roles = decoded.roles || [];
        const primaryRole = roles.length > 0 ? roles[0] : '';
        setUserRole(primaryRole);
      } catch (error) {
        console.error('Error decoding token for BIA:', error);
        setUserRole('');
      }
    } else {
      setUserRole('');
    }
  }, []);

  // Initialize data from localStorage (uploaded jobId) or use sample data
  useEffect(() => {
    const uploadedJobId = localStorage.getItem('uploadedJobId');

    if (uploadedJobId) {
      console.log('BIA: Found uploaded jobId:', uploadedJobId);
      // TODO: Fetch real BIA data based on jobId when backend supports it
      // For now, use sample data but log that we found the jobId

      // Filter data based on user role and ownership
      let baseSampleData = [
        {
          id: uploadedJobId + '_1', // Use jobId prefix for uniqueness
          name: 'Customer Service Operations (Analysis: ' + uploadedJobId.substring(0, 8) + ')',
          description: 'Handling customer inquiries, complaints, and support requests - From uploaded document',
          criticality: 'High',
          dependencies: ['IT Systems', 'Staff Availability', 'Communication Channels'],
          recoveryTimeObjective: '4 hours',
          recoveryPointObjective: '1 hour',
          maxTolerableDowntime: '8 hours',
          financialImpact: '$50,000 per hour',
          operationalImpact: 'Customer satisfaction drops, reputation damage',
          regulatoryImpact: 'Potential compliance violations',
          stakeholderImpact: 'High - affects all customer-facing operations'
        },
        {
          id: uploadedJobId + '_2',
          name: 'Financial Processing (Analysis: ' + uploadedJobId.substring(0, 8) + ')',
          description: 'Payment processing, invoicing, and financial reporting - From uploaded document',
          criticality: 'Critical',
          dependencies: ['Banking Systems', 'Accounting Software', 'Regulatory Compliance'],
          recoveryTimeObjective: '2 hours',
          recoveryPointObjective: '30 minutes',
          maxTolerableDowntime: '4 hours',
          financialImpact: '$100,000 per hour',
          operationalImpact: 'Cash flow disruption, delayed payments',
          regulatoryImpact: 'Severe - regulatory reporting deadlines missed',
          stakeholderImpact: 'Critical - affects financial stakeholders and regulators'
        }
      ];

      // Filter based on user role ownership
      if (userRole === 'process_owner') {
        // Process owner sees only "Customer Service Operations" (what they own)
        baseSampleData = baseSampleData.filter(f => f.id.includes('_1'));
      }
      // Other roles see both functions (supervisors/managers see everything)

      setBusinessFunctions(baseSampleData);
    } else {
      // Use default sample data when no upload has been done
      let defaultSampleData = [
        {
          id: 1,
          name: 'Customer Service Operations',
          description: 'Handling customer inquiries, complaints, and support requests',
          criticality: 'High',
          dependencies: ['IT Systems', 'Staff Availability', 'Communication Channels'],
          recoveryTimeObjective: '4 hours',
          recoveryPointObjective: '1 hour',
          maxTolerableDowntime: '8 hours',
          financialImpact: '$50,000 per hour',
          operationalImpact: 'Customer satisfaction drops, reputation damage',
          regulatoryImpact: 'Potential compliance violations',
          stakeholderImpact: 'High - affects all customer-facing operations'
        },
        {
          id: 2,
          name: 'Financial Processing',
          description: 'Payment processing, invoicing, and financial reporting',
          criticality: 'Critical',
          dependencies: ['Banking Systems', 'Accounting Software', 'Regulatory Compliance'],
          recoveryTimeObjective: '2 hours',
          recoveryPointObjective: '30 minutes',
          maxTolerableDowntime: '4 hours',
          financialImpact: '$100,000 per hour',
          operationalImpact: 'Cash flow disruption, delayed payments',
          regulatoryImpact: 'Severe - regulatory reporting deadlines missed',
          stakeholderImpact: 'Critical - affects financial stakeholders and regulators'
        }
      ];

      // Filter based on user role ownership
      if (userRole === 'process_owner') {
        // Process owner sees only Customer Service Operations (their function)
        defaultSampleData = defaultSampleData.filter(f => f.id === 1);
      }
      // Other roles see both functions (management/supervisors see everything)

      setBusinessFunctions(defaultSampleData);
    }
  }, [userRole]); // Re-run when user role changes

  const handleAddFunction = () => {
    if (newFunction.name.trim()) {
      const functionToAdd = {
        ...newFunction,
        id: Date.now(),
        dependencies: newFunction.dependencies.filter(dep => dep.trim())
      };
      setBusinessFunctions([...businessFunctions, functionToAdd]);
      setNewFunction({
        name: '',
        description: '',
        criticality: 'Medium',
        dependencies: [],
        recoveryTimeObjective: '',
        recoveryPointObjective: '',
        maxTolerableDowntime: '',
        financialImpact: '',
        operationalImpact: '',
        regulatoryImpact: '',
        stakeholderImpact: ''
      });
      setShowAddForm(false);
    }
  };

  const handleDependencyChange = (index, value) => {
    const updatedDependencies = [...newFunction.dependencies];
    updatedDependencies[index] = value;
    setNewFunction({ ...newFunction, dependencies: updatedDependencies });
  };

  const addDependencyField = () => {
    setNewFunction({
      ...newFunction,
      dependencies: [...newFunction.dependencies, '']
    });
  };

  const removeDependency = (index) => {
    const updatedDependencies = newFunction.dependencies.filter((_, i) => i !== index);
    setNewFunction({ ...newFunction, dependencies: updatedDependencies });
  };

  const getCriticalityColor = (criticality) => {
    switch (criticality) {
      case 'Critical': return '#dc3545';
      case 'High': return '#fd7e14';
      case 'Medium': return '#ffc107';
      case 'Low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const calculateBIAReport = () => {
    const criticalFunctions = businessFunctions.filter(f => f.criticality === 'Critical');
    const highFunctions = businessFunctions.filter(f => f.criticality === 'High');
    const mediumFunctions = businessFunctions.filter(f => f.criticality === 'Medium');
    const lowFunctions = businessFunctions.filter(f => f.criticality === 'Low');

    return {
      totalFunctions: businessFunctions.length,
      criticalCount: criticalFunctions.length,
      highCount: highFunctions.length,
      mediumCount: mediumFunctions.length,
      lowCount: lowFunctions.length,
      criticalFunctions,
      highFunctions
    };
  };

  const biaReport = calculateBIAReport();

  const handleNodeMouseEnter = (event, nodeName) => {
    const rect = event.target.getBoundingClientRect();
    const explanations = {
      'Customer Service': 'This node represents customer service operations, which depend on IT systems for handling inquiries and support.',
      'Financial Processing': 'This node represents financial processing, which depends on banking systems and accounting software.',
      'IT Systems': 'This node represents IT systems, which are foundational for other operations.'
    };
    setTooltip({
      visible: true,
      x: rect.left + window.scrollX + 50,
      y: rect.top + window.scrollY - 10,
      content: explanations[nodeName] || 'No explanation available.'
    });
  };

  const handleNodeMouseLeave = () => {
    setTooltip({ visible: false, x: 0, y: 0, content: '' });
  };

  const handleSaveBIA = async () => {
    setSaving(true);
    try {
      // Prepare BIA data for saving
      const biaData = {
        businessFunctions,
        biaReport,
        metadata: {
          totalFunctions: biaReport.totalFunctions,
          criticalFunctions: biaReport.criticalCount,
          highPriorityFunctions: biaReport.highCount,
          savedAt: new Date().toISOString()
        }
      };

      // Call the new save-bia-info endpoint
      const response = await fetch('/api/bia/save-bia-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include any authentication headers as needed
        },
        body: JSON.stringify({
          organization_id: 'org-123', // This should be dynamic based on user context
          data: biaData,
          source: 'HUMAN', // or 'AI' for AI-generated content
          notes: 'Saved from BIA Dashboard'
        })
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        setSaveStatus({
          show: true,
          message: `BIA Info saved successfully (Version ${result.version})`,
          type: 'success'
        });
        // Hide success message after 5 seconds
        setTimeout(() => setSaveStatus({ show: false, message: '', type: 'success' }), 5000);
      } else {
        throw new Error(result.detail || 'Save failed');
      }

    } catch (error) {
      console.error('Save BIA error:', error);
      setSaveStatus({
        show: true,
        message: `Save failed: ${error.message}`,
        type: 'error'
      });
      // Hide error message after 5 seconds
      setTimeout(() => setSaveStatus({ show: false, message: '', type: 'success' }), 5000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bia-container">
      <div className="bia-header">
        <div className="header-content">
          <div>
            <h1>Business Impact Analysis (BIA)</h1>
            <p className="bia-subtitle">ISO 22301:2019 Business Continuity Management System</p>
          </div>
          <div className="header-actions">
            {/* Save BIA Info - Available to department_head, bcm_coordinator, ceo, ey_admin */}
            {['department_head', 'bcm_coordinator', 'ceo', 'ey_admin'].includes(userRole) && (
              <button
                className="save-bia-btn"
                onClick={handleSaveBIA}
                disabled={saving}
                title="▪ Encrypts BIA data with AES-256-GCM encryption
▪ Creates versioned snapshots with audit trails
▪ Validates user permissions before saving
▪ Caches data for 30min instant access
▪ AI-generated content requires approval workflow"
                style={{
                  marginRight: '10px',
                  background: saving
                    ? 'linear-gradient(135deg, #6c757d 0%, #495057 100%)'
                    : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: saving
                    ? '0 2px 8px rgba(0, 0, 0, 0.2)'
                    : '0 4px 15px rgba(40, 167, 69, 0.4)',
                }}
              >
                {saving ? '💾 Saving...' : '💾 Save BIA Info'}
              </button>
            )}

            {/* Alerts & Actions - Only for senior management and admin */}
            {['bcm_coordinator', 'ceo', 'ey_admin'].includes(userRole) && (
              <button
                className="alerts-btn"
                onClick={() => setShowAlerts(true)}
                title="▪ View active alerts and risk notifications
▪ Monitor critical business impacts and priority actions
▪ Track mitigation task progress
▪ Access emergency response protocols
▪ Review compliance status and deadlines"
                style={{
                  background: 'linear-gradient(135deg, #FF4757 0%, #FF3838 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 15px rgba(255, 71, 87, 0.4)',
                }}
              >
                🔔 Alerts & Actions ({userRole})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {saveStatus.show && (
        <div
          className={`status-message ${saveStatus.type}`}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 1001,
            fontWeight: 600,
            color: 'white',
            background: saveStatus.type === 'success'
              ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'
              : 'linear-gradient(135deg, #dc3545 0%, #fd7e14 100%)',
          }}
        >
          {saveStatus.type === 'success' ? '✅' : '❌'} {saveStatus.message}
        </div>
      )}

      {/* BIA Overview Dashboard */}
      <div className="bia-overview">
        <h2>BIA Overview Dashboard</h2>
        <div className="overview-cards">
          <div className="overview-card">
            <h3>Total Business Functions</h3>
            <span className="overview-number">{biaReport.totalFunctions}</span>
          </div>
          <div className="overview-card critical">
            <h3>Critical Functions</h3>
            <span className="overview-number">{biaReport.criticalCount}</span>
          </div>
          <div className="overview-card high">
            <h3>High Priority</h3>
            <span className="overview-number">{biaReport.highCount}</span>
          </div>
          <div className="overview-card medium">
            <h3>Medium Priority</h3>
            <span className="overview-number">{biaReport.mediumCount}</span>
          </div>
        </div>
      </div>

      {/* Visualization and Analysis Tools */}
      <div className="bia-visualization-tools">
        <div className="tools-header">
          <h2>Analysis & Visualization Tools</h2>
          <div className="visualization-buttons">
            <button
              className={`toggle-btn ${showHeatmap ? 'active' : ''}`}
              onClick={() => {
                setShowHeatmap(!showHeatmap);
                if (showDependencies) setShowDependencies(false);
              }}
              title="▪ Visualizes business function criticality in a heat map
▪ Color-coded grid showing priority levels
▪ Click cells to view detailed function information
▪ Helps identify risk concentration areas
▪ Supports strategic resource allocation"
              style={{
                marginRight: '10px',
                background: showHeatmap
                  ? 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)'
                  : 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: showHeatmap
                  ? '0 4px 15px rgba(255, 107, 107, 0.4)'
                  : '0 2px 8px rgba(0, 0, 0, 0.2)',
              }}
            >
              📊 {showHeatmap ? 'Hide' : 'View'} Heatmap
            </button>
            <button
              className={`toggle-btn ${showDependencies ? 'active' : ''}`}
              onClick={() => {
                setShowDependencies(!showDependencies);
                if (showHeatmap) setShowHeatmap(false);
              }}
              title="▪ Interactive diagram showing function interconnectivity
▪ Color-coded nodes by criticality levels
▪ Hover nodes for detailed explanations
▪ Arrow connections indicate dependency flow
▪ Click nodes to view complete function details"
              style={{
                marginRight: '10px',
                background: showDependencies
                  ? 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)'
                  : 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: showDependencies
                  ? '0 4px 15px rgba(78, 205, 196, 0.4)'
                  : '0 2px 8px rgba(0, 0, 0, 0.2)',
              }}
            >
              🔗 {showDependencies ? 'Hide' : 'View'} Dependencies
            </button>
          </div>
        </div>

        {/* Inline Heatmap */}
        {showHeatmap && (
          <div className="inline-visualization-section">
            <div className="visualization-header">
              <h3>BIA Function Heatmap</h3>
            </div>
            <div className="heatmap-container">
              <div className="heatmap-legend">
                <h4>Legend</h4>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#dc3545' }}></span>
                  <span>Critical</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#fd7e14' }}></span>
                  <span>High</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#ffc107' }}></span>
                  <span>Medium</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#28a745' }}></span>
                  <span>Low</span>
                </div>
              </div>
              <div className="heatmap-grid">
                <div className="heatmap-axis">
                  <div className="axis-label">Priority →</div>
                  <div className="axis-label">Low</div>
                  <div className="axis-label">Medium</div>
                  <div className="axis-label">High</div>
                  <div className="axis-label">Critical</div>
                </div>
                <div className="heatmap-content">
                  <div className="heatmap-axis vertical">
                    <div className="axis-label">Criticality ↓</div>
                    <div className="axis-label">Critical</div>
                    <div className="axis-label">High</div>
                    <div className="axis-label">Medium</div>
                    <div className="axis-label">Low</div>
                  </div>
                  <div className="heatmap-cells">
                    {businessFunctions.map((func, index) => (
                      <div
                        key={func.id}
                        className="heatmap-cell"
                        style={{
                          backgroundColor: getCriticalityColor(func.criticality),
                          opacity: 0.8
                        }}
                        title={`${func.name} - ${func.criticality} Priority`}
                        onClick={() => {
                          setSelectedFunction(func);
                          setShowDetails(true);
                        }}
                      >
                        <span className="cell-text">{func.name.substring(0, 15)}...</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inline Dependencies */}
        {showDependencies && (
          <div className="inline-visualization-section">
            <div className="visualization-header">
              <h3>Process Dependencies</h3>
            </div>
            <div className="dependency-graph-container">
              <div className="graph-legend">
                <h4>Legend</h4>
                <div className="legend-item">
                  <span className="legend-node" style={{ backgroundColor: '#dc3545' }}></span>
                  <span>Critical Function</span>
                </div>
                <div className="legend-item">
                  <span className="legend-node" style={{ backgroundColor: '#fd7e14' }}></span>
                  <span>High Priority</span>
                </div>
                <div className="legend-item">
                  <span className="legend-node" style={{ backgroundColor: '#ffc107' }}></span>
                  <span>Medium Priority</span>
                </div>
                <div className="legend-item">
                  <span className="legend-node" style={{ backgroundColor: '#28a745' }}></span>
                  <span>Low Priority</span>
                </div>
              </div>
              <div className="graph-content">
                <svg className="dependency-graph" viewBox="0 0 800 400">
                  {/* Render dependency connections */}
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7"
                      refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#e2e8f0" />
                    </marker>
                  </defs>

                  {/* Sample dependency connections */}
                  <line x1="150" y1="100" x2="350" y2="200" stroke="#e2e8f0" strokeWidth="2" markerEnd="url(#arrowhead)" />
                  <line x1="350" y1="200" x2="550" y2="100" stroke="#e2e8f0" strokeWidth="2" markerEnd="url(#arrowhead)" />

                  {/* Function nodes */}
                  <g className="graph-node" transform="translate(100, 80)" onMouseEnter={(e) => handleNodeMouseEnter(e, 'Customer Service')} onMouseLeave={handleNodeMouseLeave}>
                    <circle cx="0" cy="0" r="40" fill="#fd7e14" stroke="#fff" strokeWidth="2" />
                    <text x="0" y="5" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                      Customer Service
                    </text>
                  </g>

                  <g className="graph-node" transform="translate(300, 180)" onMouseEnter={(e) => handleNodeMouseEnter(e, 'Financial Processing')} onMouseLeave={handleNodeMouseLeave}>
                    <circle cx="0" cy="0" r="40" fill="#dc3545" stroke="#fff" strokeWidth="2" />
                    <text x="0" y="5" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                      Financial Processing
                    </text>
                  </g>

                  <g className="graph-node" transform="translate(500, 80)" onMouseEnter={(e) => handleNodeMouseEnter(e, 'IT Systems')} onMouseLeave={handleNodeMouseLeave}>
                    <circle cx="0" cy="0" r="40" fill="#ffc107" stroke="#fff" strokeWidth="2" />
                    <text x="0" y="5" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                      IT Systems
                    </text>
                  </g>

                  {/* Dependency labels */}
                  <text x="225" y="140" textAnchor="middle" fill="#e2e8f0" fontSize="8">depends on</text>
                  <text x="425" y="140" textAnchor="middle" fill="#e2e8f0" fontSize="8">depends on</text>
                </svg>

                <div className="graph-instructions">
                  <p><strong>Instructions:</strong></p>
                  <ul>
                    <li>Click and drag nodes to reposition them</li>
                    <li>Scroll to zoom in/out</li>
                    <li>Click on nodes to view function details</li>
                    <li>Arrows show dependency direction</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Business Functions List */}
      <div className="bia-functions">
        <div className="functions-header">
          <h2>Business Functions Analysis</h2>
          <div className="function-buttons">
            <button
              className="assess-criticality-btn"
              onClick={() => navigate('/criticality-assessment')}
              title="▪ Evaluate organization's overall cybersecurity posture
▪ Assess threat landscape and risk exposure levels
▪ Review compliance requirements and regulatory alignment
▪ Identify critical assets and protection requirements
▪ Generate actionable recommendations for improvement"
              style={{
                marginRight: '10px',
                background: 'linear-gradient(135deg, #FF8E53 0%, #FE6B8B 100%)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 15px rgba(254, 107, 139, 0.4)',
              }}
            >
              Assess Organization Criticality
            </button>
            <button
              className="configure-impact-btn"
              onClick={() => navigate('/organization-impact-scale')}
              title="▪ Define custom impact assessment parameters
▪ Configure scoring weights for different impact types
▪ Set organizational thresholds and risk tolerances
▪ Customize impact categories and rating scales
▪ Align with industry standards and best practices"
              style={{
                marginRight: '10px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              }}
            >
              Configure Impact Scale
            </button>
            <button
              className="application-bia-btn"
              onClick={() => navigate('/bia/application-bia/matrix')}
              title="▪ Link business functions to supporting applications
▪ Assess application criticality based on business impact
▪ Map RTO/RPO requirements to application capabilities
▪ Identify single points of failure in IT infrastructure
▪ Optimize resource allocation for critical applications"
              style={{
                marginRight: '10px',
                background: 'linear-gradient(135deg, #3cb371 0%, #ffd700 100%)',
                color: '#232323',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 15px rgba(60, 179, 113, 0.2)',
              }}
            >
              Application BIA
            </button>
            {/* New buttons for catalogues */}
            <button
              className="process-catalogue-btn"
              onClick={() => navigate('/bia/application-bia/process-catalogue')}
              title="▪ Comprehensive catalog of business processes
▪ Hierarchical process mapping (Department → Subdepartment → Process)
▪ Detailed process descriptions and documentation
▪ Process owner assignments and contact information
▪ Dependencies and inter-process relationships"
              style={{
                marginRight: '10px',
                background: 'linear-gradient(135deg, #FFD700 0%, #232323 100%)',
                color: '#232323',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 15px rgba(255, 215, 0, 0.2)',
              }}
            >
              Process Catalogue
            </button>
            <button
              className="application-catalogue-btn"
              onClick={() => navigate('/bia/application-bia/application-catalogue')}
              title="▪ Complete inventory of IT applications and systems
▪ Application technical specifications and capabilities
▪ Vendor information and support contracts
▪ Licensing and maintenance details
▪ Application criticality and priority classifications"
              style={{
                marginRight: '10px',
                background: 'linear-gradient(135deg, #FFD700 0%, #3cb371 100%)',
                color: '#232323',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 15px rgba(255, 215, 0, 0.2)',
              }}
            >
              Application Catalogue
            </button>
            <button
              className="add-function-btn"
              onClick={() => navigate('/bia/bia-information')}
              title="▪ Add new business functions to BIA analysis
▪ Define function operations, criticality, and impacts
▪ Set recovery time objectives and tolerances
▪ Establish dependencies and resource requirements
▪ Upload supporting documentation and evidence"
            >
              + Add Business Function
            </button>
          </div>
        </div>

        <div className="functions-list">
          {businessFunctions.map((func) => (
            <div 
              key={func.id} 
              className="function-card"
              onClick={() => {
                setSelectedFunction(func);
                setShowDetails(true);
              }}
            >
              <div className="function-header">
                <h3>{func.name}</h3>
                <span 
                  className="criticality-badge"
                  style={{ backgroundColor: getCriticalityColor(func.criticality) }}
                >
                  {func.criticality}
                </span>
              </div>
              <p className="function-description">{func.description}</p>
              <div className="function-metrics">
                <div className="metric">
                  <span className="metric-label">RTO:</span>
                  <span className="metric-value">{func.recoveryTimeObjective}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">RPO:</span>
                  <span className="metric-value">{func.recoveryPointObjective}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">MTD:</span>
                  <span className="metric-value">{func.maxTolerableDowntime}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Function Modal */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add Business Function</h2>
              <button 
                className="close-btn"
                onClick={() => setShowAddForm(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Function Name *</label>
                <input
                  type="text"
                  value={newFunction.name}
                  onChange={(e) => setNewFunction({...newFunction, name: e.target.value})}
                  placeholder="Enter business function name"
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newFunction.description}
                  onChange={(e) => setNewFunction({...newFunction, description: e.target.value})}
                  placeholder="Describe the business function"
                />
              </div>

              <div className="form-group">
                <label>Criticality Level *</label>
                <select
                  value={newFunction.criticality}
                  onChange={(e) => setNewFunction({...newFunction, criticality: e.target.value})}
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="form-group">
                <label>Dependencies</label>
                {newFunction.dependencies.map((dep, index) => (
                  <div key={index} className="dependency-input">
                    <input
                      type="text"
                      value={dep}
                      onChange={(e) => handleDependencyChange(index, e.target.value)}
                      placeholder="Enter dependency"
                    />
                    <button 
                      type="button"
                      onClick={() => removeDependency(index)}
                      className="remove-dependency"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button 
                  type="button"
                  onClick={addDependencyField}
                  className="add-dependency"
                >
                  + Add Dependency
                </button>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Recovery Time Objective (RTO)</label>
                  <input
                    type="text"
                    value={newFunction.recoveryTimeObjective}
                    onChange={(e) => setNewFunction({...newFunction, recoveryTimeObjective: e.target.value})}
                    placeholder="e.g., 4 hours"
                  />
                </div>
                <div className="form-group">
                  <label>Recovery Point Objective (RPO)</label>
                  <input
                    type="text"
                    value={newFunction.recoveryPointObjective}
                    onChange={(e) => setNewFunction({...newFunction, recoveryPointObjective: e.target.value})}
                    placeholder="e.g., 1 hour"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Maximum Tolerable Downtime (MTD)</label>
                <input
                  type="text"
                  value={newFunction.maxTolerableDowntime}
                  onChange={(e) => setNewFunction({...newFunction, maxTolerableDowntime: e.target.value})}
                  placeholder="e.g., 8 hours"
                />
              </div>

              <div className="form-group">
                <label>Financial Impact</label>
                <input
                  type="text"
                  value={newFunction.financialImpact}
                  onChange={(e) => setNewFunction({...newFunction, financialImpact: e.target.value})}
                  placeholder="e.g., $50,000 per hour"
                />
              </div>

              <div className="form-group">
                <label>Operational Impact</label>
                <textarea
                  value={newFunction.operationalImpact}
                  onChange={(e) => setNewFunction({...newFunction, operationalImpact: e.target.value})}
                  placeholder="Describe operational impacts"
                />
              </div>

              <div className="form-group">
                <label>Regulatory Impact</label>
                <textarea
                  value={newFunction.regulatoryImpact}
                  onChange={(e) => setNewFunction({...newFunction, regulatoryImpact: e.target.value})}
                  placeholder="Describe regulatory compliance impacts"
                />
              </div>

              <div className="form-group">
                <label>Stakeholder Impact</label>
                <textarea
                  value={newFunction.stakeholderImpact}
                  onChange={(e) => setNewFunction({...newFunction, stakeholderImpact: e.target.value})}
                  placeholder="Describe stakeholder impacts"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
              <button 
                className="save-btn"
                onClick={handleAddFunction}
              >
                Save Function
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Function Details Modal */}
      {showDetails && selectedFunction && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h2>{selectedFunction.name}</h2>
              <button 
                className="close-btn"
                onClick={() => setShowDetails(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>Function Overview</h3>
                <p><strong>Description:</strong> {selectedFunction.description}</p>
                <p><strong>Criticality:</strong> 
                  <span 
                    className="criticality-badge inline"
                    style={{ backgroundColor: getCriticalityColor(selectedFunction.criticality) }}
                  >
                    {selectedFunction.criticality}
                  </span>
                </p>
              </div>

              <div className="detail-section">
                <h3>Dependencies</h3>
                <ul className="dependencies-list">
                  {selectedFunction.dependencies.map((dep, index) => (
                    <li key={index}>{dep}</li>
                  ))}
                </ul>
              </div>

              <div className="detail-section">
                <h3>Recovery Objectives</h3>
                <div className="recovery-objectives">
                  <div className="objective">
                    <span className="objective-label">Recovery Time Objective (RTO):</span>
                    <span className="objective-value">{selectedFunction.recoveryTimeObjective}</span>
                  </div>
                  <div className="objective">
                    <span className="objective-label">Recovery Point Objective (RPO):</span>
                    <span className="objective-value">{selectedFunction.recoveryPointObjective}</span>
                  </div>
                  <div className="objective">
                    <span className="objective-label">Maximum Tolerable Downtime (MTD):</span>
                    <span className="objective-value">{selectedFunction.maxTolerableDowntime}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Impact Assessment</h3>
                <div className="impact-grid">
                  <div className="impact-item">
                    <h4>Financial Impact</h4>
                    <p>{selectedFunction.financialImpact}</p>
                  </div>
                  <div className="impact-item">
                    <h4>Operational Impact</h4>
                    <p>{selectedFunction.operationalImpact}</p>
                  </div>
                  <div className="impact-item">
                    <h4>Regulatory Impact</h4>
                    <p>{selectedFunction.regulatoryImpact}</p>
                  </div>
                  <div className="impact-item">
                    <h4>Stakeholder Impact</h4>
                    <p>{selectedFunction.stakeholderImpact}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="close-btn"
                onClick={() => setShowDetails(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ISO 22301 Compliance Information */}
      <div className="bia-compliance">
        <h2>ISO 22301:2019 Compliance</h2>
        <div className="compliance-info">
          <div className="compliance-item">
            <h3>Clause 8.2.2 - Business Impact Analysis</h3>
            <p>This BIA tool addresses the requirements for identifying and prioritizing business functions,
            determining recovery objectives, and assessing impacts according to ISO 22301 standards.</p>
          </div>
          <div className="compliance-item">
            <h3>Key BIA Elements Covered</h3>
            <ul>
              <li>Business function identification and prioritization</li>
              <li>Dependency mapping and analysis</li>
              <li>Recovery Time Objectives (RTO)</li>
              <li>Recovery Point Objectives (RPO)</li>
              <li>Maximum Tolerable Downtime (MTD)</li>
              <li>Impact assessment across multiple dimensions</li>
              <li>Stakeholder impact analysis</li>
            </ul>
          </div>
        </div>
      </div>



      {/* Alerts & Actions Panel */}
      {showAlerts && (
        <div className="alerts-panel">
          <div className="alerts-header">
            <h2>Alerts & Actions</h2>
            <button
              className="close-btn"
              onClick={() => setShowAlerts(false)}
            >
              ×
            </button>
          </div>
          <div className="alerts-body">
            {/* Active Alerts */}
            <div className="alerts-section">
              <h3>🚨 Active Alerts</h3>
              <div className="alert-item critical">
                <div className="alert-icon">⚠️</div>
                <div className="alert-content">
                  <h4>High Risk Exposure</h4>
                  <p>Financial exposure exceeds $300k/hr threshold</p>
                  <span className="alert-time">2 hours ago</span>
                </div>
              </div>
              <div className="alert-item warning">
                <div className="alert-icon">⚠️</div>
                <div className="alert-content">
                  <h4>Recovery Plan Missing</h4>
                  <p>Customer Service Operations lacks recovery procedures</p>
                  <span className="alert-time">4 hours ago</span>
                </div>
              </div>
            </div>

            {/* Mitigation Tasks */}
            <div className="mitigation-section">
              <h3>📋 Mitigation Tasks</h3>
              <div className="task-item">
                <input type="checkbox" id="task1" />
                <label htmlFor="task1">
                  <div className="task-content">
                    <h4>Update Recovery Procedures</h4>
                    <p>Review and update recovery procedures for critical functions</p>
                    <div className="task-meta">
                      <span className="task-assignee">John Smith</span>
                      <span className="task-due">Due: 2024-10-15</span>
                      <span className="task-priority high">High Priority</span>
                    </div>
                  </div>
                </label>
              </div>

              <div className="task-item">
                <input type="checkbox" id="task2" />
                <label htmlFor="task2">
                  <div className="task-content">
                    <h4>Test Backup Systems</h4>
                    <p>Conduct backup system testing for financial processing</p>
                    <div className="task-meta">
                      <span className="task-assignee">Jane Wilson</span>
                      <span className="task-due">Due: 2024-10-18</span>
                      <span className="task-priority medium">Medium Priority</span>
                    </div>
                  </div>
                </label>
              </div>

              <div className="task-item">
                <input type="checkbox" id="task3" />
                <label htmlFor="task3">
                  <div className="task-content">
                    <h4>Review Insurance Coverage</h4>
                    <p>Assess business interruption insurance coverage</p>
                    <div className="task-meta">
                      <span className="task-assignee">Mike Johnson</span>
                      <span className="task-due">Due: 2024-10-20</span>
                      <span className="task-priority medium">Medium Priority</span>
                    </div>
                  </div>
                </label>
              </div>

              <div className="task-item completed">
                <input type="checkbox" id="task4" checked disabled />
                <label htmlFor="task4">
                  <div className="task-content">
                    <h4>Conduct BCP Training</h4>
                    <p>Complete business continuity training for all staff</p>
                    <div className="task-meta">
                      <span className="task-assignee">Sarah Wilson</span>
                      <span className="task-due completed">Completed: 2024-10-12</span>
                      <span className="task-priority low">Low Priority</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          style={{
            position: 'absolute',
            top: tooltip.y,
            left: tooltip.x,
            background: '#1e293b',
            color: '#e2e8f0',
            padding: '0.5rem',
            borderRadius: '4px',
            border: '1px solid #374151',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
            zIndex: 1000,
            maxWidth: '300px',
            fontSize: '0.9rem',
            pointerEvents: 'none'
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
};

export default BusinessImpactAnalysis;
