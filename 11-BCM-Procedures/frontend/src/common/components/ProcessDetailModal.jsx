import React from 'react';
import * as XLSX from 'xlsx';
import './ProcessDetailModal.css';

const ProcessDetailModal = ({ data, onClose }) => {
  if (!data) return null;

  const head = data.head || data.manager || {};
  const owner = data.owner || {};
  const subDepartment = data.subDepartment || null;

  const handleExport = () => {
    const rows = [];

    rows.push({
      Label: data.label,
      Description: data.description || '',
      'Process Owner': owner.name || head.name || '',
      'Owner Email': owner.email || head.email || '',
      'Contact': head.contact || '',
    });

    if (data.subProcesses && data.subProcesses.length > 0) {
      data.subProcesses.forEach((sp, i) => {
        rows.push({ [`Sub-process ${i + 1}`]: sp });
      });
    }

    if (subDepartment) {
      rows.push({
        'Sub-Department': subDepartment.label,
        'SubDept Head Name': subDepartment.head?.name || '',
        'SubDept Email': subDepartment.head?.email || '',
        'SubDept Contact': subDepartment.head?.contact || '',
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ProcessDetails');

    XLSX.writeFile(workbook, `${data.label.replace(/\s+/g, '_')}_Details.xlsx`);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <button className="close-btn" onClick={onClose}>&times;</button>
        <h2 className="modal-title">{data.label}</h2>

        {data.description && (
          <div className="modal-section">
            <h4>Description</h4>
            <p>{data.description}</p>
          </div>
        )}

        {data.subProcesses?.length > 0 && (
          <div className="modal-section">
            <h4>Sub-Processes</h4>
            <ul>
              {data.subProcesses.map((sp, idx) => (
                <li key={idx}>{sp}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="modal-section">
          <h4>{data.owner ? 'Process Owner' : head.title || 'Head'}</h4>
          <p><strong>Name:</strong> {owner.name || head.name || 'N/A'}</p>
          <p><strong>Email:</strong> {owner.email || head.email || 'N/A'}</p>
          <p><strong>Contact:</strong> {head.contact || 'N/A'}</p>
        </div>

        {subDepartment && (
          <div className="modal-section">
            <h4>Sub-Department</h4>
            <p><strong>Label:</strong> {subDepartment.label}</p>
            <p><strong>Name:</strong> {subDepartment.head?.name}</p>
            <p><strong>Email:</strong> {subDepartment.head?.email}</p>
            <p><strong>Contact:</strong> {subDepartment.head?.contact}</p>
          </div>
        )}

        <div className="modal-footer">
          <button className="export-btn" onClick={handleExport}>Export to Excel</button>
        </div>
      </div>
    </div>
  );
};

export default ProcessDetailModal;
