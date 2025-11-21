import React, { useState, useEffect, useCallback } from 'react';
import {
  generateCompleteProcedure,
  regenerateProcedure,
  refineProcedure,
  analyzeExistingProcedure,
  getAllProcedureVersions,
  getProcedureVersion,
  exportProcedureToDocx,
  downloadExportedFile,
  uploadExistingProcedure,
  setCurrentVersion,
  getCurrentProcedure
} from '../../api/procedures';

/**
 * Enhanced Procedure Generator Component
 * Complete procedure generation and management system
 */
const EnhancedProcedureGenerator = ({ procedureType = "bia" }) => {
  const [currentProcedure, setCurrentProcedure] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // UI States
  const [activeTab, setActiveTab] = useState('generate');
  const [refinementInstructions, setRefinementInstructions] = useState('');
  const [existingProcedureText, setExistingProcedureText] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [showVersionModal, setShowVersionModal] = useState(false);

  const loadCurrentProcedure = useCallback(async () => {
    try {
      const current = await getCurrentProcedure(procedureType);
      setCurrentProcedure(current);
    } catch (error) {
      console.error('Error loading current procedure:', error);
    }
  }, [procedureType]);

  const loadVersions = useCallback(async () => {
    try {
      const allVersions = await getAllProcedureVersions(procedureType);
      setVersions(allVersions);
    } catch (error) {
      console.error('Error loading procedure versions:', error);
    }
  }, [procedureType]);

  useEffect(() => {
    loadCurrentProcedure();
    loadVersions();
  }, [procedureType, loadCurrentProcedure, loadVersions]);

  const handleGenerateProcedure = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await generateCompleteProcedure(procedureType);
      setCurrentProcedure(result);
      setSuccess('Procedure generated successfully!');
      await loadVersions();
    } catch (error) {
      setError('Failed to generate procedure: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateProcedure = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await regenerateProcedure(procedureType);
      setCurrentProcedure(result);
      setSuccess('Procedure regenerated successfully!');
      await loadVersions();
    } catch (error) {
      setError('Failed to regenerate procedure: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefineProcedure = async () => {
    if (!refinementInstructions.trim()) {
      setError('Please provide refinement instructions');
      return;
    }
    
    if (!currentProcedure) {
      setError('No procedure to refine. Generate one first.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await refineProcedure(
        procedureType, 
        refinementInstructions, 
        currentProcedure.content
      );
      setCurrentProcedure(result);
      setSuccess('Procedure refined successfully!');
      setRefinementInstructions('');
      await loadVersions();
    } catch (error) {
      setError('Failed to refine procedure: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeExisting = async () => {
    if (!existingProcedureText.trim()) {
      setError('Please provide existing procedure text');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await analyzeExistingProcedure(procedureType, existingProcedureText);
      setAnalysisResult(result);
      setSuccess('Analysis completed successfully!');
    } catch (error) {
      setError('Failed to analyze procedure: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    
    try {
      const result = await uploadExistingProcedure(file, procedureType);
      setAnalysisResult({ analysis: result.analysis });
      setSuccess(`File "${file.name}" analyzed successfully!`);
    } catch (error) {
      setError('Failed to upload and analyze file: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportToDocx = async () => {
    if (!currentProcedure) {
      setError('No procedure to export. Generate one first.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await exportProcedureToDocx(currentProcedure, procedureType);
      await downloadExportedFile(result.filename);
      setSuccess('Procedure exported successfully!');
    } catch (error) {
      setError('Failed to export procedure: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVersionSelect = async (versionId) => {
    setLoading(true);
    try {
      const versionData = await getProcedureVersion(procedureType, versionId);
      setSelectedVersion(versionData);
      setShowVersionModal(true);
    } catch (error) {
      setError('Failed to load version: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetCurrentVersion = async (versionId) => {
    setLoading(true);
    try {
      await setCurrentVersion(procedureType, versionId);
      await loadCurrentProcedure();
      setSuccess('Version set as current successfully!');
      setShowVersionModal(false);
    } catch (error) {
      setError('Failed to set current version: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderProcedureContent = (procedure) => {
    if (!procedure || !procedure.content) return null;

    const content = procedure.content;
    
    return (
      <div style={{ background: '#fff', color: '#000', padding: '30px', borderRadius: '10px', marginTop: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '3px solid #FFD700', paddingBottom: '15px' }}>
          <h2 style={{ color: '#333', margin: 0, fontSize: '28px' }}>
            📋 {procedureType.toUpperCase()} Procedure
          </h2>
          <div style={{ color: '#666', fontSize: '14px' }}>
            <div><strong>Organization:</strong> {procedure.organization?.name || 'Organization'}</div>
            <div><strong>Generated:</strong> {new Date(procedure.generated_at || Date.now()).toLocaleString()}</div>
            {procedure.version && <div><strong>Version:</strong> {procedure.version.version_id}</div>}
          </div>
        </div>
        
        {Object.entries(content).map(([sectionKey, sectionContent]) => (
          <div key={sectionKey} style={{ marginBottom: '35px', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
            <h3 style={{ 
              color: '#fff', 
              background: 'linear-gradient(135deg, #FFD700, #FFA000)', 
              margin: 0, 
              padding: '15px 20px',
              fontSize: '20px',
              fontWeight: 'bold'
            }}>
              {getSectionIcon(sectionKey)} {sectionKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h3>
            
            <div style={{ padding: '20px' }}>
              {typeof sectionContent === 'string' && (
                <div style={{ lineHeight: '1.8', fontSize: '16px', color: '#333' }}>
                  {sectionContent.split('\n').map((paragraph, idx) => (
                    <p key={idx} style={{ marginBottom: '15px' }}>{paragraph}</p>
                  ))}
                </div>
              )}
              
              {Array.isArray(sectionContent) && (
                <div>
                  {sectionContent.every(item => typeof item === 'string') ? (
                    <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                      {sectionContent.map((item, index) => (
                        <li key={index} style={{ marginBottom: '8px', fontSize: '16px', lineHeight: '1.6' }}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div style={{ display: 'grid', gap: '15px' }}>
                      {sectionContent.map((item, index) => (
                        <div key={index} style={{ 
                          background: '#f8f9fa', 
                          padding: '15px', 
                          borderRadius: '6px',
                          border: '1px solid #e9ecef'
                        }}>
                          {typeof item === 'object' ? (
                            Object.entries(item).map(([key, value]) => (
                              <div key={key} style={{ marginBottom: '8px' }}>
                                <strong style={{ color: '#495057' }}>{key.replace(/_/g, ' ')}:</strong> 
                                <span style={{ marginLeft: '8px', color: '#6c757d' }}>
                                  {typeof value === 'string' ? value : JSON.stringify(value)}
                                </span>
                              </div>
                            ))
                          ) : (
                            <span>{item}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {typeof sectionContent === 'object' && !Array.isArray(sectionContent) && (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {Object.entries(sectionContent).map(([key, value]) => (
                    <div key={key} style={{ 
                      background: '#f8f9fa', 
                      padding: '15px', 
                      borderRadius: '6px',
                      border: '1px solid #e9ecef',
                      display: 'flex',
                      alignItems: 'flex-start'
                    }}>
                      <strong style={{ color: '#495057', minWidth: '150px', marginRight: '15px' }}>
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                      </strong>
                      <div style={{ flex: 1, color: '#6c757d' }}>
                        {typeof value === 'string' ? (
                          value.split('\n').map((line, idx) => (
                            <div key={idx} style={{ marginBottom: idx < value.split('\n').length - 1 ? '8px' : 0 }}>
                              {line}
                            </div>
                          ))
                        ) : (
                          <pre style={{ margin: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>
                            {JSON.stringify(value, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Action Buttons */}
        <div style={{ 
          marginTop: '30px', 
          padding: '20px', 
          background: '#f8f9fa', 
          borderRadius: '8px',
          display: 'flex',
          gap: '15px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setActiveTab('refine')}
            style={{
              background: '#9C27B0',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            🔧 Refine This Procedure
          </button>
          
          <button
            onClick={handleExportToDocx}
            disabled={loading}
            style={{
              background: loading ? '#999' : '#2196F3',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            📄 Export to DOCX
          </button>
          
          <button
            onClick={() => setActiveTab('versions')}
            style={{
              background: '#FF9800',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            📚 View All Versions
          </button>
        </div>
      </div>
    );
  };

  const getSectionIcon = (sectionKey) => {
    const icons = {
      'introduction': '📖',
      'scope': '🎯',
      'objective': '🎯',
      'methodology': '⚙️',
      'process_flow': '🔄',
      'roles_responsibilities': '👥',
      'impact_parameters': '📊',
      'critical_processes': '⚡',
      'peak_periods': '⏰',
      'impact_matrices': '📈',
      'bcm_policy': '📋',
      'bcm_questions': '❓',
      'recovery_strategies': '🔄',
      'risk_categories': '⚠️',
      'risk_matrices': '📊'
    };
    return icons[sectionKey] || '📄';
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh' }}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .tab-content {
            animation: fadeIn 0.3s ease-in;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
      <h1 style={{ color: '#FFD700', marginBottom: '20px' }}>
        Enhanced {procedureType.toUpperCase()} Procedure Generator
      </h1>

      {/* Status Messages */}
      {error && (
        <div style={{ 
          background: 'linear-gradient(135deg, #ffebee, #ffcdd2)', 
          color: '#c62828', 
          padding: '15px 20px', 
          borderRadius: '8px', 
          marginBottom: '25px',
          border: '1px solid #ef5350',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '16px'
        }}>
          <span style={{ fontSize: '20px' }}>❌</span>
          <div>
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}
      
      {success && (
        <div style={{ 
          background: 'linear-gradient(135deg, #e8f5e8, #c8e6c9)', 
          color: '#2e7d32', 
          padding: '15px 20px', 
          borderRadius: '8px', 
          marginBottom: '25px',
          border: '1px solid #66bb6a',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '16px'
        }}>
          <span style={{ fontSize: '20px' }}>✅</span>
          <div>
            <strong>Success:</strong> {success}
          </div>
        </div>
      )}
      
      {loading && (
        <div style={{ 
          background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)', 
          color: '#1976d2', 
          padding: '15px 20px', 
          borderRadius: '8px', 
          marginBottom: '25px',
          border: '1px solid #42a5f5',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '16px'
        }}>
          <div style={{ 
            width: '20px', 
            height: '20px', 
            border: '2px solid #1976d2', 
            borderTop: '2px solid transparent', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite' 
          }}></div>
          <div>
            <strong>Processing:</strong> Please wait while we work on your request...
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        marginBottom: '30px', 
        borderBottom: '3px solid #FFD700',
        background: '#1a1a1a',
        borderRadius: '10px 10px 0 0',
        overflow: 'hidden'
      }}>
        {[
          { key: 'generate', label: 'Generate', icon: '✨' },
          { key: 'refine', label: 'Refine', icon: '🔧' },
          { key: 'analyze', label: 'Analyze', icon: '🔍' },
          { key: 'versions', label: 'Versions', icon: '📚' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              background: activeTab === tab.key ? 'linear-gradient(135deg, #FFD700, #FFA000)' : 'transparent',
              color: activeTab === tab.key ? '#000' : '#FFD700',
              border: 'none',
              padding: '15px 25px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Generate Tab */}
      {activeTab === 'generate' && (
        <div className="tab-content" style={{ background: 'linear-gradient(135deg, #232323, #2a2a2a)', padding: '30px', borderRadius: '15px', border: '1px solid #FFD700' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px' }}>
            <span style={{ fontSize: '32px', marginRight: '15px' }}>✨</span>
            <h2 style={{ color: '#FFD700', margin: 0, fontSize: '28px' }}>Generate Complete Procedure</h2>
          </div>
          
          {/* Procedure Type Info */}
          <div style={{ 
            background: '#1a1a1a', 
            padding: '20px', 
            borderRadius: '10px', 
            marginBottom: '25px',
            border: '1px solid #444'
          }}>
            <h3 style={{ color: '#FFD700', marginBottom: '15px', fontSize: '20px' }}>
              🎯 Current Procedure Type: {procedureType.toUpperCase()}
            </h3>
            <div style={{ color: '#ccc', lineHeight: '1.6' }}>
              {procedureType === 'bia' && (
                <div>
                  <p><strong>Business Impact Analysis (BIA)</strong> - Comprehensive assessment of business processes and their criticality.</p>
                  <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                    <li>Process criticality assessment</li>
                    <li>Recovery time objectives (RTO)</li>
                    <li>Impact analysis matrices</li>
                    <li>Resource dependencies</li>
                  </ul>
                </div>
              )}
              {procedureType === 'bcm_plan' && (
                <div>
                  <p><strong>Business Continuity Management Plan</strong> - Complete BCM framework and implementation guide.</p>
                  <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                    <li>BCM policy development</li>
                    <li>Recovery strategies</li>
                    <li>Crisis management procedures</li>
                    <li>Testing and maintenance</li>
                  </ul>
                </div>
              )}
              {procedureType === 'risk_assessment' && (
                <div>
                  <p><strong>Risk Assessment Procedure</strong> - Systematic approach to identifying and evaluating risks.</p>
                  <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                    <li>Risk identification methodology</li>
                    <li>Risk analysis and evaluation</li>
                    <li>Risk treatment strategies</li>
                    <li>Monitoring and review</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '15px', 
            marginBottom: '25px' 
          }}>
            <button
              onClick={handleGenerateProcedure}
              disabled={loading}
              style={{
                background: loading ? '#999' : 'linear-gradient(135deg, #4CAF50, #45a049)',
                color: '#fff',
                border: 'none',
                padding: '18px 24px',
                borderRadius: '10px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.3s ease',
                boxShadow: loading ? 'none' : '0 4px 8px rgba(76, 175, 80, 0.3)'
              }}
            >
              <span style={{ fontSize: '20px' }}>🎆</span>
              {loading ? 'Generating...' : 'Generate New Procedure'}
            </button>
            
            <button
              onClick={handleRegenerateProcedure}
              disabled={loading || !currentProcedure}
              style={{
                background: loading || !currentProcedure ? '#999' : 'linear-gradient(135deg, #FF9800, #f57c00)',
                color: '#fff',
                border: 'none',
                padding: '18px 24px',
                borderRadius: '10px',
                cursor: loading || !currentProcedure ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.3s ease',
                boxShadow: loading || !currentProcedure ? 'none' : '0 4px 8px rgba(255, 152, 0, 0.3)'
              }}
            >
              <span style={{ fontSize: '20px' }}>🔄</span>
              {loading ? 'Regenerating...' : 'Regenerate with Fresh AI'}
            </button>
            
            <button
              onClick={handleExportToDocx}
              disabled={loading || !currentProcedure}
              style={{
                background: loading || !currentProcedure ? '#999' : 'linear-gradient(135deg, #2196F3, #1976d2)',
                color: '#fff',
                border: 'none',
                padding: '18px 24px',
                borderRadius: '10px',
                cursor: loading || !currentProcedure ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.3s ease',
                boxShadow: loading || !currentProcedure ? 'none' : '0 4px 8px rgba(33, 150, 243, 0.3)'
              }}
            >
              <span style={{ fontSize: '20px' }}>📄</span>
              Export to DOCX
            </button>
          </div>
          
          {/* Features Info */}
          <div style={{ 
            background: '#1a1a1a', 
            padding: '20px', 
            borderRadius: '10px',
            border: '1px solid #444'
          }}>
            <h4 style={{ color: '#FFD700', marginBottom: '15px', fontSize: '18px' }}>
              🚀 What You Get:
            </h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '15px',
              color: '#ccc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🎯</span>
                <span>ISO 22301:2019 Compliant</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📊</span>
                <span>Organization-Specific Content</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>⚙️</span>
                <span>AI-Powered Generation</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📈</span>
                <span>Professional Documentation</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refine Tab */}
      {activeTab === 'refine' && (
        <div className="tab-content" style={{ background: 'linear-gradient(135deg, #232323, #2a2a2a)', padding: '30px', borderRadius: '15px', border: '1px solid #FFD700' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px' }}>
            <span style={{ fontSize: '32px', marginRight: '15px' }}>🔧</span>
            <h2 style={{ color: '#FFD700', margin: 0, fontSize: '28px' }}>Refine Existing Procedure</h2>
          </div>
          
          <div style={{ 
            background: '#1a1a1a', 
            padding: '20px', 
            borderRadius: '10px', 
            marginBottom: '25px',
            border: '1px solid #444'
          }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              color: '#FFD700', 
              marginBottom: '15px',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              📝 Refinement Instructions:
            </label>
            <textarea
              value={refinementInstructions}
              onChange={(e) => setRefinementInstructions(e.target.value)}
              placeholder="Describe how you want to refine the procedure:\n\n• Make the language more formal\n• Add more technical details\n• Simplify for non-technical users\n• Include specific compliance requirements\n• Add more examples or case studies"
              style={{
                width: '100%',
                height: '120px',
                padding: '15px',
                borderRadius: '8px',
                border: '2px solid #FFD700',
                background: '#222',
                color: '#fff',
                resize: 'vertical',
                fontSize: '16px',
                lineHeight: '1.5',
                fontFamily: 'inherit'
              }}
            />
            {!currentProcedure && (
              <p style={{ 
                color: '#ff6b6b', 
                fontSize: '14px', 
                marginTop: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                ⚠️ You need to generate a procedure first before refining it.
              </p>
            )}
          </div>
          
          <button
            onClick={handleRefineProcedure}
            disabled={loading || !refinementInstructions.trim() || !currentProcedure}
            style={{
              background: loading || !refinementInstructions.trim() || !currentProcedure ? '#999' : 'linear-gradient(135deg, #9C27B0, #7b1fa2)',
              color: '#fff',
              border: 'none',
              padding: '18px 32px',
              borderRadius: '10px',
              cursor: loading || !refinementInstructions.trim() || !currentProcedure ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.3s ease',
              boxShadow: loading || !refinementInstructions.trim() || !currentProcedure ? 'none' : '0 4px 8px rgba(156, 39, 176, 0.3)'
            }}
          >
            <span style={{ fontSize: '20px' }}>✨</span>
            {loading ? 'Refining...' : 'Refine Procedure'}
          </button>
        </div>
      )}

      {/* Analyze Tab */}
      {activeTab === 'analyze' && (
        <div className="tab-content" style={{ background: 'linear-gradient(135deg, #232323, #2a2a2a)', padding: '30px', borderRadius: '15px', border: '1px solid #FFD700' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px' }}>
            <span style={{ fontSize: '32px', marginRight: '15px' }}>🔍</span>
            <h2 style={{ color: '#FFD700', margin: 0, fontSize: '28px' }}>Analyze Existing Procedure</h2>
          </div>
          
          <div style={{ 
            background: '#1a1a1a', 
            padding: '20px', 
            borderRadius: '10px', 
            marginBottom: '25px',
            border: '1px solid #444'
          }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              color: '#FFD700', 
              marginBottom: '15px',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              📁 Upload Existing Procedure:
            </label>
            <div style={{ 
              border: '2px dashed #FFD700', 
              borderRadius: '8px', 
              padding: '20px', 
              textAlign: 'center',
              background: '#222'
            }}>
              <input
                type="file"
                accept=".txt,.docx"
                onChange={handleFileUpload}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #FFD700',
                  background: '#333',
                  color: '#fff',
                  marginBottom: '10px',
                  width: '100%',
                  fontSize: '16px'
                }}
              />
              <p style={{ color: '#ccc', fontSize: '14px', margin: '10px 0 0 0' }}>
                📄 Supported formats: .txt, .docx
              </p>
            </div>
          </div>
          
          <div style={{ 
            background: '#1a1a1a', 
            padding: '20px', 
            borderRadius: '10px', 
            marginBottom: '25px',
            border: '1px solid #444'
          }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              color: '#FFD700', 
              marginBottom: '15px',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              ✏️ Or Paste Existing Procedure Text:
            </label>
            <textarea
              value={existingProcedureText}
              onChange={(e) => setExistingProcedureText(e.target.value)}
              placeholder="Paste your existing procedure text here for AI analysis..."
              style={{
                width: '100%',
                height: '180px',
                padding: '15px',
                borderRadius: '8px',
                border: '2px solid #FFD700',
                background: '#222',
                color: '#fff',
                resize: 'vertical',
                fontSize: '16px',
                lineHeight: '1.5',
                fontFamily: 'inherit'
              }}
            />
          </div>
          
          <button
            onClick={handleAnalyzeExisting}
            disabled={loading || !existingProcedureText.trim()}
            style={{
              background: loading || !existingProcedureText.trim() ? '#999' : 'linear-gradient(135deg, #FF5722, #d84315)',
              color: '#fff',
              border: 'none',
              padding: '18px 32px',
              borderRadius: '10px',
              cursor: loading || !existingProcedureText.trim() ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.3s ease',
              boxShadow: loading || !existingProcedureText.trim() ? 'none' : '0 4px 8px rgba(255, 87, 34, 0.3)'
            }}
          >
            <span style={{ fontSize: '20px' }}>🔍</span>
            {loading ? 'Analyzing...' : 'Analyze Procedure'}
          </button>
          
          {/* Analysis Results */}
          {analysisResult && (
            <div style={{ 
              marginTop: '30px', 
              padding: '25px', 
              background: 'linear-gradient(135deg, #1a1a1a, #2d2d2d)', 
              borderRadius: '12px',
              border: '1px solid #FFD700',
              boxShadow: '0 4px 12px rgba(255, 215, 0, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '24px', marginRight: '10px' }}>📈</span>
                <h3 style={{ color: '#FFD700', margin: 0, fontSize: '24px' }}>Analysis Results</h3>
              </div>
              
              {analysisResult.analysis && (
                <div>
                  {/* Compliance Score */}
                  <div style={{ 
                    background: '#333', 
                    padding: '20px', 
                    borderRadius: '8px', 
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <h4 style={{ color: '#fff', margin: 0, fontSize: '18px' }}>
                      🎯 Compliance Score:
                    </h4>
                    <div style={{ 
                      background: analysisResult.analysis.compliance_score >= 8 ? '#4CAF50' : 
                                 analysisResult.analysis.compliance_score >= 6 ? '#FF9800' : '#f44336',
                      color: '#fff',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '18px',
                      fontWeight: 'bold'
                    }}>
                      {analysisResult.analysis.compliance_score}/10
                    </div>
                  </div>
                  
                  {/* Gaps Section */}
                  {analysisResult.analysis.gaps && analysisResult.analysis.gaps.length > 0 && (
                    <div style={{ 
                      background: '#333', 
                      padding: '20px', 
                      borderRadius: '8px', 
                      marginBottom: '20px'
                    }}>
                      <h4 style={{ 
                        color: '#ff6b6b', 
                        marginBottom: '15px', 
                        fontSize: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        ⚠️ Identified Gaps:
                      </h4>
                      <div style={{ display: 'grid', gap: '10px' }}>
                        {analysisResult.analysis.gaps.map((gap, index) => (
                          <div key={index} style={{
                            background: '#444',
                            padding: '12px 16px',
                            borderRadius: '6px',
                            color: '#fff',
                            borderLeft: '4px solid #ff6b6b'
                          }}>
                            {gap}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Recommendations Section */}
                  {analysisResult.analysis.recommendations && analysisResult.analysis.recommendations.length > 0 && (
                    <div style={{ 
                      background: '#333', 
                      padding: '20px', 
                      borderRadius: '8px'
                    }}>
                      <h4 style={{ 
                        color: '#4CAF50', 
                        marginBottom: '15px', 
                        fontSize: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        💡 Recommendations:
                      </h4>
                      <div style={{ display: 'grid', gap: '10px' }}>
                        {analysisResult.analysis.recommendations.map((rec, index) => (
                          <div key={index} style={{
                            background: '#444',
                            padding: '12px 16px',
                            borderRadius: '6px',
                            color: '#fff',
                            borderLeft: '4px solid #4CAF50'
                          }}>
                            {rec}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Versions Tab */}
      {activeTab === 'versions' && (
        <div className="tab-content" style={{ background: 'linear-gradient(135deg, #232323, #2a2a2a)', padding: '30px', borderRadius: '15px', border: '1px solid #FFD700' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px' }}>
            <span style={{ fontSize: '32px', marginRight: '15px' }}>📚</span>
            <h2 style={{ color: '#FFD700', margin: 0, fontSize: '28px' }}>Procedure Versions</h2>
          </div>
          
          {versions.length === 0 ? (
            <div style={{ 
              background: '#1a1a1a', 
              padding: '40px', 
              borderRadius: '12px', 
              textAlign: 'center',
              border: '2px dashed #444'
            }}>
              <span style={{ fontSize: '48px', display: 'block', marginBottom: '15px' }}>📄</span>
              <p style={{ color: '#ccc', fontSize: '18px', margin: 0 }}>
                No versions found. Generate a procedure first to see version history.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {versions.map((version) => (
                <div
                  key={version.version_id}
                  style={{
                    background: 'linear-gradient(135deg, #333, #3a3a3a)',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #555',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '20px' }}>📝</span>
                      <h4 style={{ color: '#FFD700', margin: 0, fontSize: '18px' }}>
                        {version.version_id}
                      </h4>
                      {version.is_refinement && (
                        <span style={{ 
                          background: '#9C27B0', 
                          color: '#fff', 
                          padding: '4px 8px', 
                          borderRadius: '12px', 
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          REFINED
                        </span>
                      )}
                    </div>
                    <p style={{ color: '#ccc', margin: 0, fontSize: '14px' }}>
                      🕰️ Created: {new Date(version.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleVersionSelect(version.version_id)}
                      style={{
                        background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                        color: '#fff',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      👁️ View
                    </button>
                    <button
                      onClick={() => handleSetCurrentVersion(version.version_id)}
                      style={{
                        background: 'linear-gradient(135deg, #2196F3, #1976d2)',
                        color: '#fff',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      ✅ Set Current
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Current Procedure Display */}
      {currentProcedure && renderProcedureContent(currentProcedure)}

      {/* Version Modal */}
      {showVersionModal && selectedVersion && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: '#fff',
            padding: '0',
            borderRadius: '15px',
            maxWidth: '90%',
            maxHeight: '90%',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '20px 30px',
              background: 'linear-gradient(135deg, #FFD700, #FFA000)',
              color: '#000'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>📝</span>
                <h2 style={{ margin: 0, fontSize: '24px' }}>Version: {selectedVersion.version_id}</h2>
              </div>
              <button
                onClick={() => setShowVersionModal(false)}
                style={{
                  background: 'rgba(0,0,0,0.1)',
                  color: '#000',
                  border: 'none',
                  padding: '10px 15px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                ❌ Close
              </button>
            </div>
            <div style={{ 
              flex: 1, 
              overflow: 'auto', 
              padding: '0'
            }}>
              {renderProcedureContent(selectedVersion)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedProcedureGenerator;