import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getOrganizationImpactMatrix } from '../../bia/services/biaService';
import { 
  getAIDescription, 
  getAIPeakPeriod, 
  getImpactScaleMatrix,
  generateBCMPolicy,
  generateBCMQuestions
} from '../services/llmService';
import html2pdf from 'html2pdf.js';

/**
 * BCM Plan Development Procedure Component
 * Displays and allows editing of the BCM Plan Development procedure document
 */
const BcmPlanProcedure = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [criticalityThreshold, setCriticalityThreshold] = useState('12');
  const [organizationName, setOrganizationName] = useState('Your Organization');
  const [organizationId, setOrganizationId] = useState(null);
  const [documentInfo, setDocumentInfo] = useState({
    documentName: 'BCMS BCM Plan Development Procedure',
    documentOwner: 'BCM Team',
    documentVersionNo: '1.0',
    documentVersionDate: new Date().toISOString().split('T')[0],
    preparedBy: 'BCM Team',
    reviewedBy: 'Head-ORMD',
    approvedBy: 'ORMC - Operational Risk Management Committee'
  });
  const [changeLog, setChangeLog] = useState([
    { srNo: 1, versionNo: '1.0', approvalDate: '', descriptionOfChange: 'Initial document', reviewedBy: '', approvedBy: '' }
  ]);
  const [isEditing, setIsEditing] = useState(false);
  const [contentVerified, setContentVerified] = useState(false);
  const [impactMatrixData, setImpactMatrixData] = useState(null);
  const [isLoadingMatrix, setIsLoadingMatrix] = useState(false);
  const [matrixError, setMatrixError] = useState(null);
  
  // LLM-generated content states
  const [llmContent, setLlmContent] = useState({
    introduction: '',
    scope: '',
    objective: '',
    methodology: '',
    processFlow: '',
    rolesResponsibilities: '',
    reviewFrequency: '',
    bcmPolicy: '',
    bcmQuestions: [],
    criticalProcesses: [],
    peakPeriods: {},
    impactScaleMatrix: {}
  });
  const [isLoadingLLM, setIsLoadingLLM] = useState(false);
  const [llmError, setLlmError] = useState(null);
  const [useLLMContent, setUseLLMContent] = useState(false);

  // Fetch organization details and criticality threshold on component mount
  useEffect(() => {
    const fetchOrganizationData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          console.error('No access token found');
          return;
        }

        const decodedToken = jwtDecode(token);
        console.log('Decoded token:', decodedToken);
        
        if (decodedToken && decodedToken.organization_id) {
          const organizationId = decodedToken.organization_id;
          console.log('Organization ID:', organizationId);
          
          // Get organization criticality data
          const orgCriticalityData = await getOrganizationCriticality(organizationId);
          console.log('Organization criticality data:', orgCriticalityData);
          
          if (orgCriticalityData) {
            // Handle organization criticality threshold
            if (orgCriticalityData.criticality !== undefined) {
              setCriticalityThreshold(orgCriticalityData.criticality.toString());
              console.log('Setting criticality threshold from criticality:', orgCriticalityData.criticality);
            } else if (orgCriticalityData.rto_threshold !== undefined) {
              setCriticalityThreshold(orgCriticalityData.rto_threshold.toString());
              console.log('Setting criticality threshold from rto_threshold:', orgCriticalityData.rto_threshold);
            }
            
            // Handle organization name - check for both name properties
            if (orgCriticalityData.name) {
              setOrganizationName(orgCriticalityData.name);
              console.log('Setting organization name from name property:', orgCriticalityData.name);
            } else if (orgCriticalityData.organization_name) {
              setOrganizationName(orgCriticalityData.organization_name);
              console.log('Setting organization name from organization_name property:', orgCriticalityData.organization_name);
            } else {
              console.warn('No organization name found in API response');
            }
            
            setOrganizationId(organizationId);
            
            // Fetch impact matrix data
            await fetchImpactMatrix(organizationId);
          }
        }
      } catch (error) {
        console.error('Error fetching organization data:', error);
        setError('Failed to load organization data: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizationData();
  }, []);

  // Get organization criticality data
  const getOrganizationCriticality = async (organizationId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/organizations/${organizationId}/criticality`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch organization criticality');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching organization criticality:', error);
      return null;
    }
  };

  // Fetch impact matrix data
  const fetchImpactMatrix = async (organizationId) => {
    try {
      setIsLoadingMatrix(true);
      setMatrixError(null);
      
      const matrixData = await getOrganizationImpactMatrix(organizationId);
      console.log('Impact matrix data:', matrixData);
      
      if (matrixData) {
        setImpactMatrixData(matrixData);
      }
    } catch (error) {
      console.error('Error fetching impact matrix:', error);
      setMatrixError('Failed to load impact matrix: ' + error.message);
    } finally {
      setIsLoadingMatrix(false);
    }
  };

  // Generate LLM content for BCM Plan
  const generateLLMContent = async () => {
    setIsLoadingLLM(true);
    setLlmError(null);
    
    try {
      const newLlmContent = { ...llmContent };
      
      // Generate BCM Policy
      try {
        const bcmPolicyResponse = await generateBCMPolicy(organizationName, ['ISO 22301:2019'], 'BCM Plan Development');
        if (bcmPolicyResponse && bcmPolicyResponse.policy) {
          newLlmContent.bcmPolicy = bcmPolicyResponse.policy;
        }
      } catch (error) {
        console.error('Error generating BCM policy:', error);
      }

      // Generate BCM Questions
      try {
        const bcmQuestionsResponse = await generateBCMQuestions();
        if (bcmQuestionsResponse && bcmQuestionsResponse.questions) {
          newLlmContent.bcmQuestions = bcmQuestionsResponse.questions;
        }
      } catch (error) {
        console.error('Error generating BCM questions:', error);
      }

      // Generate descriptions for key BCM processes
      const bcmProcesses = ['BCM Plan Development', 'Recovery Strategy Development', 'Incident Response Planning'];
      for (const process of bcmProcesses) {
        try {
          const descriptionResponse = await getAIDescription('process', process);
          if (descriptionResponse && descriptionResponse.description) {
            if (!newLlmContent.criticalProcesses) {
              newLlmContent.criticalProcesses = [];
            }
            newLlmContent.criticalProcesses.push({
              name: process,
              description: descriptionResponse.description
            });
          }
        } catch (error) {
          console.error(`Error generating description for ${process}:`, error);
        }
      }

      // Generate peak periods for key departments
      const departments = ['IT', 'Operations', 'Finance', 'Human Resources'];
      for (const dept of departments) {
        try {
          const peakPeriodResponse = await getAIPeakPeriod(dept, 'BCM Plan Development', 'Technology');
          if (peakPeriodResponse && peakPeriodResponse.peak_period) {
            newLlmContent.peakPeriods[dept] = peakPeriodResponse.peak_period;
          }
        } catch (error) {
          console.error(`Error generating peak period for ${dept}:`, error);
        }
      }

      // Generate impact scale matrices for different impact types
      const impactTypes = ['Financial', 'Operational', 'Reputational'];
      for (const impactType of impactTypes) {
        try {
          const matrixResponse = await getImpactScaleMatrix('BCM Plan Development', impactType);
          if (matrixResponse && matrixResponse.matrix) {
            newLlmContent.impactScaleMatrix[impactType] = matrixResponse.matrix;
          }
        } catch (error) {
          console.error(`Error generating impact scale matrix for ${impactType}:`, error);
        }
      }

      setLlmContent(newLlmContent);
      setUseLLMContent(true);
      
    } catch (error) {
      console.error('Error generating LLM content:', error);
      setLlmError('Failed to generate AI content. Using fallback content instead.');
    } finally {
      setIsLoadingLLM(false);
    }
  };

  // Export impact matrix to CSV
  const exportImpactMatrixToCSV = () => {
    if (!impactMatrixData) {
      setMatrixError('No impact matrix data available for export');
      return;
    }

    try {
      // Convert matrix data to CSV format
      let csvContent = 'Impact Type,Duration,Impact Level\n';
      
      if (impactMatrixData.matrix) {
        Object.entries(impactMatrixData.matrix).forEach(([impactType, durations]) => {
          Object.entries(durations).forEach(([duration, impactLevel]) => {
            csvContent += `${impactType},${duration},${impactLevel}\n`;
          });
        });
      }

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${organizationName}_BCM_Impact_Matrix.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      setMatrixError('Failed to export CSV: ' + error.message);
    }
  };

  // Handle document info changes
  const handleDocumentInfoChange = (field, value) => {
    setDocumentInfo(prev => ({ ...prev, [field]: value }));
  };

  // Handle change log updates
  const handleChangeLogUpdate = (index, field, value) => {
    const updatedChangeLog = [...changeLog];
    updatedChangeLog[index] = { ...updatedChangeLog[index], [field]: value };
    setChangeLog(updatedChangeLog);
  };

  // Add new change log entry
  const addChangeLogEntry = () => {
    const newEntry = {
      srNo: changeLog.length + 1,
      versionNo: '',
      approvalDate: '',
      descriptionOfChange: '',
      reviewedBy: '',
      approvedBy: ''
    };
    setChangeLog([...changeLog, newEntry]);
  };

  // Verify content for PDF generation
  const verifyContent = () => {
    console.log('Verifying content...');
    console.log('Criticality threshold:', criticalityThreshold);
    console.log('Organization name:', organizationName);
    
    if (!criticalityThreshold || criticalityThreshold === '') {
      console.log('Criticality threshold not loaded');
      return false;
    }
    
    if (!organizationName || organizationName === 'Your Organization') {
      console.log('Organization name not loaded');
      return false;
    }
    
    console.log('Content verification passed');
    setContentVerified(true);
    return true;
  };

  // Generate PDF
  const generatePDF = () => {
    console.log('PDF generation started');
    console.log('Content verified:', contentVerified);
    console.log('Organization name:', organizationName);
    console.log('Criticality threshold:', criticalityThreshold);
    
    const element = document.getElementById('bcm-plan-procedure-document');
    console.log('Document element found:', element);
    
    if (!element) {
      console.error('Document element not found');
      setError('Document element not found. Please try refreshing the page.');
      return;
    }
    
    // Try to verify content, but don't block PDF generation if it fails
    const verificationResult = verifyContent();
    console.log('Content verification result:', verificationResult);
    
    // Use fallback values if verification fails
    const orgName = organizationName || 'Organization';
    const criticality = criticalityThreshold || '12';
    
    try {
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `${orgName}_BCM_Plan_Development_Procedure.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      console.log('Starting PDF generation with options:', opt);
      
      html2pdf()
        .set(opt)
        .from(element)
        .save()
        .then(() => {
          console.log('PDF generated successfully');
          setError(null); // Clear any previous errors
        })
        .catch((error) => {
          console.error('PDF generation failed:', error);
          setError('PDF generation failed: ' + error.message);
        });
    } catch (error) {
      console.error('Error in PDF generation:', error);
      setError('PDF generation error: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: '#FFD700' }}>Loading BCM Plan Development Procedure...</h2>
        <div style={{ marginTop: '20px' }}>Please wait while we fetch the latest data for your organization...</div>
      </div>
    );
  }

  if (error && !isEditing) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: '#FFD700' }}>Error Loading BCM Plan Development Procedure</h2>
        <div style={{ marginTop: '20px', color: 'red' }}>{error}</div>
        <button 
          onClick={() => setIsEditing(true)}
          style={{
            background: '#FFD700',
            color: '#232323',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            marginTop: '20px',
            cursor: 'pointer'
          }}
        >
          Continue with Editing
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#FFD700' }}>BCM Plan Development Procedure for {organizationName}</h1>
        <div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            style={{
              background: isEditing ? '#232323' : '#FFD700',
              color: isEditing ? '#FFD700' : '#232323',
              border: isEditing ? '1px solid #FFD700' : 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              marginRight: '10px',
              cursor: 'pointer'
            }}
          >
            {isEditing ? 'Preview' : 'Edit'}
          </button>
          <button
            onClick={generateLLMContent}
            disabled={isLoadingLLM}
            style={{
              background: isLoadingLLM ? '#999' : '#4CAF50',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              marginRight: '10px',
              cursor: isLoadingLLM ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoadingLLM ? 'Generating...' : 'Generate with AI'}
          </button>
          <button
            onClick={generatePDF}
            style={{
              background: '#FFD700',
              color: '#232323',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Generate PDF
          </button>
        </div>
      </div>

      {!contentVerified && criticalityThreshold === '' && (
        <div style={{ 
          backgroundColor: '#ffaaaa', 
          color: '#990000', 
          padding: '10px', 
          marginBottom: '20px', 
          borderRadius: '5px', 
          border: '1px solid #990000' 
        }}>
          <strong>Warning:</strong> Organization criticality threshold not loaded. Document cannot be finalized.
        </div>
      )}

      {llmError && (
        <div style={{ 
          backgroundColor: '#fff3cd', 
          color: '#856404', 
          padding: '10px', 
          marginBottom: '20px', 
          borderRadius: '5px', 
          border: '1px solid #ffeaa7' 
        }}>
          <strong>AI Generation Notice:</strong> {llmError}
        </div>
      )}

      {useLLMContent && (
        <div style={{ 
          backgroundColor: '#d4edda', 
          color: '#155724', 
          padding: '10px', 
          marginBottom: '20px', 
          borderRadius: '5px', 
          border: '1px solid #c3e6cb' 
        }}>
          <strong>AI Content Active:</strong> Using AI-generated content for enhanced procedure details.
        </div>
      )}

      {isEditing ? (
        <div style={{ background: '#232323', padding: '20px', borderRadius: '10px' }}>
          <h2 style={{ color: '#FFD700', marginBottom: '20px' }}>Document Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            {Object.entries(documentInfo).map(([key, value]) => (
              <div key={key} style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#FFD700' }}>
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </label>
                <input
                  type={key.includes('Date') ? 'date' : 'text'}
                  value={value}
                  onChange={(e) => handleDocumentInfoChange(key, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '5px',
                    border: '1px solid #FFD700',
                    background: '#181818',
                    color: '#fff'
                  }}
                />
              </div>
            ))}
          </div>

          <h2 style={{ color: '#FFD700', marginTop: '30px', marginBottom: '20px' }}>Organization Settings</h2>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#FFD700' }}>
              Organization Name
            </label>
            <input
              type="text"
              value={organizationName}
              disabled={true}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '5px',
                border: '1px solid #999',
                background: '#333',
                color: '#ccc',
                cursor: 'not-allowed'
              }}
            />
            <p style={{ color: '#999', fontSize: '12px', marginTop: '5px' }}>
              Organization name is set automatically based on your login credentials
            </p>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#FFD700' }}>
              Criticality Threshold (Hours)
            </label>
            <input
              type="number"
              value={criticalityThreshold}
              disabled={true}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '5px',
                border: '1px solid #999',
                background: '#333',
                color: '#ccc',
                cursor: 'not-allowed'
              }}
            />
            <p style={{ color: '#999', fontSize: '12px', marginTop: '5px' }}>
              Criticality threshold is set automatically from your organization settings
            </p>
          </div>

          <h2 style={{ color: '#FFD700', marginTop: '30px', marginBottom: '20px' }}>Content Settings</h2>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', color: '#FFD700', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={useLLMContent}
                onChange={(e) => setUseLLMContent(e.target.checked)}
                style={{ marginRight: '10px' }}
              />
              Use AI-Generated Content (when available)
            </label>
            <p style={{ color: '#999', fontSize: '12px', marginTop: '5px' }}>
              When enabled, the document will use AI-generated content for enhanced sections. If AI content is not available, fallback content will be used.
            </p>
          </div>

          <h2 style={{ color: '#FFD700', marginTop: '30px', marginBottom: '20px' }}>Change Log/Revision History</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '10px', border: '1px solid #FFD700', color: '#FFD700' }}>Sr. No.</th>
                <th style={{ padding: '10px', border: '1px solid #FFD700', color: '#FFD700' }}>Version No.</th>
                <th style={{ padding: '10px', border: '1px solid #FFD700', color: '#FFD700' }}>Approval Date</th>
                <th style={{ padding: '10px', border: '1px solid #FFD700', color: '#FFD700' }}>Description of Change</th>
                <th style={{ padding: '10px', border: '1px solid #FFD700', color: '#FFD700' }}>Reviewed By</th>
                <th style={{ padding: '10px', border: '1px solid #FFD700', color: '#FFD700' }}>Approved By</th>
              </tr>
            </thead>
            <tbody>
              {changeLog.map((entry, index) => (
                <tr key={index}>
                  <td style={{ padding: '10px', border: '1px solid #FFD700', color: '#fff' }}>
                    {entry.srNo}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #FFD700', color: '#fff' }}>
                    <input
                      type="text"
                      value={entry.versionNo}
                      onChange={(e) => handleChangeLogUpdate(index, 'versionNo', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '5px',
                        borderRadius: '3px',
                        border: '1px solid #FFD700',
                        background: '#181818',
                        color: '#fff'
                      }}
                    />
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #FFD700', color: '#fff' }}>
                    <input
                      type="date"
                      value={entry.approvalDate}
                      onChange={(e) => handleChangeLogUpdate(index, 'approvalDate', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '5px',
                        borderRadius: '3px',
                        border: '1px solid #FFD700',
                        background: '#181818',
                        color: '#fff'
                      }}
                    />
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #FFD700', color: '#fff' }}>
                    <input
                      type="text"
                      value={entry.descriptionOfChange}
                      onChange={(e) => handleChangeLogUpdate(index, 'descriptionOfChange', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '5px',
                        borderRadius: '3px',
                        border: '1px solid #FFD700',
                        background: '#181818',
                        color: '#fff'
                      }}
                    />
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #FFD700', color: '#fff' }}>
                    <input
                      type="text"
                      value={entry.reviewedBy}
                      onChange={(e) => handleChangeLogUpdate(index, 'reviewedBy', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '5px',
                        borderRadius: '3px',
                        border: '1px solid #FFD700',
                        background: '#181818',
                        color: '#fff'
                      }}
                    />
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #FFD700', color: '#fff' }}>
                    <input
                      type="text"
                      value={entry.approvedBy}
                      onChange={(e) => handleChangeLogUpdate(index, 'approvedBy', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '5px',
                        borderRadius: '3px',
                        border: '1px solid #FFD700',
                        background: '#181818',
                        color: '#fff'
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={addChangeLogEntry}
            style={{
              background: '#FFD700',
              color: '#232323',
              border: 'none',
              padding: '8px 15px',
              borderRadius: '5px',
              marginTop: '15px',
              cursor: 'pointer'
            }}
          >
            Add Entry
          </button>
        </div>
      ) : (
        <div id="bcm-plan-procedure-document" style={{ background: '#fff', color: '#000', padding: '40px', borderRadius: '5px' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>{organizationName} BCMS BCM Plan Development Procedure</h1>
          <p style={{ fontSize: '16px', marginBottom: '10px' }}>Version {documentInfo.documentVersionNo}</p>
          <p style={{ fontSize: '14px', marginBottom: '30px' }}>This document outlines the BCM Plan Development procedure for {organizationName}.</p>
          
          <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>1. Introduction</h2>
          <p style={{ marginBottom: '15px', lineHeight: '1.5' }}>
            {useLLMContent && llmContent.introduction ? 
              llmContent.introduction :
              `This Business Continuity Management (BCM) Plan Development Procedure outlines ${organizationName}'s standardized approach to
              developing comprehensive business continuity plans that ensure the organization can continue critical operations during and after disruptive incidents.
              The procedure establishes a structured methodology for creating, implementing, and maintaining BCM plans in alignment with ISO 22301:2019 standards.`
            }
          </p>

          <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>2. Scope</h2>
          <p style={{ marginBottom: '15px', lineHeight: '1.5' }}>
            {useLLMContent && llmContent.scope ? 
              llmContent.scope :
              `This procedure applies to all business units, departments, and critical functions within ${organizationName}'s Business Continuity Management System (BCMS).
              It covers the end-to-end process of developing business continuity plans, including strategy development, plan documentation, implementation,
              testing, and continuous improvement activities.`
            }
          </p>

          <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>3. Objective</h2>
          <p style={{ marginBottom: '15px', lineHeight: '1.5' }}>
            {useLLMContent && llmContent.objective ? 
              llmContent.objective :
              `The objective of this procedure is to provide a structured approach for developing comprehensive business continuity plans that enable
              ${organizationName} to maintain critical operations during disruptive incidents and recover effectively.`
            }
          </p>

          <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>4. BCM Plan Development Methodology</h2>
          <p style={{ marginBottom: '15px', lineHeight: '1.5' }}>
            {useLLMContent && llmContent.methodology ? 
              llmContent.methodology :
              `The BCM Plan Development methodology follows a systematic approach that integrates findings from the Business Impact Analysis (BIA) and Risk Assessment
              to create comprehensive recovery strategies. This methodology ensures that all critical processes have appropriate continuity plans that address
              their specific requirements and dependencies.`
            }
          </p>

          <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>5. Process Flow</h2>
          <p style={{ marginBottom: '15px', lineHeight: '1.5' }}>
            The BCM Plan Development process follows a structured sequence of steps to ensure comprehensive and effective plan creation.
            The process includes reviewing BIA and Risk Assessment results, developing recovery strategies, drafting BCM plans,
            reviewing and validating plans, obtaining stakeholder approval, implementing and training, testing and exercising,
            and continuous monitoring and improvement.
          </p>

          <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>6. Roles and Responsibilities</h2>
          <p style={{ marginBottom: '15px', lineHeight: '1.5' }}>
            This section outlines the key stakeholders involved at {organizationName} and their respective duties throughout the
            BCM Plan Development lifecycle, including the BCM Team, Department Heads, and the Operational Risk Management Committee.
          </p>

          <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>7. Review Frequency</h2>
          <p style={{ marginBottom: '15px', lineHeight: '1.5' }}>
            {useLLMContent && llmContent.reviewFrequency ? 
              llmContent.reviewFrequency :
              `BCM plans are to be reviewed annually or whenever there are significant changes in business operations,
              organizational structure, technology infrastructure, or regulatory requirements. Additionally, plans should be
              updated following any testing exercises or actual incident responses to incorporate lessons learned.`
            }
          </p>

          <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>8. Annexure</h2>
          
          <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>8.1 BCM Policy</h3>
          <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
            {useLLMContent && llmContent.bcmPolicy ? 
              llmContent.bcmPolicy :
              `${organizationName} is committed to maintaining business continuity and ensuring the resilience of critical business operations.
              This BCM policy establishes the framework for developing, implementing, and maintaining comprehensive business continuity
              management plans that enable the organization to respond effectively to disruptive incidents and maintain service delivery
              to stakeholders. The policy aligns with ISO 22301:2019 standards and regulatory requirements applicable to our operations.`
            }
          </div>
          
          <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>8.2 BCM Questions</h3>
          <div style={{ marginBottom: '20px' }}>
            {useLLMContent && llmContent.bcmQuestions && llmContent.bcmQuestions.length > 0 ? (
              <ol style={{ marginLeft: '20px', lineHeight: '1.5' }}>
                {llmContent.bcmQuestions.map((question, index) => (
                  <li key={index} style={{ marginBottom: '10px' }}>{question}</li>
                ))}
              </ol>
            ) : (
              <ol style={{ marginLeft: '20px', lineHeight: '1.5' }}>
                <li style={{ marginBottom: '10px' }}>What are the critical business processes that must be maintained during a disruption?</li>
                <li style={{ marginBottom: '10px' }}>What are the maximum acceptable downtime periods for each critical process?</li>
                <li style={{ marginBottom: '10px' }}>What resources are required to maintain critical operations during a disruption?</li>
                <li style={{ marginBottom: '10px' }}>How will communication be maintained with stakeholders during an incident?</li>
                <li style={{ marginBottom: '10px' }}>What are the recovery strategies for each critical business function?</li>
                <li style={{ marginBottom: '10px' }}>How will the organization test and validate its business continuity plans?</li>
              </ol>
            )}
          </div>

          {useLLMContent && Object.keys(llmContent.impactScaleMatrix).length > 0 && (
            <>
              <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>8.3 AI-Generated Impact Scale Matrix</h3>
              <div style={{ marginBottom: '20px' }}>
                {Object.entries(llmContent.impactScaleMatrix).map(([impactType, matrix]) => (
                  <div key={impactType} style={{ marginBottom: '15px', border: '1px solid #ddd', padding: '10px', borderRadius: '5px' }}>
                    <h4 style={{ fontSize: '16px', marginBottom: '10px', color: '#333' }}>{impactType} Impact</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f5f5' }}>
                          <th style={{ padding: '5px', border: '1px solid #ddd' }}>Duration</th>
                          <th style={{ padding: '5px', border: '1px solid #ddd' }}>Impact Level</th>
                          <th style={{ padding: '5px', border: '1px solid #ddd' }}>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(matrix).map(([duration, value]) => {
                          let impactLevel = value;
                          let reason = '';
                          if (typeof value === 'object' && value !== null) {
                            impactLevel = value.impact_severity ?? '';
                            reason = value.reason ?? '';
                          }
                          return (
                            <tr key={duration}>
                              <td style={{ padding: '5px', border: '1px solid #ddd' }}>{duration}</td>
                              <td style={{ padding: '5px', border: '1px solid #ddd' }}>{impactLevel}</td>
                              <td style={{ padding: '5px', border: '1px solid #ddd' }}>{reason}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </>
          )}

          {useLLMContent && Object.keys(llmContent.peakPeriods).length > 0 && (
            <>
              <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>8.4 AI-Predicted Peak Periods</h3>
              <div style={{ marginBottom: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{ padding: '8px', border: '1px solid #ddd' }}>Department</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd' }}>Predicted Peak Period</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(llmContent.peakPeriods).map(([dept, period]) => (
                      <tr key={dept}>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{dept}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{period}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          
          <div style={{ marginTop: '50px', textAlign: 'center', fontStyle: 'italic' }}>
            --- End of Document ---
          </div>
        </div>
      )}
    </div>
  );
};

export default BcmPlanProcedure;
