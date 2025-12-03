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
 * Risk Assessment Procedure Component
 * Displays and allows editing of the Risk Assessment procedure document
 */
const RiskAssessmentProcedure = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [criticalityThreshold, setCriticalityThreshold] = useState('12');
  const [organizationName, setOrganizationName] = useState('Your Organization');
  const [organizationId, setOrganizationId] = useState(null);
  const [documentInfo, setDocumentInfo] = useState({
    documentName: 'Risk Assessment Procedure',
    documentOwner: 'BCM Team',
    documentVersionNo: '1.0',
    documentVersionDate: new Date().toISOString().split('T')[0],
    preparedBy: 'BCM Team',
    reviewedBy: 'Head-ORMD',
    approvedBy: 'ORMC- Operational Risk Management Committee'
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
    governance: '',
    frequency: '',
    riskParameters: [],
    controlEffectiveness: {},
    riskValueMatrix: {}
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

            // Mark content as verified if we have the critical data
            if ((orgCriticalityData.criticality !== undefined || orgCriticalityData.rto_threshold !== undefined) && 
                (orgCriticalityData.name || orgCriticalityData.organization_name)) {
              setContentVerified(true);
              console.log('Content verified: Setting to true');
            }
          }
          
          // Fetch impact matrix data for the organization
          fetchImpactMatrix(organizationId);
        }
      } catch (error) {
        console.error('Error fetching organization data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizationData();
  }, []);

  // Implement a local version of getOrganizationCriticality to ensure we get all data
  const getOrganizationCriticality = async (organizationId) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No token found');
      }
      const API_URL = 'http://localhost:8000';
      const response = await fetch(`${API_URL}/organizations/${organizationId}/criticality`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch organization criticality');
      }
      
      // Try to parse as JSON first
      const data = await response.json();
      console.log('Raw organization data:', data);
      return data;
      
    } catch (error) {
      console.error('Fetch organization criticality error:', error);
      return { rto_threshold: 12 }; // Default fallback value
    }
  };

  // Function to fetch the organization's impact matrix
  const fetchImpactMatrix = async (organizationId) => {
    try {
      setIsLoadingMatrix(true);
      setMatrixError(null);
      
      console.log('Fetching impact matrix for organization:', organizationId);
      
      const response = await getOrganizationImpactMatrix(organizationId);
      console.log('Raw API response:', response);
      
      if (!response) {
        throw new Error('Empty response from API');
      }
      
      // Extract the data property from the response
      const matrixData = response.data || response;
      console.log('Impact matrix data extracted:', matrixData);
      
      if (!matrixData || !matrixData.cells || !matrixData.impact_types || !matrixData.impact_levels) {
        console.warn('Impact matrix data is incomplete:', matrixData);
        setMatrixError('Incomplete impact matrix data received from the server');
        setIsLoadingMatrix(false);
        return;
      }
      
      // Update the state with the matrix data
      setImpactMatrixData(matrixData);
      setIsLoadingMatrix(false);
    } catch (error) {
      console.error('Error fetching impact matrix data:', error);
      setMatrixError('Failed to load impact matrix data: ' + (error.message || 'Unknown error'));
      setIsLoadingMatrix(false);
    }
  };

  // Function to generate LLM content for Risk Assessment procedure
  const generateLLMContent = async () => {
    if (!organizationName) {
      setLlmError('Organization name is required to generate LLM content');
      return;
    }

    setIsLoadingLLM(true);
    setLlmError(null);

    try {
      // Generate introduction
      const introResponse = await getAIDescription('process', 'Risk Assessment Procedure');
      const intro = introResponse.description || '';

      // Generate scope
      const scopeResponse = await getAIDescription('process', 'Risk Assessment Scope');
      const scope = scopeResponse.description || '';

      // Generate objective
      const objectiveResponse = await getAIDescription('process', 'Risk Assessment Objective');
      const objective = objectiveResponse.description || '';

      // Generate methodology
      const methodologyResponse = await getAIDescription('process', 'Risk Assessment Methodology');
      const methodology = methodologyResponse.description || '';

      // Generate governance
      const governanceResponse = await getAIDescription('process', 'Risk Governance and Documentation');
      const governance = governanceResponse.description || '';

      // Generate frequency
      const frequencyResponse = await getAIDescription('process', 'Risk Assessment Frequency');
      const frequency = frequencyResponse.description || '';

      // Get impact scale matrix for different risk types
      const riskTypes = ['Operational', 'Technological', 'Security', 'Regulatory'];
      const riskValueMatrix = {};
      
      for (const riskType of riskTypes) {
        try {
          const matrixResponse = await getImpactScaleMatrix('Risk Assessment', riskType);
          riskValueMatrix[riskType] = matrixResponse.impact_scale_matrix || {};
        } catch (error) {
          console.warn(`Failed to get risk value matrix for ${riskType}:`, error);
        }
      }

      setLlmContent({
        introduction: intro,
        scope: scope,
        objective: objective,
        methodology: methodology,
        governance: governance,
        frequency: frequency,
        riskParameters: ['People', 'Sites', 'Technology', 'Third Party'],
        controlEffectiveness: {
          'Controls not implemented': 1,
          'Controls implemented partially': 2,
          'Controls guaranteed to function': 3
        },
        riskValueMatrix: riskValueMatrix
      });

      setUseLLMContent(true);
    } catch (error) {
      console.error('Error generating LLM content:', error);
      setLlmError('Failed to generate LLM content. Using fallback content instead.');
      setUseLLMContent(false);
    } finally {
      setIsLoadingLLM(false);
    }
  };

  // Function to export impact matrix to CSV
  const exportImpactMatrixToCSV = () => {
    console.log('Attempting to export impact matrix to CSV. Data:', impactMatrixData);
    
    if (!impactMatrixData) {
      console.error('No impact matrix data available to export');
      setMatrixError('No impact matrix data available to export');
      return;
    }
    
    try {
      // Check what data we have to debug
      console.log('Impact types:', impactMatrixData.impact_types);
      console.log('Impact levels:', impactMatrixData.impact_levels);
      console.log('Cells:', impactMatrixData.cells);
      
      if (!Array.isArray(impactMatrixData.impact_types) || !Array.isArray(impactMatrixData.impact_levels) || !Array.isArray(impactMatrixData.cells)) {
        console.error('Impact matrix data is in an unexpected format:', impactMatrixData);
        setMatrixError('Impact matrix data is in an unexpected format');
        return;
      }
      
      // Create CSV header with impact level names
      let csvContent = 'Impact Type,Area of Impact,';
      impactMatrixData.impact_levels.forEach((level, index) => {
        csvContent += level.name || '';
        if (index < impactMatrixData.impact_levels.length - 1) {
          csvContent += ',';
        }
      });
      csvContent += '\n';
      
      // Group cells by impact type and level for easier processing
      const cellsByTypeAndLevel = {};
      impactMatrixData.cells.forEach(cell => {
        const typeId = cell.impact_type_id;
        const levelId = cell.impact_level_id;
        
        if (!cellsByTypeAndLevel[typeId]) {
          cellsByTypeAndLevel[typeId] = {};
        }
        
        cellsByTypeAndLevel[typeId][levelId] = cell.description || '';
      });
      
      // Add rows for each impact type
      impactMatrixData.impact_types.forEach(type => {
        const typeId = type.id;
        const typeName = type.name || '';
        const areaOfImpact = type.area_of_impact || '';
        
        // Start the row with impact type and area of impact
        let row = `"${typeName}","${areaOfImpact}",`;
        
        // Add cell descriptions for each impact level
        impactMatrixData.impact_levels.forEach((level, index) => {
          const levelId = level.id;
          const cellData = cellsByTypeAndLevel[typeId]?.[levelId] || '';
          
          // Escape quotes in the cell content and wrap in quotes
          row += `"${(cellData || '').toString().replace(/"/g, '""')}"`;
          
          // Add comma if not the last item
          if (index < impactMatrixData.impact_levels.length - 1) {
            row += ',';
          }
        });
        
        csvContent += row + '\n';
      });
      
      // Create a blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${organizationName}_Risk_Assessment_Matrix.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log('CSV export completed successfully');
      
    } catch (error) {
      console.error('Error exporting impact matrix to CSV:', error);
      setMatrixError('Failed to export impact matrix to CSV: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDocumentInfoChange = (field, value) => {
    setDocumentInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleChangeLogUpdate = (index, field, value) => {
    const updatedLog = [...changeLog];
    updatedLog[index] = { ...updatedLog[index], [field]: value };
    setChangeLog(updatedLog);
  };

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

  const verifyContent = () => {
    console.log('Verifying content...');
    console.log('Criticality threshold:', criticalityThreshold);
    console.log('Organization name:', organizationName);
    
    if (!criticalityThreshold) {
      console.log('Criticality threshold not loaded');
      setError('Criticality threshold not loaded. Cannot generate PDF.');
      return false;
    }
    
    if (!organizationName) {
      console.log('Organization name not loaded');
      setError('Organization name not loaded. Cannot generate PDF.');
      return false;
    }
    
    console.log('Content verification passed');
    setContentVerified(true);
    return true;
  };

  const generatePDF = () => {
    console.log('PDF generation started');
    console.log('Content verified:', contentVerified);
    console.log('Organization name:', organizationName);
    console.log('Criticality threshold:', criticalityThreshold);
    
    const element = document.getElementById('risk-assessment-procedure-document');
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
        filename: `${orgName}_Risk_Assessment_Procedure.pdf`,
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
        <h2 style={{ color: '#FFD700' }}>Loading Risk Assessment Procedure...</h2>
        <div style={{ marginTop: '20px' }}>Please wait while we fetch the latest data for your organization...</div>
      </div>
    );
  }

  if (error && !isEditing) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: '#FFD700' }}>Error Loading Risk Assessment Procedure</h2>
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
        <h1 style={{ color: '#FFD700' }}>Risk Assessment Procedure for {organizationName}</h1>
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
          {/* <button
            onClick={() => {
              // Simple test to check if html2pdf is working
              const testElement = document.createElement('div');
              testElement.innerHTML = '<h1>Test PDF</h1><p>This is a test PDF generation.</p>';
              document.body.appendChild(testElement);
              
              html2pdf()
                .from(testElement)
                .save('test.pdf')
                .then(() => {
                  console.log('Test PDF generated successfully');
                  document.body.removeChild(testElement);
                })
                .catch((error) => {
                  console.error('Test PDF generation failed:', error);
                  document.body.removeChild(testElement);
                });
            }}
            style={{
              background: '#4CAF50',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Test PDF
          </button> */}
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
        <div id="risk-assessment-procedure-document" style={{ background: '#fff', color: '#000', padding: '40px', borderRadius: '5px' }}>
          {/* Cover Page */}
          <div style={{ textAlign: 'center', marginBottom: '50px', pageBreakAfter: 'always' }}>
            <div style={{ marginBottom: '100px' }}>
              {organizationName} Logo
            </div>
            <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>{organizationName} Risk Assessment Procedure</h1>
            <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>(2025-26)</h2>
            <p style={{ fontSize: '16px' }}>Version {documentInfo.documentVersionNo}</p>
            <div style={{ position: 'absolute', bottom: '20px', right: '40px', fontSize: '12px' }}>
              {organizationName} Internal Purpose<br />
              Page | 1
            </div>
          </div>

          {/* Document Information */}
          <div style={{ marginBottom: '50px', pageBreakAfter: 'always' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Document Information:</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
              <tbody>
                {Object.entries(documentInfo).map(([key, value]) => (
                  <tr key={key}>
                    <td style={{ padding: '8px', border: '1px solid #000', width: '30%' }}>
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #000' }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Change Log/Revision History:</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px', border: '1px solid #000' }}>Sr. No.</th>
                  <th style={{ padding: '8px', border: '1px solid #000' }}>Version No.</th>
                  <th style={{ padding: '8px', border: '1px solid #000' }}>Approval Date</th>
                  <th style={{ padding: '8px', border: '1px solid #000' }}>Description of Change</th>
                  <th style={{ padding: '8px', border: '1px solid #000' }}>Reviewed By</th>
                  <th style={{ padding: '8px', border: '1px solid #000' }}>Approved By</th>
                </tr>
              </thead>
              <tbody>
                {changeLog.map((entry, index) => (
                  <tr key={index}>
                    <td style={{ padding: '8px', border: '1px solid #000' }}>{entry.srNo}</td>
                    <td style={{ padding: '8px', border: '1px solid #000' }}>{entry.versionNo}</td>
                    <td style={{ padding: '8px', border: '1px solid #000' }}>{entry.approvalDate}</td>
                    <td style={{ padding: '8px', border: '1px solid #000' }}>{entry.descriptionOfChange}</td>
                    <td style={{ padding: '8px', border: '1px solid #000' }}>{entry.reviewedBy}</td>
                    <td style={{ padding: '8px', border: '1px solid #000' }}>{entry.approvedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ position: 'absolute', bottom: '20px', right: '40px', fontSize: '12px' }}>
              {organizationName} Internal Purpose<br />
              Page | 2
            </div>
          </div>

          {/* Table of Contents */}
          <div style={{ marginBottom: '50px', pageBreakAfter: 'always' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Table of Contents</h2>
            <div>
              <p>1. Introduction ............................................................................................................. 4</p>
              <p>2. Scope ..................................................................................................................... 4</p>
              <p>3. Objective ................................................................................................................ 4</p>
              <p>4. Risk Assessment Methodology .................................................................................................... 4</p>
              <p>5. Governance and Documentation ....................................................................................... 6</p>
              <p>6. Frequency ................................................................................................................ 6</p>
              <p>7. Annexure ................................................................................................................ 6</p>
              {useLLMContent && (
                <>
                  <p>7.1 AI-Generated Risk Value Matrix ................................................................... 7</p>
                  <p>7.2 AI-Generated Control Effectiveness ................................................................... 7</p>
                </>
              )}
            </div>
            <div style={{ position: 'absolute', bottom: '20px', right: '40px', fontSize: '12px' }}>
              {organizationName} Internal Purpose<br />
              Page | 3
            </div>
          </div>

          {/* Introduction, Scope, Objective */}
          <div style={{ marginBottom: '50px', pageBreakAfter: 'always' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>1. Introduction</h2>
            <p style={{ marginBottom: '15px', lineHeight: '1.5' }}>
              {useLLMContent && llmContent.introduction ? 
                llmContent.introduction :
                `The Risk Assessment Procedure outlines a systematic approach to identifying, analyzing, evaluating, and treating risks that may affect the organization's ability to achieve its objectives. This process helps ensure that critical enablers—such as people, facilities, technology, networks, and services—are assessed for potential threats and vulnerabilities. The procedure supports informed decision-making, enhances resilience, and ensures compliance with regulatory and business continuity requirements.`
              }
            </p>

            <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>2. Scope</h2>
            <p style={{ marginBottom: '25px', lineHeight: '1.5' }}>
              {useLLMContent && llmContent.scope ? 
                llmContent.scope :
                `This procedure applies to all business units, departments, support functions, and critical third-party service providers that are part of the Bank's in-scope Business Continuity Management System (BCMS).`
              }
            </p>

            <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>3. Objective</h2>
            <p style={{ marginBottom: '15px', lineHeight: '1.5' }}>
              {useLLMContent && llmContent.objective ? 
                llmContent.objective :
                `The objective of this procedure is to systematically identify, assess, and manage risks that may impact the organization's ability to operate effectively. It aims to support proactive decision-making and strengthen organizational resilience.`
              }
            </p>

            <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>4. Risk Assessment Methodology</h2>
            <p style={{ marginBottom: '15px', lineHeight: '1.5' }}>
              {useLLMContent && llmContent.methodology ? 
                llmContent.methodology :
                `This methodology provides a structured approach to identifying, assessing, and managing risks associated with people, sites, technology and third party.`
              }
            </p>

            <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>4.1. Asset and Enabler Identification</h3>
            <p style={{ marginBottom: '15px', lineHeight: '1.5' }}>
              The first step involves identifying critical enablers and assets across the organization. These may include people (employees, contractors), physical sites (buildings, server rooms), technology (applications, tools, hardware), networks (LAN/WAN), end-user systems, cloud services, and IoT devices. Each enabler is classified and documented in the risk register to ensure comprehensive coverage.
            </p>

            <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>4.2. Threat and Vulnerability Mapping</h3>
            <p style={{ marginBottom: '15px', lineHeight: '1.5' }}>
              For each enabler, potential threats are identified—both natural (e.g., earthquakes, floods) and man-made (e.g., cyberattacks, insider threats, utility failures). Simultaneously, vulnerabilities associated with each enabler are assessed. These may include weaknesses in planning, controls, configurations, physical safeguards, or process maturity. This step ensures a contextual understanding of how specific vulnerabilities can be exploited by corresponding threats.
            </p>
            <div style={{ position: 'absolute', bottom: '20px', right: '40px', fontSize: '12px' }}>
              {organizationName} Internal Purpose<br />
              Page | 4
            </div>
          </div>

          {/* Risk Assessment Methodology Continued */}
          <div style={{ marginBottom: '50px', pageBreakAfter: 'always' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>4.3. Risk Assessment (Impact × Likelihood)</h3>
            <p style={{ marginBottom: '15px', lineHeight: '1.5' }}>
              Each threat-vulnerability pair is analyzed to assess the risk. Two factors are considered:
            </p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.5' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Impact:</strong> The consequence of the risk materializing (e.g., service disruption, data loss, reputational damage).
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Likelihood:</strong> The probability of occurrence based on historical trends, current exposure, or threat intelligence.
              </li>
            </ul>
            <p style={{ marginBottom: '15px', lineHeight: '1.5' }}>
              Using a defined risk matrix (e.g., 5x5), a Risk Value is calculated by multiplying the Impact and Likelihood scores. Based on this, a Risk Rating (Low, Medium, High, or Critical) is assigned. The risk is then categorized by type (e.g., operational, technological, security, regulatory).
            </p>

            <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>4.4. Current Control Assessment</h3>
            <p style={{ marginBottom: '15px', lineHeight: '1.5' }}>
              Existing controls for each risk are identified and described. These may include technical safeguards (e.g., firewalls, patch management), process controls (e.g., escalation matrices, awareness programs), physical measures (e.g., power backup), or contractual agreements. Each control is evaluated for its effectiveness and assigned a Control Rating (Strong, Moderate, Weak). The effectiveness of current controls informs the Residual Risk, which is the remaining exposure after accounting for mitigation.
            </p>

            <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>4.5. Risk Classification and Residual Risk Evaluation</h3>
            <p style={{ marginBottom: '15px', lineHeight: '1.5' }}>
              Risks are classified into relevant categories (e.g., People Risk, Site Risk, IT Risk) for reporting and monitoring. If residual risk exceeds acceptable thresholds, the risk is flagged for treatment. Risks with inadequate mitigation and high residual values are prioritized for further action.
            </p>

            <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>4.6. Mitigation Planning</h3>
            <p style={{ marginBottom: '15px', lineHeight: '1.5' }}>
              For risks deemed unacceptable, a mitigation plan is developed. This includes:
            </p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.5' }}>
              <li style={{ marginBottom: '10px' }}>Specific actions to reduce the risk</li>
              <li style={{ marginBottom: '10px' }}>Target completion timelines</li>
              <li style={{ marginBottom: '10px' }}>Assigned risk owner(s)</li>
              <li style={{ marginBottom: '10px' }}>Dependencies and required resources</li>
            </ul>
            <p style={{ marginBottom: '15px', lineHeight: '1.5' }}>
              Mitigation strategies may include enhancing controls, implementing redundancies, training employees, upgrading infrastructure, or revising processes.
            </p>

            <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>4.7. Monitoring and Review</h3>
            <p style={{ marginBottom: '15px', lineHeight: '1.5' }}>
              Risks and controls are monitored continuously, and the risk register is updated periodically (e.g., quarterly or upon significant change). Mitigation plans are tracked until closure. Emerging risks or changes in external/internal environments trigger reassessment.
            </p>
            <div style={{ position: 'absolute', bottom: '20px', right: '40px', fontSize: '12px' }}>
              {organizationName} Internal Purpose<br />
              Page | 5
            </div>
          </div>

          {/* Governance, Frequency, and Annexure */}
          <div style={{ marginBottom: '50px', pageBreakAfter: 'always' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>5. Governance and Documentation</h2>
            <p style={{ marginBottom: '25px', lineHeight: '1.5' }}>
              {useLLMContent && llmContent.governance ? 
                llmContent.governance :
                `All risk data—including assessments, control evaluations, and mitigation actions—are documented in a structured risk register. This register serves as a single source of truth and is reviewed by Risk team or HO BCM team. Key risks and exceptions are escalated appropriately.`
              }
            </p>

            <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>6. Frequency</h2>
            <p style={{ marginBottom: '15px', lineHeight: '1.5' }}>
              {useLLMContent && llmContent.frequency ? 
                llmContent.frequency :
                `Risk assessments shall be conducted annually to ensure continued compliance, relevance, and effectiveness of risk control measures.`
              }
            </p>
            <p style={{ marginBottom: '25px', lineHeight: '1.5', fontStyle: 'italic', fontWeight: 'bold' }}>
              *RA is to be conducted as and when there is major change in the operations and the products/services offered by the department and/or as mandated by the regulators.
            </p>

            <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>7. Annexure</h2>
            
            <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>7.1 Likelihood/Probability of occurrence of threat</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f2c999' }}>
                  <th style={{ padding: '8px', border: '1px solid #000' }}>Rating</th>
                  <th style={{ padding: '8px', border: '1px solid #000' }}>Likelihood Level</th>
                  <th style={{ padding: '8px', border: '1px solid #000' }}>Likelihood Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center' }}>1</td>
                  <td style={{ padding: '8px', border: '1px solid #000' }}>Rare</td>
                  <td style={{ padding: '8px', border: '1px solid #000' }}>The event may occur only in an exceptional circumstance.</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center' }}>2</td>
                  <td style={{ padding: '8px', border: '1px solid #000' }}>Unlikely</td>
                  <td style={{ padding: '8px', border: '1px solid #000' }}>The event could occur in some circumstances or at some point of time over the next 3 to 5 years.</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center' }}>3</td>
                  <td style={{ padding: '8px', border: '1px solid #000' }}>Occasional</td>
                  <td style={{ padding: '8px', border: '1px solid #000' }}>The event might occur at some point of time over the next 1 to 2 years.</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center' }}>4</td>
                  <td style={{ padding: '8px', border: '1px solid #000' }}>Likely</td>
                  <td style={{ padding: '8px', border: '1px solid #000' }}>The event will probably occur in most circumstances in next 7 to 12 months.</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center' }}>5</td>
                  <td style={{ padding: '8px', border: '1px solid #000' }}>Almost Certain</td>
                  <td style={{ padding: '8px', border: '1px solid #000' }}>The event is expected to occur in most circumstances in next 0-6 months.</td>
                </tr>
              </tbody>
            </table>

            <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>7.2 Impact due to Threat</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f2c999' }}>
                  <th style={{ padding: '8px', border: '1px solid #000' }}>Rating</th>
                  <th style={{ padding: '8px', border: '1px solid #000' }}>Impact Level</th>
                  <th style={{ padding: '8px', border: '1px solid #000' }}>Impact Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center' }}>1</td>
                  <td style={{ padding: '8px', border: '1px solid #000' }}>Limited</td>
                  <td style={{ padding: '8px', border: '1px solid #000' }}>No impact on delivery of processes if the enabler is compromised</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center' }}>2</td>
                  <td style={{ padding: '8px', border: '1px solid #000' }}>Low</td>
                  <td style={{ padding: '8px', border: '1px solid #000' }}>Minor impact on delivery of processes if the enabler is compromised</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center' }}>3</td>
                  <td style={{ padding: '8px', border: '1px solid #000' }}>Moderate</td>
                  <td style={{ padding: '8px', border: '1px solid #000' }}>Moderate Impact on delivery of processes if the enabler is compromised</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center' }}>4</td>
                  <td style={{ padding: '8px', border: '1px solid #000' }}>High</td>
                  <td style={{ padding: '8px', border: '1px solid #000' }}>
                    Non-availability of enabler could result in the following consequences:
                    <ul style={{ marginTop: '5px', marginBottom: '0' }}>
                      <li>Network downtime</li>
                      <li>Reduced effectiveness of the organization's functions</li>
                      <li>Expenditures of time and effort to recover the enabler.</li>
                    </ul>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center' }}>5</td>
                  <td style={{ padding: '8px', border: '1px solid #000' }}>Critical</td>
                  <td style={{ padding: '8px', border: '1px solid #000' }}>Extended outage and/or loss of connectivity and/or compromise of large amounts of data or services/or permanent shutdown and/or complete compromise of the organization</td>
                </tr>
              </tbody>
            </table>
            <div style={{ position: 'absolute', bottom: '20px', right: '40px', fontSize: '12px' }}>
              {organizationName} Internal Purpose<br />
              Page | 6
            </div>
          </div>

          {/* Risk Value Matrix and Additional Content */}
          <div style={{ marginBottom: '50px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>7.3 Effectiveness of Current/Mitigating Controls</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f2c999' }}>
                  <th style={{ padding: '8px', border: '1px solid #000' }}>S.No.</th>
                  <th style={{ padding: '8px', border: '1px solid #000' }}>Description</th>
                  <th style={{ padding: '8px', border: '1px solid #000' }}>Control Rating</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center' }}>1</td>
                  <td style={{ padding: '8px', border: '1px solid #000' }}>Controls are not implemented, and threat will materialize</td>
                  <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center' }}>1</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center' }}>2</td>
                  <td style={{ padding: '8px', border: '1px solid #000' }}>Controls are implemented partially and can be exploited by the threat</td>
                  <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center' }}>2</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center' }}>3</td>
                  <td style={{ padding: '8px', border: '1px solid #000' }}>Controls are guaranteed to function effectively at every instance of occurrence of the threat</td>
                  <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center' }}>3</td>
                </tr>
              </tbody>
            </table>

            <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>7.4 Risk Value Matrix</h3>
            <div style={{ marginBottom: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f2c999' }}>
                    <th style={{ padding: '8px', border: '1px solid #000' }}>Impact</th>
                    <th style={{ padding: '8px', border: '1px solid #000' }}>Rare (1)</th>
                    <th style={{ padding: '8px', border: '1px solid #000' }}>Unlikely (2)</th>
                    <th style={{ padding: '8px', border: '1px solid #000' }}>Occasional (3)</th>
                    <th style={{ padding: '8px', border: '1px solid #000' }}>Likely (4)</th>
                    <th style={{ padding: '8px', border: '1px solid #000' }}>Almost Certain (5)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px', border: '1px solid #000', fontWeight: 'bold' }}>Limited (1)</td>
                    <td style={{ padding: '8px', border: '1px solid #000', backgroundColor: '#90EE90', textAlign: 'center' }}>1</td>
                    <td style={{ padding: '8px', border: '1px solid #000', backgroundColor: '#90EE90', textAlign: 'center' }}>2</td>
                    <td style={{ padding: '8px', border: '1px solid #000', backgroundColor: '#90EE90', textAlign: 'center' }}>3</td>
                    <td style={{ padding: '8px', border: '1px solid #000', backgroundColor: '#90EE90', textAlign: 'center' }}>4</td>
                    <td style={{ padding: '8px', border: '1px solid #000', backgroundColor: '#90EE90', textAlign: 'center' }}>5</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', border: '1px solid #000', fontWeight: 'bold' }}>Low (2)</td>
                    <td style={{ padding: '8px', border: '1px solid #000', backgroundColor: '#90EE90', textAlign: 'center' }}>2</td>
                    <td style={{ padding: '8px', border: '1px solid #000', backgroundColor: '#90EE90', textAlign: 'center' }}>4</td>
                    <td style={{ padding: '8px', border: '1px solid #000', backgroundColor: '#FFFF00', textAlign: 'center' }}>6</td>
                    <td style={{ padding: '8px', border: '1px solid #000', backgroundColor: '#FFFF00', textAlign: 'center' }}>8</td>
                    <td style={{ padding: '8px', border: '1px solid #000', backgroundColor: '#FFFF00', textAlign: 'center' }}>10</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', border: '1px solid #000', fontWeight: 'bold' }}>Moderate (3)</td>
                    <td style={{ padding: '8px', border: '1px solid #000', backgroundColor: '#90EE90', textAlign: 'center' }}>3</td>
                    <td style={{ padding: '8px', border: '1px solid #000', backgroundColor: '#FFFF00', textAlign: 'center' }}>6</td>
                    <td style={{ padding: '8px', border: '1px solid #000', backgroundColor: '#FFFF00', textAlign: 'center' }}>9</td>
                    <td style={{ padding: '8px', border: '1px solid #000', backgroundColor: '#FFFF00', textAlign: 'center' }}>12</td>
                    <td style={{ padding: '8px', border: '1px solid #000', backgroundColor: '#FF0000', textAlign: 'center', color: 'white' }}>15</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', border: '1px solid #000', fontWeight: 'bold' }}>High (4)</td>
                    <td style={{ padding: '8px', border: '1px solid #000', backgroundColor: '#90EE90', textAlign: 'center' }}>4</td>
                    <td style={{ padding: '8px', border: '1px solid #000', backgroundColor: '#FFFF00', textAlign: 'center' }}>8</td>
                    <td style={{ padding: '8px', border: '1px solid #000', backgroundColor: '#FFFF00', textAlign: 'center' }}>12</td>
                    <td style={{ padding: '8px', border: '1px solid #000', backgroundColor: '#FF0000', textAlign: 'center', color: 'white' }}>16</td>
                    <td style={{ padding: '8px', border: '1px solid #000', backgroundColor: '#FF0000', textAlign: 'center', color: 'white' }}>20</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', border: '1px solid #000', fontWeight: 'bold' }}>Critical (5)</td>
                    <td style={{ padding: '8px', border: '1px solid #000', backgroundColor: '#90EE90', textAlign: 'center' }}>5</td>
                    <td style={{ padding: '8px', border: '1px solid #000', backgroundColor: '#FFFF00', textAlign: 'center' }}>10</td>
                    <td style={{ padding: '8px', border: '1px solid #000', backgroundColor: '#FF0000', textAlign: 'center', color: 'white' }}>15</td>
                    <td style={{ padding: '8px', border: '1px solid #000', backgroundColor: '#FF0000', textAlign: 'center', color: 'white' }}>20</td>
                    <td style={{ padding: '8px', border: '1px solid #000', backgroundColor: '#FF0000', textAlign: 'center', color: 'white' }}>25</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>7.5 Risk Rating</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f2c999' }}>
                  <th style={{ padding: '8px', border: '1px solid #000' }}>Numerical Rating</th>
                  <th style={{ padding: '8px', border: '1px solid #000' }}>Qualitative Rating</th>
                  <th style={{ padding: '8px', border: '1px solid #000' }}>Range</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center' }}>1</td>
                  <td style={{ padding: '8px', border: '1px solid #000', backgroundColor: '#90EE90', textAlign: 'center' }}>Low</td>
                  <td style={{ padding: '8px', border: '1px solid #000' }}>1-5</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center' }}>2</td>
                  <td style={{ padding: '8px', border: '1px solid #000', backgroundColor: '#FFFF00', textAlign: 'center' }}>Medium</td>
                  <td style={{ padding: '8px', border: '1px solid #000' }}>6-12</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center' }}>3</td>
                  <td style={{ padding: '8px', border: '1px solid #000', backgroundColor: '#FF0000', textAlign: 'center', color: 'white' }}>High</td>
                  <td style={{ padding: '8px', border: '1px solid #000' }}>15-25</td>
                </tr>
              </tbody>
            </table>

            <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>7.6 Risk Assessment Template</h3>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ marginRight: '10px', display: 'inline-flex', alignItems: 'center', border: '1px solid #ccc', padding: '5px', borderRadius: '3px' }}>
                <div style={{ width: '16px', height: '16px', backgroundColor: '#1D6F42', marginRight: '5px' }}></div>
                <span>BCMS_Risk Assessment_Template.xlsx</span>
              </div>
              <button 
                style={{ 
                  backgroundColor: '#FFD700', 
                  border: 'none', 
                  padding: '5px 10px', 
                  borderRadius: '3px', 
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Download
              </button>
            </div>

            {useLLMContent && Object.keys(llmContent.riskValueMatrix).length > 0 && (
              <>
                <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>7.7 AI-Generated Risk Value Matrix</h3>
                <div style={{ marginBottom: '20px' }}>
                  {Object.entries(llmContent.riskValueMatrix).map(([riskType, matrix]) => (
                    <div key={riskType} style={{ marginBottom: '15px', border: '1px solid #ddd', padding: '10px', borderRadius: '5px' }}>
                      <h4 style={{ fontSize: '14px', marginBottom: '10px', color: '#333' }}>{riskType} Risk</h4>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f5f5f5' }}>
                            <th style={{ padding: '5px', border: '1px solid #ddd' }}>Duration</th>
                            <th style={{ padding: '5px', border: '1px solid #ddd' }}>Risk Level</th>
                            <th style={{ padding: '5px', border: '1px solid #ddd' }}>Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(matrix).map(([duration, value]) => {
                            let riskLevel = value;
                            let reason = '';
                            if (typeof value === 'object' && value !== null) {
                              riskLevel = value.impact_severity ?? '';
                              reason = value.reason ?? '';
                            }
                            return (
                              <tr key={duration}>
                                <td style={{ padding: '5px', border: '1px solid #ddd' }}>{duration}</td>
                                <td style={{ padding: '5px', border: '1px solid #ddd' }}>{riskLevel}</td>
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

            {useLLMContent && Object.keys(llmContent.controlEffectiveness).length > 0 && (
              <>
                <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>7.8 AI-Generated Control Effectiveness</h3>
                <div style={{ marginBottom: '20px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f5f5f5' }}>
                        <th style={{ padding: '8px', border: '1px solid #ddd' }}>Control Type</th>
                        <th style={{ padding: '8px', border: '1px solid #ddd' }}>Effectiveness Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(llmContent.controlEffectiveness).map(([controlType, rating]) => (
                        <tr key={controlType}>
                          <td style={{ padding: '8px', border: '1px solid #ddd' }}>{controlType}</td>
                          <td style={{ padding: '8px', border: '1px solid #ddd' }}>{rating}</td>
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
            
            <div style={{ position: 'absolute', bottom: '20px', right: '40px', fontSize: '12px' }}>
              {organizationName} Internal Purpose<br />
              Page | 7
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskAssessmentProcedure;
