import React from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import './ProcessDependencyTable.css';

const ProcessDependencyTable = ({ nodes }) => {
  const processNodes = nodes.filter((node) =>
    node.data.label?.toLowerCase().startsWith('process')
  );

  const exportToExcel = () => {
    const data = processNodes.map((node) => ({
      'Process Name': node.data.label,
      'Description': node.data.description || '',
      'Owner': node.data.owner?.name || '',
      'Email': node.data.owner?.email || '',
      'Sub-Processes': (node.data.subProcesses || []).join(', ')
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Process Mapping');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(dataBlob, 'process_mapping.xlsx');
  };

  return (
    <div className="process-table">
      <h2>Process Dependency Information</h2>
      <table>
        <thead>
          <tr>
            <th>Process Name</th>
            <th>Description</th>
            <th>Owner</th>
            <th>Email</th>
            <th>Sub-Processes</th>
          </tr>
        </thead>
        <tbody>
          {processNodes.map((node) => (
            <tr key={node.id}>
              <td>{node.data.label}</td>
              <td>{node.data.description || '—'}</td>
              <td>{node.data.owner?.name || '—'}</td>
              <td>{node.data.owner?.email || '—'}</td>
              <td>{(node.data.subProcesses || []).join(', ') || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="export-button" onClick={exportToExcel}>
        Export to Excel
      </button>
    </div>
  );
};

export default ProcessDependencyTable;
