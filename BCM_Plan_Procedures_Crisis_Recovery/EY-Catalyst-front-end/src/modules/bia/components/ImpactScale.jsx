import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronUp, FaChevronDown, FaSync } from 'react-icons/fa';
import { getImpactMatrix, createImpactMatrix, getOrganizationImpactMatrix, createOrganizationImpactMatrix } from '../services/biaService';
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
  
  // Debug effect to monitor matrixCells changes
  useEffect(() => {
    console.log('matrixCells state updated:', matrixCells);
    // Check if cells exist for specific type/level combinations
    if (matrixCells.length > 0 && impactTypes.length > 0 && impactLevels.length > 0) {
      const typeId = impactTypes[0].id;
      impactLevels.forEach(level => {
        if (level.name) {
          const cell = matrixCells.find(c => 
            c.impact_type_id === typeId && c.impact_level_id === level.id
          );
          console.log(`DEBUG CHECK - Cell for ${typeId}/${level.id}:`, cell);
        }
      });
    }
  }, [matrixCells]);

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
          console.log('Found organization ID in token:', organizationId);
          // Load the impact matrix automatically when component mounts
          loadOrganizationImpactMatrix(organizationId);
        } else {
          console.warn('No organization ID found in token, initializing empty matrix');
          initializeMatrixCells();
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        setMatrixError('Failed to get organization ID from token');
        initializeMatrixCells();
      }
    } else {
      console.warn('No access token found, initializing empty matrix');
      initializeMatrixCells();
    }
  }, []);

  // Initialize matrix cells when impact types and levels change
  useEffect(() => {
    initializeMatrixCells();
  }, [impactTypes, impactLevels]);
  
  // Initialize matrix cells with empty values
  const initializeMatrixCells = () => {
    console.log('Initializing matrix cells');
    const cells = [];
    
    // Create a cell for each impact type and level combination
    impactTypes.forEach(type => {
      if (type.name) {
        impactLevels.forEach(level => {
          if (level.name) {
            cells.push({
              impactTypeId: type.id,
              impactLevelId: level.id,
              description: ''
            });
          }
        });
      }
    });
    
    console.log('Initialized cells:', cells);
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
  
  // Handle cell description change
  const handleCellChange = (typeId, levelId, description) => {
    console.log(`Updating cell: type=${typeId}, level=${levelId}, description=${description}`);
    
    // Create a copy of the current cells
    const updatedCells = [...matrixCells];
    
    // Try to find an existing cell with these exact IDs
    const existingCellIndex = updatedCells.findIndex(
      cell => cell.impact_type_id === typeId && cell.impact_level_id === levelId
    );
    
    if (existingCellIndex !== -1) {
      // Update existing cell
      console.log(`Found existing cell at index ${existingCellIndex}, updating description`);
      updatedCells[existingCellIndex] = {
        ...updatedCells[existingCellIndex],
        description
      };
    } else {
      // Add new cell with the correct property names
      console.log(`No existing cell found, adding new cell`);
      updatedCells.push({
        impact_type_id: typeId,
        impact_level_id: levelId,
        description
      });
    }
    
    console.log('Updated cells:', updatedCells);
    setMatrixCells(updatedCells);
  };

  // Helper function to find a cell description
  const getCellDescription = (typeId, levelId) => {
    // First try to find a cell with impact_type_id and impact_level_id
    const cell = matrixCells.find(
      c => c.impact_type_id === typeId && c.impact_level_id === levelId
    );
    
    if (cell) {
      return cell.description || '';
    }
    
    // If not found, return empty string
    return '';
  };

  // Load organization impact matrix from backend
  const loadOrganizationImpactMatrix = async (organizationId) => {
    try {
      setMatrixLoading(true);
      setMatrixError(null);
      
      console.log('Loading organization impact matrix for:', organizationId);
      
      const matrixData = await getOrganizationImpactMatrix(organizationId);
      console.log('Received matrix data:', JSON.stringify(matrixData, null, 2));
      
      // Extract the actual data if it's nested in a data property
      const actualData = matrixData.data || matrixData;
      console.log('Actual data to process:', JSON.stringify(actualData, null, 2));
      
      if (actualData) {
        // Store the raw cells data for direct access
        window.rawCellsData = actualData.cells || [];
        console.log('Raw cells data stored in window.rawCellsData');
        
        // Set impact types with their areas of impact
        if (Array.isArray(actualData.impact_types) && actualData.impact_types.length > 0) {
          // New format: array of impact types
          const newImpactTypes = actualData.impact_types.map((type) => {
            return {
              id: type.id,
              name: type.name || '',
              process_name: type.area_of_impact || ''
            };
          });
          
          // Fill remaining slots with empty types
          while (newImpactTypes.length < 5) {
            newImpactTypes.push({ 
              id: `type${newImpactTypes.length}`, 
              name: '', 
              process_name: '' 
            });
          }
          
          console.log('Setting impact types:', newImpactTypes);
          setImpactTypes(newImpactTypes);
        } else if (actualData.impact_types) {
          // Handle old format (object with keys)
          const types = Object.keys(actualData.impact_types);
          const newImpactTypes = types.map((type, index) => ({
            id: type,
            name: actualData.impact_types[type],
            process_name: actualData.areas_of_impact?.[type] || ''
          }));
          
          // Fill remaining slots with empty types
          while (newImpactTypes.length < 5) {
            newImpactTypes.push({ 
              id: `type${newImpactTypes.length}`, 
              name: '', 
              process_name: '' 
            });
          }
          
          console.log('Setting impact types (old format):', newImpactTypes);
          setImpactTypes(newImpactTypes);
        }
        
        // Set impact levels
        if (Array.isArray(actualData.impact_levels) && actualData.impact_levels.length > 0) {
          // New format: array of impact levels
          const newImpactLevels = actualData.impact_levels.map((level) => {
            return {
              id: level.id,
              name: level.name || ''
            };
          });
          
          // Fill remaining slots with empty levels
          while (newImpactLevels.length < 5) {
            newImpactLevels.push({ 
              id: `level${newImpactLevels.length}`, 
              name: '' 
            });
          }
          
          console.log('Setting impact levels:', newImpactLevels);
          setImpactLevels(newImpactLevels);
        } else if (actualData.impact_levels) {
          // Handle old format (object with keys)
          const levels = Object.keys(actualData.impact_levels);
          const newImpactLevels = levels.map((level, index) => ({
            id: level,
            name: actualData.impact_levels[level]
          }));
          
          // Fill remaining slots with empty levels
          while (newImpactLevels.length < 5) {
            newImpactLevels.push({ 
              id: `level${newImpactLevels.length}`, 
              name: '' 
            });
          }
          
          console.log('Setting impact levels (old format):', newImpactLevels);
          setImpactLevels(newImpactLevels);
        }
        
        // Set matrix cells
        if (Array.isArray(actualData.cells) && actualData.cells.length > 0) {
          // Map cells directly from the API response
          const mappedCells = actualData.cells.map(cell => {
            console.log('Processing cell:', cell);
            return {
              impact_type_id: cell.impact_type_id || cell.impact_type,
              impact_level_id: cell.impact_level_id || cell.impact_level,
              description: cell.description || ''
            };
          });
          
          console.log('Setting matrix cells:', JSON.stringify(mappedCells, null, 2));
          
          // Verify that cells are properly mapped
          mappedCells.forEach(cell => {
            console.log(`Cell mapped: type=${cell.impact_type_id}, level=${cell.impact_level_id}, desc=${cell.description}`);
          });
          
          // Set the state with the mapped cells
          setMatrixCells(mappedCells);
          
          // Also store in a global variable for debugging
          window.debugMatrixCells = mappedCells;
          
          // Debug log all cells for each type and level
          if (mappedCells.length > 0) {
            console.log('Cell mapping check:');
            const impactTypeIds = [...new Set(mappedCells.map(c => c.impact_type_id))];
            const impactLevelIds = [...new Set(mappedCells.map(c => c.impact_level_id))];
            
            impactTypeIds.forEach(typeId => {
              impactLevelIds.forEach(levelId => {
                const cell = mappedCells.find(c => 
                  c.impact_type_id === typeId && c.impact_level_id === levelId
                );
                console.log(`Cell for ${typeId}/${levelId}:`, cell);
              });
            });
          }
        } else if (actualData.cells) {
          // Handle old format (object with nested objects)
          const mappedCells = [];
          
          Object.keys(actualData.cells).forEach(typeId => {
            Object.keys(actualData.cells[typeId]).forEach(levelId => {
              mappedCells.push({
                impact_type_id: typeId,
                impact_level_id: levelId,
                description: actualData.cells[typeId][levelId]
              });
            });
          });
          
          console.log('Setting matrix cells (old format):', mappedCells);
          setMatrixCells(mappedCells);
        } else {
          // Initialize empty cells if none provided
          console.log('No cells found in response, initializing empty cells');
          initializeMatrixCells();
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

  useEffect(() => {
    if (window.rawCellsData) {
      setMatrixCells(window.rawCellsData);
    }
  }, [window.rawCellsData]);

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
    try {
      setMatrixLoading(true);
      
      // Get organization ID from token
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const decodedToken = decodeToken(token);
      const organizationId = decodedToken?.organization_id;
      
      if (!organizationId) {
        throw new Error('No organization ID found in token');
      }
      
      // Prepare impact matrix data
      const impactMatrixData = {
        impact_types: impactTypes
          .filter(type => type.name) // Only include types with names
          .map(type => ({
            id: type.id,
            name: type.name,
            area_of_impact: type.process_name
          })),
        impact_levels: impactLevels
          .filter(level => level.name) // Only include levels with names
          .map(level => ({
            id: level.id,
            name: level.name
          })),
        cells: matrixCells
          .filter(cell => {
            // Only include cells for valid types and levels
            const typeExists = impactTypes.some(t => t.id === cell.impactTypeId && t.name);
            const levelExists = impactLevels.some(l => l.id === cell.impactLevelId && l.name);
            return typeExists && levelExists && cell.description;
          })
          .map(cell => ({
            impactTypeId: cell.impactTypeId,
            impactLevelId: cell.impactLevelId,
            description: cell.description
          }))
      };
      
      console.log('Saving impact matrix:', impactMatrixData);
      
      // Save to backend
      await createOrganizationImpactMatrix(organizationId, impactMatrixData);
      
      setMatrixLoading(false);
      alert('Impact matrix saved successfully');
    } catch (error) {
      console.error('Error saving impact matrix:', error);
      setMatrixError(error.message || 'Failed to save impact matrix');
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
                  {/* Removed business sector field */}
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
                        {impactLevels.map((level, index) => level.name && (
                          <th key={level.id} style={{
                            padding: '8px',
                            border: '1px solid #333',
                            color: '#000',
                            fontWeight: '700',
                            fontSize: '12px',
                            background: '#FFD700',
                            textTransform: 'none',
                          }}>
                            <input
                              type="text"
                              value={level.name}
                              onChange={(e) => handleImpactLevelChange(level.id, e.target.value)}
                              placeholder="Enter impact level"
                              style={{
                                width: '100%',
                                padding: '4px 6px',
                                fontSize: '12px',
                                borderRadius: '4px',
                                border: '1px solid #333',
                                background: '#FFD700',
                                color: '#000',
                              }}
                            />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {impactTypes.map((type, typeIndex) => type.name && (
                        <tr key={`row-${typeIndex}`}>
                          <td style={{
                            padding: '8px',
                            border: '1px solid #333',
                            background: '#1a1a1a',
                          }}>
                            <input
                              type="text"
                              value={type.name}
                              onChange={(e) => handleImpactTypeChange(type.id, e.target.value)}
                              placeholder="Enter impact type"
                              style={{
                                width: '100%',
                                padding: '8px',
                                background: '#232323',
                                border: '1px solid #444',
                                borderRadius: '4px',
                                color: '#fff'
                              }}
                            />
                          </td>
                          <td style={{
                            padding: '8px',
                            border: '1px solid #333',
                            background: '#1a1a1a',
                          }}>
                            <input
                              type="text"
                              value={type.process_name || ''}
                              onChange={(e) => handleProcessNameChange(type.id, e.target.value)}
                              placeholder="Area of impact"
                              style={{
                                width: '100%',
                                padding: '8px',
                                background: '#232323',
                                border: '1px solid #444',
                                borderRadius: '4px',
                                color: '#fff',
                                fontSize: '12px'
                              }}
                            />
                          </td>
                          {impactLevels.map(level => level.name && (
                            <td key={`cell-${type.id}-${level.id}`} style={{
                              padding: '8px',
                              border: '1px solid #333',
                              background: '#1a1a1a',
                            }}>
                              {/* Debug button to check cell data */}
                              <button 
                                onClick={() => {
                                  console.log('DEBUG - All matrix cells:', matrixCells);
                                  console.log('DEBUG - Looking for cell with type:', type.id, 'level:', level.id);
                                  const foundCell = matrixCells.find(c => 
                                    c.impact_type_id === type.id && c.impact_level_id === level.id
                                  );
                                  console.log('DEBUG - Found cell:', foundCell);
                                }}
                                style={{
                                  position: 'absolute',
                                  top: '2px',
                                  right: '2px',
                                  padding: '2px',
                                  fontSize: '8px',
                                  background: '#333',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '2px',
                                  cursor: 'pointer'
                                }}
                              >
                                Debug
                              </button>
                              <textarea
                                value={getCellDescription(type.id, level.id)}
                                onChange={(e) => handleCellChange(type.id, level.id, e.target.value)}
                                placeholder="Enter description"
                                style={{
                                  width: '100%',
                                  padding: '8px',
                                  background: '#232323',
                                  border: '1px solid #444',
                                  borderRadius: '4px',
                                  color: '#fff',
                                  resize: 'vertical',
                                  minHeight: '80px'
                                }}
                              />
                            </td>
                          ))}
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
