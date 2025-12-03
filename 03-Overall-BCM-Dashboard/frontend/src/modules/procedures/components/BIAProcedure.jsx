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
 * BIA Procedure Component
 * Displays and allows editing of the BIA procedure document
 */
const BIAProcedure = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [criticalityThreshold, setCriticalityThreshold] = useState('12'); // Initialize with default value as string
  const [organizationName, setOrganizationName] = useState('Your Organization');
  const [organizationId, setOrganizationId] = useState(null);
  const [documentInfo, setDocumentInfo] = useState({
    documentName: 'BCMS BIA Procedure',
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
    impactParameters: [],
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

  // Function to generate LLM content for BIA procedure
  const generateLLMContent = async () => {
    if (!organizationName) {
      setLlmError('Organization name is required to generate LLM content');
      return;
    }

    setIsLoadingLLM(true);
    setLlmError(null);

    try {
      // Generate introduction
      const introResponse = await getAIDescription('process', 'BIA Procedure');
      const intro = introResponse.description || '';

      // Generate scope
      const scopeResponse = await getAIDescription('process', 'Business Impact Analysis Scope');
      const scope = scopeResponse.description || '';

      // Generate objective
      const objectiveResponse = await getAIDescription('process', 'BIA Objective');
      const objective = objectiveResponse.description || '';

      // Generate methodology
      const methodologyResponse = await getAIDescription('process', 'BIA Methodology');
      const methodology = methodologyResponse.description || '';

      // Get impact scale matrix for different impact types
      const impactTypes = ['Financial', 'Operational', 'Reputational', 'Legal and Regulatory', 'Customer', 'Wellbeing'];
      const impactScaleMatrix = {};
      
      for (const impactType of impactTypes) {
        try {
          const matrixResponse = await getImpactScaleMatrix('Business Process', impactType);
          impactScaleMatrix[impactType] = matrixResponse.impact_scale_matrix || {};
        } catch (error) {
          console.warn(`Failed to get impact scale matrix for ${impactType}:`, error);
        }
      }

      // Get peak periods for different departments
      const departments = ['Human Resources', 'IT', 'Finance', 'Operations'];
      const peakPeriods = {};
      
      for (const dept of departments) {
        try {
          const peakResponse = await getAIPeakPeriod(dept, 'Critical Process', 'Technology');
          peakPeriods[dept] = peakResponse.peak_period || '';
        } catch (error) {
          console.warn(`Failed to get peak period for ${dept}:`, error);
        }
      }

      setLlmContent({
        introduction: intro,
        scope: scope,
        objective: objective,
        methodology: methodology,
        processFlow: 'The BIA process follows a structured sequence of steps to ensure consistency and completeness in assessing business impacts.',
        rolesResponsibilities: 'This section outlines the key stakeholders and their respective duties throughout the BIA lifecycle.',
        reviewFrequency: 'BIA is to be conducted annually for all identified departments and/or as and when there is major change in operations.',
        impactParameters: impactTypes,
        criticalProcesses: ['Employee Onboarding', 'Financial Reporting', 'Customer Service', 'IT Infrastructure'],
        peakPeriods: peakPeriods,
        impactScaleMatrix: impactScaleMatrix
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
      link.setAttribute('download', `${organizationName}_Impact_Matrix.csv`);
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
    
    const element = document.getElementById('bia-procedure-document');
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
        filename: `${orgName}_BIA_Procedure.pdf`,
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
        <h2 style={{ color: '#FFD700' }}>Loading BIA Procedure...</h2>
        <div style={{ marginTop: '20px' }}>Please wait while we fetch the latest data for your organization...</div>
      </div>
    );
  }

  if (error && !isEditing) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: '#FFD700' }}>Error Loading BIA Procedure</h2>
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
        <h1 style={{ color: '#FFD700' }}>BIA Procedure for {organizationName}</h1>
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
        <div id="bia-procedure-document" style={{ background: '#fff', color: '#000', padding: '40px', borderRadius: '5px' }}>
          {/* Cover Page */}
          <div style={{ textAlign: 'center', marginBottom: '50px', pageBreakAfter: 'always' }}>
            <div style={{ marginBottom: '100px' }}>
              {organizationName} Logo
            </div>
            <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>{organizationName} BCMS BIA Procedure</h1>
            <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>(2025-26)</h2>
            <p style={{ fontSize: '16px' }}>Version {documentInfo.documentVersionNo}</p>
            <div style={{ position: 'absolute', bottom: '20px', right: '40px', fontSize: '12px' }}>
              {organizationName} Internal Purpose<br />
              Page | 1
            </div>
          </div>

          {/* Table of Contents */}
          <div style={{ marginBottom: '50px', pageBreakAfter: 'always' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Table of Contents</h2>
            <div>
              <p>1. Introduction ............................................................................................................. 4</p>
              <p>2. Scope ..................................................................................................................... 4</p>
              <p>3. Objective ................................................................................................................ 4</p>
              <p>4. BIA Methodology .................................................................................................... 5</p>
              <p>5. Process Flow ........................................................................................................... 6</p>
              <p>6. Roles and Responsibilities ....................................................................................... 7</p>
              <p>7. Review Frequency ................................................................................................... 8</p>
              <p>8. Annexure ................................................................................................................ 8</p>
              <p>8.1 BIA Impact Matrix ................................................................................................. 8</p>
              <p>8.2 BIA Template ........................................................................................................ 8</p>
              {useLLMContent && (
                <>
                  <p>8.3 AI-Generated Impact Scale Matrix ................................................................... 9</p>
                  <p>8.4 AI-Predicted Peak Periods ............................................................................. 9</p>
                </>
              )}
            </div>
            <div style={{ position: 'absolute', bottom: '20px', right: '40px', fontSize: '12px' }}>
              {organizationName} Internal Purpose<br />
              Page | 2
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
              Page | 3
            </div>
          </div>

          {/* Introduction, Scope, Objective */}
          <div style={{ marginBottom: '50px', pageBreakAfter: 'always' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>1. Introduction</h2>
            <p style={{ marginBottom: '15px', lineHeight: '1.5' }}>
              {useLLMContent && llmContent.introduction ? 
                llmContent.introduction :
                `This Business Impact Analysis (BIA) Procedure outlines ${organizationName}'s standardized approach to
                identifying critical business functions, evaluating the potential impact of disruptions, and
                determining recovery priorities. An impact matrix with defined impact parameters and
                threshold is used to evaluate disruptions and establish recovery timelines (RTO and MTPD),
                as outlined in the BIA process flow template.`
              }
            </p>
            <p style={{ marginBottom: '25px', lineHeight: '1.5' }}>
              Applicable to all in-scope departments and functions of {organizationName}, this procedure ensures consistency,
              alignment with ISO 22301:2019
            </p>

            <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>2. Scope</h2>
            <p style={{ marginBottom: '25px', lineHeight: '1.5' }}>
              {useLLMContent && llmContent.scope ? 
                llmContent.scope :
                `This procedure applies to all critical business units, processes, systems, and supporting
                functions that fall within the scope of ${organizationName}'s Business Continuity Management System
                (BCMS). It covers the end-to-end process of conducting a Business Impact Analysis, from
                identifying key activities to assessing impacts and determining recovery priorities.`
              }
            </p>

            <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>3. Objective</h2>
            <p style={{ marginBottom: '15px', lineHeight: '1.5' }}>
              {useLLMContent && llmContent.objective ? 
                llmContent.objective :
                `The objective of this procedure is to provide a structured approach for identifying critical
                business functions, assessing the potential impact of their disruption, and determining
                acceptable recovery timeframes.`
              }
            </p>
            <p style={{ marginBottom: '15px', lineHeight: '1.5' }}>
              The primary purpose of the BIA activity is to:
            </p>
            <ol type="a" style={{ marginLeft: '20px', lineHeight: '1.5' }}>
              <li style={{ marginBottom: '10px' }}>
                Identify the critical processes of each department of {organizationName} within the scope of the
                BCMS.
              </li>
              <li style={{ marginBottom: '10px' }}>
                Identify resources and mapping of interdependencies that are critical to the
                delivery of such processes such as, Technology, Premises & Infrastructure, People
                & Skills, Critical Records, Key Equipment, Third Party Vendor, Activity Dependency.
              </li>
              <li style={{ marginBottom: '10px' }}>
                Assess the impact of a disruption with respect to time for Financial, Operational,
                Regulatory, Reputational, Customer and Technology parameters.
              </li>
              <li style={{ marginBottom: '10px' }}>
                Establish the MTPD, MBCO (Minimum Business Critical Objective) and RTO for each
                activity, by identifying failure points, taking account of the time needed to
                implement recovery without breaching the MTPD.
              </li>
              <li style={{ marginBottom: '10px' }}>
                Categorize department activities based on their agreed RTO.
              </li>
              <li style={{ marginBottom: '10px' }}>
                Understand key threats, resource vulnerabilities, and potential impact of
                disruptions.
              </li>
            </ol>
            <div style={{ position: 'absolute', bottom: '20px', right: '40px', fontSize: '12px' }}>
              {organizationName} Internal Purpose<br />
              Page | 4
            </div>
          </div>

          {/* BIA Methodology */}
          <div style={{ marginBottom: '50px', pageBreakAfter: 'always' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>4. BIA Methodology</h2>
            <p style={{ marginBottom: '15px', lineHeight: '1.5' }}>
              {useLLMContent && llmContent.methodology ? 
                llmContent.methodology :
                `Each department within ${organizationName} is required to assess the most severe yet plausible disruption scenario that
                could impact their critical processes. This assessment is essential for understanding the
                potential consequences and identifying appropriate recovery requirements.`
              }
            </p>
            <p style={{ marginBottom: '15px', lineHeight: '1.5' }}>
              An Impact Assessment Matrix is used to evaluate the severity of such disruptions. The matrix
              includes clearly defined impact parameters and threshold levels, which serve as the basis
              for determining:
            </p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.5' }}>
              <li style={{ marginBottom: '10px' }}>
                Recovery Time Objective (RTO) – the maximum acceptable time to restore a process
                after a disruption. It is calculated as per the rating when the impact goes to "major"
                rating.
              </li>
              <li style={{ marginBottom: '10px' }}>
                Maximum Tolerable Period of Disruption (MTPD) – the maximum time a process can
                be unavailable before significantly jeopardizing {organizationName}. Next duration of RTO shall
                be considered as MTPD
              </li>
            </ul>
            <p style={{ marginBottom: '15px', lineHeight: '1.5' }}>
              Process managers will perform the impact assessment of business processes identified in
              process to enable mapping phase considering the impact on following parameter:
            </p>
            <ol type="I" style={{ marginLeft: '20px', lineHeight: '1.5' }}>
              <li style={{ marginBottom: '5px' }}>Financial</li>
              <li style={{ marginBottom: '5px' }}>Operational</li>
              <li style={{ marginBottom: '5px' }}>Reputational</li>
              <li style={{ marginBottom: '5px' }}>Legal and Regulatory Impact</li>
              <li style={{ marginBottom: '5px' }}>Customer Impact</li>
              <li style={{ marginBottom: '5px' }}>Wellbeing, Health and Safety</li>
            </ol>
            <p style={{ marginBottom: '15px', lineHeight: '1.5', marginTop: '15px' }}>
              The above parameters will drive decisions regarding business process to be categorized as
              critical. It is important to note that all business processes will be recovered after a period of
              time but the critical pro. Processes Criticality will be defined based on Impact Rating
            </p>
            <p style={{ marginBottom: '10px', lineHeight: '1.5' }}>
              Critical Process: Any process with RTO less than or equal to {criticalityThreshold} Hours will be considered
              critical.
            </p>
            <p style={{ marginBottom: '15px', lineHeight: '1.5' }}>
              Non-Critical Process: Any process with RTO more than {criticalityThreshold} Hours will be considered non-critical
            </p>
            <p style={{ marginBottom: '15px', lineHeight: '1.5' }}>
              BIA Matrix/Scale is attached in the annexure.
            </p>
            <div style={{ position: 'absolute', bottom: '20px', right: '40px', fontSize: '12px' }}>
              {organizationName} Internal Purpose<br />
              Page | 5
            </div>
          </div>

          {/* General Assumptions */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>General Assumptions for Business Impact Assessments:</h3>
            <ol type="a" style={{ marginLeft: '20px', lineHeight: '1.5' }}>
              <li style={{ marginBottom: '10px' }}>Process outage happening as the worst-case scenario</li>
              <li style={{ marginBottom: '10px' }}>
                No current redundancies of recovery for the process as such, these assumptions support
                in determining the required timelines for response and recovery mechanism to be
                developed in case of any disruption.
              </li>
            </ol>
          </div>

          {/* Process Flow */}
          <div style={{ marginBottom: '50px', pageBreakAfter: 'always' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>5. Process Flow</h2>
            <p style={{ marginBottom: '15px', lineHeight: '1.5' }}>
              The BIA process follows a structured sequence of steps to ensure consistency and
              completeness in assessing business impacts at {organizationName}. Below is the outline of the end-to-end workflow,
              from initiation to documentation and approval.
            </p>
            
            <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '20px', textAlign: 'center' }}>
              {/* Flowchart visualization */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', gap: '10px' }}>
                  <div style={{ border: '1px solid #FFD700', padding: '5px 10px', borderRadius: '5px', backgroundColor: '#f9f9f9', minWidth: '120px' }}>Start</div>
                  <div style={{ border: '1px solid #FFD700', padding: '5px 10px', borderRadius: '5px', backgroundColor: '#f9f9f9', minWidth: '120px' }}>Develop or re-validate an impact matrix</div>
                  <div style={{ border: '1px solid #FFD700', padding: '5px 10px', borderRadius: '5px', backgroundColor: '#f9f9f9', minWidth: '120px' }}>Plan BIA activity in collaboration with Department Head</div>
                  <div style={{ border: '1px solid #FFD700', padding: '5px 10px', borderRadius: '5px', backgroundColor: '#f9f9f9', minWidth: '120px' }}>Develop or re-validate the existing processes and include the newly introduced business processes</div>
                </div>
                
                <div style={{ fontSize: '20px', marginTop: '-5px', marginBottom: '-5px' }}>↓</div>
                
                <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', gap: '10px' }}>
                  <div style={{ border: '1px solid #FFD700', padding: '5px 10px', borderRadius: '5px', backgroundColor: '#f9f9f9', minWidth: '120px' }}>Identify Key resources and dependencies</div>
                  <div style={{ border: '1px solid #FFD700', padding: '5px 10px', borderRadius: '5px', backgroundColor: '#f9f9f9', minWidth: '120px' }}>Determine the process RTO and MTPD</div>
                  <div style={{ border: '1px solid #FFD700', padding: '5px 10px', borderRadius: '5px', backgroundColor: '#f9f9f9', minWidth: '120px' }}>Perform BIA using predefined template</div>
                  <div style={{ border: '1px solid #FFD700', padding: '5px 10px', borderRadius: '5px', backgroundColor: '#f9f9f9', minWidth: '120px' }}>Determine critical and non-critical processes</div>
                </div>
                
                <div style={{ fontSize: '20px', marginTop: '-5px', marginBottom: '-5px' }}>↓</div>
                
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', width: '100%' }}>
                  <div style={{ border: '1px solid #FFD700', padding: '5px 10px', borderRadius: '5px', backgroundColor: '#f9f9f9', minWidth: '120px' }}>Document the BIA</div>
                  <div style={{ border: '1px solid #FFD700', padding: '5px 10px', borderRadius: '5px', backgroundColor: '#f9f9f9', width: '150px', height: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <div>Validate BIA with department head</div>
                    <div style={{ marginTop: '10px', display: 'flex', gap: '20px' }}>
                      <div>Yes →</div>
                      <div>No ↓</div>
                    </div>
                  </div>
                  <div style={{ border: '1px solid #FFD700', padding: '5px 10px', borderRadius: '5px', backgroundColor: '#f9f9f9', minWidth: '120px' }}>Consolidate the BIA results of all the departments</div>
                  <div style={{ border: '1px solid #FFD700', padding: '5px 10px', borderRadius: '5px', backgroundColor: '#f9f9f9', minWidth: '120px' }}>Update recovery strategies of respective departments</div>
                </div>
                
                <div style={{ fontSize: '20px', marginTop: '10px' }}>↓</div>
                
                <div style={{ border: '1px solid #FFD700', padding: '5px 10px', borderRadius: '5px', backgroundColor: '#f9f9f9', minWidth: '120px' }}>Stop</div>
              </div>
            </div>
            
            <div style={{ position: 'absolute', bottom: '20px', right: '40px', fontSize: '12px' }}>
              {organizationName} Internal Purpose<br />
              Page | 6
            </div>
          </div>

          {/* Roles and Responsibilities */}
          <div style={{ marginBottom: '50px', pageBreakAfter: 'always' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>6. Roles and Responsibilities</h2>
            <p style={{ marginBottom: '20px', lineHeight: '1.5' }}>
              This section outlines the key stakeholders involved at {organizationName} and their respective duties throughout the
              BIA lifecycle.
            </p>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f2c999' }}>
                  <th style={{ padding: '10px', border: '1px solid #000', width: '10%' }}>Step #</th>
                  <th style={{ padding: '10px', border: '1px solid #000', width: '60%' }}>Activity</th>
                  <th style={{ padding: '10px', border: '1px solid #000', width: '30%' }}>Activity Owner</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '10px', border: '1px solid #000', textAlign: 'center' }}>1</td>
                  <td style={{ padding: '10px', border: '1px solid #000' }}>
                    Develop an impact matrix with impact parameters and the criteria to define the impact.
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #000' }}>HO BCM Team</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px', border: '1px solid #000', textAlign: 'center' }}>2</td>
                  <td style={{ padding: '10px', border: '1px solid #000' }}>
                    Plan the BIA activity for respective departments, in collaboration with the Department Head.
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #000' }}>Department BCM team – BCM Champion</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px', border: '1px solid #000', textAlign: 'center' }}>3</td>
                  <td style={{ padding: '10px', border: '1px solid #000' }}>
                    Develop or re-validate the existing processes and include the newly introduced business processes in the business processes list.
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #000' }}>Department BCM team – BCM Champion</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px', border: '1px solid #000', textAlign: 'center' }}>4</td>
                  <td style={{ padding: '10px', border: '1px solid #000' }}>
                    BCM Champion of respective department to segregate the consolidated list of processes into critical and non- critical in discussion with the critical resources and department head.
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #000' }}>Department BCM team – BCM Champion</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px', border: '1px solid #000', textAlign: 'center' }}>5</td>
                  <td style={{ padding: '10px', border: '1px solid #000' }}>
                    The pre-developed BIA templates shall be used to perform the BIA during the discussion with the department. For each critical business process, consider the worst-case scenario to determine the impact of business process unavailability.
                    <br /><br />
                    Utilize impact criteria defined in the Impact Matrix for determining the impact over various time intervals.
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #000' }}>Department BCM team – BCM Champion</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px', border: '1px solid #000', textAlign: 'center' }}>6</td>
                  <td style={{ padding: '10px', border: '1px solid #000' }}>
                    Based on the inputs from the department regarding the impact, the Maximum Tolerable Period of Disruption (MTPD) and the Recovery Time Objective (RTO) will be calculated automatically in the BIA template.
                    <br /><br />
                    RTO: - First occurrence of 3 or when the rating goes to moderate.
                    <br />
                    MTPD: - Second occurrence of 3 is the MTPD.
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #000' }}>Department BCM team – BCM Champion</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px', border: '1px solid #000', textAlign: 'center' }}>7</td>
                  <td style={{ padding: '10px', border: '1px solid #000' }}>
                    Identify the details of the key resources (such as equipment, people, premises, technology etc.) and dependencies (internal and external dependencies) that are required for critical processes to be functional. The external dependencies include third-party suppliers.
                    <br /><br />
                    Department to determine the list of applications/technologies required for the critical processes.
                    <br /><br />
                    Department / staff to determine a point in time at which loss of data becomes unacceptable. This is called the Recovery Point Objective (RPO).
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #000' }}>Department BCM team – BCM Champion</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px', border: '1px solid #000', textAlign: 'center' }}>8</td>
                  <td style={{ padding: '10px', border: '1px solid #000' }}>
                    Document the BIA based on the template.
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #000' }}>Department BCM team – BCM Champion</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px', border: '1px solid #000', textAlign: 'center' }}>9</td>
                  <td style={{ padding: '10px', border: '1px solid #000' }}>
                    Validate the BIA results for the department with department head. Review and approve the BIA
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #000' }}>Department BCM team – Head of Department</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px', border: '1px solid #000', textAlign: 'center' }}>10</td>
                  <td style={{ padding: '10px', border: '1px solid #000' }}>
                    Consolidate the BIA results of all departments within {organizationName}.
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #000' }}>HO BCM Team</td>
                </tr>
              </tbody>
            </table>

            <div style={{ position: 'absolute', bottom: '20px', right: '40px', fontSize: '12px' }}>
              {organizationName} Internal Purpose<br />
              Page | 7
            </div>
          </div>

          {/* Review Frequency */}
          <div style={{ marginBottom: '50px', pageBreakAfter: 'always' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>7. Review Frequency</h2>
            <p style={{ marginBottom: '15px', lineHeight: '1.5' }}>
              {useLLMContent && llmContent.reviewFrequency ? 
                llmContent.reviewFrequency :
                `BIA is to be conducted annually for all the identified department and/or as and when there is
                major change in the operations and the products/services offered by the department and/or as
                mandated by the regulators.`
              }
            </p>
            
            <div style={{ position: 'absolute', bottom: '20px', right: '40px', fontSize: '12px' }}>
              {organizationName} Internal Purpose<br />
              Page | 8
            </div>
          </div>

          {/* Annexure */}
          <div style={{ marginBottom: '50px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>8. Annexure</h2>
            
            <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>8.1 BIA Impact Matrix</h3>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ marginRight: '10px', display: 'inline-flex', alignItems: 'center', border: '1px solid #ccc', padding: '5px', borderRadius: '3px' }}>
                <div style={{ width: '16px', height: '16px', backgroundColor: '#1D6F42', marginRight: '5px' }}></div>
                <span>Impact Matrix.xlsx</span>
              </div>
              <button 
                style={{ 
                  backgroundColor: '#FFD700', 
                  border: 'none', 
                  padding: '5px 10px', 
                  borderRadius: '3px', 
                  cursor: isLoadingMatrix ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  opacity: isLoadingMatrix ? 0.7 : 1
                }}
                onClick={exportImpactMatrixToCSV}
                disabled={isLoadingMatrix || !impactMatrixData}
              >
                {isLoadingMatrix ? 'Loading...' : 'Download CSV'}
              </button>
            </div>
            {matrixError && (
              <div style={{ color: 'red', marginBottom: '10px', fontSize: '14px' }}>
                {matrixError}
              </div>
            )}
            
            <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>8.2 BIA Template</h3>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ marginRight: '10px', display: 'inline-flex', alignItems: 'center', border: '1px solid #ccc', padding: '5px', borderRadius: '3px' }}>
                <div style={{ width: '16px', height: '16px', backgroundColor: '#1D6F42', marginRight: '5px' }}></div>
                <span>BIA Template.xlsx</span>
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

            {useLLMContent && Object.keys(llmContent.impactScaleMatrix).length > 0 && (
              <>
                <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>8.3 AI-Generated Impact Scale Matrix</h3>
                <div style={{ marginBottom: '20px' }}>
                  {Object.entries(llmContent.impactScaleMatrix).map(([impactType, matrix]) => (
                    <div key={impactType} style={{ marginBottom: '15px', border: '1px solid #ddd', padding: '10px', borderRadius: '5px' }}>
                      <h4 style={{ fontSize: '14px', marginBottom: '10px', color: '#333' }}>{impactType} Impact</h4>
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
                <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>8.4 AI-Predicted Peak Periods</h3>
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
            
            <div style={{ position: 'absolute', bottom: '20px', right: '40px', fontSize: '12px' }}>
              {organizationName} Internal Purpose<br />
              Page | 9
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BIAProcedure;