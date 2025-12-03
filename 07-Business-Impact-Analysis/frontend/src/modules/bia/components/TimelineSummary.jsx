import React, { useState, useEffect } from 'react';
import { useBIAData } from '../BIADataContext';
import { getCriticalVendors, getTimelineSummaryWithImpactData, saveTimelineSummary } from '../services/biaService';
import { useNavigate } from 'react-router-dom';

const columns = [
  { label: 'Process Name', key: 'processName', type: 'readonly' },
  { label: 'MTPD Summary', key: 'mtpdSummary', type: 'readonly' },
  { label: 'RTO Summary', key: 'rtoSummary', type: 'readonly' },
  { label: 'Moderated RTO', key: 'moderatedRto' },
  { label: 'MBCO (%)', key: 'mbcoPercentage' },
  { label: 'Criticality', key: 'criticality', type: 'readonly' },
];

const initialRow = {
  processName: '',
  mtpdSummary: '',
  rtoSummary: '',
  moderatedRto: '',
  mbcoPercentage: '',
  criticality: '',
};

export default function TimelineSummary() {
  const { criticalProcesses } = useBIAData();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadTimelineData();
  }, []);

  const loadTimelineData = async () => {
    try {
      const [criticalProcs, timelineData] = await Promise.all([
        getCriticalVendors(), 
        getTimelineSummaryWithImpactData()
      ]);
      
      // For each process, pick the latest timeline data by created_at/updated_at
      const latestTimelineMap = {};
      timelineData.forEach(timeline => {
        if (!latestTimelineMap[timeline.process_id] || new Date(timeline.updated_at || timeline.created_at) > new Date(latestTimelineMap[timeline.process_id].updated_at || latestTimelineMap[timeline.process_id].created_at)) {
          latestTimelineMap[timeline.process_id] = timeline;
        }
      });
      
      setRows(criticalProcs.map(proc => {
        const timeline = latestTimelineMap[proc.bia_process_info_id];
        return {
          id: timeline ? timeline.id : Date.now() + Math.random(),
          processId: proc.process_id,
          biaProcessInfoId: proc.bia_process_info_id,
          processName: proc.process_name,
          mtpdSummary: timeline ? timeline.mtpd_summary || '' : '',
          rtoSummary: timeline ? timeline.rto_summary || '' : '',
          moderatedRto: timeline ? timeline.moderated_rto || '' : '',
          mbcoPercentage: timeline ? timeline.mbco_percentage || '' : '',
          criticality: timeline ? timeline.criticality || '' : '',
          createdAt: timeline ? timeline.created_at : null,
          updatedAt: timeline ? timeline.updated_at : null,
        };
      }));
      setLoading(false);
    } catch (err) {
      console.error('Error loading timeline data:', err);
      setLoading(false);
    }
  };

  const handleChange = (idx, key, value) => {
    setRows(r => r.map((row, i) => i === idx ? { ...row, [key]: value } : row));
  };

  const saveAllData = async () => {
    try {
      // Filter out rows that have at least one editable field filled
      const validRows = rows.filter(row => 
        row.moderatedRto || row.mbcoPercentage
      );

      if (validRows.length === 0) {
        alert('Please fill in at least one field (Moderated RTO or MBCO %) before saving.');
        return;
      }

      // Save each valid row
      for (const row of validRows) {
        const payload = {
          process_id: row.biaProcessInfoId,
          mtpd_summary: row.mtpdSummary || null,
          rto_summary: row.rtoSummary || null,
          moderated_rto: row.moderatedRto || null,
          mbco_percentage: row.mbcoPercentage || null,
          criticality: row.criticality || null,
        };

        await saveTimelineSummary(payload);
      }

      alert('Timeline summary saved successfully!');
      
      // Re-fetch timeline data and update the table (same pattern as MOR and Critical Vendor Details)
      const timelineData = await getTimelineSummaryWithImpactData();
      const latestTimelineMap = {};
      timelineData.forEach(timeline => {
        if (!latestTimelineMap[timeline.process_id] || new Date(timeline.updated_at || timeline.created_at) > new Date(latestTimelineMap[timeline.process_id].updated_at || latestTimelineMap[timeline.process_id].created_at)) {
          latestTimelineMap[timeline.process_id] = timeline;
        }
      });
      
      setRows(rows => rows.map(row => {
        const timeline = latestTimelineMap[row.biaProcessInfoId];
        if (timeline) {
          return {
            ...row,
            id: timeline.id,
            mtpdSummary: timeline.mtpd_summary || '',
            rtoSummary: timeline.rto_summary || '',
            // Preserve user's input values instead of overwriting them
            moderatedRto: row.moderatedRto || timeline.moderated_rto || '',
            mbcoPercentage: row.mbcoPercentage || timeline.mbco_percentage || '',
            criticality: timeline.criticality || '',
            createdAt: timeline.created_at,
            updatedAt: timeline.updated_at,
          };
        }
        return row;
      }));
    } catch (err) {
      alert('Failed to save timeline summary: ' + err.message);
    }
  };

  if (loading) return <div className="bia-form-container">Loading...</div>;

  return (
    <div className="bia-form-container" style={{ position: 'relative', minHeight: 400 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button
          type="button"
          style={{
            background: '#FFD700',
            color: '#232323',
            border: '2px solid #FFD700',
            borderRadius: 6,
            fontWeight: 700,
            fontSize: 15,
            padding: '8px 22px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px #0004',
            transition: 'background 0.2s, color 0.2s',
          }}
          onClick={() => navigate('/bia/bia-matrix')}
        >
          View BIA Matrix
        </button>
      </div>
      <h2 style={{ color: '#FFD700', marginBottom: 20 }}>Timeline Summary</h2>
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
      
      {/* Criticality Category Explanation Section */}
      <div style={{ marginTop: 32, borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 12px #000a', border: '2px solid #FFD700', background: '#232323', maxWidth: 900, marginLeft: 'auto', marginRight: 'auto' }}>
        <div style={{ background: '#1a1a1a', color: '#FFD700', fontWeight: 800, fontSize: 18, padding: '14px 24px', borderBottom: '2px solid #FFD700', textAlign: 'center' }}>*Criticality Category</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'transparent' }}>
          <thead>
            <tr>
              <th style={{ background: '#232323', color: '#FFD700', fontWeight: 700, fontSize: 16, padding: '12px 18px', borderBottom: '1.5px solid #FFD700', width: '30%' }}>Criticality</th>
              <th style={{ background: '#232323', color: '#FFD700', fontWeight: 700, fontSize: 16, padding: '12px 18px', borderBottom: '1.5px solid #FFD700' }}>Explanation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ background: '#181818', color: '#FFD700', fontWeight: 700, fontSize: 15, padding: '12px 18px', borderBottom: '1px solid #232323' }}>Critical</td>
              <td style={{ background: '#181818', color: '#fff', fontWeight: 500, fontSize: 15, padding: '12px 18px', borderBottom: '1px solid #232323' }}>
                Process/Activity that must be operational for the organization to function within 12 hours.
              </td>
            </tr>
            <tr>
              <td style={{ background: '#181818', color: '#FFD700', fontWeight: 700, fontSize: 15, padding: '12px 18px', borderBottom: '1px solid #232323' }}>Non-Critical</td>
              <td style={{ background: '#181818', color: '#fff', fontWeight: 500, fontSize: 15, padding: '12px 18px', borderBottom: '1px solid #232323' }}>
                Process/Activity that can be resumed after more than 12 hours without significantly impacting business operations.
              </td>
            </tr>
          </tbody>
        </table>
        <div style={{ color: 'red', fontWeight: 700, fontSize: 15, padding: '12px 18px', background: '#232323', borderTop: '1.5px solid #FFD700', textAlign: 'center' }}>
          NOTE: Process criticality is defined based on the RTO summary
        </div>
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