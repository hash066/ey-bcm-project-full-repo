import React, { useState, useEffect } from 'react';
import '../styles/BusinessImpactAnalysis.css';
import { useNavigate } from 'react-router-dom';

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

  const navigate = useNavigate();

  // Sample data for demonstration
  useEffect(() => {
    const sampleData = [
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
    setBusinessFunctions(sampleData);
  }, []);

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

  return (
    <div className="bia-container">
      <div className="bia-header">
        <h1>Business Impact Analysis (BIA)</h1>
        <p className="bia-subtitle">ISO 22301:2019 Business Continuity Management System</p>
      </div>

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

      {/* Business Functions List */}
      <div className="bia-functions">
        <div className="functions-header">
          <h2>Business Functions Analysis</h2>
          <div className="function-buttons">
            <button 
              className="assess-criticality-btn"
              onClick={() => navigate('/criticality-assessment')}
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
    </div>
  );
};

export default BusinessImpactAnalysis; 