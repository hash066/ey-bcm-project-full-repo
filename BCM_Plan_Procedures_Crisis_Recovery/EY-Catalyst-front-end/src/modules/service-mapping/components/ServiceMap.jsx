import React, { useEffect, useState, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  Handle,
  Position,
} from 'reactflow';
// TODO: Create or import the ProcessDetailModal component
// import ProcessDetailModal from './components/ProcessDetailModal'; // Reusing same modal
import 'reactflow/dist/style.css';
import './ServiceMap.css';
import ServiceMappingTable from './ServiceMappingTable.jsx';


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
      padding: 10,
      borderRadius: 10,
      backgroundColor: data.bgColor || '#ecf0f1',
      color: '#fff',
      minWidth: 180,
      textAlign: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      fontWeight: 'bold',
      position: 'relative',
    }}
  >
    {targetPosition && (
      <Handle
        type="target"
        position={getPositionEnum(targetPosition)}
        style={{ background: '#fff' }}
      />
    )}
    {data.label}
    {sourcePosition && (
      <Handle
        type="source"
        position={getPositionEnum(sourcePosition)}
        style={{ background: '#fff' }}
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
    fetch('/serviceMappingData.json') // 
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
    <div className="dashboard">
      <div className="main-content">
        <h1>Service Mapping</h1>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
        {/* <ProcessDetailModal
          data={selectedNodeData}
          onClose={() => setSelectedNodeData(null)}
        /> */}
        <ServiceMappingTable nodes={nodes} edges={edges} />
      </div>
    </div>
  );
};

export default ServiceMap;
