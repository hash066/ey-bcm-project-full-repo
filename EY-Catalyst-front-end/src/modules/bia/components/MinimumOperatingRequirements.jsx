import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FaIdBadge } from 'react-icons/fa';
import { useBIAData } from '../BIADataContext';
import { getCriticalVendors, getMinimumOperatingRequirements, saveMinimumOperatingRequirement } from '../services/biaService';

const initialRow = {
  criticalProcessName: '',
  primarySPOC: '',
  fallbackSPOC: '',
  numCriticalResources: '',
  numCriticalResourcesOutsourced: '',
  processDependencyInternal: '',
  processDependencyExternal: '',
  itApplications: '',
  vendorName: '',
  appRPO: '',
  numWorkstations: '',
  numITAssets: '',
  softwareNames: '',
  generalAssets: '',
  internetIntranet: '',
};

const yesNoOptions = [
  { value: '', label: 'Select' },
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
];

const columns = [
  { label: 'Critical Processes Name', key: 'criticalProcessName' },
  { label: 'Primary SPOC', key: 'primarySPOC' },
  { label: 'Fallback SPOC', key: 'fallbackSPOC' },
  { label: 'No of Critical Resources (Personnel)', key: 'numCriticalResources' },
  { label: 'No of Critical Resources (Outsourced)', key: 'numCriticalResourcesOutsourced' },
  { label: 'Process Dependency (Internal)', key: 'processDependencyInternal' },
  { label: 'Process Dependency (External)', key: 'processDependencyExternal' },
  { label: 'IT Applications Supporting the Processes', key: 'itApplications' },
  { label: 'Vendor Name in Case of Vendor Managed Application', key: 'vendorName' },
  { label: 'Application RPO Required by Business', key: 'appRPO' },
  { label: 'Number of Workstations Required', key: 'numWorkstations' },
  { label: 'Number of IT Assets (Laptop)', key: 'numITAssets' },
  { label: 'Names of Software Required in the Desktop/Laptop', key: 'softwareNames' },
  { label: 'General Assets (Telephones, FAX machines, Printers, Scanner)', key: 'generalAssets' },
  { label: 'Internet/Intranet (Yes/No)', key: 'internetIntranet', type: 'select', options: yesNoOptions },
];

function RowModal({ row, onClose, editMode, onSave, onCancel }) {
  const { criticalProcesses, vendors, spocs } = useBIAData();
  const [form, setForm] = React.useState(row);
  React.useEffect(() => { setForm(row); }, [row]);
  const [isEditing, setIsEditing] = React.useState(editMode);
  React.useEffect(() => { setIsEditing(editMode); }, [editMode]);
  // Update columns to use context for dropdowns
  const yesNoOptions = [
    { value: '', label: 'Select' },
    { value: 'Yes', label: 'Yes' },
    { value: 'No', label: 'No' },
  ];
  const columns = [
    { label: 'Critical Processes Name', key: 'criticalProcessName', type: 'readonly' },
    { label: 'Primary SPOC', key: 'primarySPOC', type: 'readonly' },
    { label: 'Fallback SPOC', key: 'fallbackSPOC' },
    { label: 'No of Critical Resources (Personnel)', key: 'numCriticalResources' },
    { label: 'No of Critical Resources (Outsourced)', key: 'numCriticalResourcesOutsourced' },
    { label: 'Process Dependency (Internal)', key: 'processDependencyInternal' },
    { label: 'Process Dependency (External)', key: 'processDependencyExternal' },
    { label: 'IT Applications Supporting the Processes', key: 'itApplications' },
    { label: 'Vendor Name in Case of Vendor Managed Application', key: 'vendorName' },
    { label: 'Application RPO Required by Business', key: 'appRPO' },
    { label: 'Number of Workstations Required', key: 'numWorkstations' },
    { label: 'Number of IT Assets (Laptop)', key: 'numITAssets' },
    { label: 'Names of Software Required in the Desktop/Laptop', key: 'softwareNames' },
    { label: 'General Assets (Telephones, FAX machines, Printers, Scanner)', key: 'generalAssets' },
    { label: 'Internet/Intranet (Yes/No)', key: 'internetIntranet', type: 'select', options: yesNoOptions },
  ];
  // Auto-populate SPOC fields if a process is selected
  React.useEffect(() => {
    const selectedProcess = criticalProcesses.find(p => p.name === form.criticalProcessName);
    if (selectedProcess && isEditing) {
      setForm(f => ({
        ...f,
        primarySPOC: selectedProcess.spoc || f.primarySPOC,
        fallbackSPOC: selectedProcess.fallbackSpoc || f.fallbackSPOC,
      }));
    }
    // eslint-disable-next-line
  }, [form.criticalProcessName]);
  return ReactDOM.createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.75)',
      zIndex: 20000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflowY: 'auto',
      animation: 'fadeInModal 0.25s',
    }}>
      <style>{`
        @keyframes fadeInModal {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div style={{
        background: 'linear-gradient(135deg, #181818 80%, #232323 100%)',
        color: '#FFD700',
        borderRadius: 18,
        minWidth: 350,
        maxWidth: 700,
        width: '98vw',
        maxHeight: '92vh',
        padding: '0 0 32px 0',
        boxShadow: '0 0 0 4px #FFD700, 0 8px 32px #000a',
        position: 'relative',
        border: '2.5px solid #FFD700',
        animation: 'fadeInModal 0.25s',
        zIndex: 20001,
        margin: '40px auto',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#232323',
          padding: '22px 36px 16px 32px',
          borderBottom: '1.5px solid #FFD700',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <FaIdBadge style={{ color: '#FFD700', fontSize: 26 }} />
            <span style={{ color: '#FFD700', fontWeight: 800, fontSize: 22, letterSpacing: 1 }}>{isEditing ? 'Edit Minimum Operating Requirement' : 'Minimum Operating Requirement'}</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#FFD700',
              fontSize: 32,
              fontWeight: 900,
              cursor: 'pointer',
              marginLeft: 12,
              marginTop: -4,
              transition: 'color 0.2s',
            }}
            aria-label="Close"
            title="Close"
          >×</button>
        </div>
        <div style={{ margin: '0', padding: '0 0 0 0', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 18 }}>
            <tbody>
              {columns.map((f, idx) => (
                <tr key={f.label} style={{ background: idx % 2 === 0 ? '#232323' : '#181818' }}>
                  <td style={{
                    padding: '18px 28px',
                    color: '#FFD700',
                    fontWeight: 700,
                    fontSize: 17,
                    borderBottom: '1px solid #232323',
                    width: '38%',
                    whiteSpace: 'nowrap',
                  }}>{f.label}</td>
                  <td style={{
                    padding: '18px 28px',
                    color: '#fff',
                    fontWeight: 500,
                    fontSize: 17,
                    borderBottom: '1px solid #232323',
                    width: '62%',
                    wordBreak: 'break-word',
                  }}>
                    {isEditing ? (
                      f.type === 'readonly' ? (
                        <input
                          style={{ width: '100%', padding: '14px', borderRadius: 8, border: '2px solid #FFD700', background: '#232323', color: '#FFD700', fontSize: 17 }}
                          value={form[f.key]}
                          readOnly
                          disabled
                        />
                      ) : f.type === 'select' ? (
                        <select
                          style={{ width: '100%', padding: '14px', borderRadius: 8, border: '2px solid #FFD700', background: '#181818', color: '#FFD700', fontSize: 17 }}
                          value={form[f.key]}
                          onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                        >
                          {(f.options || []).map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          style={{ width: '100%', padding: '14px', borderRadius: 8, border: '2px solid #FFD700', background: '#181818', color: '#FFD700', fontSize: 17 }}
                          value={form[f.key]}
                          onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                        />
                      )
                    ) : (
                      form[f.key] || '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: isEditing ? 'flex-end' : 'flex-end', gap: 16, margin: '28px 36px 0 36px' }}>
          {isEditing ? (
            <>
              <button
                onClick={() => { setIsEditing(false); onCancel && onCancel(); }}
                style={{ background: '#232323', color: '#FFD700', border: '2px solid #FFD700', borderRadius: 8, fontWeight: 700, fontSize: 17, padding: '12px 32px', cursor: 'pointer' }}
              >Cancel</button>
              <button
                onClick={() => { setIsEditing(false); onSave && onSave(form); }}
                style={{ background: '#FFD700', color: '#232323', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 17, padding: '12px 32px', cursor: 'pointer' }}
              >Save</button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              style={{ background: '#FFD700', color: '#232323', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 17, padding: '12px 32px', cursor: 'pointer' }}
            >Edit</button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function MinimumOperatingRequirements() {
  const [rows, setRows] = useState([]);
  const [criticalProcesses, setCriticalProcesses] = useState([]);
  const [spocs, setSpocs] = useState([]);
  const [viewRow, setViewRow] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editRowIdx, setEditRowIdx] = useState(null);

    useEffect(() => {
    Promise.all([getCriticalVendors(), getMinimumOperatingRequirements()]).then(([criticalProcs, morRows]) => {
      // For each process, pick the latest MOR by created_at/updated_at
      const latestMorMap = {};
      morRows.forEach(row => {
        if (!latestMorMap[row.process_id] || new Date(row.updated_at || row.created_at) > new Date(latestMorMap[row.process_id].updated_at || latestMorMap[row.process_id].created_at)) {
          latestMorMap[row.process_id] = row;
        }
      });
      setRows(criticalProcs.map(proc => {
        const mor = latestMorMap[proc.bia_process_info_id];
        return {
          criticalProcessName: proc.process_name,
          processId: proc.process_id,
          biaProcessInfoId: proc.bia_process_info_id,
          spoc: proc.spoc,
          description: proc.description,
          peakPeriod: proc.peak_period,
          reviewStatus: proc.review_status,
          createdAt: proc.created_at,
          updatedAt: proc.updated_at,
          // Fill from MOR if exists, else blank
          primarySPOC: mor ? mor.primary_spoc : proc.spoc,
          fallbackSPOC: mor ? mor.fallback_spoc : proc.spoc,
          numCriticalResources: mor ? mor.num_critical_resources : '',
          numCriticalResourcesOutsourced: mor ? mor.num_critical_resources_outsourced : '',
          processDependencyInternal: mor ? mor.process_dependency_internal : '',
          processDependencyExternal: mor ? mor.process_dependency_external : '',
          itApplications: mor ? mor.it_applications : '',
          vendorName: mor ? mor.vendor_name : '',
          appRPO: mor ? mor.app_rpo : '',
          numWorkstations: mor ? mor.num_workstations : '',
          numITAssets: mor ? mor.num_it_assets : '',
          softwareNames: mor ? mor.software_names : '',
          generalAssets: mor ? mor.general_assets : '',
          internetIntranet: mor ? (mor.internet_intranet ? 'Yes' : 'No') : '',
          id: mor ? mor.id : Date.now() + Math.random(),
        };
      }));
      setCriticalProcesses(criticalProcs);
      setSpocs([...new Set(criticalProcs.map(p => p.spoc).filter(Boolean))]);
    });
  }, []);

  const addRow = () => {
    setRows(rows => [...rows, { ...initialRow, id: Date.now() }]);
  };
  const removeRow = idx => {
    setRows(rows => rows.filter((_, i) => i !== idx));
    if (editRowIdx === idx) {
      setEditRowIdx(null);
      setViewRow(null);
      setEditMode(false);
    }
  };
  const openView = (row) => {
    setViewRow(row);
    setEditMode(false);
  };
  const startEdit = idx => {
    setEditRowIdx(idx);
    setViewRow(rows[idx]);
    setEditMode(true);
  };
  const saveEdit = async (updatedRow) => {
    // Map frontend fields to backend fields
    const payload = {
      process_id: updatedRow.biaProcessInfoId,
      primary_spoc: updatedRow.primarySPOC,
      fallback_spoc: updatedRow.fallbackSPOC,
      num_critical_resources: parseInt(updatedRow.numCriticalResources) || null,
      num_critical_resources_outsourced: parseInt(updatedRow.numCriticalResourcesOutsourced) || null,
      process_dependency_internal: updatedRow.processDependencyInternal,
      process_dependency_external: updatedRow.processDependencyExternal,
      it_applications: updatedRow.itApplications,
      vendor_name: updatedRow.vendorName,
      app_rpo: updatedRow.appRPO,
      num_workstations: parseInt(updatedRow.numWorkstations) || null,
      num_it_assets: parseInt(updatedRow.numITAssets) || null,
      software_names: updatedRow.softwareNames,
      general_assets: updatedRow.generalAssets,
      internet_intranet: updatedRow.internetIntranet === 'Yes' ? true : false,
    };
    try {
      await saveMinimumOperatingRequirement(payload);
      alert('Minimum operating requirement saved successfully!');
      // Re-fetch MOR details and update the table
      const morRows = await getMinimumOperatingRequirements();
      // Pick latest for each process_id
      const latestMorMap = {};
      morRows.forEach(row => {
        if (!latestMorMap[row.process_id] || new Date(row.updated_at || row.created_at) > new Date(latestMorMap[row.process_id].updated_at || latestMorMap[row.process_id].created_at)) {
          latestMorMap[row.process_id] = row;
        }
      });
      setRows(rows => rows.map((row) => {
        const mor = latestMorMap[row.biaProcessInfoId];
        return mor
          ? {
              ...row,
              primarySPOC: mor.primary_spoc,
              fallbackSPOC: mor.fallback_spoc,
              numCriticalResources: mor.num_critical_resources,
              numCriticalResourcesOutsourced: mor.num_critical_resources_outsourced,
              processDependencyInternal: mor.process_dependency_internal,
              processDependencyExternal: mor.process_dependency_external,
              itApplications: mor.it_applications,
              vendorName: mor.vendor_name,
              appRPO: mor.app_rpo,
              numWorkstations: mor.num_workstations,
              numITAssets: mor.num_it_assets,
              softwareNames: mor.software_names,
              generalAssets: mor.general_assets,
              internetIntranet: mor.internet_intranet ? 'Yes' : 'No',
            }
          : row;
      }));
      setEditRowIdx(null);
      setViewRow(null);
      setEditMode(false);
    } catch (err) {
      alert('Failed to save minimum operating requirement: ' + err.message);
    }
  };
  const cancelEdit = () => {
    setEditRowIdx(null);
    setViewRow(null);
    setEditMode(false);
  };

  return (
    <div className="bia-form-container" style={{ position: 'relative', minHeight: 400 }}>
      <h2 style={{ color: '#FFD700', marginBottom: 20 }}>Minimum Operating Requirements</h2>
      <div className="table-container" style={{ borderRadius: 12, boxShadow: '0 4px 24px #00000044', padding: 0, marginTop: 8, border: '1.5px solid #232323', width: '100%', overflowX: 'auto', background: 'transparent' }}>
        <style>{`
          .export-table {
            width: 100%;
            min-width: 1400px;
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
            max-width: 220px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 13px;
          }
          .export-table tr {
            transition: background 0.2s;
          }
          .export-table tbody tr:hover td, .export-table tbody tr:hover th, .clickable-row:hover td, .clickable-row:hover th {
            background: #FFD700 !important;
            color: #232323 !important;
            cursor: pointer;
            transition: background 0.15s, color 0.15s;
          }
          .table-container {
            overflow-y: auto;
            overflow-x: auto;
            scrollbar-width: thin;
            scrollbar-color: #FFD700 #232323;
            width: 100%;
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
        <table className="export-table" style={{ minWidth: 1400 }}>
          <thead>
            <tr>
              <th style={{ minWidth: 50 }}>S. No.</th>
              {columns.map(col => (
                <th key={col.key} style={{ minWidth: 120 }}>{col.label}</th>
              ))}
              <th style={{ minWidth: 120 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.id || idx}
                className={'clickable-row'}
                onClick={e => {
                  if (
                    e.target.tagName !== 'BUTTON' &&
                    e.target.tagName !== 'svg' &&
                    e.target.tagName !== 'path'
                  ) {
                    openView(row);
                  }
                }}
              >
                <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                {columns.map(col => (
                  <td key={col.key}>{row[col.key]}</td>
                ))}
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button type="button" className="btn-sm" style={{ background: '#232323', color: '#FFD700', border: '1px solid #FFD700', borderRadius: 4, fontWeight: 700, cursor: 'pointer', marginLeft: 6 }} onClick={e => { e.stopPropagation(); removeRow(idx); }} disabled={rows.length === 1}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        className="btn-sm"
        style={{ background: '#FFD700', color: '#232323', border: 'none', borderRadius: 4, fontWeight: 700, cursor: 'pointer', marginBottom: 10, marginTop: 16 }}
        onClick={addRow}
      >
        + Add Row
      </button>
      {viewRow && (
        <RowModal
          row={viewRow}
          onClose={editMode ? cancelEdit : () => setViewRow(null)}
          editMode={editMode}
          onSave={saveEdit}
          onCancel={cancelEdit}
        />
      )}
    </div>
  );
} 