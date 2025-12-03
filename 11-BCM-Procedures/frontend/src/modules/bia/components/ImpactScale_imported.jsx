import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronUp, FaChevronDown, FaSync } from 'react-icons/fa';
import { getImpactMatrix, createImpactMatrix, getOrganizationImpactMatrix } from '../services/biaService';
import { getClients, getDepartments, getSubdepartments } from '../../../services/adminService';
import { decodeToken } from '../../../services/authService';
import '../styles/BIAStyles.css';
import '../styles/ImpactScale.css';

// Mock useAuth hook since we don't have AuthContext
const useAuth = () => {
  const userInfo = decodeToken();
  return { userInfo };
};

const ImpactScale = () => {
  const navigate = useNavigate();
  const { userInfo } = useAuth();
  
  // Gmail-style scrolling state
  const [scrollPosition, setScrollPosition] = useState(0);
  const [autoScroll, setAutoScroll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const contentRef = useRef(null);
  
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

  const handleScroll = () => {
    if (contentRef.current) {
      setScrollPosition(contentRef.current.scrollTop);
    }
  };

  const scrollToTop = () => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const startAutoScroll = () => {
    setAutoScroll(!autoScroll);
  };

  useEffect(() => {
    let interval;
    if (autoScroll && contentRef.current) {
      interval = setInterval(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop += 2;
          if (contentRef.current.scrollTop >= contentRef.current.scrollHeight - contentRef.current.clientHeight) {
            setAutoScroll(false);
          }
        }
      }, 50);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoScroll]);
  
  // Initialize matrix on component mount
  useEffect(() => {
    // Get organization ID from token and load matrix automatically
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const decodedToken = decodeToken(token);
        const organizationId = decodedToken?.organization_id;
        
        if (organizationId) {
          // Load the impact matrix automatically when component mounts
          loadOrganizationImpactMatrix(organizationId);
        } else {
          initializeMatrixCells();
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        setMatrixError('Failed to get organization ID from token');
        initializeMatrixCells();
      }
    } else {
      initializeMatrixCells();
    }
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
      // Use a default client ID since we're not using client selection anymore
      const clientId = userInfo?.client_id || '1';
      loadImpactMatrix(clientId, sector);
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
  
  // Load organization impact matrix from backend
  const loadOrganizationImpactMatrix = async (organizationId) => {
    try {
      setMatrixLoading(true);
      setMatrixError(null);
      
      console.log('Loading organization impact matrix for:', organizationId);
      const matrixData = await getOrganizationImpactMatrix(organizationId);
      console.log('Received matrix data:', matrixData);
      
      if (matrixData) {
        // Set sector if available
        if (matrixData.metadata?.sector) {
          setSelectedSector(matrixData.metadata.sector);
        }
        
        // Set impact types with their areas of impact
        if (matrixData.metadata?.impact_types && matrixData.metadata.impact_types.length > 0) {
          const newImpactTypes = matrixData.metadata.impact_types.map((type, index) => ({
            id: type.id || `type${index}`,
            name: type.name || '',
            process_name: type.area_of_impact || ''
          }));
          
          // Fill remaining slots with empty types
          while (newImpactTypes.length < 5) {
            newImpactTypes.push({ 
              id: `type${newImpactTypes.length}`, 
              name: '', 
              process_name: '' 
            });
          }
          
          setImpactTypes(newImpactTypes);
        }
        
        // Set impact levels
        if (matrixData.metadata?.impact_levels && matrixData.metadata.impact_levels.length > 0) {
          const newImpactLevels = matrixData.metadata.impact_levels.map((level, index) => ({
            id: level.id || `level${index}`,
            name: level.name || ''
          }));
          
          // Fill remaining slots with empty levels
          while (newImpactLevels.length < 5) {
            newImpactLevels.push({ 
              id: `level${newImpactLevels.length}`, 
              name: '' 
            });
          }
          
          setImpactLevels(newImpactLevels);
        }
        
        // Set matrix cells
        if (matrixData.cells && matrixData.cells.length > 0) {
          setMatrixCells(matrixData.cells.map(cell => ({
            impact_type: cell.impact_type,
            impact_level: cell.impact_level,
            description: cell.description || ''
          })));
        }
      }
      
      setMatrixLoading(false);
    } catch (error) {
      console.error('Error loading organization impact matrix:', error);
      setMatrixError(error.message || 'Failed to load impact matrix');
      setMatrixLoading(false);
      setTimeout(() => setMatrixError(null), 3000);
    }
  };

  // Load existing matrix if available (legacy method)
  const loadImpactMatrix = async (clientId, sector) => {
    if (!sector) {
      setMatrixError('Sector is required to load impact matrix');
      setTimeout(() => setMatrixError(null), 3000);
      return;
    }
    
    try {
      setMatrixLoading(true);
      
      const matrixData = await getImpactMatrix(clientId, sector);
      
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
    setMatrixCells(prev => 
      prev.map(cell => 
        cell.impact_type === typeId && cell.impact_level === levelId
          ? { ...cell, description: newDescription }
          : cell
      )
    );
  };

  // Get suggestions for a specific cell
  const getSuggestions = async (type, level) => {
    if (!selectedSector) {
      setMatrixError('Please select a sector first');
      setTimeout(() => setMatrixError(null), 3000);
        return;
      }
      
    try {
      setFetchingSuggestions(true);
      
      // Use a default client ID since we're not using client selection anymore
      const clientId = userInfo?.client_id || '1';
      
      const response = await fetch(`/api/suggestions?client_id=${clientId}&sector=${selectedSector}&impact_type=${type}&impact_level=${level}`);
      
      if (response.ok) {
      const data = await response.json();
        const cellKey = `${type}-${level}`;
      setSuggestions(prev => ({
        ...prev,
          [cellKey]: data.suggestions || []
        }));
      } else {
        setMatrixError('Failed to get suggestions');
        setTimeout(() => setMatrixError(null), 3000);
      }
    } catch (err) {
      setMatrixError('Failed to get suggestions');
      setTimeout(() => setMatrixError(null), 3000);
    } finally {
      setFetchingSuggestions(false);
    }
  };
  
  // Apply a suggestion to a cell
  const applySuggestion = (typeId, levelId, suggestion) => {
    handleCellChange(typeId, levelId, suggestion);
  };
  
  // Save impact matrix
  const saveImpactMatrix = async () => {
    if (!selectedSector) {
      setMatrixError('Please select a sector first');
      setTimeout(() => setMatrixError(null), 3000);
      return;
    }
    
    try {
      setMatrixLoading(true);
      
      // Create impact type and level name mappings
      const impactTypeNames = {};
      impactTypes.forEach(type => {
        impactTypeNames[type.id] = type.name;
      });
      
      const impactLevelNames = {};
      impactLevels.forEach(level => {
        impactLevelNames[level.id] = level.name;
      });
      
      // Use a default client ID since we're not using client selection anymore
      const clientId = userInfo?.client_id || '1';
      // Create a mapping of process names for each impact type
      const processNames = {};
      impactTypes.forEach(type => {
        if (type.name) {
          processNames[type.id] = type.process_name;
        }
      });
      
      await createImpactMatrix(
        clientId,
        selectedSector,
        matrixCells,  // Cells already have the process_name from initialization
        impactTypeNames,
        impactLevelNames,
        processNames
      );
      
      setMatrixSuccess('Impact matrix saved successfully');
      setMatrixLoading(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setMatrixSuccess(null), 3000);
    } catch (err) {
      setMatrixError(err.message || 'Failed to save impact matrix');
      setMatrixLoading(false);
      setTimeout(() => setMatrixError(null), 3000);
    }
  };

  return (
    <div style={{ 
      position: 'relative', 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: '#121212',
    }}>
      {/* Gmail-style scrollable content area */}
      <div 
        ref={contentRef}
        className="tab-content" 
        style={{ 
          flex: 1, 
          minHeight: 0, 
          overflowY: 'auto',
          padding: '8px',
          position: 'relative',
          background: '#121212',
          // Gmail-style smooth scrolling
          scrollBehavior: 'smooth',
          // Custom scrollbar styling
          scrollbarWidth: 'thin',
          scrollbarColor: '#FFD700 #232323',
        }}
        onScroll={handleScroll}
      >
        {/* Custom scrollbar styles */}
        <style>{`
          .tab-content::-webkit-scrollbar {
            width: 8px;
          }
          .tab-content::-webkit-scrollbar-track {
            background: #232323;
            border-radius: 4px;
          }
          .tab-content::-webkit-scrollbar-thumb {
            background: #FFD700;
            border-radius: 4px;
            transition: background 0.3s ease;
          }
          .tab-content::-webkit-scrollbar-thumb:hover {
            background: #facc15;
          }
        `}</style>

        {/* Optimized Loading overlay */}
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#232323',
            color: '#FFD700',
            padding: '12px 20px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 4px 16px #FFD70022',
            border: '1px solid #FFD700',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            animation: 'fadeInOut 0.15s ease-in-out',
          }}>
            <FaSync style={{ animation: 'spin 0.6s linear infinite' }} />
            Loading...
          </div>
        )}

        {/* Main content with optimized animations */}
        <div style={{
          opacity: isLoading ? 0.8 : 1,
          transition: 'opacity 0.15s ease',
          animation: 'fadeIn 0.3s ease-in-out',
        }}>
          <div className="bia-content" style={{
            maxWidth: '100%',
            padding: '0',
            margin: '0',
          }}>
            <h2 className="matrix-title" style={{
              color: '#FFD700',
              fontSize: '16px',
              fontWeight: '700',
              marginBottom: '12px',
              marginTop: '-8px',
              textAlign: 'center',
            }}>Business Impact Analysis - Impact Matrix</h2>
        
            <div className="matrix-container" style={{
              background: '#181818',
              borderRadius: '8px',
              padding: '8px',
              border: '1px solid #333',
            }}>
              <div className="form-row" style={{
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'center',
              }}>
                <div className="form-group" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  alignItems: 'center',
                  maxWidth: '300px',
                  width: '100%',
                }}>
                  <label htmlFor="sector" style={{
                    fontSize: '14px',
                    color: '#FFD700',
                    fontWeight: '600',
                    textAlign: 'center',
                  }}>Business Sector</label>
              <input
                type="text"
                id="sector"
                name="sector"
                value={selectedSector}
                onChange={handleSectorChange}
                className="form-control"
                placeholder="Enter business sector"
                    style={{
                      padding: '8px 12px',
                      fontSize: '14px',
                      borderRadius: '6px',
                      border: '1px solid #333',
                      background: '#232323',
                      color: '#fff',
                      width: '100%',
                      textAlign: 'center',
                    }}
              />
            </div>
          </div>
          
              {matrixError && (
                <div style={{ 
                  padding: '6px 10px', 
                  marginBottom: '8px', 
                  backgroundColor: '#2a1a1a', 
                  color: '#FFD700', 
                  borderRadius: '4px', 
                  border: '1px solid #FFD700',
                  fontSize: '12px',
                }}>
                  {matrixError}
                </div>
              )}
              {matrixSuccess && (
                <div style={{ 
                  padding: '6px 10px', 
                  marginBottom: '8px', 
                  backgroundColor: '#1a2a1a', 
                  color: '#FFD700', 
                  borderRadius: '4px', 
                  border: '1px solid #FFD700',
                  fontSize: '12px',
                }}>
                  {matrixSuccess}
                </div>
              )}
          
          {matrixLoading ? (
                <div style={{
                  textAlign: 'center',
                  padding: '12px',
                  color: '#FFD700',
                }}>
                  Loading matrix...
            </div>
          ) : (
                <div className="matrix-table-container" style={{
                  overflowX: 'auto',
                  borderRadius: '6px',
                  border: '1px solid #333',
                }}>
                  <table className="table table-bordered matrix-table" style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '13px',
                    color: '#fff',
                  }}>
                <thead>
                      <tr style={{
                        background: '#1a1a1a',
                        borderBottom: '2px solid #FFD700',
                      }}>
                        <th style={{
                          padding: '8px',
                          border: '1px solid #333',
                          color: '#000',
                          fontWeight: '700',
                          fontSize: '12px',
                          background: '#FFD700',
                          textTransform: 'none',
                        }}>Impact Type</th>
                        <th style={{
                          padding: '8px',
                          border: '1px solid #333',
                          color: '#000',
                          fontWeight: '700',
                          fontSize: '12px',
                          background: '#FFD700',
                          textTransform: 'none',
                        }}>Area of Impact</th>
                    {impactLevels.map((level, index) => (
                          <th key={level.id} style={{
                            padding: '8px',
                            border: '1px solid #333',
                            color: '#FFD700',
                            fontWeight: '600',
                            fontSize: '13px',
                          }}>
                        <input
                          type="text"
                          className="form-control"
                          value={level.name}
                          onChange={(e) => handleImpactLevelChange(level.id, e.target.value)}
                              placeholder={`Level ${index + 1}`}
                              style={{
                                padding: '4px 6px',
                                fontSize: '12px',
                                borderRadius: '4px',
                                border: '1px solid #333',
                                background: '#1a1a1a',
                                color: '#fff',
                                width: '100%',
                              }}
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {impactTypes.map((type, index) => (
                        <tr key={type.id} style={{
                          background: index % 2 === 0 ? '#1a1a1a' : '#232323',
                        }}>
                          <td className="impact-type-cell" style={{
                            padding: '8px',
                            border: '1px solid #333',
                            verticalAlign: 'top',
                          }}>
                        <input
                          type="text"
                          className="form-control"
                          value={type.name}
                          onChange={(e) => handleImpactTypeChange(type.id, e.target.value)}
                              placeholder={`Type ${index + 1}`}
                              style={{
                                padding: '6px 8px',
                                fontSize: '12px',
                                borderRadius: '4px',
                                border: '1px solid #333',
                                background: '#232323',
                                color: '#fff',
                                width: '100%',
                              }}
                        />
                      </td>
                          <td className="area-of-impact-cell" style={{
                            padding: '8px',
                            border: '1px solid #333',
                            verticalAlign: 'top',
                          }}>
                        <input
                          type="text"
                          className="form-control"
                          value={type.process_name}
                          onChange={(e) => handleProcessNameChange(type.id, e.target.value)}
                              placeholder="Area of Impact"
                              style={{
                                padding: '6px 8px',
                                fontSize: '12px',
                                borderRadius: '4px',
                                border: '1px solid #333',
                                background: '#232323',
                                color: '#fff',
                                width: '100%',
                              }}
                        />
                      </td>
                      {impactLevels.map(level => {
                        const cell = matrixCells.find(
                          c => c.impact_type === type.id && c.impact_level === level.id
                        ) || { description: '' };
                        
                        const cellKey = `${type.id}-${level.id}`;
                        const hasSuggestions = suggestions[cellKey] && suggestions[cellKey].length > 0;
                        
                        return (
                              <td key={level.id} className="matrix-cell" style={{
                                padding: '8px',
                                border: '1px solid #333',
                                verticalAlign: 'top',
                                minWidth: '200px',
                              }}>
                            <textarea
                              value={cell.description || ''}
                              onChange={(e) => handleCellChange(type.id, level.id, e.target.value)}
                              className="form-control matrix-textarea"
                                  rows="2"
                                  placeholder="Enter description"
                                  style={{
                                    padding: '6px 8px',
                                    fontSize: '12px',
                                    borderRadius: '4px',
                                    border: '1px solid #333',
                                    background: '#232323',
                                    color: '#fff',
                                    width: '100%',
                                    resize: 'vertical',
                                    minHeight: '60px',
                                  }}
                            />
                            
                                <div className="matrix-cell-actions" style={{
                                  marginTop: '6px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '4px',
                                }}>
                              <button
                                type="button"
                                className="btn btn-sm"
                                onClick={() => getSuggestions(type.id, level.id)}
                                disabled={fetchingSuggestions || !type.name || !level.name || !selectedSector || !type.process_name}
                                    style={{
                                      padding: '4px 8px',
                                      fontSize: '11px',
                                      background: '#FFD700',
                                      color: '#232323',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontWeight: '600',
                                      opacity: (fetchingSuggestions || !type.name || !level.name || !selectedSector || !type.process_name) ? 0.5 : 1,
                                    }}
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
                                        style={{
                                          padding: '4px 6px',
                                          fontSize: '11px',
                                          borderRadius: '4px',
                                          border: '1px solid #333',
                                          background: '#1a1a1a',
                                          color: '#fff',
                                          width: '100%',
                                        }}
                                  >
                                        <option value="">Select suggestion</option>
                                    {suggestions[cellKey].map((suggestion, idx) => (
                                      <option key={idx} value={suggestion}>
                                            {suggestion.length > 40 ? `${suggestion.substring(0, 40)}...` : suggestion}
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
          
              <div className="matrix-actions" style={{
                marginTop: '12px',
                display: 'flex',
                justifyContent: 'flex-end',
              }}>
            <button 
              type="button" 
              className="btn"
              style={{ 
                padding: '10px 20px', 
                    backgroundColor: '#FFD700', 
                    color: '#232323', 
                    border: 'none', 
                    borderRadius: '6px',
                cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '14px',
              }}
              onClick={saveImpactMatrix}
              disabled={matrixLoading || !selectedSector || impactTypes.some(type => type.name && !type.process_name)}
            >
              {matrixLoading ? 'Saving...' : 'Save Impact Matrix'}
            </button>
          </div>
        </div>
          </div>
        </div>

        {/* Gmail-style scroll indicators */}
        {scrollPosition > 200 && (
          <button
            onClick={scrollToTop}
            style={{
              position: 'fixed',
              bottom: 100,
              right: 30,
              background: '#232323',
              color: '#FFD700',
              border: '1px solid #FFD700',
              borderRadius: '50%',
              width: 50,
              height: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 1000,
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 16px #FFD70022',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#FFD700';
              e.currentTarget.style.color = '#232323';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#232323';
              e.currentTarget.style.color = '#FFD700';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <FaChevronUp />
          </button>
        )}

        {/* Auto-scroll button */}
        <button
          onClick={startAutoScroll}
          style={{
            position: 'fixed',
            bottom: 30,
            right: 30,
            background: autoScroll ? '#FFD700' : '#232323',
            color: autoScroll ? '#232323' : '#FFD700',
            border: '1px solid #FFD700',
            borderRadius: '50%',
            width: 50,
            height: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 1000,
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 16px #FFD70022',
          }}
          onMouseEnter={(e) => {
            if (!autoScroll) {
              e.currentTarget.style.background = '#FFD700';
              e.currentTarget.style.color = '#232323';
              e.currentTarget.style.transform = 'scale(1.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (!autoScroll) {
              e.currentTarget.style.background = '#232323';
              e.currentTarget.style.color = '#FFD700';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          <FaChevronDown />
        </button>

        {/* CSS Animations */}
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes fadeInOut {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default ImpactScale;
