import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/BIAStyles.css';
import '../styles/BIAInformation.css';
import { useAuditTrail } from '../AuditTrailContext';
import { useRole } from '../RoleContext';
import { getOrganizationSector, getAIDescription, getAIPeakPeriod, getProcessesByDepartment } from '../services/biaService';
import { jwtDecode } from 'jwt-decode';
import { saveBIAInformation, saveBIAProcesses } from '../services/biaService.js';

const REVIEW_STATUSES = ['Draft', 'Under Review', 'Approved'];

const BIAInformation = () => {
  const navigate = useNavigate();
  const { logAction, logs } = useAuditTrail();
  const { role } = useRole();

  const [formData, setFormData] = useState({
    departmentName: '',
    subdepartmentName: '',
    departmentDescription: '',
    biaCoordinatorName: '',
    secondaryPOCName: '',
    primaryLocation: '',
    secondaryLocation: '',
    countPrimaryLocation: '',
    countSecondaryLocation: '',
    processes: [
      { name: '', description: '', spoc: '', peakPeriod: '24/7' },
      { name: '', description: '', spoc: '', peakPeriod: '24/7' }
    ]
  });
  const [reviewStatus, setReviewStatus] = useState('Draft');
  const [lastReviewed, setLastReviewed] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [organizationId, setOrganizationId] = useState(null);
  const [organizationSector, setOrganizationSector] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [predictionStatus, setPredictionStatus] = useState({
    departmentDescription: { loading: false, error: null },
    processDescription: { loading: false, error: null, index: null },
    peakPeriod: { loading: false, error: null, index: null }
  });
  const [isLoadingProcesses, setIsLoadingProcesses] = useState(false);
  const [processesError, setProcessesError] = useState(null);

  // Get organization ID from token
  useEffect(() => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        const decodedToken = jwtDecode(token);
        if (decodedToken.organization_id) {
          setOrganizationId(decodedToken.organization_id);
          fetchOrganizationSector(decodedToken.organization_id);
        }
      }
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }, []);

  // Fetch organization sector
  const fetchOrganizationSector = async (orgId) => {
    try {
      setIsLoading(true);
      const response = await getOrganizationSector(orgId);
      setOrganizationSector(response.sector || '');
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching organization sector:', error);
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    logAction('edit', { field: name, value });
  };

  const handleProcessChange = (index, field, value) => {
    setFormData(prev => {
      const updatedProcesses = [...prev.processes];
      updatedProcesses[index] = { ...updatedProcesses[index], [field]: value };
      return { ...prev, processes: updatedProcesses };
    });
    logAction('edit', { processIndex: index, field, value });
  };

  const addProcess = () => {
    setFormData(prev => ({
      ...prev,
      processes: [...prev.processes, { name: '', description: '', spoc: '', peakPeriod: '24/7' }]
    }));
    logAction('add', { type: 'process' });
  };

  const removeProcess = (index) => {
    setFormData(prev => ({
      ...prev,
      processes: prev.processes.filter((_, i) => i !== index)
    }));
    logAction('remove', { type: 'process', index });
  };

  // Predict department description
  const predictDepartmentDescription = async () => {
    if (!formData.departmentName) {
      alert('Please enter a department name first');
      return;
    }

    try {
      setPredictionStatus(prev => ({
        ...prev,
        departmentDescription: { loading: true, error: null }
      }));

      const response = await getAIDescription('department', formData.departmentName);
      
      if (response && response.description) {
        setFormData(prev => ({
          ...prev,
          departmentDescription: response.description
        }));
        logAction('predict', { field: 'departmentDescription', value: response.description });
      }

      setPredictionStatus(prev => ({
        ...prev,
        departmentDescription: { loading: false, error: null }
      }));
    } catch (error) {
      console.error('Error predicting department description:', error);
      setPredictionStatus(prev => ({
        ...prev,
        departmentDescription: { loading: false, error: error.message }
      }));
    }
  };

  // Predict process description
  const predictProcessDescription = async (index) => {
    const processName = formData.processes[index]?.name;
    if (!processName) {
      alert('Please enter a process name first');
      return;
    }

    try {
      setPredictionStatus(prev => ({
        ...prev,
        processDescription: { loading: true, error: null, index }
      }));

      const response = await getAIDescription('process', processName);
      
      if (response && response.description) {
        setFormData(prev => {
          const updatedProcesses = [...prev.processes];
          updatedProcesses[index] = { 
            ...updatedProcesses[index], 
            description: response.description 
          };
          return { ...prev, processes: updatedProcesses };
        });
        logAction('predict', { field: 'processDescription', index, value: response.description });
      }

      setPredictionStatus(prev => ({
        ...prev,
        processDescription: { loading: false, error: null, index: null }
      }));
    } catch (error) {
      console.error('Error predicting process description:', error);
      setPredictionStatus(prev => ({
        ...prev,
        processDescription: { loading: false, error: error.message, index }
      }));
    }
  };

  // Predict peak period
  const predictPeakPeriod = async (index) => {
    const processName = formData.processes[index]?.name;
    if (!processName || !formData.departmentName || !organizationSector) {
      alert('Please ensure department name, process name, and organization sector are available');
      return;
    }

    try {
      setPredictionStatus(prev => ({
        ...prev,
        peakPeriod: { loading: true, error: null, index }
      }));

      const response = await getAIPeakPeriod(
        formData.departmentName,
        processName,
        organizationSector
      );
      
      if (response && response.peak_period) {
        setFormData(prev => {
          const updatedProcesses = [...prev.processes];
          updatedProcesses[index] = { 
            ...updatedProcesses[index], 
            peakPeriod: response.peak_period 
          };
          return { ...prev, processes: updatedProcesses };
        });
        logAction('predict', { field: 'peakPeriod', index, value: response.peak_period });
      }

      setPredictionStatus(prev => ({
        ...prev,
        peakPeriod: { loading: false, error: null, index: null }
      }));
    } catch (error) {
      console.error('Error predicting peak period:', error);
      setPredictionStatus(prev => ({
        ...prev,
        peakPeriod: { loading: false, error: error.message, index }
      }));
    }
  };

  // Fetch processes by department and subdepartment
  const fetchProcesses = async () => {
    if (!formData.departmentName || !formData.subdepartmentName || !organizationId) {
      alert('Please enter both department and subdepartment names first');
      return;
    }

    try {
      setIsLoadingProcesses(true);
      setProcessesError(null);
      
      const processes = await getProcessesByDepartment(
        organizationId,
        formData.departmentName,
        formData.subdepartmentName
      );
      
      if (processes && processes.length > 0) {
        // Map the fetched processes to the format expected by the form
        const mappedProcesses = processes.map(process => ({
          name: process.name,
          spoc: process.process_owner,
          description: '', // Empty description to be filled by user or AI
          peakPeriod: '24/7' // Default peak period
        }));
        
        // Update the form data with the fetched processes
        setFormData(prev => ({
          ...prev,
          processes: mappedProcesses
        }));
        
        logAction('fetch_processes', { 
          departmentName: formData.departmentName,
          subdepartmentName: formData.subdepartmentName,
          processesCount: processes.length 
        });
      } else {
        // If no processes found, show a message but don't clear existing processes
        alert('No processes found for the specified department and subdepartment');
      }
    } catch (error) {
      console.error('Error fetching processes:', error);
      setProcessesError(error.message || 'Failed to fetch processes');
    } finally {
      setIsLoadingProcesses(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // 1. Save BIA Information and get its ID
      const department_id = await getDepartmentIdByName(organizationId, formData.departmentName);
      if (!department_id) throw new Error('Department not found');
      const subdepartment_id = await getSubdepartmentIdByName(department_id, formData.subdepartmentName);

      const payload = {
        department_id,
        subdepartment_id,
        department_name: formData.departmentName,
        department_description: formData.departmentDescription,
        bcp_coordinator: formData.biaCoordinatorName,
        secondary_spoc: formData.secondaryPOCName,
        primary_location: formData.primaryLocation,
        secondary_location: formData.secondaryLocation,
        primary_staff_count: formData.countPrimaryLocation,
        secondary_staff_count: formData.countSecondaryLocation,
        organization_id: organizationId,
      };
      const biaInfoResponse = await saveBIAInformation(payload);
      const bia_information_id = biaInfoResponse.id;

      // 2. Get all processes for this department/subdepartment to map names to IDs
      const backendProcesses = await getProcessesByDepartment(
        organizationId,
        formData.departmentName,
        formData.subdepartmentName
      );
      // 3. Build the payload for bia_process
      const processPayload = formData.processes.map((proc) => {
        const backendProc = backendProcesses.find(p => p.name === proc.name);
        return {
          process_id: backendProc ? backendProc.id : null,
          spoc: proc.spoc,
          process_description: proc.description,
          peak_period: proc.peakPeriod,
          critical: false,
          bia_information_id,
        };
      }).filter(p => p.process_id); // Only include those with a valid process_id
      await saveBIAProcesses(processPayload);

      // --- FIX: Always save latest info to localStorage before navigating ---
      localStorage.setItem('biaInformation', JSON.stringify({
        departmentName: formData.departmentName,
        subdepartmentName: formData.subdepartmentName
      }));
      // --- END FIX ---

      logAction('submit', { formData });
      navigate('/bia/impact-analysis');
    } catch (error) {
      alert('Failed to save. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = () => {
    setReviewStatus('Under Review');
    setLastReviewed(new Date().toISOString());
    logAction('submit_for_review', { formData });
  };

  const handleApprove = () => {
    setReviewStatus('Approved');
    setLastReviewed(new Date().toISOString());
    logAction('approve', { formData });
  };

  // Export to CSV (simple demo)
  const handleExport = () => {
    const csv = [
      ['Department Name', formData.departmentName],
      ['Subdepartment Name', formData.subdepartmentName],
      ['Department Description', formData.departmentDescription],
      ['BCP Coordinator Name', formData.biaCoordinatorName],
      ['Secondary SPOC Name', formData.secondaryPOCName],
      ['Primary Location', formData.primaryLocation],
      ['Secondary Location', formData.secondaryLocation],
      ['Count of Staff in Primary Location', formData.countPrimaryLocation],
      ['Count of Staff in Secondary Location', formData.countSecondaryLocation],
      ['Processes', ''],
      ...formData.processes.map((p, i) => [
        `Process ${i + 1} Name`, p.name,
        `Description`, p.description,
        `SPOC`, p.spoc,
        `Peak Period`, p.peakPeriod
      ])
    ].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bia_information.csv';
    a.click();
    URL.revokeObjectURL(url);
    logAction('export', { type: 'csv' });
  };

  // Review reminder logic
  const reviewDue = lastReviewed && (Date.now() - new Date(lastReviewed).getTime() > 365 * 24 * 60 * 60 * 1000);

  return (
    <div className="bia-container">
      {/* Review/Export/History Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <span style={{ color: '#FFD700', fontWeight: 700, fontSize: 16 }}>Review Status: {reviewStatus}</span>
          {lastReviewed && (
            <span style={{ color: '#FFD700', marginLeft: 18, fontSize: 14 }}>
              Last Reviewed: {new Date(lastReviewed).toLocaleDateString()}
            </span>
          )}
          {reviewDue && (
            <span style={{ color: 'red', marginLeft: 18, fontWeight: 700 }}>Review Overdue!</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={handleExport} style={{ background: '#FFD700', color: '#232323', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 15, padding: '8px 18px', cursor: 'pointer' }}>Export CSV</button>
          <button type="button" onClick={() => setShowHistory(true)} style={{ background: '#232323', color: '#FFD700', border: '1.5px solid #FFD700', borderRadius: 6, fontWeight: 700, fontSize: 15, padding: '8px 18px', cursor: 'pointer' }}>Change History</button>
        </div>
      </div>

      <div className="bia-form-container" style={{ marginBottom: 32 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Department Name</label>
              <input
                type="text"
                name="departmentName"
                value={formData.departmentName}
                onChange={handleInputChange}
                required
                placeholder="Enter department name"
                maxLength={60}
                disabled={role !== 'admin'}
              />
              <span className="input-char-count">{formData.departmentName.length}/60</span>
            </div>
            <div className="form-group">
              <label>Subdepartment Name</label>
              <input
                type="text"
                name="subdepartmentName"
                value={formData.subdepartmentName}
                onChange={handleInputChange}
                required
                placeholder="Enter subdepartment name"
                maxLength={60}
                disabled={role !== 'admin'}
              />
              <span className="input-char-count">{formData.subdepartmentName.length}/60</span>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button 
                type="button" 
                onClick={fetchProcesses} 
                disabled={isLoadingProcesses || !formData.departmentName || !formData.subdepartmentName}
                style={{ 
                  background: '#232323', 
                  color: '#FFD700', 
                  border: '1.5px solid #FFD700', 
                  borderRadius: 6, 
                  fontWeight: 700, 
                  fontSize: 15, 
                  padding: '8px 18px', 
                  cursor: (isLoadingProcesses || !formData.departmentName || !formData.subdepartmentName) ? 'not-allowed' : 'pointer',
                  opacity: (isLoadingProcesses || !formData.departmentName || !formData.subdepartmentName) ? 0.7 : 1
                }}
              >
                {isLoadingProcesses ? 'Fetching...' : 'Fetch Processes'}
              </button>
              {processesError && (
                <div style={{ color: 'red', fontSize: '14px' }}>
                  Error: {processesError}
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Department Description</label>
              <input
                type="text"
                name="departmentDescription"
                value={formData.departmentDescription}
                onChange={handleInputChange}
                required
                placeholder="Enter department description"
                maxLength={100}
                disabled={role !== 'admin'}
              />
              <span className="input-char-count">{formData.departmentDescription.length}/100</span>
              <button 
                type="button" 
                onClick={predictDepartmentDescription} 
                disabled={predictionStatus.departmentDescription.loading || !formData.departmentName}
                style={{ 
                  background: '#232323', 
                  color: '#FFD700', 
                  border: '1.5px solid #FFD700', 
                  borderRadius: 6, 
                  fontWeight: 700, 
                  fontSize: 15, 
                  padding: '8px 18px', 
                  cursor: predictionStatus.departmentDescription.loading || !formData.departmentName ? 'not-allowed' : 'pointer',
                  opacity: predictionStatus.departmentDescription.loading || !formData.departmentName ? 0.7 : 1
                }}
              >
                {predictionStatus.departmentDescription.loading ? 'Predicting...' : 'Predict Description'}
              </button>
              {predictionStatus.departmentDescription.error && (
                <div style={{ color: 'red', marginTop: '5px' }}>
                  Error: {predictionStatus.departmentDescription.error}
                </div>
              )}
            </div>
          </div>
          {/* ... repeat for all other fields, add disabled={role !== 'admin'} ... */}
          {/* Processes section ... */}
          <div style={{ marginTop: 24 }}>
            <div style={{ fontWeight: 700, color: '#FFD700', marginBottom: 8, fontSize: 18 }}>Processes</div>
            {formData.processes.map((process, idx) => (
              <div key={idx} className="form-row" style={{ alignItems: 'flex-end' }}>
                <div className="form-group">
                  <label>Process Name</label>
                  <input
                    type="text"
                    value={process.name}
                    onChange={e => handleProcessChange(idx, 'name', e.target.value)}
                    required
                    placeholder="Enter process name"
                    maxLength={60}
                    disabled={role !== 'admin'}
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    value={process.description}
                    onChange={e => handleProcessChange(idx, 'description', e.target.value)}
                    required
                    placeholder="Enter description"
                    maxLength={100}
                    disabled={role !== 'admin'}
                  />
                  <button 
                    type="button" 
                    onClick={() => predictProcessDescription(idx)} 
                    disabled={predictionStatus.processDescription.loading || !process.name}
                    style={{ 
                      background: '#232323', 
                      color: '#FFD700', 
                      border: '1.5px solid #FFD700', 
                      borderRadius: 6, 
                      fontWeight: 700, 
                      fontSize: 15, 
                      padding: '8px 18px', 
                      cursor: predictionStatus.processDescription.loading || !process.name ? 'not-allowed' : 'pointer',
                      opacity: predictionStatus.processDescription.loading || !process.name ? 0.7 : 1
                    }}
                  >
                    {predictionStatus.processDescription.loading && predictionStatus.processDescription.index === idx ? 'Predicting...' : 'Predict Description'}
                  </button>
                  {predictionStatus.processDescription.error && predictionStatus.processDescription.index === idx && (
                    <div style={{ color: 'red', marginTop: '5px' }}>
                      Error: {predictionStatus.processDescription.error}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>SPOC</label>
                  <input
                    type="text"
                    value={process.spoc}
                    onChange={e => handleProcessChange(idx, 'spoc', e.target.value)}
                    required
                    placeholder="Enter SPOC"
                    maxLength={40}
                    disabled={role !== 'admin'}
                  />
                </div>
                <div className="form-group">
                  <label>Peak Period</label>
                  <input
                    type="text"
                    value={process.peakPeriod}
                    onChange={e => handleProcessChange(idx, 'peakPeriod', e.target.value)}
                    required
                    placeholder="e.g. 24/7, 9am-6pm"
                    maxLength={20}
                    disabled={role !== 'admin'}
                  />
                  <button 
                    type="button" 
                    onClick={() => predictPeakPeriod(idx)} 
                    disabled={predictionStatus.peakPeriod.loading || !process.name || !formData.departmentName || !organizationSector}
                    style={{ 
                      background: '#232323', 
                      color: '#FFD700', 
                      border: '1.5px solid #FFD700', 
                      borderRadius: 6, 
                      fontWeight: 700, 
                      fontSize: 15, 
                      padding: '8px 18px', 
                      cursor: predictionStatus.peakPeriod.loading || !process.name || !formData.departmentName || !organizationSector ? 'not-allowed' : 'pointer',
                      opacity: predictionStatus.peakPeriod.loading || !process.name || !formData.departmentName || !organizationSector ? 0.7 : 1
                    }}
                  >
                    {predictionStatus.peakPeriod.loading && predictionStatus.peakPeriod.index === idx ? 'Predicting...' : 'Predict Peak Period'}
                  </button>
                  {predictionStatus.peakPeriod.error && predictionStatus.peakPeriod.index === idx && (
                    <div style={{ color: 'red', marginTop: '5px' }}>
                      Error: {predictionStatus.peakPeriod.error}
                    </div>
                  )}
                </div>
                {role === 'admin' && (
                  <button type="button" onClick={() => removeProcess(idx)} style={{ background: '#b22222', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 15, padding: '8px 14px', marginLeft: 8, cursor: 'pointer' }}>Remove</button>
                )}
              </div>
            ))}
            {role === 'admin' && (
              <button type="button" onClick={addProcess} style={{ background: '#FFD700', color: '#232323', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, padding: '10px 28px', marginTop: 10, cursor: 'pointer' }}>+ Add Process</button>
            )}
            {isLoadingProcesses && (
              <div style={{ color: '#FFD700', marginTop: 10, fontSize: 14 }}>Fetching processes...</div>
            )}
            {processesError && (
              <div style={{ color: 'red', marginTop: 10, fontSize: 14 }}>{processesError}</div>
            )}
          </div>
          <div style={{ marginTop: 32, display: 'flex', gap: 16 }}>
            {role === 'admin' && (
              <button type="submit" style={{ background: '#FFD700', color: '#232323', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 17, padding: '12px 32px', cursor: 'pointer' }}>Save & Next</button>
            )}
            {role === 'admin' && reviewStatus === 'Draft' && (
              <button type="button" onClick={handleReview} style={{ background: '#232323', color: '#FFD700', border: '1.5px solid #FFD700', borderRadius: 8, fontWeight: 700, fontSize: 17, padding: '12px 32px', cursor: 'pointer' }}>Submit for Review</button>
            )}
            {role === 'admin' && reviewStatus === 'Under Review' && (
              <button type="button" onClick={handleApprove} style={{ background: '#232323', color: '#FFD700', border: '1.5px solid #FFD700', borderRadius: 8, fontWeight: 700, fontSize: 17, padding: '12px 32px', cursor: 'pointer' }}>Approve</button>
            )}
          </div>
        </form>
      </div>

      {/* Change History Modal */}
      {showHistory && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto',
        }}>
          <div style={{ background: '#232323', color: '#FFD700', borderRadius: 14, minWidth: 350, maxWidth: 700, width: '98vw', maxHeight: '92vh', padding: '0 0 32px 0', boxShadow: '0 0 0 4px #FFD700, 0 8px 32px #000a', position: 'relative', border: '2.5px solid #FFD700', margin: '40px auto', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#181818', padding: '22px 36px 16px 32px', borderBottom: '1.5px solid #FFD700' }}>
              <span style={{ color: '#FFD700', fontWeight: 800, fontSize: 22, letterSpacing: 1 }}>Change History</span>
              <button onClick={() => setShowHistory(false)} style={{ background: 'none', border: 'none', color: '#FFD700', fontSize: 32, fontWeight: 900, cursor: 'pointer', marginLeft: 12, marginTop: -4, transition: 'color 0.2s' }} aria-label="Close" title="Close">×</button>
            </div>
            <div style={{ padding: '18px 32px', color: '#fff', maxHeight: 400, overflowY: 'auto' }}>
              {logs.length === 0 ? (
                <div style={{ color: '#FFD700', fontWeight: 600 }}>No changes logged yet.</div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {logs.map((log, idx) => (
                    <li key={idx} style={{ marginBottom: 12, color: '#fff' }}>
                      <span style={{ color: '#FFD700', fontWeight: 700 }}>{log.action}</span> — {log.details && JSON.stringify(log.details)}<br />
                      <span style={{ color: '#aaa', fontSize: 13 }}>{log.user} @ {new Date(log.timestamp).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BIAInformation;

const API_URL = 'http://localhost:8000';

export async function getDepartmentIdByName(organizationId, departmentName) {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_URL}/organizations/${organizationId}/departments`, {
    headers: { 'Authorization': token ? `Bearer ${token}` : undefined }
  });
  const departments = await response.json();
  const dept = departments.find(d => d.name === departmentName);
  return dept ? dept.id : null;
}

export async function getSubdepartmentIdByName(departmentId, subdepartmentName) {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_URL}/organizations/departments/${departmentId}/subdepartments`, {
    headers: { 'Authorization': token ? `Bearer ${token}` : undefined }
  });
  const subdepartments = await response.json();
  const subdept = subdepartments.find(s => s.name === subdepartmentName);
  return subdept ? subdept.id : null;
}
