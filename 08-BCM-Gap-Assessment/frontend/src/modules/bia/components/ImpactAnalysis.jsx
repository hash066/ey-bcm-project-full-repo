import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/BIAStyles.css';
import { getImpactScaleMatrix, getBIAProcesses, getOrganizationCriticality, sendProcessToLLM, saveImpactAnalysis, saveBulkImpactAnalysis } from '../services/biaService';
import { jwtDecode } from 'jwt-decode';

const ImpactAnalysis = () => {
  const navigate = useNavigate();
  
  const [lastUpdated, setLastUpdated] = useState('');
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [organizationId, setOrganizationId] = useState('');
  const [departmentInfo, setDepartmentInfo] = useState({
    departmentName: '',
    subdepartmentName: ''
  });
  const [criticalityThreshold, setCriticalityThreshold] = useState(null);
  const [criticalityLoading, setCriticalityLoading] = useState(true);
  const [criticalityError, setCriticalityError] = useState(null);
  const [processLLMStatus, setProcessLLMStatus] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  // Impact types
  const impactTypes = [
    'Financial Impact',
    'Operational Impact',
    'Legal and Regulatory Impact',
    'Reputational Impact',
    'Customer Impact'
  ];
  
  // Time periods for RTO assessment
  const timePeriods = [
    'Up to 1 hour',
    'Up to 4 hours',
    'Up to 8 hours',
    'Up to 12 hours',
    'Up to 24 hours',
    'Up to 48 hours',
    'Up to 72 hours',
    'More than 1 week'
  ];

  // Impact severity levels
  const severityLevels = [
    { value: 0, label: 'No Impact' },
    { value: 1, label: 'Minor' },
    { value: 2, label: 'Moderate' },
    { value: 3, label: 'Major' },
    { value: 4, label: 'Severe' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get token and extract organization ID
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('No token found');
        }
        
        const decodedToken = jwtDecode(token);
        const orgId = decodedToken.organization_id;
        setOrganizationId(orgId);
        
        // Get BIA information from localStorage
        const biaInfo = localStorage.getItem('biaInformation');
        if (!biaInfo) {
          throw new Error('No BIA information found');
        }
        
        const parsedBiaInfo = JSON.parse(biaInfo);
        setDepartmentInfo({
          departmentName: parsedBiaInfo.departmentName || '',
          subdepartmentName: parsedBiaInfo.subdepartmentName || ''
        });
        
        // Fetch organization criticality threshold
        try {
          console.log(`Fetching criticality threshold for organization ${orgId}`);
          setCriticalityLoading(true);
          const response = await getOrganizationCriticality(orgId);
          console.log('Criticality threshold response:', response);
          
          // The response might be a string or an object with a criticality property
          let criticalityValue;
          if (typeof response === 'string') {
            // If the response is directly a string
            criticalityValue = response;
          } else if (response && typeof response === 'object') {
            // If the response is an object with a criticality property
            criticalityValue = response.criticality;
          }
          
          console.log('Extracted criticality value:', criticalityValue);
          
          // Convert the criticality value to a number
          const threshold = parseInt(criticalityValue, 10);
          setCriticalityThreshold(isNaN(threshold) ? null : threshold);
          setCriticalityLoading(false);
        } catch (critErr) {
          console.error('Error fetching criticality:', critErr);
          setCriticalityError(critErr.message);
          setCriticalityLoading(false);
        }
        
        // Fetch processes from API
        const processesResponse = await getBIAProcesses(
          orgId,
          parsedBiaInfo.departmentName || '',
          parsedBiaInfo.subdepartmentName || ''
        );
        
        // Initialize processes with impact types
        const initializedProcesses = processesResponse.map(process => {
          const processImpacts = {};
          impactTypes.forEach(impactType => {
            processImpacts[impactType] = {
              selected: null,
              comment: '',
              rto: '',
              impactScores: {},
              isLoading: false,
              error: null
            };
          });
          
          return {
            ...process,
            impacts: processImpacts
          };
        });
        
        setProcesses(initializedProcesses);
        
        // Set last updated timestamp
        const now = new Date();
        const formattedDate = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}, ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')} ${now.getHours() >= 12 ? 'pm' : 'am'}`;
        setLastUpdated(formattedDate);
        setLoading(false);
        
        // Don't automatically fetch impact data for all processes
        // This will now only happen when the user clicks the LLM Analysis button
      } catch (err) {
        console.error('Error initializing Impact Analysis:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Fetch impact data for all processes and impact types
  const fetchAllImpactData = async (processesList) => {
    // Use the passed processesList parameter instead of the state
    for (let processIndex = 0; processIndex < processesList.length; processIndex++) {
      const process = processesList[processIndex];
      for (const impactType of impactTypes) {
        // Pass the process object directly to avoid state timing issues
        await fetchImpactScaleMatrix(processIndex, impactType, process);
      }
    }
  };

  // Helper function to convert time period to hours for comparison
  const timeToHours = (timePeriod) => {
    if (timePeriod === 'Up to 1 hour') return 1;
    if (timePeriod === 'Up to 4 hours') return 4;
    if (timePeriod === 'Up to 8 hours') return 8;
    if (timePeriod === 'Up to 12 hours') return 12;
    if (timePeriod === 'Up to 24 hours') return 24;
    if (timePeriod === 'Up to 48 hours') return 48;
    if (timePeriod === 'Up to 72 hours') return 72;
    if (timePeriod === 'More than 1 week') return 168; // 7 days * 24 hours
    return null;
  };

  // Helper function to determine if a process is critical
  const getProcessCriticality = (process) => {
    if (criticalityLoading) return { status: 'loading', label: 'Loading...' };
    if (criticalityError) return { status: 'error', label: 'Error!' };
    if (criticalityThreshold === null) return { status: 'unknown', label: 'Unknown' };
    
    const rto = calculateRTO(process);
    if (rto === 'N/A') return { status: 'non-critical', label: 'Non-Critical' };
    
    const rtoHours = timeToHours(rto);
    if (rtoHours === null) return { status: 'unknown', label: 'Unknown' };
    
    return rtoHours <= criticalityThreshold ? { status: 'critical', label: 'Critical' } : { status: 'non-critical', label: 'Non-Critical' };
  };

  // Helper function to get impact severity level based on time period and impact scores
  const getImpactSeverity = (process, impactType, timeIndex) => {
    const impactData = process.impacts[impactType];
    if (!impactData.impactScores || Object.keys(impactData.impactScores).length === 0) {
      return null;
    }
    
    const timePeriodKey = timeIndex === 0 ? '1hr' : 
                         timeIndex === 1 ? '4hr' : 
                         timeIndex === 2 ? '8hr' : 
                         timeIndex === 3 ? '12hr' : 
                         timeIndex === 4 ? '24hr' : 
                         timeIndex === 5 ? '48hr' : 
                         timeIndex === 6 ? '72hr' : '1 week';
    
    // Parse the nested response format
    // Format: { impact_scale_matrix: { "Process Name": { "Impact Type": { "1hr": 1, ... } } } }
    const processName = process.name;
    const impactName = impactType.split(' ')[0]; // Extract first word (Financial, Operational, etc.)
    
    try {
      console.log(`Getting severity for ${processName}, ${impactName}, ${timePeriodKey}`, impactData.impactScores);
      
      // Check if we have the nested structure
      if (impactData.impactScores.impact_scale_matrix && 
          impactData.impactScores.impact_scale_matrix[processName] && 
          impactData.impactScores.impact_scale_matrix[processName][impactName]) {
        // Return the value from the nested structure
        const value = impactData.impactScores.impact_scale_matrix[processName][impactName][timePeriodKey];
        console.log(`Found nested value: ${value}`);
        return value || 0;
      }
      
      // Fallback to direct access if nested structure is not found
      console.log('Nested structure not found, using direct access');
      return impactData.impactScores[timePeriodKey] || 0;
    } catch (error) {
      console.error('Error parsing impact severity:', error);
      return 0;
    }
  };

  // Helper function to get cell background color based on severity
  const getCellColor = (severity) => {
    if (severity === null) return 'transparent';
    if (severity === 0) return '#ffffff'; // No impact - white
    if (severity === 1) return '#ccffcc'; // Minor - light green
    if (severity === 2) return '#ffffcc'; // Moderate - light yellow
    if (severity === 3) return '#ffcc99'; // Major - light orange
    if (severity === 4) return '#ffcccc'; // Severe - light red
    return 'transparent';
  };

  // Helper function to get background color for criticality
  const getCriticalityColor = (criticalityStatus) => {
    switch (criticalityStatus) {
      case 'critical': return '#8B0000'; // dark red
      case 'non-critical': return '#006400'; // dark green
      case 'loading':
      case 'error':
      case 'unknown':
      default: return '#555'; // gray
    }
  };

  // Helper function to calculate RTO (first occurrence of severity 3)
  const calculateRTO = (process) => {
    // Check all impact types for this process
    const allImpactSeverities = {};
    // For each impact type, find the first occurrence of severity 3 or higher
    impactTypes.forEach(impactType => {
      for (let timeIndex = 0; timeIndex < timePeriods.length; timeIndex++) {
        let severity = getImpactSeverity(process, impactType, timeIndex);
        if (typeof severity === 'object' && severity !== null && 'severity' in severity) {
          severity = severity.severity;
        }
        if (severity >= 3) {
          allImpactSeverities[impactType] = timePeriods[timeIndex];
          break;
        }
      }
    });
    // Return the earliest RTO across all impact types
    const rtoValues = Object.values(allImpactSeverities);
    if (rtoValues.length === 0) return 'N/A';
    // Find the earliest time period
    const earliestRTO = rtoValues.reduce((earliest, current) => {
      const earliestIndex = timePeriods.indexOf(earliest);
      const currentIndex = timePeriods.indexOf(current);
      return currentIndex < earliestIndex ? current : earliest;
    }, rtoValues[0]);
    return earliestRTO;
  };

  // Helper function to calculate MTPD (second occurrence of severity 3)
  const calculateMTPD = (process) => {
    // For each impact type, find occurrences of severity 3 or higher
    const allOccurrences = [];
    impactTypes.forEach(impactType => {
      let occurrenceCount = 0;
      for (let timeIndex = 0; timeIndex < timePeriods.length; timeIndex++) {
        let severity = getImpactSeverity(process, impactType, timeIndex);
        if (typeof severity === 'object' && severity !== null && 'severity' in severity) {
          severity = severity.severity;
        }
        if (severity >= 3) {
          occurrenceCount++;
          // If this is the second occurrence, add it to our list
          if (occurrenceCount === 2) {
            allOccurrences.push(timePeriods[timeIndex]);
            break;
          }
        }
      }
    });
    // If we don't have any second occurrences, return N/A
    if (allOccurrences.length === 0) return 'N/A';
    // Find the earliest second occurrence
    const earliestMTPD = allOccurrences.reduce((earliest, current) => {
      const earliestIndex = timePeriods.indexOf(earliest);
      const currentIndex = timePeriods.indexOf(current);
      return currentIndex < earliestIndex ? current : earliest;
    }, allOccurrences[0]);
    return earliestMTPD;
  };

  const fetchImpactScaleMatrix = async (processIndex, impactType, processObj = null) => {
    // Use the passed process object if available, otherwise get from state
    const process = processObj || processes[processIndex];
    
    // Safety check to ensure process exists and has a name
    if (!process || !process.name) {
      console.error('Process object is undefined or missing name property', { processIndex, process });
      return;
    }
    
    const impactName = impactType.split(' ')[0]; // Extract first word (Financial, Operational, etc.)
    
    // Update loading state
    setProcesses(prevProcesses => {
      const updatedProcesses = [...prevProcesses];
      // Ensure the process exists in the state before updating
      if (updatedProcesses[processIndex] && updatedProcesses[processIndex].impacts && 
          updatedProcesses[processIndex].impacts[impactType]) {
        updatedProcesses[processIndex].impacts[impactType].isLoading = true;
        updatedProcesses[processIndex].impacts[impactType].error = null;
      }
      return updatedProcesses;
    });
    
    try {
      console.log(`Fetching impact data for ${process.name}, ${impactType}`);
      const response = await getImpactScaleMatrix(process.name, impactName);
      console.log('Response received:', response);
      
      // Update process with impact scale matrix data
      setProcesses(prevProcesses => {
        const updatedProcesses = [...prevProcesses];
        // Ensure the process exists in the state before updating
        if (updatedProcesses[processIndex] && updatedProcesses[processIndex].impacts && 
            updatedProcesses[processIndex].impacts[impactType]) {
          updatedProcesses[processIndex].impacts[impactType].impactScores = response;
          updatedProcesses[processIndex].impacts[impactType].isLoading = false;
          console.log(`Updated impact scores for ${process.name}, ${impactType}:`, 
            updatedProcesses[processIndex].impacts[impactType].impactScores);
        }
        return updatedProcesses;
      });
    } catch (error) {
      console.error(`Error fetching impact scale for ${process.name}, ${impactType}:`, error);
      
      // Update error state
      setProcesses(prevProcesses => {
        const updatedProcesses = [...prevProcesses];
        // Ensure the process exists in the state before updating
        if (updatedProcesses[processIndex] && updatedProcesses[processIndex].impacts && 
            updatedProcesses[processIndex].impacts[impactType]) {
          updatedProcesses[processIndex].impacts[impactType].error = error.message;
          updatedProcesses[processIndex].impacts[impactType].isLoading = false;
        }
        return updatedProcesses;
      });
    }
  };

  const handleImpactSelection = (processIndex, impactType, timeIndex) => {
    setProcesses(prevProcesses => {
      const updatedProcesses = [...prevProcesses];
      updatedProcesses[processIndex].impacts[impactType].selected = timeIndex;
      
      // Set RTO based on selection
      updatedProcesses[processIndex].impacts[impactType].rto = timePeriods[timeIndex];
      
      return updatedProcesses;
    });
    
    // Fetch impact scale matrix when a time period is selected
    fetchImpactScaleMatrix(processIndex, impactType);
  };

  const handleCommentChange = (processIndex, impactType, comment) => {
    setProcesses(prevProcesses => {
      const updatedProcesses = [...prevProcesses];
      updatedProcesses[processIndex].impacts[impactType].comment = comment;
      return updatedProcesses;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    console.log('Impact Analysis Data:', processes);
    
    // Prepare the analyses array
    const analyses = processes.map(process => ({
      bia_process_id: process.bia_info.id, // or process.id if that's the UUID
      impact_data: Object.entries(process.impacts).map(([impact_type, impactData]) => ({
        impact_type,
        impact_data: impactData.impactScores
      })),
      rto: calculateRTO(process), // ensure this is an integer (hours)
      mtpd: calculateMTPD(process) // ensure this is an integer (hours)
    }));

    // Call the API
    try {
      await saveBulkImpactAnalysis(analyses );
      alert('Impact analysis saved!');
      // Navigate to next step
      navigate('/bia/critical-vendor-details');
    } catch (err) {
      alert('Failed to save: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    navigate('/bia');
  };

  // Function to handle sending process data to LLM for analysis
  const handleLLMAnalysis = async (processIndex, process) => {
    // Update status to loading
    setProcessLLMStatus(prev => ({
      ...prev,
      [processIndex]: { loading: true, error: null, result: null }
    }));
    
    try {
      // Prepare data to send to LLM
      const processData = {
        process_name: process.name,
        process_owner: process.process_owner,
        impact_data: {},
        rto: calculateRTO(process),
        mtpd: calculateMTPD(process),
        criticality: getProcessCriticality(process).label,
        comments: {}
      };
      
      // Add impact data for each impact type
      impactTypes.forEach(impactType => {
        processData.impact_data[impactType] = {};
        timePeriods.forEach((period, timeIndex) => {
          const severity = getImpactSeverity(process, impactType, timeIndex);
          processData.impact_data[impactType][period] = severity;
        });
        processData.comments[impactType] = process.impacts[impactType].comment;
      });
      
      // Send to LLM
      const result = await sendProcessToLLM(processData);
      
      // Update status with result
      setProcessLLMStatus(prev => ({
        ...prev,
        [processIndex]: { loading: false, error: null, result }
      }));
      
      // Show result in modal or alert
      alert(`LLM Analysis for ${process.name}:\n\n${result.analysis || result.message || JSON.stringify(result)}`);
      
    } catch (error) {
      console.error('Error in LLM analysis:', error);
      setProcessLLMStatus(prev => ({
        ...prev,
        [processIndex]: { loading: false, error: error.message, result: null }
      }));
      
      // Show error
      alert(`Error analyzing ${process.name}: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <div style={{ color: '#FFD700', fontSize: '18px' }}>Loading processes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <div style={{ color: 'red', fontSize: '18px', marginBottom: '20px' }}>
          Error: {error}
        </div>
        <button 
          onClick={goBack}
          style={{ 
            background: '#232323', 
            color: '#FFD700', 
            border: '1.5px solid #FFD700', 
            borderRadius: 8, 
            fontWeight: 700, 
            fontSize: 17, 
            padding: '12px 32px', 
            cursor: 'pointer' 
          }}
        >
          Back to BIA Information
        </button>
      </div>
    );
  }

  return (
    <div style={{
      animation: 'fadeIn 0.5s ease-in-out',
      padding: '8px',
    }}>
      <div className="bia-form-container">
        <h2 style={{ textAlign: 'center', color: '#FFD700', marginBottom: '20px' }}>
          BUSINESS CONTINUITY PLANNING: Impact Analysis - Recovery Time Objective (RTO)
        </h2>
        
        <div className="last-updated">
          <span>Last updated: {lastUpdated}</span>
        </div>
        
        {departmentInfo.departmentName && (
          <div style={{ marginBottom: '20px' }}>
            <p><strong>Department:</strong> {departmentInfo.departmentName}</p>
            {departmentInfo.subdepartmentName && (
              <p><strong>Subdepartment:</strong> {departmentInfo.subdepartmentName}</p>
            )}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="impact-analysis-table">
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #444' }}>
              <thead>
                <tr style={{ backgroundColor: '#232323', color: '#FFD700' }}>
                  <th style={{ border: '1px solid #444', padding: '8px' }}>S. No.</th>
                  <th style={{ border: '1px solid #444', padding: '8px' }}>Process Name</th>
                  <th style={{ border: '1px solid #444', padding: '8px' }}>Type of Impact</th>
                  {timePeriods.map((period, index) => (
                    <th key={index} style={{ border: '1px solid #444', padding: '8px', fontSize: '0.9em' }}>{period}</th>
                  ))}
                  <th style={{ border: '1px solid #444', padding: '8px' }}>Rationale and Comments</th>
                  <th style={{ border: '1px solid #444', padding: '8px', backgroundColor: '#3a2f7d' }}>RTO</th>
                  <th style={{ border: '1px solid #444', padding: '8px', backgroundColor: '#3a2f7d' }}>MTPD</th>
                  <th style={{ border: '1px solid #444', padding: '8px', backgroundColor: '#3a2f7d' }}>Criticality</th>
                </tr>
              </thead>
              <tbody>
                {processes.length === 0 ? (
                  <tr>
                    <td colSpan={14} style={{ textAlign: 'center', padding: '20px', color: '#fff' }}>
                      No processes found. Please go back and add processes in the BIA Information page.
                    </td>
                  </tr>
                ) : (
                  processes.map((process, processIndex) => (
                    <React.Fragment key={`process-${processIndex}`}>
                      {impactTypes.map((impactType, impactIndex) => (
                        <tr key={`${processIndex}-${impactIndex}`}>
                          {impactIndex === 0 && (
                            <td rowSpan={impactTypes.length} style={{ border: '1px solid #444', padding: '8px', textAlign: 'center', color: '#fff' }}>
                              {processIndex + 1}
                            </td>
                          )}
                          {impactIndex === 0 && (
                            <td rowSpan={impactTypes.length} style={{ border: '1px solid #444', padding: '8px', color: '#fff' }}>
                              {process.name}
                              {/* LLM Analysis Button - only in first row of each process */}
                              <div style={{ marginTop: '10px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleLLMAnalysis(processIndex, process)}
                                  disabled={processLLMStatus[processIndex]?.loading}
                                  style={{
                                    padding: '5px 10px',
                                    backgroundColor: '#3a2f7d',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: processLLMStatus[processIndex]?.loading ? 'not-allowed' : 'pointer',
                                    fontSize: '0.8em',
                                    width: '100%'
                                  }}
                                >
                                  {processLLMStatus[processIndex]?.loading ? 'Analyzing...' : 'LLM Analysis'}
                                </button>
                                {processLLMStatus[processIndex]?.error && (
                                  <div style={{ color: 'red', fontSize: '0.8em', marginTop: '5px' }}>
                                    Error: {processLLMStatus[processIndex].error}
                                  </div>
                                )}
                              </div>
                            </td>
                          )}
                          <td style={{ border: '1px solid #444', padding: '8px', color: '#fff' }}>{impactType}</td>
                          {timePeriods.map((_, timeIndex) => {
                            let severity = getImpactSeverity(process, impactType, timeIndex);
                            // If severity is an object, extract the 'severity' property or stringify
                            if (typeof severity === 'object' && severity !== null) {
                              if ('severity' in severity) {
                                severity = severity.severity;
                              } else {
                                severity = JSON.stringify(severity);
                              }
                            }
                            const bgColor = getCellColor(severity);
                            // Determine text color based on background color for contrast
                            const textColor = (severity === 0 || severity === 1 || severity === 2) ? '#000' : '#fff';
                            return (
                              <td 
                                key={timeIndex} 
                                style={{ 
                                  border: '1px solid #444', 
                                  padding: '8px', 
                                  textAlign: 'center',
                                  backgroundColor: bgColor,
                                  color: textColor,
                                  cursor: 'pointer'
                                }}
                                onClick={() => handleImpactSelection(processIndex, impactType, timeIndex)}
                              >
                                {severity !== null ? severity : (
                                  process.impacts[impactType].isLoading ? (
                                    <small style={{ color: '#FFD700' }}>...</small>
                                  ) : process.impacts[impactType].error ? (
                                    <small style={{ color: 'red' }}>!</small>
                                  ) : ''
                                )}
                              </td>
                            );
                          })}
                          <td style={{ border: '1px solid #444', padding: '8px' }}>
                            <input
                              type="text"
                              style={{ width: '100%', padding: '4px', backgroundColor: '#333', color: '#fff', border: '1px solid #444' }}
                              value={process.impacts[impactType].comment}
                              onChange={(e) => handleCommentChange(processIndex, impactType, e.target.value)}
                              placeholder="Enter comments"
                            />
                            {process.impacts[impactType].isLoading && (
                              <div style={{ fontSize: '0.8em', color: '#FFD700' }}>Loading impact data...</div>
                            )}
                            {process.impacts[impactType].error && (
                              <div style={{ fontSize: '0.8em', color: 'red' }}>Error: {process.impacts[impactType].error}</div>
                            )}
                          </td>
                          
                          {/* RTO, MTPD, and Criticality columns - only show in first row of each process */}
                          {impactIndex === 0 && (
                            <>
                              <td 
                                rowSpan={impactTypes.length} 
                                style={{ 
                                  border: '1px solid #444', 
                                  padding: '8px', 
                                  textAlign: 'center',
                                  backgroundColor: '#3a2f7d',
                                  color: '#fff',
                                  fontWeight: 'bold'
                                }}
                              >
                                {calculateRTO(process)}
                              </td>
                              <td 
                                rowSpan={impactTypes.length} 
                                style={{ 
                                  border: '1px solid #444', 
                                  padding: '8px', 
                                  textAlign: 'center',
                                  backgroundColor: '#3a2f7d',
                                  color: '#fff',
                                  fontWeight: 'bold'
                                }}
                              >
                                {calculateMTPD(process)}
                              </td>
                              <td 
                                rowSpan={impactTypes.length} 
                                style={{ 
                                  border: '1px solid #444', 
                                  padding: '8px', 
                                  textAlign: 'center',
                                  backgroundColor: getCriticalityColor(getProcessCriticality(process).status),
                                  color: '#fff',
                                  fontWeight: 'bold'
                                }}
                              >
                                {getProcessCriticality(process).label}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                      {processIndex < processes.length - 1 && (
                        <tr style={{ height: '10px', backgroundColor: '#333' }}>
                          <td colSpan={14} style={{ padding: 0 }}></td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <h4 style={{ color: '#FFD700', marginBottom: '10px' }}>Legend:</h4>
              <ul style={{ listStyleType: 'none', padding: 0 }}>
                {severityLevels.map((level, index) => (
                  <li key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', color: '#fff' }}>
                    <div style={{ 
                      width: '20px', 
                      height: '20px', 
                      backgroundColor: getCellColor(level.value),
                      border: '1px solid #444',
                      marginRight: '10px'
                    }}></div>
                    <span>{level.value}: {level.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="form-actions" style={{ marginTop: '32px', display: 'flex', gap: '16px' }}>
            <button 
              type="button" 
              onClick={goBack}
              style={{ 
                background: '#232323', 
                color: '#FFD700', 
                border: '1.5px solid #FFD700', 
                borderRadius: 8, 
                fontWeight: 700, 
                fontSize: 17, 
                padding: '12px 32px', 
                cursor: 'pointer' 
              }}
            >
              Back to BIA Information
            </button>
            <button 
              type="submit"
              disabled={submitting}
              style={{ 
                background: '#FFD700', 
                color: '#232323', 
                border: 'none', 
                borderRadius: 8, 
                fontWeight: 700, 
                fontSize: 17, 
                padding: '12px 32px', 
                cursor: submitting ? 'not-allowed' : 'pointer' 
              }}
            >
              Continue to Vendor Details
            </button>
          </div>
        </form>
      </div>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#333', borderRadius: '5px' }}>
        <h3 style={{ color: '#FFD700' }}>Legend</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#FFFFFF', marginRight: '5px' }}></div>
            <span style={{ color: '#fff' }}>0 - No Impact</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#90EE90', marginRight: '5px' }}></div>
            <span style={{ color: '#fff' }}>1 - Minor</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#FFFF00', marginRight: '5px' }}></div>
            <span style={{ color: '#fff' }}>2 - Moderate</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#FFA500', marginRight: '5px' }}></div>
            <span style={{ color: '#fff' }}>3 - Major</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#FF6347', marginRight: '5px' }}></div>
            <span style={{ color: '#fff' }}>4 - Severe</span>
          </div>
        </div>
        <div style={{ marginTop: '10px' }}>
          <h4 style={{ color: '#FFD700' }}>Criticality Assessment</h4>
          <p style={{ color: '#fff' }}>
            Organization Criticality Threshold: {criticalityLoading ? 'Loading...' : criticalityError ? 'Error loading' : criticalityThreshold !== null ? `${criticalityThreshold} hours` : 'Not set'}
          </p>
          <p style={{ color: '#fff' }}>
            <span style={{ backgroundColor: '#8B0000', padding: '2px 5px' }}>Critical Process</span>: RTO ≤ {criticalityThreshold !== null ? `${criticalityThreshold} hours` : 'threshold'}
          </p>
          <p style={{ color: '#fff' }}>
            <span style={{ backgroundColor: '#006400', padding: '2px 5px' }}>Non-Critical Process</span>: RTO &gt; {criticalityThreshold !== null ? `${criticalityThreshold} hours` : 'threshold'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImpactAnalysis;
