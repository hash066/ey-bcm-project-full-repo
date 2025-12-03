import React, { useEffect, useState, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  Handle,
  Position,
} from 'reactflow';
import ProcessDetailModal from '../../../common/components/ProcessDetailModal.jsx';
import 'reactflow/dist/style.css';
import '../../../index.css';
import { FaSitemap } from 'react-icons/fa';


const getPositionEnum = (pos) => {
  const positionMap = {
    top: Position.Top,
    bottom: Position.Bottom,
    left: Position.Left,
    right: Position.Right,
  };
  return positionMap[pos] || Position.Bottom;
};

const CustomNode = ({ data, sourcePosition, targetPosition }) => (
  <div
    style={{
      padding: 8,
      borderRadius: 10,
      backgroundColor: data.bgColor || '#232526',
      color: '#FFD700',
      minWidth: 140,
      textAlign: 'center',
      boxShadow: '0 2px 8px #FFD70022',
      fontWeight: 'bold',
      position: 'relative',
      fontSize: '0.95rem',
      border: '1.5px solid #FFD700',
      margin: 2,
    }}
  >
    {targetPosition && (
      <Handle
        type="target"
        position={getPositionEnum(targetPosition)}
        style={{ background: '#FFD700' }}
      />
    )}
    {data.label}
    {sourcePosition && (
      <Handle
        type="source"
        position={getPositionEnum(sourcePosition)}
        style={{ background: '#FFD700' }}
      />
    )}
  </div>
);

const nodeTypes = { custom: CustomNode };

const ServiceMap = () => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNodeData, setSelectedNodeData] = useState(null);

  useEffect(() => {
    fetch('/serviceMappingData.json') // revert to original static JSON
      .then((res) => res.json())
      .then(({ nodes, edges }) => {
        setNodes(nodes);
        setEdges(edges);
      })
      .catch((err) => {
        console.error('Error loading serviceMappingData.json:', err);
      });
  }, []);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNodeData(node.data);
  }, []);

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
        <FaSitemap style={{ fontSize: 20, color: '#FFD700', filter: 'drop-shadow(0 2px 8px #FFD70088)' }} />
        <h1 style={{ color: '#FFD700', fontWeight: 800, fontSize: 20, letterSpacing: 1, margin: 0 }}>Service Mapping</h1>
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
          <Controls />
        </ReactFlow>
        {/* Floating Action Button for future features */}
        <button
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
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
          }}
          title="Add or Edit (coming soon)"
          disabled
        >
          +
        </button>
      </div>
      <ProcessDetailModal
        data={selectedNodeData}
        onClose={() => setSelectedNodeData(null)}
      />
    </div>
  );
};

export default ServiceMap;
