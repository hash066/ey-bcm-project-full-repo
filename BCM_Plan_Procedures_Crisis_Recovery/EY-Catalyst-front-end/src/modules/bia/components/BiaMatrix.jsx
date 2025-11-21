import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrganizationImpactMatrix } from '../services/biaService';
import { jwtDecode } from 'jwt-decode';

export default function BiaMatrix() {
  const navigate = useNavigate();
  const [matrixData, setMatrixData] = useState([]);
  const [impactTypes, setImpactTypes] = useState([]);
  const [severities, setSeverities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Recovery Categories Data (unchanged)
  const recoveryCategories = [
    {
      color: '#e74c3c',
      label: 'Category I',
      title: 'CRITICAL IT services',
      description: 'Time it would take for adverse impacts to become unacceptable due to unavailability of IT service is less than or equal to 24 hours.'
    },
    {
      color: '#ffd700',
      label: 'Category II',
      title: 'Essential IT services',
      description: 'Time it would take for adverse impacts to become unacceptable due to unavailability of IT service is between 1 – 5 business days.'
    },
    {
      color: '#e67e22',
      label: 'Category III',
      title: 'Necessary IT services',
      description: 'Time it would take for adverse impacts to become unacceptable due to unavailability of IT service is between 1 – 2 weeks.'
    },
    {
      color: '#28a745',
      label: 'Category IV',
      title: 'Desirable IT services',
      description: 'Time it would take for adverse impacts to become unacceptable due to unavailability of IT service is larger than 2 weeks and up to 1 month.'
    },
  ];

  useEffect(() => {
    const fetchMatrix = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('access_token');
        if (!token) throw new Error('No access token found');
        const decoded = jwtDecode(token);
        const orgId = decoded.organization_id;
        if (!orgId) throw new Error('No organization_id in token');
        const data = await getOrganizationImpactMatrix(orgId);
        // Expecting data.impact_types (array), data.impact_levels (array), data.cells (array)
        setImpactTypes(data.impact_types?.map(t => t.name) || []);
        setSeverities(data.impact_levels?.map((l, idx) => ({ label: l.name, color: l.color || ['#3cb371','#f7e967','#ffe066','#ffb347','#e74c3c'][idx] })) || []);
        // Build a 2D matrix: rows = impact_types, cols = impact_levels
        const matrix = (data.impact_types || []).map(type => {
          return (data.impact_levels || []).map(level => {
            const cell = (data.cells || []).find(c => c.impact_type_id === type.id && c.impact_level_id === level.id);
            return cell ? cell.description : '';
          });
        });
        setMatrixData(matrix);
      } catch (err) {
        setError(err.message || 'Failed to load impact matrix');
      } finally {
        setLoading(false);
      }
    };
    fetchMatrix();
  }, []);

  return (
    <div style={{ background: '#181818', minHeight: '100vh', padding: '32px 0', color: '#FFD700' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', background: '#232323', borderRadius: 16, boxShadow: '0 4px 32px #000a', padding: 32, position: 'relative' }}>
        <h2 style={{ color: '#FFD700', textAlign: 'center', marginBottom: 32, fontWeight: 800, fontSize: 32 }}>BIA Impact Matrix</h2>
        {loading ? (
          <div style={{ color: '#FFD700', textAlign: 'center', margin: 32 }}>Loading...</div>
        ) : error ? (
          <div style={{ color: 'red', textAlign: 'center', margin: 32 }}>{error}</div>
        ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: 'transparent', color: '#FFD700', fontSize: 15, minWidth: 1100 }}>
            <thead>
              <tr>
                <th style={{ background: '#232323', color: '#FFD700', fontWeight: 700, fontSize: 16, padding: '16px 18px', borderBottom: '2px solid #FFD700', minWidth: 180 }}>Impact Types</th>
                {severities.map((sev, idx) => (
                  <th key={sev.label} style={{ background: sev.color, color: '#232323', fontWeight: 700, fontSize: 16, padding: '16px 18px', borderBottom: '2px solid #FFD700', minWidth: 220, textAlign: 'center' }}>{sev.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {impactTypes.map((type, rowIdx) => (
                <tr key={type}>
                  <td style={{ background: '#232323', color: '#FFD700', fontWeight: 700, padding: '14px 18px', borderBottom: '1.5px solid #FFD700', verticalAlign: 'top', minWidth: 180 }}>{type}</td>
                  {severities.map((sev, colIdx) => (
                    <td
                      key={sev.label}
                      style={{
                        background: sev.color,
                        color: '#232323',
                        fontWeight: 500,
                        padding: '14px 18px',
                        borderBottom: '1px solid #FFD700',
                        borderLeft: colIdx === 0 ? 'none' : '1px solid #FFD700',
                        minWidth: 220,
                        verticalAlign: 'top',
                        borderRadius: colIdx === 0 ? '0 0 0 0' : '0',
                        boxShadow: '0 1px 4px #0002',
                      }}
                    >
                      {matrixData[rowIdx]?.[colIdx] || ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
        {/* Recovery Categories Section (moved below matrix) */}
        <div style={{ marginTop: 36 }}>
          <div style={{ background: '#4682b4', color: '#fff', fontWeight: 800, fontSize: 20, textAlign: 'center', borderRadius: 8, padding: '10px 0', marginBottom: 0, letterSpacing: 1, boxShadow: '0 2px 8px #0002' }}>
            Recovery Categories
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, justifyContent: 'center', background: '#eaf3fa', borderRadius: '0 0 12px 12px', padding: '18px 12px 12px 12px' }}>
            {recoveryCategories.map((cat, idx) => (
              <div key={cat.label} style={{ background: cat.color, color: '#fff', borderRadius: 10, minWidth: 220, maxWidth: 320, flex: '1 1 220px', margin: '0 8px', boxShadow: '0 2px 12px #0003', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '18px 18px 16px 18px', position: 'relative' }}>
                <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 2, letterSpacing: 0.5 }}>{cat.label}</div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{cat.title}</div>
                <div style={{ fontWeight: 500, fontSize: 14, color: '#fff', opacity: 0.95 }}>{cat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 