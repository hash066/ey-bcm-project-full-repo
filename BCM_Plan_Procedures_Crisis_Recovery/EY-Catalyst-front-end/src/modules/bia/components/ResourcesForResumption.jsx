import React, { useState, useEffect } from 'react';
import { useBIAData } from '../BIADataContext';
import { getCriticalVendors, getResourcesForResumption, saveResourcesForResumption } from '../services/biaService';

const timeWindows = [
  'Up to 15 min',
  'Up to 30 min',
  'Up to 1 Hour',
  'Up to 4 Hours',
  'Up to 8 Hours',
  'Up to 12 Hours',
  'Up to 24 Hours',
  'Up to 48 hours',
  'Up to 72 hours',
  'Up to 1 Week',
];

const initialRow = {
  criticalProcess: '',
  staff: Array(timeWindows.length).fill(''),
  remarks: '',
};

export default function ResourcesForResumption() {
  const { criticalProcesses } = useBIAData();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCriticalVendors(), getResourcesForResumption()]).then(([criticalProcs, resourcesData]) => {
      // For each process, pick the latest resource data by created_at/updated_at
      const latestResourceMap = {};
      resourcesData.forEach(resource => {
        if (!latestResourceMap[resource.process_id] || new Date(resource.updated_at || resource.created_at) > new Date(latestResourceMap[resource.process_id].updated_at || latestResourceMap[resource.process_id].created_at)) {
          latestResourceMap[resource.process_id] = resource;
        }
      });
      
      setRows(criticalProcs.map(proc => {
        const resource = latestResourceMap[proc.bia_process_info_id];
        return {
          id: resource ? resource.id : Date.now() + Math.random(),
          processId: proc.process_id,
          biaProcessInfoId: proc.bia_process_info_id,
          criticalProcess: proc.process_name,
          staff: resource ? [
            resource.staff_required_15_min || '',
            resource.staff_required_30_min || '',
            resource.staff_required_1_hour || '',
            resource.staff_required_4_hours || '',
            resource.staff_required_8_hours || '',
            resource.staff_required_12_hours || '',
            resource.staff_required_24_hours || '',
            resource.staff_required_48_hours || '',
            resource.staff_required_72_hours || '',
            resource.staff_required_1_week || ''
          ] : Array(timeWindows.length).fill(''),
          remarks: resource ? resource.remarks || '' : '',
          createdAt: resource ? resource.created_at : null,
          updatedAt: resource ? resource.updated_at : null,
        };
      }));
      setLoading(false);
    }).catch(err => {
      console.error('Error loading data:', err);
      setLoading(false);
    });
  }, []);

  const addRow = () => {
    // This function is kept for consistency but won't be used since all processes are pre-populated
    console.log('Add row functionality not needed - all critical processes are pre-populated');
  };

  const removeRow = idx => {
    setRows(r => r.filter((_, i) => i !== idx));
  };

  const handleChange = (idx, key, value) => {
    setRows(r => r.map((row, i) => i === idx ? { ...row, [key]: value } : row));
  };

  const handleStaffChange = (idx, staffIdx, value) => {
    setRows(r => r.map((row, i) => i === idx ? { ...row, staff: row.staff.map((s, j) => j === staffIdx ? value : s) } : row));
  };



  const saveAllData = async () => {
    try {
      // Filter out rows that have at least one staff number entered
      const validRows = rows.filter(row => 
        row.staff.some(staffNum => staffNum && String(staffNum).trim() !== '')
      );

      if (validRows.length === 0) {
        alert('Please enter staff requirements for at least one process before saving.');
        return;
      }

      // Save each valid row
      for (const row of validRows) {
        const payload = {
          process_id: row.biaProcessInfoId,
          staff_required_15_min: parseInt(row.staff[0]) || null,
          staff_required_30_min: parseInt(row.staff[1]) || null,
          staff_required_1_hour: parseInt(row.staff[2]) || null,
          staff_required_4_hours: parseInt(row.staff[3]) || null,
          staff_required_8_hours: parseInt(row.staff[4]) || null,
          staff_required_12_hours: parseInt(row.staff[5]) || null,
          staff_required_24_hours: parseInt(row.staff[6]) || null,
          staff_required_48_hours: parseInt(row.staff[7]) || null,
          staff_required_72_hours: parseInt(row.staff[8]) || null,
          staff_required_1_week: parseInt(row.staff[9]) || null,
          remarks: row.remarks || null,
        };

        await saveResourcesForResumption(payload);
      }

      alert('Resources for resumption saved successfully!');
      
      // Refresh data
      const resourcesData = await getResourcesForResumption();
      const latestResourceMap = {};
      resourcesData.forEach(resource => {
        if (!latestResourceMap[resource.process_id] || new Date(resource.updated_at || resource.created_at) > new Date(latestResourceMap[resource.process_id].updated_at || latestResourceMap[resource.process_id].created_at)) {
          latestResourceMap[resource.process_id] = resource;
        }
      });
      
      setRows(rows => rows.map(row => {
        const resource = latestResourceMap[row.biaProcessInfoId];
        if (resource) {
          return {
            ...row,
            id: resource.id,
            staff: [
              resource.staff_required_15_min || '',
              resource.staff_required_30_min || '',
              resource.staff_required_1_hour || '',
              resource.staff_required_4_hours || '',
              resource.staff_required_8_hours || '',
              resource.staff_required_12_hours || '',
              resource.staff_required_24_hours || '',
              resource.staff_required_48_hours || '',
              resource.staff_required_72_hours || '',
              resource.staff_required_1_week || ''
            ],
            remarks: resource.remarks || '',
            createdAt: resource.created_at,
            updatedAt: resource.updated_at,
          };
        }
        return row;
      }));
    } catch (err) {
      alert('Failed to save resources for resumption: ' + err.message);
    }
  };

  if (loading) return <div className="bia-form-container">Loading...</div>;

  return (
    <div className="bia-form-container" style={{ position: 'relative', minHeight: 400 }}>
      <h2 style={{ color: '#FFD700', marginBottom: 20 }}>Resources for Resumption</h2>
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
              <th style={{ minWidth: 180 }}>Critical Process</th>
              {timeWindows.map((label, i) => (
                <th key={i} style={{ minWidth: 110 }}>{label}</th>
              ))}
              <th style={{ minWidth: 220 }}>Remarks / Additional Information</th>
              <th style={{ minWidth: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id || idx} className={'clickable-row'}>
                <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                <td>
                  <input
                    style={{ width: '100%', padding: '8px', borderRadius: 6, border: '2px solid #FFD700', background: '#232323', color: '#FFD700', fontSize: 14 }}
                    value={row.criticalProcess}
                    readOnly
                    disabled
                  />
                </td>
                {timeWindows.map((label, staffIdx) => (
                  <td key={staffIdx}>
                    <input
                      style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1.5px solid #FFD700', background: '#181818', color: '#FFD700', fontSize: 14 }}
                      value={row.staff[staffIdx]}
                      onChange={e => handleStaffChange(idx, staffIdx, e.target.value)}
                      placeholder="Staff #"
                    />
                  </td>
                ))}
                <td>
                  <input
                    style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1.5px solid #FFD700', background: '#181818', color: '#FFD700', fontSize: 14 }}
                    value={row.remarks}
                    onChange={e => handleChange(idx, 'remarks', e.target.value)}
                    placeholder="Remarks / Additional Info"
                  />
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button type="button" className="btn-sm" style={{ background: '#232323', color: '#FFD700', border: '1px solid #FFD700', borderRadius: 4, fontWeight: 700, cursor: 'pointer', marginLeft: 6 }} onClick={e => { e.stopPropagation(); removeRow(idx); }} disabled={rows.length === 1}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
        <button
          type="button"
          className="btn-sm"
          style={{ background: '#232323', color: '#FFD700', border: '2px solid #FFD700', borderRadius: 4, fontWeight: 700, cursor: 'pointer', marginBottom: 10 }}
          onClick={saveAllData}
        >
          Save All Data
        </button>
      </div>
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