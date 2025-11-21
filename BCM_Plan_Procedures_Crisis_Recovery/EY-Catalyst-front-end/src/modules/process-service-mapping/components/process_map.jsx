import React, { useEffect, useState, useCallback, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  Handle,
  Position,
  addEdge,
} from 'reactflow';
import ProcessDetailModal from '../../../common/components/ProcessDetailModal.jsx';
import 'reactflow/dist/style.css';
import '../../../index.css';
import { FaProjectDiagram, FaPlus, FaMinus, FaUndo, FaLock, FaUnlock, FaEdit, FaTrash } from 'react-icons/fa';
import apiService from '../../../services/apiService.js';

const getPositionEnum = (pos) => {
  const positionMap = {
    top: Position.Top,
    bottom: Position.Bottom,
    left: Position.Left,
    right: Position.Right,
  };
  return positionMap[pos] || Position.Bottom;
};

const CustomNode = ({ data, sourcePosition, targetPosition, id, selected }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    data.onNodeEdit(id, editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(data.label);
    setIsEditing(false);
  };

  return (
    <div
      style={{
        padding: 8,
        borderRadius: 10,
        backgroundColor: data.bgColor || '#232526',
        color: '#FFD700',
        minWidth: 140,
        textAlign: 'center',
        boxShadow: selected ? '0 4px 16px #FFD70044' : '0 2px 8px #FFD70022',
        fontWeight: 'bold',
        position: 'relative',
        fontSize: '0.95rem',
        border: selected ? '2px solid #FFD700' : '1.5px solid #FFD700',
        margin: 2,
        cursor: 'pointer',
      }}
    >
      {targetPosition && (
        <Handle
          type="target"
          position={getPositionEnum(targetPosition)}
          style={{ background: '#FFD700' }}
        />
      )}
      
      {isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            style={{
              background: '#232323',
              border: '1px solid #FFD700',
              color: '#FFD700',
              padding: '4px 8px',
              borderRadius: 4,
              fontSize: '0.9rem',
              textAlign: 'center'
            }}
            autoFocus
          />
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
            <button
              onClick={handleSave}
              style={{
                background: '#27ae60',
                border: 'none',
                color: 'white',
                padding: '2px 6px',
                borderRadius: 3,
                fontSize: '0.7rem',
                cursor: 'pointer'
              }}
            >
              ✓
            </button>
            <button
              onClick={handleCancel}
              style={{
                background: '#e74c3c',
                border: 'none',
                color: 'white',
                padding: '2px 6px',
                borderRadius: 3,
                fontSize: '0.7rem',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <div>{data.label}</div>
      )}
      
      {sourcePosition && (
        <Handle
          type="source"
          position={getPositionEnum(sourcePosition)}
          style={{ background: '#FFD700' }}
        />
      )}
      
      {/* Edit button */}
      {selected && !isEditing && (
        <button
          onClick={handleEdit}
          style={{
            position: 'absolute',
            top: -8,
            right: -8,
            background: '#FFD700',
            border: 'none',
            borderRadius: '50%',
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '0.7rem',
            color: '#232323'
          }}
          title="Edit node"
        >
          <FaEdit />
        </button>
      )}
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

const ProcessMap = ({ nodes, setNodes, edges, setEdges }) => {
  const [selectedNodeData, setSelectedNodeData] = useState(null);
  const [showMissingNodePrompt, setShowMissingNodePrompt] = useState(false);
  const [missingNodePosition, setMissingNodePosition] = useState(null);
  const [newNodeName, setNewNodeName] = useState('');
  const [isZoomLocked, setIsZoomLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const reactFlowInstance = useRef(null);

  // Comment out missing data handling - use dummy data instead
  /*
  const expectedHierarchy = [
    'ceo', 'reportees', 'cxo', 'projectsponsor', 'bcm', 
    'servicename1', 'servicename2', 'servicename3',
    'backend1', 'backend2', 'backend3',
    'depthead1', 'depthead2', 'depthead3',
    'subdepthead1', 'subdepthead2', 'subdepthead3', 'subdepthead4', 'subdepthead5', 'subdepthead6',
    'processowner1', 'processowner2', 'processowner3', 'processowner4', 'processowner5', 'processowner6',
    'subprocessowner1', 'subprocessowner2', 'subprocessowner3', 'subprocessowner4', 'subprocessowner5', 'subprocessowner6'
  ];

  const checkMissingNodes = useCallback(() => {
    const existingNodeIds = nodes.map(node => node.id);
    const missingNodes = expectedHierarchy.filter(id => !existingNodeIds.includes(id));
    
    if (missingNodes.length > 0) {
      const firstMissing = missingNodes[0];
      const position = expectedHierarchy.indexOf(firstMissing);
      setMissingNodePosition({ id: firstMissing, position });
      setShowMissingNodePrompt(true);
    }
  }, [nodes]);

  useEffect(() => {
    if (nodes.length > 0) {
      checkMissingNodes();
    }
  }, [checkMissingNodes, nodes.length]);
  */

  // Use dummy data instead of checking for missing nodes
  // const [showMissingNodePrompt, setShowMissingNodePrompt] = useState(false);
  // const [missingNodePosition, setMissingNodePosition] = useState(null);
  // const [newNodeName, setNewNodeName] = useState('');

  // Set loading to false when nodes are loaded
  useEffect(() => {
    if (nodes.length > 0) {
      setIsLoading(false);
    }
  }, [nodes.length]);

  const onNodesChange = useCallback(
    (changes) => {
      try {
        if (!isZoomLocked) {
          setNodes((nds) => applyNodeChanges(changes, nds));
        }
      } catch (error) {
        console.error('Error updating nodes:', error);
        setError('Failed to update nodes');
      }
    },
    [setNodes, isZoomLocked]
  );

  const onEdgesChange = useCallback(
    (changes) => {
      try {
        setEdges((eds) => applyEdgeChanges(changes, eds));
      } catch (error) {
        console.error('Error updating edges:', error);
        setError('Failed to update edges');
      }
    },
    [setEdges]
  );

  const onNodeClick = useCallback(async (event, node) => {
    try {
      // Use local node data instead of calling API to avoid backend crashes
      setSelectedNodeData(node.data);
      
      /*
      // Comment out API call to avoid backend crashes
      // Try to get detailed node information from API
      try {
        const nodeDetails = await apiService.getNodeDetails(node.id);
        setSelectedNodeData({
          ...node.data,
          ...nodeDetails,
          // Merge API data with existing node data
          label: nodeDetails.name || node.data.label,
          role: nodeDetails.role || node.data.role,
          head: {
            name: nodeDetails.details?.contact_info?.name || node.data.head?.name || '',
            email: nodeDetails.details?.contact_info?.email || node.data.head?.email || '',
            contact: nodeDetails.details?.contact_info?.phone || node.data.head?.contact || ''
          },
          owner: {
            name: nodeDetails.details?.owner?.name || node.data.owner?.name || '',
            email: nodeDetails.details?.owner?.email || node.data.owner?.email || '',
            contact: nodeDetails.details?.owner?.phone || node.data.owner?.contact || ''
          },
          department: nodeDetails.details?.department || node.data.department || '',
          subDepartment: nodeDetails.details?.sub_department || node.data.subDepartment || '',
          description: nodeDetails.details?.description || node.data.description || '',
          notes: nodeDetails.details?.context || node.data.notes || ''
        });
      } catch (apiError) {
        console.warn('Could not fetch node details from API, using local data:', apiError);
        setSelectedNodeData(node.data);
      }
      */
    } catch (error) {
      console.error('Error handling node click:', error);
      setSelectedNodeData(node.data);
    }
  }, []);

  const onConnect = useCallback(
    (params) => {
      try {
        setEdges((eds) => addEdge(params, eds));
      } catch (error) {
        console.error('Error connecting nodes:', error);
      }
    },
    [setEdges]
  );

  const onInit = useCallback((instance) => {
    try {
      reactFlowInstance.current = instance;
    } catch (error) {
      console.error('Error initializing ReactFlow:', error);
    }
  }, []);

  // Comment out missing data handling - use dummy data instead
  /*
  const handleAddMissingNode = () => {
    if (!newNodeName.trim()) return;
    
    const newNode = {
      id: missingNodePosition.id,
      type: 'custom',
      position: { x: 150 * missingNodePosition.position + 50, y: 300 },
      data: {
        label: newNodeName,
        bgColor: '#95a5a6',
        role: `Role for ${newNodeName}`,
        notes: `Notes for ${newNodeName}`,
        head: {
          name: `Manager ${newNodeName}`,
          email: `${newNodeName.toLowerCase()}@company.com`,
          contact: `+1-555-${String(missingNodePosition.position + 100).padStart(4, '0')}`
        },
        onNodeEdit: handleNodeEdit
      },
      sourcePosition: 'right',
      targetPosition: 'left'
    };
    
    setNodes(prev => [...prev, newNode]);
    
    // Add edge to previous node if exists
    if (missingNodePosition.position > 0) {
      const prevNodeId = expectedHierarchy[missingNodePosition.position - 1];
      const prevNode = nodes.find(n => n.id === prevNodeId);
      if (prevNode) {
        const newEdge = {
          id: `e-${prevNodeId}-${missingNodePosition.id}`,
          source: prevNodeId,
          target: missingNodePosition.id,
          animated: true,
          style: { stroke: '#95a5a6', strokeWidth: 2 }
        };
        setEdges(prev => [...prev, newEdge]);
      }
    }
    
    // Add edge to next node if exists
    if (missingNodePosition.position < expectedHierarchy.length - 1) {
      const nextNodeId = expectedHierarchy[missingNodePosition.position + 1];
      const nextNode = nodes.find(n => n.id === nextNodeId);
      if (nextNode) {
        const newEdge = {
          id: `e-${missingNodePosition.id}-${nextNodeId}`,
          source: missingNodePosition.id,
          target: nextNodeId,
          animated: true,
          style: { stroke: '#95a5a6', strokeWidth: 2 }
        };
        setEdges(prev => [...prev, newEdge]);
      }
    }
    
    setNewNodeName('');
    setShowMissingNodePrompt(false);
    setMissingNodePosition(null);
  };
  */

  const handleNodeEdit = useCallback((nodeId, newLabel) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, data: { ...node.data, label: newLabel } }
        : node
    ));
  }, [setNodes]);

  const handleAddNewNode = () => {
    const newNodeId = `custom-${Date.now()}`;
    const newNode = {
      id: newNodeId,
      type: 'custom',
      position: { x: Math.random() * 800 + 100, y: Math.random() * 400 + 100 },
      data: {
        label: 'New Node',
        bgColor: '#95a5a6',
        role: 'Custom Role',
        notes: 'Custom notes',
        head: {
          name: 'Custom Manager',
          email: 'custom@company.com',
          contact: '+1-555-9999'
        },
        onNodeEdit: handleNodeEdit
      },
      sourcePosition: 'right',
      targetPosition: 'left'
    };
    
    setNodes(prev => [...prev, newNode]);
  };

  const handleDeleteNode = useCallback((nodeId) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setEdges(prev => prev.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
  }, [setNodes, setEdges]);

  const handleZoomIn = () => {
    if (!isZoomLocked && reactFlowInstance.current) {
      reactFlowInstance.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (!isZoomLocked && reactFlowInstance.current) {
      reactFlowInstance.current.zoomOut();
    }
  };

  const handleResetView = () => {
    if (!isZoomLocked && reactFlowInstance.current) {
      reactFlowInstance.current.fitView();
    }
  };

  const toggleZoomLock = () => {
    setIsZoomLocked(!isZoomLocked);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div style={{ 
        width: '100%', 
        height: '70vh', 
        display: 'flex', 
        flexDirection: 'column',
        maxWidth: 1050, 
        margin: '0 auto',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12,
          background: 'linear-gradient(90deg, #232526 0%, #FFD700 100%)',
          borderRadius: 10, boxShadow: '0 3px 20px #FFD70022', padding: '10px 20px',
          flexShrink: 0,
          border: '2px solid #FFD700',
        }}>
          <FaProjectDiagram style={{ fontSize: 20, color: '#FFD700', filter: 'drop-shadow(0 2px 8px #FFD70088)' }} />
          <h1 style={{ color: '#FFD700', fontWeight: 800, fontSize: 20, letterSpacing: 1, margin: 0 }}>Process Mapping</h1>
        </div>
        <div style={{ color: '#FFD700', fontSize: 16 }}>Loading process mapping...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div style={{ 
        width: '100%', 
        height: '70vh', 
        display: 'flex', 
        flexDirection: 'column',
        maxWidth: 1050, 
        margin: '0 auto',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12,
          background: 'linear-gradient(90deg, #232526 0%, #FFD700 100%)',
          borderRadius: 10, boxShadow: '0 3px 20px #FFD70022', padding: '10px 20px',
          flexShrink: 0,
          border: '2px solid #FFD700',
        }}>
          <FaProjectDiagram style={{ fontSize: 20, color: '#FFD700', filter: 'drop-shadow(0 2px 8px #FFD70088)' }} />
          <h1 style={{ color: '#FFD700', fontWeight: 800, fontSize: 20, letterSpacing: 1, margin: 0 }}>Process Mapping</h1>
        </div>
        <div style={{ color: '#e74c3c', fontSize: 16 }}>Error: {error}</div>
        <button 
          onClick={() => setError(null)}
          style={{
            marginTop: 16,
            padding: '8px 16px',
            background: '#FFD700',
            color: '#232323',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Show empty state if no nodes
  if (!nodes || nodes.length === 0) {
    return (
      <div style={{ 
        width: '100%', 
        height: '70vh', 
        display: 'flex', 
        flexDirection: 'column',
        maxWidth: 1050, 
        margin: '0 auto',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12,
          background: 'linear-gradient(90deg, #232526 0%, #FFD700 100%)',
          borderRadius: 10, boxShadow: '0 3px 20px #FFD70022', padding: '10px 20px',
          flexShrink: 0,
          border: '2px solid #FFD700',
        }}>
          <FaProjectDiagram style={{ fontSize: 20, color: '#FFD700', filter: 'drop-shadow(0 2px 8px #FFD70088)' }} />
          <h1 style={{ color: '#FFD700', fontWeight: 800, fontSize: 20, letterSpacing: 1, margin: 0 }}>Process Mapping</h1>
        </div>
        <div style={{ color: '#FFD700', fontSize: 16, marginBottom: 16 }}>No process mapping data available</div>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 16px',
            background: '#FFD700',
            color: '#232323',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100%', 
      height: '70vh', 
      display: 'flex', 
      flexDirection: 'column',
      maxWidth: 1050, 
      margin: '0 auto'
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12,
        background: 'linear-gradient(90deg, #232526 0%, #FFD700 100%)',
        borderRadius: 10, boxShadow: '0 3px 20px #FFD70022', padding: '10px 20px',
        flexShrink: 0,
        border: '2px solid #FFD700',
      }}>
        <FaProjectDiagram style={{ fontSize: 20, color: '#FFD700', filter: 'drop-shadow(0 2px 8px #FFD70088)' }} />
        <h1 style={{ color: '#FFD700', fontWeight: 800, fontSize: 20, letterSpacing: 1, margin: 0 }}>Process Mapping</h1>
      </div>
      
      <div style={{
        background: 'linear-gradient(120deg, #181818 0%, #232526 100%)',
        borderRadius: 10,
        boxShadow: '0 6px 24px #FFD70022',
        padding: 12,
        flex: 1,
        position: 'relative',
        minHeight: 0,
        border: '2px solid #232323',
      }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onConnect={onConnect}
          onInit={onInit}
          nodeTypes={nodeTypes}
          fitView
          style={{ 
            background: '#111',
            borderRadius: 8,
            height: '100%',
            border: '2px solid #232323',
          }}
        >
          <Background color="#FFD700" gap={24} />
          <Controls showZoom={false} showFitView={false} showInteractive={false} />
        </ReactFlow>
        
        {/* Custom Zoom Controls */}
        <div style={{
          position: 'absolute',
          top: 12,
          right: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 10,
        }}>
          <button
            onClick={handleZoomIn}
            disabled={isZoomLocked}
            style={{
              background: isZoomLocked ? '#666' : '#232323',
              color: '#FFD700',
              border: '1px solid #FFD700',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isZoomLocked ? 'not-allowed' : 'pointer',
              fontSize: 12
            }}
            title="Zoom In"
          >
            <FaPlus />
          </button>
          <button
            onClick={handleZoomOut}
            disabled={isZoomLocked}
            style={{
              background: isZoomLocked ? '#666' : '#232323',
              color: '#FFD700',
              border: '1px solid #FFD700',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isZoomLocked ? 'not-allowed' : 'pointer',
              fontSize: 12
            }}
            title="Zoom Out"
          >
            <FaMinus />
          </button>
          <button
            onClick={handleResetView}
            disabled={isZoomLocked}
            style={{
              background: isZoomLocked ? '#666' : '#232323',
              color: '#FFD700',
              border: '1px solid #FFD700',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isZoomLocked ? 'not-allowed' : 'pointer',
              fontSize: 12
            }}
            title="Reset View"
          >
            <FaUndo />
          </button>
          <button
            onClick={toggleZoomLock}
            style={{
              background: isZoomLocked ? '#e74c3c' : '#232323',
              color: '#FFD700',
              border: '1px solid #FFD700',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 12
            }}
            title={isZoomLocked ? "Unlock Zoom" : "Lock Zoom"}
          >
            {isZoomLocked ? <FaLock /> : <FaUnlock />}
          </button>
        </div>
        
        {/* Add Node Button */}
        <button
          onClick={handleAddNewNode}
          style={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            background: 'linear-gradient(90deg, #232526 0%, #FFD700 100%)',
            color: '#FFD700',
            border: 'none',
            borderRadius: '50%',
            width: 40,
            height: 40,
            boxShadow: '0 3px 12px #FFD70044',
            fontSize: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
          }}
          title="Add New Node"
        >
          <FaPlus />
        </button>
      </div>
      
      {/* Missing Node Prompt - Commented out to use dummy data instead */}
      {/*
      {showMissingNodePrompt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#232323',
            padding: 24,
            borderRadius: 12,
            border: '2px solid #FFD700',
            minWidth: 400,
            textAlign: 'center',
          }}>
            <h3 style={{ color: '#FFD700', marginBottom: 16 }}>
              Missing Node at Position {missingNodePosition.position + 1}
            </h3>
            <p style={{ color: '#f1f1f1', marginBottom: 16 }}>
              Please add the missing node: <strong>{missingNodePosition.id}</strong>
            </p>
            <input
              type="text"
              value={newNodeName}
              onChange={(e) => setNewNodeName(e.target.value)}
              placeholder="Enter node name"
              style={{
                width: '100%',
                padding: '8px 12px',
                marginBottom: 16,
                background: '#181818',
                border: '1px solid #FFD700',
                borderRadius: 6,
                color: '#f1f1f1',
                fontSize: 14,
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleAddMissingNode()}
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={handleAddMissingNode}
                style={{
                  padding: '8px 16px',
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                Add Node
              </button>
              <button
                onClick={() => {
                  setShowMissingNodePrompt(false);
                  setMissingNodePosition(null);
                  setNewNodeName('');
                }}
                style={{
                  padding: '8px 16px',
                  background: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      */}
      
      <ProcessDetailModal
        data={selectedNodeData}
        onClose={() => setSelectedNodeData(null)}
        onDelete={selectedNodeData ? () => handleDeleteNode(selectedNodeData.id) : null}
      />
    </div>
  );
};

export default ProcessMap;
