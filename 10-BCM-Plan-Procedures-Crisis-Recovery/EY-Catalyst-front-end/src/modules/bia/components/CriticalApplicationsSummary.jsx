import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const headerStyle = {
  background: '#181818',
  color: '#FFD700',
  fontWeight: 800,
  fontSize: 16,
  padding: '18px 10px',
  borderBottom: '2.5px solid #FFD700',
  minWidth: 120,
  textAlign: 'center',
  letterSpacing: 0.5,
};

const cellStyle = {
  background: '#232323',
  color: '#FFD700',
  fontWeight: 700,
  textAlign: 'center',
  borderBottom: '1.5px solid #FFD700',
  minWidth: 120,
  padding: '12px 8px',
  fontSize: 15,
  verticalAlign: 'middle',
};

const inputStyle = {
  width: '100%',
  background: 'transparent',
  border: '1px solid #FFD700',
  color: '#fff',
  fontWeight: 600,
  fontSize: 15,
  borderRadius: 6,
  padding: '6px 8px',
  outline: 'none',
  transition: 'border 0.2s',
};

const API_BASE = 'http://localhost:8000/bia/critical-applications-summary';

async function getOrganizationId() {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('No access token found');
  const decoded = jwtDecode(token);
  const organization_id = decoded.organization_id;
  if (!organization_id) throw new Error('No organization_id in token');
  return organization_id;
}

const columns = [
  'Application Name',
  'On Prem/Cloud/SAAS/External-Third Party',
  'Application RTO (Hours)-Minimum',
  'Application RPO (Hours)-Minimum',
  'Business RTO',
  'Application Status Transformation Program Status',
  'Application Status per Transformation Program',
  'Replacement',
  'Tech RTO',
  'Tech RPO',
  'Remarks',
];

const CriticalApplicationsSummary = () => {
  const [organizationId, setOrganizationId] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      setSuccess('');
      try {
        const orgId = await getOrganizationId();
        setOrganizationId(orgId);
        const res = await fetch(`${API_BASE}/${orgId}`);
        if (!res.ok) throw new Error('Failed to fetch critical applications summary');
        const data = await res.json();
        setRows(
          data.map(row => ({
            ...row,
            location: row.location || '',
            business_rto: row.business_rto || '',
            trans_status: row.trans_status || '',
            prog_status: row.prog_status || '',
            replacement: row.replacement || '',
            tech_rto: row.tech_rto || '',
            tech_rpo: row.tech_rpo || '',
            remarks: row.remarks || '',
          }))
        );
      } catch (e) {
        setError(e.message || 'Failed to fetch critical applications summary');
      }
      setLoading(false);
    })();
  }, []);

  const handleInputChange = (idx, field, value) => {
    setRows(rows => rows.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = rows.map(({ id, ...rest }) => rest); // Remove id if present
      const res = await fetch(`${API_BASE}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to save critical applications summary');
      }
      setSuccess('Critical applications summary saved successfully!');
    } catch (e) {
      setError(e.message || 'Failed to save critical applications summary');
    }
    setSaving(false);
  };

  return (
    <div style={{ background: '#181818', minHeight: '100vh', padding: '32px 0', color: '#fff' }}>
      <div style={{ maxWidth: 1700, margin: '0 auto', background: '#232323', borderRadius: 18, boxShadow: '0 6px 36px #000a', padding: 36, position: 'relative' }}>
        <h2 style={{ color: '#FFD700', textAlign: 'center', marginBottom: 36, fontWeight: 900, fontSize: 34, letterSpacing: 1 }}>Critical Applications Summary</h2>
        {loading && <div style={{ color: '#FFD700', marginBottom: 16 }}>Loading...</div>}
        {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
        {success && <div style={{ color: 'lime', marginBottom: 16 }}>{success}</div>}
        <div style={{ overflowX: 'auto', borderRadius: 12, border: '1.5px solid #FFD700', background: '#181818', boxShadow: '0 2px 12px #0008' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: 'transparent', color: '#fff', fontSize: 15, minWidth: 1800, borderRadius: 12 }}>
            <thead>
              <tr>
                {columns.map((col, idx) => (
                  <th key={col} style={headerStyle}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} style={{ background: idx % 2 === 0 ? '#232323' : '#181818', borderRadius: 8 }}>
                  <td style={cellStyle}>{row.app_name}</td>
                  <td style={cellStyle}>
                    <input type="text" value={row.location} onChange={e => handleInputChange(idx, 'location', e.target.value)} style={inputStyle} />
                  </td>
                  <td style={cellStyle}>{row.app_rto}</td>
                  <td style={cellStyle}>{row.app_rpo}</td>
                  <td style={cellStyle}>
                    <input type="text" value={row.business_rto} onChange={e => handleInputChange(idx, 'business_rto', e.target.value)} style={inputStyle} />
                  </td>
                  <td style={cellStyle}>
                    <input type="text" value={row.trans_status} onChange={e => handleInputChange(idx, 'trans_status', e.target.value)} style={inputStyle} />
                  </td>
                  <td style={cellStyle}>
                    <input type="text" value={row.prog_status} onChange={e => handleInputChange(idx, 'prog_status', e.target.value)} style={inputStyle} />
                  </td>
                  <td style={cellStyle}>
                    <input type="text" value={row.replacement} onChange={e => handleInputChange(idx, 'replacement', e.target.value)} style={inputStyle} />
                  </td>
                  <td style={cellStyle}>
                    <input type="text" value={row.tech_rto} onChange={e => handleInputChange(idx, 'tech_rto', e.target.value)} style={inputStyle} />
                  </td>
                  <td style={cellStyle}>
                    <input type="text" value={row.tech_rpo} onChange={e => handleInputChange(idx, 'tech_rpo', e.target.value)} style={inputStyle} />
                  </td>
                  <td style={cellStyle}>
                    <input type="text" value={row.remarks} onChange={e => handleInputChange(idx, 'remarks', e.target.value)} style={inputStyle} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button
            onClick={handleSave}
            disabled={saving || loading || rows.length === 0}
            style={{
              background: '#FFD700',
              color: '#232323',
              fontWeight: 800,
              fontSize: 18,
              border: 'none',
              borderRadius: 8,
              padding: '12px 36px',
              cursor: 'pointer',
              opacity: saving || loading || rows.length === 0 ? 0.6 : 1,
              boxShadow: '0 2px 8px #0006',
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CriticalApplicationsSummary; 