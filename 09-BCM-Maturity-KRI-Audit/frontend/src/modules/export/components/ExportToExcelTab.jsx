import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { FaFileExcel, FaTable } from 'react-icons/fa';

const ExportToExcelTab = () => {
  const [processNodes, setProcessNodes] = useState([]);
  const [serviceNodes, setServiceNodes] = useState([]);
  const [view, setView] = useState('process'); // 'process' or 'service'

  useEffect(() => {
    // Fetch process mapping data
    fetch('/structure.json')
      .then((res) => res.json())
      .then(({ nodes }) => setProcessNodes(nodes || []))
      .catch(() => setProcessNodes([]));
    // Fetch service mapping data
    fetch('/serviceMappingData.json')
      .then((res) => res.json())
      .then(({ nodes }) => setServiceNodes(nodes || []))
      .catch(() => setServiceNodes([]));
  }, []);

  const extractFields = (node, type) => {
    const d = node.data || {};
    const head = d.head || d.manager || {};
    const owner = d.owner || {};
    const subProcesses = d.subProcesses || [];
    return {
      Type: type,
      Label: d.label || '',
      Description: d.description || '',
      'Head/Manager Name': head.name || '',
      'Head/Manager Email': head.email || '',
      'Head/Manager Contact': head.contact || '',
      'Owner Name': owner.name || '',
      'Owner Email': owner.email || '',
      'Sub-Processes': subProcesses.join(', ')
    };
  };

  const handleExport = () => {
    const rows = [];
    processNodes.forEach((node) => rows.push(extractFields(node, 'Process')));
    serviceNodes.forEach((node) => rows.push(extractFields(node, 'Service')));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ExportedDetails');
    XLSX.writeFile(workbook, 'Process_Service_Export.xlsx');
  };

  const renderTable = (nodes, type) => {
    const columns = [
      'Type', 'Label', 'Description',
      'Head/Manager Name', 'Head/Manager Email', 'Head/Manager Contact',
      'Owner Name', 'Owner Email',
      'Sub-Processes'
    ];
    return (
      <div style={{
        background: '#181818',
        borderRadius: 12,
        boxShadow: '0 4px 24px #00000044',
        padding: 0,
        marginTop: 8,
        border: '1.5px solid #232323',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <style>{`
          .export-table {
            width: 100%;
            min-width: 1200px;
            border-collapse: separate;
            border-spacing: 0;
            font-size: 14px;
            color: #f1f1f1;
            background: transparent;
            table-layout: auto;
          }
          .export-table th {
            padding: 12px 8px;
            font-weight: 700;
            color: #FFD700;
            background: #232323;
            border-bottom: 2px solid #FFD700;
            transition: background 0.2s, color 0.2s;
            white-space: nowrap;
            font-size: 13px;
          }
          .export-table td {
            padding: 10px 8px;
            border-bottom: 1px solid #232323;
            border-left: 1px solid #232323;
            background: none;
            transition: background 0.2s, color 0.2s;
            max-width: 200px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 13px;
          }
          .export-table tr {
            transition: background 0.2s;
          }
          .export-table tbody tr:hover {
            background: #222 !important;
            color: #FFD700;
          }
          .export-table thead tr:hover {
            background: #232323 !important;
            color: #FFD700;
          }
          .table-container {
            overflow-y: auto;
            overflow-x: auto;
            height: 100%;
            scrollbar-width: thin;
            scrollbar-color: #FFD700 #232323;
          }
          .table-container::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          .table-container::-webkit-scrollbar-track {
            background: #232323;
            border-radius: 4px;
          }
          .table-container::-webkit-scrollbar-thumb {
            background: #FFD700;
            border-radius: 4px;
            transition: background 0.3s ease;
          }
          .table-container::-webkit-scrollbar-thumb:hover {
            background: #facc15;
          }
        `}</style>
        <div className="table-container">
        <table className="export-table">
          <thead>
            <tr>
              {columns.map((col) => <th key={col}>{col}</th>)}
            </tr>
          </thead>
          <tbody>
            {nodes.length === 0 && (
              <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: 24, color: '#FFD700', background: '#232323' }}>No data available.</td></tr>
            )}
            {nodes.map((node, idx) => {
              const row = extractFields(node, type);
              return (
                <tr key={idx} style={{ background: idx % 2 === 0 ? '#232323' : '#181818' }}>
                  {columns.map((col) => (
                    <td key={col} title={row[col]}>{row[col]}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '0 0 20px 0', background: '#121212', height: '100vh', width: '100%', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
        background: '#232323',
        borderRadius: 12, boxShadow: '0 4px 24px #00000044', padding: '12px 24px',
        border: '1.5px solid #FFD700',
        width: '100%',
        minWidth: 0,
        marginLeft: 0,
        marginRight: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <FaFileExcel style={{ fontSize: 24, color: '#FFD700', filter: 'drop-shadow(0 2px 8px #FFD70088)' }} />
          <h2 style={{ color: '#FFD700', fontWeight: 800, fontSize: 22, letterSpacing: 1, margin: 0, textAlign: 'center' }}>Export to Excel</h2>
        </div>
      </div>
      <p style={{ color: '#FFD700cc', marginBottom: 16, fontWeight: 500, fontSize: 14, marginLeft: 16 }}>{'Export all Process and Service Mapping details to Excel. The data below matches the Excel export format.'}</p>
      <button onClick={handleExport} style={{ padding: '10px 24px', background: '#232323', color: '#FFD700', border: '1.5px solid #FFD700', borderRadius: 8, fontWeight: 800, cursor: 'pointer', marginBottom: 20, fontSize: 14, boxShadow: '0 2px 8px #00000044', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s', marginLeft: 16 }}
        onMouseOver={e => {
          e.currentTarget.style.background = '#FFD700';
          e.currentTarget.style.color = '#232323';
          // Update icon color to be visible on yellow background
          const icon = e.currentTarget.querySelector('svg');
          if (icon) icon.style.color = '#232323';
        }}
        onMouseOut={e => {
          e.currentTarget.style.background = '#232323';
          e.currentTarget.style.color = '#FFD700';
          // Reset icon color
          const icon = e.currentTarget.querySelector('svg');
          if (icon) icon.style.color = '#FFD700';
        }}
        onFocus={e => {
          e.currentTarget.style.background = '#FFD700';
          e.currentTarget.style.color = '#232323';
          const icon = e.currentTarget.querySelector('svg');
          if (icon) icon.style.color = '#232323';
        }}
        onBlur={e => {
          e.currentTarget.style.background = '#232323';
          e.currentTarget.style.color = '#FFD700';
          const icon = e.currentTarget.querySelector('svg');
          if (icon) icon.style.color = '#FFD700';
        }}
      >
        <FaFileExcel style={{ color: '#FFD700', fontSize: 16 }} /> Export All to Excel
      </button>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, width: '100%', marginLeft: 16 }}>
        <button
          onClick={() => setView('process')}
          style={{
            padding: '8px 20px',
            borderRadius: 6,
            border: '1.5px solid #FFD700',
            background: view === 'process' ? '#232323' : 'transparent',
            color: view === 'process' ? '#FFD700' : '#FFD70099',
            fontWeight: 700,
            fontSize: 13,
            boxShadow: view === 'process' ? '0 2px 8px #FFD70022' : 'none',
            transition: 'all 0.2s',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            width: 160,
          }}
          onMouseOver={e => { if (view !== 'process') { e.currentTarget.style.background = '#232323'; e.currentTarget.style.color = '#FFD700'; }}}
          onMouseOut={e => { if (view !== 'process') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#FFD70099'; }}}
        >
          <FaTable style={{ fontSize: 14 }} /> Process Mapping
        </button>
        <button
          onClick={() => setView('service')}
          style={{
            padding: '8px 20px',
            borderRadius: 6,
            border: '1.5px solid #FFD700',
            background: view === 'service' ? '#232323' : 'transparent',
            color: view === 'service' ? '#FFD700' : '#FFD70099',
            fontWeight: 700,
            fontSize: 13,
            boxShadow: view === 'service' ? '0 2px 8px #FFD70022' : 'none',
            transition: 'all 0.2s',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            width: 160,
          }}
          onMouseOver={e => { if (view !== 'service') { e.currentTarget.style.background = '#232323'; e.currentTarget.style.color = '#FFD700'; }}}
          onMouseOut={e => { if (view !== 'service') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#FFD70099'; }}}
        >
          <FaTable style={{ fontSize: 14 }} /> Service Mapping
        </button>
      </div>
      <h3 style={{ marginTop: 0, color: '#FFD700', fontWeight: 700, fontSize: 16, letterSpacing: 0.5, marginLeft: 16, marginBottom: 12 }}>{view === 'process' ? 'Process Mapping Data' : 'Service Mapping Data'}</h3>
      <div style={{ width: '100%', minWidth: 0, marginLeft: 0, marginRight: 0, flex: 1, overflow: 'hidden' }}>{view === 'process' ? renderTable(processNodes, 'Process') : renderTable(serviceNodes, 'Service')}</div>
    </div>
  );
};

export default ExportToExcelTab; 