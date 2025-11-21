import React, { useState, useEffect } from 'react';
import { useBIAData } from '../BIADataContext';
import { getCriticalVendors, getVitalRecords, saveVitalRecord } from '../services/biaService';

const columns = [
  { label: 'Critical Process', key: 'criticalProcess', type: 'readonly' },
  { label: 'Record Name', key: 'recordName' },
  { label: 'Shared Folder', key: 'sharedFolder' },
  { label: 'Media Type (Soft Copy or Hard Copy)', key: 'mediaType' },
  { label: 'Where Held?', key: 'whereHeld' },
  { label: 'Whose Custody?', key: 'whoseCustody' },
  { label: 'When Required?', key: 'whenRequired' },
  { label: 'Alternate Source', key: 'alternateSource' },
  { label: 'Remarks', key: 'remarks' },
];

const initialRow = {
  criticalProcess: '',
  recordName: '',
  sharedFolder: '',
  mediaType: '',
  whereHeld: '',
  whoseCustody: '',
  whenRequired: '',
  alternateSource: '',
  remarks: '',
};

export default function VitalRecords() {
  const { criticalProcesses } = useBIAData();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCriticalVendors(), getVitalRecords()]).then(([criticalProcs, vitalRecordsData]) => {
      // For each process, pick the latest vital record data by created_at/updated_at
      const latestVitalRecordMap = {};
      vitalRecordsData.forEach(record => {
        if (!latestVitalRecordMap[record.process_id] || new Date(record.updated_at || record.created_at) > new Date(latestVitalRecordMap[record.process_id].updated_at || latestVitalRecordMap[record.process_id].created_at)) {
          latestVitalRecordMap[record.process_id] = record;
        }
      });
      
      setRows(criticalProcs.map(proc => {
        const record = latestVitalRecordMap[proc.bia_process_info_id];
        return {
          id: record ? record.id : Date.now() + Math.random(),
          processId: proc.process_id,
          biaProcessInfoId: proc.bia_process_info_id,
          criticalProcess: proc.process_name,
          recordName: record ? record.record_name || '' : '',
          sharedFolder: record ? record.shared_folder || '' : '',
          mediaType: record ? record.media_type || '' : '',
          whereHeld: record ? record.where_held || '' : '',
          whoseCustody: record ? record.whose_custody || '' : '',
          whenRequired: record ? record.when_required || '' : '',
          alternateSource: record ? record.alternate_source || '' : '',
          remarks: record ? record.remarks || '' : '',
          createdAt: record ? record.created_at : null,
          updatedAt: record ? record.updated_at : null,
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

  const saveAllData = async () => {
    try {
      // Filter out rows that have at least record name entered
      const validRows = rows.filter(row => 
        row.recordName && row.recordName.trim() !== ''
      );

      if (validRows.length === 0) {
        alert('Please enter record name for at least one process before saving.');
        return;
      }

      // Save each valid row
      for (const row of validRows) {
        const payload = {
          process_id: row.biaProcessInfoId,
          record_name: row.recordName,
          shared_folder: row.sharedFolder || null,
          media_type: row.mediaType || null,
          where_held: row.whereHeld || null,
          whose_custody: row.whoseCustody || null,
          when_required: row.whenRequired || null,
          alternate_source: row.alternateSource || null,
          remarks: row.remarks || null,
        };

        await saveVitalRecord(payload);
      }

      alert('Vital records saved successfully!');
      
      // Refresh data
      const vitalRecordsData = await getVitalRecords();
      const latestVitalRecordMap = {};
      vitalRecordsData.forEach(record => {
        if (!latestVitalRecordMap[record.process_id] || new Date(record.updated_at || record.created_at) > new Date(latestVitalRecordMap[record.process_id].updated_at || latestVitalRecordMap[record.process_id].created_at)) {
          latestVitalRecordMap[record.process_id] = record;
        }
      });
      
      setRows(rows => rows.map(row => {
        const record = latestVitalRecordMap[row.biaProcessInfoId];
        if (record) {
          return {
            ...row,
            id: record.id,
            recordName: record.record_name || '',
            sharedFolder: record.shared_folder || '',
            mediaType: record.media_type || '',
            whereHeld: record.where_held || '',
            whoseCustody: record.whose_custody || '',
            whenRequired: record.when_required || '',
            alternateSource: record.alternate_source || '',
            remarks: record.remarks || '',
            createdAt: record.created_at,
            updatedAt: record.updated_at,
          };
        }
        return row;
      }));
    } catch (err) {
      alert('Failed to save vital records: ' + err.message);
    }
  };

  if (loading) return <div className="bia-form-container">Loading...</div>;

  return (
    <div className="bia-form-container" style={{ position: 'relative', minHeight: 400 }}>
      <h2 style={{ color: '#FFD700', marginBottom: 20 }}>Vital Records</h2>
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
              {columns.map(col => (
                <th key={col.key} style={{ minWidth: 120 }}>{col.label}</th>
              ))}
              <th style={{ minWidth: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id || idx} className={'clickable-row'}>
                <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                {columns.map(col => (
                  <td key={col.key}>
                    {col.type === 'readonly' ? (
                      <input
                        style={{ width: '100%', padding: '8px', borderRadius: 6, border: '2px solid #FFD700', background: '#232323', color: '#FFD700', fontSize: 14 }}
                        value={row[col.key]}
                        readOnly
                        disabled
                      />
                    ) : (
                      <input
                        style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1.5px solid #FFD700', background: '#181818', color: '#FFD700', fontSize: 14 }}
                        value={row[col.key]}
                        onChange={e => handleChange(idx, col.key, e.target.value)}
                        placeholder={col.label}
                      />
                    )}
                  </td>
                ))}
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