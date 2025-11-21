import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FaIdBadge } from 'react-icons/fa';
import { getCriticalStaffDetails, getOrganizations, saveCriticalStaffDetail } from '../services/biaService';

const initialStaff = {
  name: '',
  designation: '',
  location: '',
  phone: '',
  email: '',
  manager: '',
};

const columns = [
  { label: 'Sr. No', key: 'srNo', readonly: true },
  { label: 'Organization', key: 'organizationName' },
  { label: 'Name of Employee', key: 'name' },
  { label: 'Designation', key: 'designation' },
  { label: "Employee's Location", key: 'location' },
  { label: 'Primary Phone (Mob:)', key: 'phone' },
  { label: 'Official Email', key: 'email' },
  { label: 'Reporting Manager', key: 'manager' },
];

function StaffModal({ staff, onClose, editMode, onSave, onCancel, organizations }) {
  const [form, setForm] = useState(staff);
  const [isEditing, setIsEditing] = useState(editMode);
  React.useEffect(() => { setForm(staff); setIsEditing(editMode); }, [staff, editMode]);
  return ReactDOM.createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.75)', zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto', animation: 'fadeInModal 0.25s',
    }}>
      <style>{`
        @keyframes fadeInModal { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
      `}</style>
      <div style={{
        background: 'linear-gradient(135deg, #181818 80%, #232323 100%)', color: '#FFD700', borderRadius: 18, minWidth: 350, maxWidth: 700, width: '98vw', maxHeight: '92vh', padding: '0 0 32px 0', boxShadow: '0 0 0 4px #FFD700, 0 8px 32px #000a', position: 'relative', border: '2.5px solid #FFD700', animation: 'fadeInModal 0.25s', zIndex: 20001, margin: '40px auto', display: 'flex', flexDirection: 'column', overflow: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#232323', padding: '22px 36px 16px 32px', borderBottom: '1.5px solid #FFD700', }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <FaIdBadge style={{ color: '#FFD700', fontSize: 26 }} />
            <span style={{ color: '#FFD700', fontWeight: 800, fontSize: 22, letterSpacing: 1 }}>{isEditing ? 'Edit Staff' : 'Staff Details'}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#FFD700', fontSize: 32, fontWeight: 900, cursor: 'pointer', marginLeft: 12, marginTop: -4, transition: 'color 0.2s', }} aria-label="Close" title="Close">×</button>
        </div>
        <div style={{ margin: '0', padding: '0 0 0 0', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 18 }}>
            <tbody>
              {columns.filter(f => f.key !== 'srNo').map((f, idx) => (
                <tr key={f.label} style={{ background: idx % 2 === 0 ? '#232323' : '#181818' }}>
                  <td style={{ padding: '18px 28px', color: '#FFD700', fontWeight: 700, fontSize: 17, borderBottom: '1px solid #232323', width: '38%', whiteSpace: 'nowrap', }}>{f.label}</td>
                  <td style={{ padding: '18px 28px', color: '#fff', fontWeight: 500, fontSize: 17, borderBottom: '1px solid #232323', width: '62%', wordBreak: 'break-word', }}>
                    {isEditing ? (
                      f.key === 'organizationName' ? (
                        <select
                          style={{ width: '100%', padding: '14px', borderRadius: 8, border: '2px solid #FFD700', background: '#181818', color: '#FFD700', fontSize: 17 }}
                          value={form[f.key] || ''}
                          onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                        >
                          <option value="">Select Organization</option>
                          {organizations.map(org => (
                            <option key={org.id} value={org.name}>{org.name}</option>
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
              <button onClick={() => { setIsEditing(false); onCancel && onCancel(); }} style={{ background: '#232323', color: '#FFD700', border: '2px solid #FFD700', borderRadius: 8, fontWeight: 700, fontSize: 17, padding: '12px 32px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { setIsEditing(false); onSave && onSave(form); }} style={{ background: '#FFD700', color: '#232323', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 17, padding: '12px 32px', cursor: 'pointer' }}>Save</button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} style={{ background: '#FFD700', color: '#232323', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 17, padding: '12px 32px', cursor: 'pointer' }}>Edit</button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function CriticalStaffDetails() {
  const [rows, setRows] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewRow, setViewRow] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editRowIdx, setEditRowIdx] = useState(null);

  useEffect(() => {
    Promise.all([getCriticalStaffDetails(), getOrganizations()]).then(([staffDetails, orgs]) => {
      setRows(staffDetails.map(staff => ({
        id: staff.id,
        organizationId: staff.organization_id,
        organizationName: orgs.find(org => org.id === staff.organization_id)?.name || '',
        name: staff.employee_name,
        designation: staff.designation || '',
        location: staff.location || '',
        phone: staff.phone || '',
        email: staff.email || '',
        manager: staff.reporting_manager || '',
        createdAt: staff.created_at,
        updatedAt: staff.updated_at,
      })));
      setOrganizations(orgs);
      setLoading(false);
    }).catch(err => {
      console.error('Error loading data:', err);
      setLoading(false);
    });
  }, []);

  const addRow = () => {
    const newStaff = { 
      ...initialStaff, 
      id: Date.now(),
      organizationName: '',
      organizationId: null
    };
    setRows(r => [...r, newStaff]);
    setEditRowIdx(rows.length);
    setViewRow(newStaff);
    setEditMode(true);
  };

  const openView = (row) => {
    setViewRow(row);
    setEditMode(false);
  };

  const startEdit = (idx) => {
    setEditRowIdx(idx);
    setViewRow(rows[idx]);
    setEditMode(true);
  };

  const saveEdit = async (updatedStaff) => {
    // Find the organization ID from the organization name
    const organization = organizations.find(org => org.name === updatedStaff.organizationName);
    if (!organization) {
      alert('Please select a valid organization');
      return;
    }

    const payload = {
      organization_id: organization.id,
      employee_name: updatedStaff.name,
      designation: updatedStaff.designation,
      location: updatedStaff.location,
      phone: updatedStaff.phone,
      email: updatedStaff.email,
      reporting_manager: updatedStaff.manager,
    };

    try {
      await saveCriticalStaffDetail(payload);
      alert('Staff details saved successfully!');
      
      // Re-fetch staff details and update the table
      const staffDetails = await getCriticalStaffDetails();
      setRows(staffDetails.map(staff => ({
        id: staff.id,
        organizationId: staff.organization_id,
        organizationName: organizations.find(org => org.id === staff.organization_id)?.name || '',
        name: staff.employee_name,
        designation: staff.designation || '',
        location: staff.location || '',
        phone: staff.phone || '',
        email: staff.email || '',
        manager: staff.reporting_manager || '',
        createdAt: staff.created_at,
        updatedAt: staff.updated_at,
      })));
      
      setEditRowIdx(null);
      setViewRow(null);
      setEditMode(false);
    } catch (err) {
      alert('Failed to save staff details: ' + err.message);
    }
  };

  const cancelEdit = () => {
    setEditRowIdx(null);
    setViewRow(null);
    setEditMode(false);
  };

  const removeRow = (idx) => {
    setRows(r => r.filter((_, i) => i !== idx));
    if (editRowIdx === idx) {
      setEditRowIdx(null);
      setViewRow(null);
      setEditMode(false);
    }
  };

  if (loading) return <div className="bia-form-container">Loading...</div>;

  return (
    <div className="bia-form-container" style={{ position: 'relative', minHeight: 400 }}>
      <h2 style={{ color: '#FFD700', marginBottom: 20 }}>Critical Staff Details</h2>
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
              {columns.filter(col => col.key !== 'srNo').map(col => (
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
                {columns.filter(col => col.key !== 'srNo').map(col => (
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
        + Add Staff
      </button>
      {viewRow && (
        <StaffModal
          staff={viewRow}
          onClose={editMode ? cancelEdit : () => setViewRow(null)}
          editMode={editMode}
          onSave={saveEdit}
          onCancel={cancelEdit}
          organizations={organizations}
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
} 