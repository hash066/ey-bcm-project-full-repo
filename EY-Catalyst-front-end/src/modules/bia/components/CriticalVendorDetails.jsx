import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { getCriticalVendors, getVendorDetails, saveVendorDetail } from '../services/biaService';
import '../styles/BIAStyles.css';
import { FaIdBadge } from 'react-icons/fa';
import { useBIAData } from '../BIADataContext';

const initialVendor = {
  criticalProcessName: '',
  vendorName: '',
  activities: '',
  primaryContact: '',
  secondaryContact: '',
  address: '',
  bcpArrangement: '',
};

const bcpOptions = [
  { value: '', label: 'Select' },
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
];

const cellStyle = {
  padding: '14px 16px',
  fontSize: '15px',
  verticalAlign: 'middle',
  background: '#181818',
  color: '#fff',
  borderBottom: '1.5px solid #232323',
};
const headerCellStyle = {
  ...cellStyle,
  background: '#FFD700',
  color: '#232323',
  fontWeight: 700,
  fontSize: '15px',
  borderBottom: '2.5px solid #FFD700',
};
const altRowStyle = {
  background: '#232323',
};
const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  fontSize: '15px',
  borderRadius: '6px',
  border: '1.5px solid #FFD700',
  background: '#121212',
  color: '#fff',
  boxSizing: 'border-box',
  minHeight: 38,
};
const selectStyle = {
  ...inputStyle,
  minHeight: 38,
};

function VendorModal({ vendor, onClose, editMode, onSave, onCancel, onEdit }) {
  const { criticalProcesses, vendors } = useBIAData();
  const [form, setForm] = React.useState(vendor);
  React.useEffect(() => { setForm(vendor); }, [vendor]);
  const [isEditing, setIsEditing] = React.useState(editMode);
  React.useEffect(() => { setIsEditing(editMode); }, [editMode]);
  const fields = [
    { label: 'Critical Process Name', key: 'criticalProcessName', type: 'readonly' },
    { label: 'Vendor / Supplier Name', key: 'vendorName', type: 'text' },
    { label: 'Activities Performed / Services Provided', key: 'activities', type: 'text' },
    { label: 'Primary Contact Details', key: 'primaryContact', type: 'text' },
    { label: 'Secondary Contact Details', key: 'secondaryContact', type: 'text' },
    { label: 'Address & Location', key: 'address', type: 'text' },
    { label: 'BCP Arrangement', key: 'bcpArrangement', type: 'select' },
  ];
  const bcpOptions = [
    { value: '', label: 'Select' },
    { value: 'Yes', label: 'Yes' },
    { value: 'No', label: 'No' },
  ];
  // Auto-populate SPOC fields if a process is selected (optional, can be extended)
  React.useEffect(() => {
    const selectedProcess = criticalProcesses.find(p => p.name === form.criticalProcessName);
    if (selectedProcess && isEditing) {
      setForm(f => ({
        ...f,
        primaryContact: selectedProcess.spoc || f.primaryContact,
        secondaryContact: selectedProcess.fallbackSpoc || f.secondaryContact,
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
            <span style={{ color: '#FFD700', fontWeight: 800, fontSize: 22, letterSpacing: 1 }}>{isEditing ? 'Edit Vendor' : 'Vendor Details'}</span>
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
              {fields.map((f, idx) => (
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
                      f.type === 'select' ? (
                        <select
                          style={{ width: '100%', padding: '14px', borderRadius: 8, border: '2px solid #FFD700', background: '#181818', color: '#FFD700', fontSize: 17 }}
                          value={form[f.key]}
                          onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                        >
                          {(bcpOptions).map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : f.type === 'readonly' ? (
                        <input
                          style={{ width: '100%', padding: '14px', borderRadius: 8, border: '2px solid #FFD700', background: '#181818', color: '#FFD700', fontSize: 17 }}
                          value={form[f.key]}
                          readOnly
                          disabled
                        />
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

const CriticalVendorDetails = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editVendorIdx, setEditVendorIdx] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [viewVendor, setViewVendor] = useState(null);

  useEffect(() => {
    Promise.all([getCriticalVendors(), getVendorDetails()]).then(([criticalProcs, vendorDetails]) => {
      // For each process, pick the latest vendor detail by created_at
      const latestVendorMap = {};
      vendorDetails.forEach(v => {
        if (!latestVendorMap[v.process_id] || new Date(v.created_at) > new Date(latestVendorMap[v.process_id].created_at)) {
          latestVendorMap[v.process_id] = v;
        }
      });
      setVendors(criticalProcs.map(proc => {
        const vendor = latestVendorMap[proc.bia_process_info_id];
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
          // Fill from vendor detail if exists, else blank
          vendorName: vendor ? vendor.vendor_name : '',
          activities: vendor ? vendor.activities : '',
          primaryContact: vendor ? vendor.primary_contact_details : '',
          secondaryContact: vendor ? vendor.secondary_contact_details : '',
          address: vendor ? vendor.location : '',
          bcpArrangement: vendor ? (vendor.bcp_arrangement ? 'Yes' : 'No') : '',
        };
      }));
      setLoading(false);
    });
  }, []);

  const handleChange = (field, value) => {
    setEditVendor(v => ({ ...v, [field]: value }));
  };

  // Edit handler
  const startEdit = idx => {
    setEditVendorIdx(idx);
    setViewVendor(vendors[idx]);
    setEditMode(true);
  };

  // Save handler
  const saveEdit = async (updatedVendor) => {
    // Map frontend fields to backend fields
    const payload = {
      process_id: updatedVendor.biaProcessInfoId, // <-- use this, not processId
      vendor_name: updatedVendor.vendorName,
      activities: updatedVendor.activities,
      primary_contact_details: updatedVendor.primaryContact,
      secondary_contact_details: updatedVendor.secondaryContact,
      location: updatedVendor.address,
      bcp_arrangement: updatedVendor.bcpArrangement === 'Yes' ? true : false,
    };
    try {
      await saveVendorDetail(payload);
      alert('Vendor details saved successfully!');
      // Re-fetch vendor details and update the table
      const vendorDetails = await getVendorDetails();
      // Pick latest for each process_id
      const latestVendorMap = {};
      vendorDetails.forEach(v => {
        if (!latestVendorMap[v.process_id] || new Date(v.created_at) > new Date(latestVendorMap[v.process_id].created_at)) {
          latestVendorMap[v.process_id] = v;
        }
      });
      setVendors(vendors => vendors.map((v) => {
        const vendor = latestVendorMap[v.biaProcessInfoId];
        return vendor
          ? {
              ...v,
              vendorName: vendor.vendor_name,
              activities: vendor.activities,
              primaryContact: vendor.primary_contact_details,
              secondaryContact: vendor.secondary_contact_details,
              address: vendor.location,
              bcpArrangement: vendor.bcp_arrangement ? 'Yes' : 'No',
            }
          : v;
      }));
      setEditVendorIdx(null);
      setViewVendor(null);
      setEditMode(false);
    } catch (err) {
      alert('Failed to save vendor details: ' + err.message);
    }
  };

  // Cancel handler
  const cancelEdit = () => {
    setEditVendorIdx(null);
    setViewVendor(null);
    setEditMode(false);
  };

  // View handler
  const openView = (vendor) => {
    setViewVendor(vendor);
    setEditMode(false);
  };

  const addVendor = () => {
    setVendors(vendors => [...vendors, { ...initialVendor, id: Date.now() }]);
    setEditVendorIdx(vendors.length);
    setViewVendor({ ...initialVendor, id: Date.now() });
    setEditMode(true);
  };

  const removeVendor = idx => {
    setVendors(vendors => vendors.filter((_, i) => i !== idx));
    if (editVendorIdx === idx) {
      setEditVendorIdx(null);
      setViewVendor(null);
      setEditMode(false);
    }
  };

  if (loading) return <div className="bia-form-container">Loading...</div>;

  return (
    <div className="bia-form-container" style={{ position: 'relative', minHeight: 400 }}>
      <h2 style={{ color: '#FFD700', marginBottom: 20 }}>Critical Vendor Details</h2>
      <div className="table-container" style={{ borderRadius: 12, boxShadow: '0 4px 24px #00000044', padding: 0, marginTop: 8, border: '1.5px solid #232323', width: '100%', overflowX: 'auto', background: 'transparent' }}>
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
        <table className="export-table" style={{ minWidth: 1200 }}>
          <thead>
            <tr>
              <th style={{ minWidth: 50 }}>S. No.</th>
              <th style={{ minWidth: 160 }}>Critical Process Name</th>
              <th style={{ minWidth: 160 }}>Vendor / Supplier Name</th>
              <th style={{ minWidth: 220 }}>Activities Performed / Services Provided</th>
              <th style={{ minWidth: 160 }}>Primary Contact Details</th>
              <th style={{ minWidth: 160 }}>Secondary Contact Details</th>
              <th style={{ minWidth: 180 }}>Address & Location</th>
              <th style={{ minWidth: 120 }}>BCP Arrangement (Yes/No)</th>
              <th style={{ minWidth: 120 }}></th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor, idx) => {
              const isAlt = idx % 2 === 1;
              return (
                <tr
                  key={vendor.id || idx}
                  style={isAlt ? altRowStyle : {}}
                  onClick={e => {
                    if (
                      e.target.tagName !== 'BUTTON' &&
                      e.target.tagName !== 'svg' &&
                      e.target.tagName !== 'path'
                    ) {
                      openView(vendor);
                    }
                  }}
                  className={'clickable-row'}
                >
                  <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                  <td>{vendor.criticalProcessName}</td>
                  <td>{vendor.vendorName}</td>
                  <td>{vendor.activities}</td>
                  <td>{vendor.primaryContact}</td>
                  <td>{vendor.secondaryContact}</td>
                  <td>{vendor.address}</td>
                  <td>{vendor.bcpArrangement}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button type="button" className="btn-sm" style={{ background: '#232323', color: '#FFD700', border: '1px solid #FFD700', borderRadius: 4, fontWeight: 700, cursor: 'pointer', marginLeft: 6 }} onClick={e => { e.stopPropagation(); removeVendor(idx); }} disabled={vendors.length === 1}>Remove</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        className="btn-sm"
        style={{ background: '#FFD700', color: '#232323', border: 'none', borderRadius: 4, fontWeight: 700, cursor: 'pointer', marginBottom: 10 }}
        onClick={addVendor}
        disabled={editVendorIdx !== null}
      >
        + Add Vendor
      </button>
      {/* Modal overlay via portal */}
      {viewVendor && (
        <VendorModal
          vendor={viewVendor}
          onClose={editMode ? cancelEdit : () => setViewVendor(null)}
          editMode={editMode}
          onSave={saveEdit}
          onCancel={cancelEdit}
          onEdit={startEdit}
        />
      )}
      <style>{`
        .clickable-row:hover td, .clickable-row:hover th {
          background: #FFD700 !important;
          color: #232323 !important;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
      `}</style>
    </div>
  );
};

export default CriticalVendorDetails; 