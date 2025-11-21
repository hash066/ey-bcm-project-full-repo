import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const API_BASE = 'http://localhost:8000/bia/process-catalogue';

async function getOrganizationId() {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('No access token found');
  const decoded = jwtDecode(token);
  const organization_id = decoded.organization_id;
  if (!organization_id) throw new Error('No organization_id in token');
  return organization_id;
}

const headerStyle = {
  background: 'linear-gradient(90deg, #181818 60%, #232323 100%)',
  color: '#FFD700',
  fontWeight: 900,
  fontSize: 18,
  padding: '20px 12px',
  borderBottom: '3px solid #FFD700',
  minWidth: 140,
  textAlign: 'center',
  letterSpacing: 0.7,
  borderTopLeftRadius: 12,
  borderTopRightRadius: 12,
};

const cellStyle = {
  background: 'rgba(35,35,35,0.97)',
  color: '#FFD700',
  fontWeight: 600,
  textAlign: 'center',
  borderBottom: '1.5px solid #FFD700',
  minWidth: 140,
  padding: '16px 10px',
  fontSize: 16,
  verticalAlign: 'middle',
  borderRadius: 8,
  transition: 'background 0.2s',
};

const columns = [
  { label: 'Process Name', key: 'process_name' },
  { label: 'Department Name', key: 'department_name' },
  { label: 'Sub-Department', key: 'subdepartment_name' },
  { label: 'Application Name', key: 'application_name' },
  { label: 'Vendor/Supplier Name', key: 'vendor_name' },
  { label: 'Process RTO (Hours)', key: 'process_rto' },
  { label: 'Process RPO (Hours)', key: 'process_rpo' },
  { label: 'Process MTPD', key: 'process_mtpd' },
  { label: 'Criticality', key: 'criticality' },
];

const ProcessCatalogue = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const orgId = await getOrganizationId();
        const res = await fetch(`${API_BASE}/${orgId}`);
        if (!res.ok) throw new Error('Failed to fetch process catalogue');
        const data = await res.json();
        setRows(data);
      } catch (e) {
        setError(e.message || 'Failed to fetch process catalogue');
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div style={{ background: '#181818', minHeight: '100vh', padding: '32px 0', color: '#fff' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', background: '#232323', borderRadius: 22, boxShadow: '0 8px 40px #000b', padding: 40, position: 'relative' }}>
        <h2 style={{ color: '#FFD700', textAlign: 'center', marginBottom: 38, fontWeight: 900, fontSize: 38, letterSpacing: 1.2, textShadow: '0 2px 8px #0008' }}>Process Catalogue</h2>
        {loading && <div style={{ color: '#FFD700', marginBottom: 18, fontSize: 18 }}>Loading...</div>}
        {error && <div style={{ color: 'red', marginBottom: 18, fontSize: 17 }}>{error}</div>}
        <div style={{ overflowX: 'auto', borderRadius: 16, border: '2px solid #FFD700', background: '#181818', boxShadow: '0 2px 16px #0008' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: 'transparent', color: '#fff', fontSize: 16, minWidth: 1200, borderRadius: 16 }}>
            <thead>
              <tr>
                {columns.map(col => (
                  <th key={col.key} style={headerStyle}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr
                  key={idx}
                  style={{
                    background: idx % 2 === 0 ? 'rgba(35,35,35,0.97)' : '#181818',
                    borderRadius: 8,
                    boxShadow: idx % 2 === 0 ? '0 1px 6px #0004' : 'none',
                    transition: 'background 0.2s',
                  }}
                >
                  {columns.map(col => (
                    <td key={col.key} style={cellStyle}>{row[col.key]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProcessCatalogue; 