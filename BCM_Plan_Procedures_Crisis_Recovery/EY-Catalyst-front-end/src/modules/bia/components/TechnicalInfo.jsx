import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

const columns = [
  'S/N',
  'Application/IT Service',
  'Application Owner',
  'Technical Interdependency with other application, details',
  'Current Capability',
  'Minimum Human Resource',
  'Critical Administrative Accounts, if any',
  'Required internet connectivity',
  'Any special tools/script, details',
  'In-house or Externally Sourced',
  'Service Provider required for troubleshooting and recovery, and SLA',
  "Vendor's Onsite Support",
  "Vendor's Offsite Support"
];

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

// Placeholder for getting organization_id (replace with your actual logic)
async function getOrganizationId() {
  // TODO: Replace with actual logic to get user's organization_id
  // e.g., from user context, profile, or API
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('No access token found');
const decoded = jwtDecode(token);
        const organization_id = decoded.organization_id;
        if (!organization_id) throw new Error('No organization_id in token');
  // const organization_id = window.localStorage.getItem('organization_id') || '';
  console.log(organization_id);
  
  return organization_id;

}

// Backend API base URL
const API_BASE = 'http://localhost:8000/bia/technical-info'; // Adjust if your backend is on a different base path

export default function TechnicalInfo() {
  const [organizationId, setOrganizationId] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 1. Get organizationId and fetch initial technical info template
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      setSuccess('');
      const orgId = await getOrganizationId();
      if (!orgId) {
        setError('Organization not found.');
        setLoading(false);
        return;
      }
      setOrganizationId(orgId);
      try {
        const res = await fetch(`${API_BASE}/${orgId}`);
        if (!res.ok) throw new Error('Failed to fetch technical info template');
        const data = await res.json();
        setRows(
          data.map(row => ({
            ...row,
            // Ensure all fields exist for editing
            owner: row.owner || '',
            min_human_resource: row.min_human_resource || '',
            admin_accounts: row.admin_accounts || '',
            internet_connectivity: row.internet_connectivity || '',
            special_tools: row.special_tools || '',
            external: row.external || '',
            service_provider: row.service_provider || '',
            vendor_onsite_support: row.vendor_onsite_support || '',
            vendor_offsite_support: row.vendor_offsite_support || '',
          }))
        );
      } catch (e) {
        setError(e.message || 'Failed to fetch technical info template');
      }
      setLoading(false);
    })();
  }, []);

  // 2. Handle user input for editable fields
  const handleInputChange = (idx, field, value) => {
    setRows(rows => rows.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  };

  // 3. Save handler
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
        throw new Error(err.detail || 'Failed to save technical info');
      }
      setSuccess('Technical info saved successfully!');
    } catch (e) {
      setError(e.message || 'Failed to save technical info');
    }
    setSaving(false);
  };

  return (
    <div style={{ background: '#181818', minHeight: '100vh', padding: '32px 0', color: '#FFD700' }}>
      <div style={{ maxWidth: 1600, margin: '0 auto', background: '#232323', borderRadius: 18, boxShadow: '0 6px 36px #000a', padding: 36, position: 'relative' }}>
        <h2 style={{ color: '#FFD700', textAlign: 'center', marginBottom: 36, fontWeight: 900, fontSize: 34, letterSpacing: 1 }}>Technical Information Table</h2>
        {loading && <div style={{ color: '#FFD700', marginBottom: 16 }}>Loading...</div>}
        {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
        {success && <div style={{ color: 'lime', marginBottom: 16 }}>{success}</div>}
        <div style={{ overflowX: 'auto', borderRadius: 12, border: '1.5px solid #FFD700', background: '#181818', boxShadow: '0 2px 12px #0008' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: 'transparent', color: '#FFD700', fontSize: 15, minWidth: 1500, borderRadius: 12 }}>
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
                  <td style={cellStyle}>{idx + 1}</td>
                  <td style={cellStyle}>{row.service}</td>
                  <td style={cellStyle}>
                    <input
                      type="text"
                      value={row.owner}
                      onChange={e => handleInputChange(idx, 'owner', e.target.value)}
                      style={{ width: '100%', background: 'transparent', color: '#FFD700', border: 'none', outline: 'none', textAlign: 'center' }}
                    />
                  </td>
                  <td style={cellStyle}>
                    <input
                      type="text"
                      value={row.interdependency}
                      onChange={e => handleInputChange(idx, 'interdependency', e.target.value)}
                      style={{ width: '100%', background: 'transparent', color: '#FFD700', border: 'none', outline: 'none', textAlign: 'center' }}
                    />
                  </td>
                  <td style={cellStyle}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, borderRight: '1px solid #FFD700', paddingRight: 8 }}>
                        <span style={{ color: '#FFD700', fontWeight: 700, fontSize: 14 }}>RTO</span>
                        <span style={{ color: '#3cb371', fontWeight: 700, fontSize: 15 }}>{row.rto}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, paddingLeft: 8 }}>
                        <span style={{ color: '#FFD700', fontWeight: 700, fontSize: 14 }}>RPO</span>
                        <span style={{ color: '#3cb371', fontWeight: 700, fontSize: 15 }}>{row.rpo}</span>
                      </div>
                    </div>
                  </td>
                  <td style={cellStyle}>
                    <input
                      type="text"
                      value={row.min_human_resource}
                      onChange={e => handleInputChange(idx, 'min_human_resource', e.target.value)}
                      style={{ width: '100%', background: 'transparent', color: '#FFD700', border: 'none', outline: 'none', textAlign: 'center' }}
                    />
                  </td>
                  <td style={{ ...cellStyle, whiteSpace: 'pre-line', fontStyle: 'italic' }}>
                    <input
                      type="text"
                      value={row.admin_accounts}
                      onChange={e => handleInputChange(idx, 'admin_accounts', e.target.value)}
                      style={{ width: '100%', background: 'transparent', color: '#FFD700', border: 'none', outline: 'none', textAlign: 'center', fontStyle: 'italic' }}
                    />
                  </td>
                  <td style={cellStyle}>
                    <input
                      type="text"
                      value={row.internet_connectivity}
                      onChange={e => handleInputChange(idx, 'internet_connectivity', e.target.value)}
                      style={{ width: '100%', background: 'transparent', color: '#FFD700', border: 'none', outline: 'none', textAlign: 'center' }}
                    />
                  </td>
                  <td style={cellStyle}>
                    <input
                      type="text"
                      value={row.special_tools}
                      onChange={e => handleInputChange(idx, 'special_tools', e.target.value)}
                      style={{ width: '100%', background: 'transparent', color: '#FFD700', border: 'none', outline: 'none', textAlign: 'center' }}
                    />
                  </td>
                  <td style={cellStyle}>
                    <input
                      type="text"
                      value={row.external}
                      onChange={e => handleInputChange(idx, 'external', e.target.value)}
                      style={{ width: '100%', background: 'transparent', color: '#FFD700', border: 'none', outline: 'none', textAlign: 'center' }}
                    />
                  </td>
                  <td style={cellStyle}>
                    <input
                      type="text"
                      value={row.service_provider}
                      onChange={e => handleInputChange(idx, 'service_provider', e.target.value)}
                      style={{ width: '100%', background: 'transparent', color: '#FFD700', border: 'none', outline: 'none', textAlign: 'center' }}
                    />
                  </td>
                  <td style={cellStyle}>
                    <input
                      type="text"
                      value={row.vendor_onsite_support}
                      onChange={e => handleInputChange(idx, 'vendor_onsite_support', e.target.value)}
                      style={{ width: '100%', background: 'transparent', color: '#FFD700', border: 'none', outline: 'none', textAlign: 'center' }}
                    />
                  </td>
                  <td style={cellStyle}>
                    <input
                      type="text"
                      value={row.vendor_offsite_support}
                      onChange={e => handleInputChange(idx, 'vendor_offsite_support', e.target.value)}
                      style={{ width: '100%', background: 'transparent', color: '#FFD700', border: 'none', outline: 'none', textAlign: 'center' }}
                    />
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
} 