import React, { useState, useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import '../../../index.css';
import ProcessMap from './process_map.jsx';
import ServiceMap from './ServiceMap.jsx';
import ExportToExcelTab from '../../export/components/ExportToExcelTab.jsx';
import ProcessServiceMaps from './ProcessServiceMaps.jsx';
import FileUpload from './FileUpload.jsx';
import ApiHealthCheck from '../../../common/components/ApiHealthCheck.jsx';
import apiService from '../../../services/apiService.js';

const tabConfig = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'process', label: 'Process Mapping' },
  { key: 'service', label: 'Service Mapping' },
  { key: 'export', label: 'Export' },
];

function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentFileId, setCurrentFileId] = useState(null);

  // Handle flowchart generation from file upload
  const handleFlowchartGenerated = (flowchartData, fileId) => {
    console.log('Flowchart generated from file:', flowchartData);
    
    // The API service now handles response structure, so we expect { nodes, edges }
    const { nodes, edges } = flowchartData;
    
    if (!nodes || !Array.isArray(nodes)) {
      setError('Invalid nodes data structure from API');
      return;
    }
    
    if (!edges || !Array.isArray(edges)) {
      setError('Invalid edges data structure from API');
      return;
    }
    
    // Transform backend nodes to React Flow format
    const transformedNodes = nodes.map(node => {
      const reactFlowNode = apiService.transformNodeToReactFlow(node);
      return {
        ...reactFlowNode,
        data: {
          ...reactFlowNode.data,
          onNodeEdit: (nodeId, newLabel) => {
            setNodes(prev => prev.map(n => 
              n.id === nodeId 
                ? { ...n, data: { ...n.data, label: newLabel } }
                : n
            ));
          }
        }
      };
    });
    
    setNodes(transformedNodes);
    setEdges(edges);
    setCurrentFileId(fileId);
    setError(null);
  };

  // Load sample data when process tab is first accessed
  useEffect(() => {
    if (activeTab === 'process' && nodes.length === 0 && edges.length === 0 && !currentFileId) {
      console.log('Loading static process mapping data from structure.json...');
      setIsLoading(true);
      setError(null);
      
      apiService.getFlowchartData()
        .then((response) => {
          console.log('Static data response:', response);
          
          // The API service now returns static data from structure.json
          const { nodes, edges } = response;
          
          console.log('Extracted nodes:', nodes);
          console.log('Extracted edges:', edges);
          
          if (!nodes || !Array.isArray(nodes)) {
            throw new Error('Invalid nodes data structure from static file');
          }
          
          if (!edges || !Array.isArray(edges)) {
            throw new Error('Invalid edges data structure from static file');
          }
          
          // Transform backend nodes to React Flow format if needed
          const transformedNodes = nodes.map(node => {
            const reactFlowNode = apiService.transformNodeToReactFlow(node);
            return {
              ...reactFlowNode,
              data: {
                ...reactFlowNode.data,
                onNodeEdit: (nodeId, newLabel) => {
                  setNodes(prev => prev.map(n => 
                    n.id === nodeId 
                      ? { ...n, data: { ...n.data, label: newLabel } }
                      : n
                  ));
                }
              }
            };
          });
          
          console.log('Setting transformed nodes and edges...');
          setNodes(transformedNodes);
          setEdges(edges);
          setError(null);
        })
        .catch((err) => {
          console.error('Error loading static data:', err);
          setError('Failed to load process mapping data from static file');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [activeTab, nodes.length, edges.length, currentFileId]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#121212',
      color: '#f1f1f1',
      fontFamily: 'Inter, system-ui, sans-serif',
      position: 'relative',
    }}>
      <ApiHealthCheck />
      <div style={{
        background: 'linear-gradient(90deg, #232526 0%, #414345 100%)',
        padding: '16px 32px',
        borderBottom: '2px solid #FFD700',
        boxShadow: '0 4px 24px #00000044',
      }}>
        <nav style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
        }}>
          {tabConfig.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: '1.5px solid #FFD700',
                background: activeTab === tab.key ? '#232323' : 'transparent',
                color: activeTab === tab.key ? '#FFD700' : '#FFD70099',
                fontWeight: 700,
                fontSize: 15,
                boxShadow: activeTab === tab.key ? '0 2px 8px #FFD70022' : 'none',
                transition: 'all 0.2s',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
              onMouseOver={e => {
                if (activeTab !== tab.key) {
                  e.currentTarget.style.background = '#232323';
                  e.currentTarget.style.color = '#FFD700';
                }
              }}
              onMouseOut={e => {
                if (activeTab !== tab.key) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#FFD700';
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="tab-content" style={{ flex: 1, minHeight: 0 }}>
        {activeTab === 'dashboard' ? (
          <ProcessServiceMaps />
        ) : activeTab === 'process' ? (
          <div style={{ padding: '24px', height: '100%', overflow: 'auto' }}>
            <FileUpload onFlowchartGenerated={handleFlowchartGenerated} />
            
            {isLoading && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px',
                fontSize: '18px',
                color: '#FFD700'
              }}>
                Loading process mapping data...
              </div>
            )}
            {error && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px',
                fontSize: '16px',
                color: '#e74c3c',
                textAlign: 'center'
              }}>
                <div style={{ marginBottom: '10px' }}>⚠️ {error}</div>
                <button
                  onClick={() => {
                    setNodes([]);
                    setEdges([]);
                    setError(null);
                    setCurrentFileId(null);
                  }}
                  style={{
                    padding: '8px 16px',
                    background: '#FFD700',
                    color: '#232526',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Retry
                </button>
              </div>
            )}
            {!isLoading && !error && nodes.length > 0 && (
              <div style={{ height: 'calc(100vh - 400px)', minHeight: '500px' }}>
                <ReactFlowProvider>
                  <ProcessMap nodes={nodes} setNodes={setNodes} edges={edges} setEdges={setEdges} />
                </ReactFlowProvider>
              </div>
            )}
            {!isLoading && !error && nodes.length === 0 && !currentFileId && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px',
                fontSize: '16px',
                color: '#FFD700cc',
                textAlign: 'center'
              }}>
                Upload a document to generate a process mapping flowchart, or use the sample data above.
              </div>
            )}
          </div>
        ) : activeTab === 'service' ? (
          <ServiceMap />
        ) : (
          <ExportToExcelTab />
        )}
      </div>
    </div>
  );
}

export default Dashboard;
