import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrganizationImpactMatrix } from '../services/biaService';
import { decodeToken } from '../../../services/authService';
import { useImpactMatrix } from '../ImpactMatrixContext';
import '../styles/ImpactScale.css';

// Mock useAuth hook since we don't have AuthContext
const useAuth = () => {
  const userInfo = decodeToken();
  return { userInfo };
};

// Approval workflow hierarchy
const APPROVAL_HIERARCHY = [
  "Process Owner",
  "Department Sub Head",
  "Department Head",
  "Organization Head",
  "EY Admin"
];

const OrganizationImpactScale = () => {
  const navigate = useNavigate();
  const { userInfo } = useAuth();

  // Get user role for approval workflow
  const [userRole, setUserRole] = useState('');
  const [pendingApprovals, setPendingApprovals] = useState([]);

  // State for sector
  const [selectedSector, setSelectedSector] = useState('');

  // State for matrix
  const [matrixCells, setMatrixCells] = useState([]);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [matrixError, setMatrixError] = useState(null);
  const [matrixSuccess, setMatrixSuccess] = useState(null);

  // State for impact types and levels (editable by user)
  const [impactTypes, setImpactTypes] = useState([
    { id: 'type0', name: '', process_name: '' },
    { id: 'type1', name: '', process_name: '' },
    { id: 'type2', name: '', process_name: '' },
    { id: 'type3', name: '', process_name: '' },
    { id: 'type4', name: '', process_name: '' }
  ]);

  const [impactLevels, setImpactLevels] = useState([
    { id: 'level0', name: '' },
    { id: 'level1', name: '' },
    { id: 'level2', name: '' },
    { id: 'level3', name: '' },
    { id: 'level4', name: '' }
  ]);

  // State for suggestions
  const [suggestions, setSuggestions] = useState({});
  const [fetchingSuggestions, setFetchingSuggestions] = useState(false);

  // Get user role on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setUserRole(decoded.roles?.[0] || '');
        loadPendingApprovals(decoded.roles?.[0] || '');
      } catch (err) {
        console.error('Error parsing user role:', err);
      }
    }
  }, []);

  // Load pending approvals for the current user
  const loadPendingApprovals = async (role) => {
    if (!role) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/organizations/${userInfo?.organization_id}/approvals/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPendingApprovals(data.approvals || []);
      }
    } catch (err) {
      console.error('Error loading pending approvals:', err);
    }
  };

  // Approve or reject an approval request
  const handleApprovalAction = async (requestId, action, comments = '') => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/organizations/approvals/${requestId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          approver_role: userRole,
          comments
        })
      });

      if (response.ok) {
        // Reload pending approvals
        loadPendingApprovals(userRole);
        setMatrixSuccess(`Request ${action}d successfully`);
        setTimeout(() => setMatrixSuccess(null), 3000);
      } else {
        setMatrixError('Failed to process approval');
        setTimeout(() => setMatrixError(null), 3000);
      }
    } catch (err) {
      console.error('Error processing approval:', err);
      setMatrixError('Error processing approval');
      setTimeout(() => setMatrixError(null), 3000);
    }
  };
  
  // Initialize matrix on component mount
  useEffect(() => {
    initializeMatrixCells();
  }, []);

  // Initialize matrix cells when impact types and levels change
  useEffect(() => {
    initializeMatrixCells();
  }, [impactTypes, impactLevels]);
  
  // Initialize matrix cells with empty values
  const initializeMatrixCells = () => {
    const cells = [];
    
    impactTypes.forEach(type => {
      if (type.name) { // Only create cells for types with names
        impactLevels.forEach(level => {
          if (level.name) { // Only create cells for levels with names
            cells.push({
              impact_type: type.id,
              impact_level: level.id,
              description: '',
              process_name: type.process_name
            });
          }
        });
      }
    });
    
    setMatrixCells(cells);
  };
  
  // Handle sector selection
  const handleSectorChange = (e) => {
    const sector = e.target.value;
    setSelectedSector(sector);
    
    if (sector) {
      // Use organization_id to fetch the impact matrix
      const organizationId = userInfo?.organization_id || '1';
      loadImpactMatrix(organizationId, sector);
    } else {
      // Reset matrix cells if no sector is selected
      initializeMatrixCells();
    }
  };
  
  // Handle process name change for a specific impact type
  const handleProcessNameChange = (id, newProcessName) => {
    setImpactTypes(prev => 
      prev.map(type => 
        type.id === id ? { ...type, process_name: newProcessName } : type
      )
    );
  };
  
  // Handle impact type name change
  const handleImpactTypeChange = (id, newName) => {
    setImpactTypes(prev => 
      prev.map(type => 
        type.id === id ? { ...type, name: newName } : type
      )
    );
  };
  
  // Handle impact level name change
  const handleImpactLevelChange = (id, newName) => {
    setImpactLevels(prev => 
      prev.map(level => 
        level.id === id ? { ...level, name: newName } : level
      )
    );
  };
  
  // Load existing matrix if available
  const loadImpactMatrix = async (organizationId, sector) => {
    if (!sector) {
      setMatrixError('Sector is required to load impact matrix');
      setTimeout(() => setMatrixError(null), 3000);
      return;
    }
    
    try {
      setMatrixLoading(true);
      
      const matrixData = await getOrganizationImpactMatrix(organizationId, sector);
      
      if (matrixData) {
        // Set impact types
        if (matrixData.impact_types) {
          const types = Object.entries(matrixData.impact_types).map(([id, name]) => ({
            id,
            name
          }));
          setImpactTypes(types);
        }
        
        // Set impact levels
        if (matrixData.impact_levels) {
          const levels = Object.entries(matrixData.impact_levels).map(([id, name]) => ({
            id,
            name
          }));
          setImpactLevels(levels);
        }
        
        // Set process names for impact types if available
        if (matrixData.process_names && matrixData.impact_types) {
          setImpactTypes(prev => {
            return prev.map(type => {
              const processName = matrixData.process_names[type.id] || '';
              return { ...type, process_name: processName };
            });
          });
        }
        
        // Set matrix cells
        if (matrixData.cells) {
          setMatrixCells(matrixData.cells);
        }
      }
      
      setMatrixLoading(false);
    } catch (err) {
      setMatrixError(err.message || 'Failed to load impact matrix');
      setMatrixLoading(false);
      setTimeout(() => setMatrixError(null), 3000);
    }
  };
  
  // Handle cell description change
  const handleCellChange = (typeId, levelId, newDescription) => {
    // Find the process name for this type
    const type = impactTypes.find(t => t.id === typeId);
    const processName = type ? type.process_name : '';
    
    setMatrixCells(prev => {
      return prev.map(cell => {
        if (cell.impact_type === typeId && cell.impact_level === levelId) {
          return { ...cell, description: newDescription, process_name: processName };
        }
        return cell;
      });
    });
  };

  // Get suggestions for a specific cell
  const getSuggestions = async (type, level) => {
    const impactType = impactTypes.find(t => t.id === type);
    
    if (!selectedSector || !impactType?.process_name) {
      setMatrixError('Please enter both sector and area of impact to get suggestions');
      setTimeout(() => setMatrixError(null), 3000);
        return;
      }
      
    try {
      setFetchingSuggestions(true);
      
      // Get the impact type and level names
      const impactType = impactTypes.find(t => t.id === type);
      const impactLevel = impactLevels.find(l => l.id === level);
      
      if (!impactType || !impactLevel) {
        throw new Error('Invalid impact type or level');
      }
      
      // Make direct API call to Hugging Face endpoint
      const response = await fetch('https://Prithivi-nanda-EY-catalyst.hf.space/get-bia-matrix-choices', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer your-huggingface-token-here',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          process_name: impactType.process_name,
          impact_type: impactType.name,
          impact_level: impactLevel.name,
          sector: selectedSector
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get suggestions from AI service');
      }
      
      const data = await response.json();
      const choices = data.choices || [];
      
      // Update suggestions state with new choices
      setSuggestions(prev => ({
        ...prev,
        [`${type}-${level}`]: choices
      }));
      
      setFetchingSuggestions(false);
    } catch (err) {
      console.error('Error getting suggestions:', err);
      setMatrixError(err.message || 'Failed to get suggestions');
      setFetchingSuggestions(false);
      setTimeout(() => setMatrixError(null), 3000);
    }
  };
  
  // Apply suggestion to a cell
  const applySuggestion = (typeId, levelId, suggestion) => {
    handleCellChange(typeId, levelId, suggestion);
    
    // Clear suggestions for this cell
    setSuggestions(prev => {
      const newSuggestions = { ...prev };
      delete newSuggestions[`${typeId}-${levelId}`];
      return newSuggestions;
    });
  };
  
  // Save impact matrix
  const saveImpactMatrix = async () => {
    // Only validate impact types that have names
    const namedTypes = impactTypes.filter(type => type.name.trim() !== '');
    console.log("reached here")
    // Check if named impact types have process names
    const missingProcessNames = namedTypes.filter(type => !type.process_name.trim());
    if (missingProcessNames.length > 0) {
      setMatrixError('Please enter an Area of Impact for all named impact types');
      return;
    }
    
    if (!selectedSector) {
      setMatrixError('Please select a sector');
      return;
    }
    
    // Ensure at least one impact type and level is defined
    if (namedTypes.length === 0) {
      setMatrixError('Please define at least one impact type');
      return;
    }
    
    // Only validate impact levels that have names
    const namedLevels = impactLevels.filter(level => level.name.trim() !== '');
    if (namedLevels.length === 0) {
      setMatrixError('Please define at least one impact level');
      return;
    }
    
    try {
      setMatrixLoading(true);
      
      // Get organization ID from token
      const token = localStorage.getItem('access_token');
      let organizationId;
      
      if (token) {
        try {
          // Decode the token to get organization_id
          const decodedToken = decodeToken(token);
          organizationId = decodedToken?.organization_id;
          
          if (!organizationId) {
            throw new Error('Organization ID not found in token');
          }
        } catch (error) {
          console.error('Error decoding token:', error);
          throw new Error('Failed to get organization ID from token');
        }
      } else {
        throw new Error('No authentication token found');
      }
      
      // Filter out cells for unnamed types or levels
      const validCells = matrixCells.filter(cell => {
        const type = impactTypes.find(t => t.id === cell.impact_type);
        const level = impactLevels.find(l => l.id === cell.impact_level);
        return type?.name.trim() !== '' && level?.name.trim() !== '';
      });
      
      // Call the API with the organization ID from the token
      await createOrganizationImpactMatrix(
        organizationId,
        selectedSector,
        validCells,
        impactTypes.reduce((acc, type) => {
          if (type.name.trim() !== '') {
            acc[type.id] = type.name;
          }
          return acc;
        }, {}),
        impactLevels.reduce((acc, level) => {
          if (level.name.trim() !== '') {
            acc[level.id] = level.name;
          }
          return acc;
        }, {}),
        impactTypes.reduce((acc, type) => {
          if (type.name.trim() !== '' && type.process_name.trim() !== '') {
            acc[type.id] = type.process_name;
          }
          return acc;
        }, {})
      );
      
      setMatrixSuccess('Organization impact matrix saved successfully');
      setMatrixLoading(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setMatrixSuccess(null);
        // Navigate back to BIA dashboard after successful save
        navigate('/business-impact-analysis');
      }, 3000);
    } catch (err) {
      setMatrixError(err.message || 'Failed to save impact matrix');
      setMatrixLoading(false);
      setTimeout(() => setMatrixError(null), 3000);
    }
  };

  return (
    <div className="bia-container">
      <div className="bia-content">
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => navigate('/business-impact-analysis')}
            style={{ background: 'none', color: '#FFD700', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 16, textDecoration: 'underline' }}
          >
            ← Back to BIA Dashboard
          </button>
        </div>
        <h2 className="matrix-title">Organization-wide Impact Scale Configuration</h2>
        <p className="matrix-description">
          Configure the impact scale that will be used across all business functions in your organization.
          This will serve as the template for all BIA assessments.
        </p>
        
        <div className="matrix-container">
          <div className="form-row">
            <div className="form-group col-md-6">
              <label htmlFor="sector">Business Sector</label>
              <input
                type="text"
                id="sector"
                name="sector"
                value={selectedSector}
                onChange={handleSectorChange}
                className="form-control"
                placeholder="Enter business sector"
              />
            </div>
            
            {/* Process name is now per row in the matrix */}
          </div>
          
          {matrixError && <div style={{ padding: '10px', marginBottom: '15px', backgroundColor: '#000', color: '#FFD700', borderRadius: '4px', border: '1px solid #FFD700' }}>{matrixError}</div>}
          {matrixSuccess && <div style={{ padding: '10px', marginBottom: '15px', backgroundColor: '#000', color: '#FFD700', borderRadius: '4px', border: '1px solid #FFD700' }}>{matrixSuccess}</div>}
          
          {matrixLoading ? (
            <div className="text-center my-4">
              <div className="spinner-border" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="matrix-table-container">
              <table className="table table-bordered matrix-table">
                <thead>
                  <tr>
                    <th>Impact Type</th>
                    <th>Area of Impact</th>
                    {impactLevels.map((level, index) => (
                      <th key={level.id}>
                        <input
                          type="text"
                          className="form-control"
                          value={level.name}
                          onChange={(e) => handleImpactLevelChange(level.id, e.target.value)}
                          placeholder={`Impact Level ${index}`}
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {impactTypes.map((type, index) => (
                    <tr key={type.id}>
                      <td className="impact-type-cell">
                        <input
                          type="text"
                          className="form-control"
                          value={type.name}
                          onChange={(e) => handleImpactTypeChange(type.id, e.target.value)}
                          placeholder={`Impact Type ${index + 1}`}
                      
                        />
                      </td>
                      <td className="area-of-impact-cell">
                        <input
                          type="text"
                          className="form-control"
                          value={type.process_name}
                          onChange={(e) => handleProcessNameChange(type.id, e.target.value)}
                          placeholder="Enter Area of Impact"
                        />
                      </td>
                      {impactLevels.map(level => {
                        const cell = matrixCells.find(
                          c => c.impact_type === type.id && c.impact_level === level.id
                        ) || { description: '' };
                        
                        const cellKey = `${type.id}-${level.id}`;
                        const hasSuggestions = suggestions[cellKey] && suggestions[cellKey].length > 0;
                        
                        return (
                          <td key={level.id} className="matrix-cell">
                            <textarea
                              value={cell.description || ''}
                              onChange={(e) => handleCellChange(type.id, level.id, e.target.value)}
                              className="form-control matrix-textarea"
                              rows="3"
                              placeholder="Enter description or get suggestions"
                            />
                             
                            <div className="matrix-cell-actions">
                              <button
                                type="button"
                                className="btn btn-sm"
                                onClick={() => getSuggestions(type.id, level.id)}
                                disabled={fetchingSuggestions || !type.name || !level.name || !selectedSector || !type.process_name}
                              >
                                {fetchingSuggestions ? 'Loading...' : 'Get Suggestions'}
                              </button>
                              
                              {hasSuggestions && (
                                <div className="suggestion-dropdown">
                                  <select
                                    className="form-control form-control-sm"
                                    
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        applySuggestion(type.id, level.id, e.target.value);
                                        e.target.value = '';
                                      }
                                    }}
                                  >
                                    <option value="">Select a suggestion</option>
                                    {suggestions[cellKey].map((suggestion, idx) => (
                                      <option key={idx} value={suggestion}>
                                        {suggestion.length > 50 ? `${suggestion.substring(0, 50)}...` : suggestion}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="matrix-actions mt-3">
            <button 
              type="button" 
              className="btn"
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#000', 
                color: '#FFD700', 
                border: '1px solid #FFD700', 
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
              onClick={saveImpactMatrix}
              disabled={matrixLoading || !selectedSector || impactTypes.some(type => type.name && !type.process_name)}
            >
              {matrixLoading ? 'Saving...' : 'Save Organization Impact Matrix'}
            </button>
          </div>
        </div>

        {/* Approval Workflow Section */}
        {(userRole === 'Department Head' ||
          userRole === 'Department Sub Head' ||
          userRole === 'Organization Head' ||
          userRole === 'EY Admin') && pendingApprovals.length > 0 && (
          <div className="approval-workflow-section" style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#1a1a1a',
            border: '1px solid #FFD700',
            borderRadius: '8px'
          }}>
            <h3 style={{ color: '#FFD700', marginBottom: '15px' }}>
              Pending Approvals ({userRole})
            </h3>

            <div className="approval-workflow-hierarchy" style={{
              marginBottom: '20px',
              padding: '10px',
              backgroundColor: '#232323',
              borderRadius: '6px'
            }}>
              <h4 style={{ color: '#FFD700', marginBottom: '10px' }}>Approval Hierarchy</h4>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                {APPROVAL_HIERARCHY.map((role, index) => (
                  <div key={role} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: APPROVAL_HIERARCHY.indexOf(userRole) >= index ? '#FFD700' : '#444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: APPROVAL_HIERARCHY.indexOf(userRole) >= index ? '#000' : '#fff',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {index + 1}
                    </div>
                    <span style={{
                      fontSize: '11px',
                      color: APPROVAL_HIERARCHY.indexOf(userRole) >= index ? '#FFD700' : '#aaa',
                      textAlign: 'center'
                    }}>
                      {role}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pending-approvals-list">
              {pendingApprovals.map(approval => (
                <div key={approval.id} style={{
                  padding: '15px',
                  marginBottom: '10px',
                  backgroundColor: '#232323',
                  border: '1px solid #444',
                  borderRadius: '6px'
                }}>
                  <h4 style={{ color: '#FFD700', marginBottom: '10px' }}>
                    AI Content Edit Request #{approval.id}
                  </h4>

                  <div style={{ marginBottom: '10px' }}>
                    <strong style={{ color: '#fff' }}>Original Content:</strong>
                    <p style={{ color: '#ccc', margin: '5px 0', fontSize: '14px' }}>
                      {approval.original_content}
                    </p>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <strong style={{ color: '#fff' }}>Edited Content:</strong>
                    <p style={{ color: '#FFD700', margin: '5px 0', fontSize: '14px' }}>
                      {approval.edited_content}
                    </p>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <strong style={{ color: '#fff' }}>Reason:</strong>
                    <p style={{ color: '#ccc', margin: '5px 0', fontSize: '14px' }}>
                      {approval.reason}
                    </p>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <strong style={{ color: '#fff' }}>Requested by:</strong>
                    <span style={{ color: '#FFD700', marginLeft: '5px' }}>
                      {approval.requester_username} ({approval.requester_role})
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center'
                  }}>
                    <textarea
                      placeholder="Add comments (optional)"
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: '#333',
                        border: '1px solid #555',
                        borderRadius: '4px',
                        color: '#fff',
                        minHeight: '40px',
                        resize: 'vertical'
                      }}
                      id={`comments-${approval.id}`}
                    />

                    <button
                      onClick={() => {
                        const comments = document.getElementById(`comments-${approval.id}`).value;
                        handleApprovalAction(approval.id, 'approve', comments);
                      }}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#28a745',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      Approve
                    </button>

                    <button
                      onClick={() => {
                        const comments = document.getElementById(`comments-${approval.id}`).value;
                        handleApprovalAction(approval.id, 'reject', comments);
                      }}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#dc3545',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationImpactScale;
