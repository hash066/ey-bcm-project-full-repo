import React, { useEffect, useState } from 'react';
import { getOrganizationMorApplications, fetchProcessImpactData } from '../services/biaService';
import { jwtDecode } from 'jwt-decode';

const IMPACT_CATEGORIES = [
  'Reputational Impact',
  'Operational Impact',
  'Financial Impact',
  'Legal Impact',
  'Overall Impact',
];
const DURATION_COLUMNS = [
  '2 Hours', '4 Hours', '8 Hours', '12 Hours', '24 Hours', '48 Hours', '72 Hours', '1 Week', '2 Weeks', '1 Month'
];

export default function BusinessInformation() {
  const [rows, setRows] = useState([]);
  const [impactData, setImpactData] = useState({});
  const [editedRows, setEditedRows] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRows = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('access_token');
        if (!token) throw new Error('No access token found');
        const decoded = jwtDecode(token);
        const organization_id = decoded.organization_id;
        if (!organization_id) throw new Error('No organization_id in token');
        const data = await getOrganizationMorApplications(organization_id);
        // Show only unique it_applications (case-insensitive, trimmed), keep only the latest one by updated_at/created_at
        const latestByApp = {};
        data.forEach(row => {
          const appNameRaw = row.it_applications || '';
          const appName = appNameRaw.trim().toLowerCase();
          if (!appName) return;
          const current = latestByApp[appName];
          const rowDate = row.updated_at ? new Date(row.updated_at) : (row.created_at ? new Date(row.created_at) : null);
          const currentDate = current ? (current.updated_at ? new Date(current.updated_at) : (current.created_at ? new Date(current.created_at) : null)) : null;
          if (!current || (rowDate && (!currentDate || rowDate > currentDate))) {
            latestByApp[appName] = row;
          }
        });
        setRows(Object.values(latestByApp));
        // Initialize editedRows with empty strings for all cells
        const initialEditedRows = {};
        data.forEach(row => {
          initialEditedRows[row.mor_id] = {};
          IMPACT_CATEGORIES.forEach(cat => {
            initialEditedRows[row.mor_id][cat] = {};
            DURATION_COLUMNS.forEach(duration => {
              initialEditedRows[row.mor_id][cat][duration] = '';
            });
          });
        });
        setEditedRows(initialEditedRows);
        // Fetch impact data for each application (mock if not available)
        const impactResults = {};
        for (const row of data) {
          try {
            const impacts = await fetchProcessImpactData({ name: row.application_name });
            impactResults[row.mor_id] = impacts;
          } catch {
            impactResults[row.mor_id] = {};
          }
        }
        setImpactData(impactResults);
      } catch (err) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchRows();
  }, []);

  // Handle input changes for editable fields
  const handleInputChange = (morId, cat, field, value) => {
    setEditedRows(prev => {
      const prevRow = prev[morId] || {};
      const prevCat = prevRow[cat] || {};
      return {
        ...prev,
        [morId]: {
          ...prevRow,
          [cat]: {
            ...prevCat,
            [field]: value
          }
        }
      };
    });
  };

  // Handle input changes for non-impact fields (not per impact category)
  const handleRowInputChange = (morId, field, value) => {
    setEditedRows(prev => ({
      ...prev,
      [morId]: {
        ...prev[morId],
        [field]: value
      }
    }));
  };

  // Helper to get the value (edited or original)
  const getCellValue = (row, cat, field, duration) => {
    const morId = row.mor_id;
    if (editedRows[morId]?.[cat]?.[duration] !== undefined) return editedRows[morId][cat][duration];
    return '';
  };
  const getRowValue = (row, field) => {
    const morId = row.mor_id;
    if (editedRows[morId]?.[field] !== undefined) return editedRows[morId][field];
    return row[field] || '';
  };

  // Save handler (for now, just log the editedRows)
  const handleSave = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('No access token found');
      const decoded = jwtDecode(token);
      const username = decoded.username || decoded.user || decoded.sub || decoded.name;
      const organization_id = decoded.organization_id;
      if (!username) throw new Error('No username in token');

      // Prepare payload for business_application_impact
      const payload = rows.map(row => {
        const morId = row.mor_id;
        const impacts = editedRows[morId] || {};
        // Calculate matrix and derived values
        const impactMatrix = {};
        IMPACT_CATEGORIES.forEach(cat => {
          impactMatrix[cat] = {};
          DURATION_COLUMNS.forEach(duration => {
            impactMatrix[cat][duration] = impacts[cat]?.[duration] || '';
          });
        });
        // Calculate derived values (same as in render)
        const overallRow = DURATION_COLUMNS.map((_, colIdx) => {
          const values = IMPACT_CATEGORIES.filter(c => c !== 'Overall Impact').map(cat => impactMatrix[cat][DURATION_COLUMNS[colIdx]]);
          return getMaxNumeric(values);
        });
        const rtoIdx = getDurationByValue(overallRow, 2, true);
        const mtpdIdx = getDurationByValue(overallRow, 3, false);
        const rpoIdx = rtoIdx;
        const rto = rtoIdx !== '' ? DURATION_COLUMNS[rtoIdx] : '';
        const mtpd = mtpdIdx !== '' ? DURATION_COLUMNS[mtpdIdx] : '';
        const rpo = rpoIdx !== '' ? DURATION_COLUMNS[rpoIdx] : '';
        const recoveryCategoryRoman = getRecoveryCategoryRoman(mtpd);
        return {
          organization_id,
          application_name: row.it_applications,
          department_name: row.department_name,
          impact_matrix: impactMatrix,
          mtpd,
          rto,
          rpo,
          recovery_category: recoveryCategoryRoman ? `Category ${recoveryCategoryRoman}` : '',
          interdependency: getRowValue(row, 'it_applications'),
          external_application_service: getRowValue(row, 'vendor_name'),
          desktop_software_list: getRowValue(row, 'software_names'),
        };
      });

      const response = await fetch(
        `http://localhost:8000/bia/business-application-impact`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : undefined,
          },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) throw new Error('Failed to save data');
      const result = await response.json();
      alert('Data saved successfully!');
      console.log('Backend response:', result);
    } catch (err) {
      alert('Failed to save data: ' + err.message);
    }
  };

  // Helper: get max numeric value from a set of values
  function getMaxNumeric(values) {
    const nums = values.map(v => parseInt(v)).filter(v => !isNaN(v));
    return nums.length ? Math.max(...nums) : '';
  }

  // Helper: get duration index for RTO/MTPD
  function getDurationByValue(values, target, last = false) {
    const idxs = values
      .map((v, i) => (parseInt(v) === target ? i : -1))
      .filter(i => i !== -1);
    if (!idxs.length) return '';
    return last ? idxs[idxs.length - 1] : idxs[0];
  }

  // Helper: map duration string to hours for comparison
  function durationToHours(duration) {
    if (!duration) return Infinity;
    if (duration.includes('Hour')) return parseInt(duration);
    if (duration === '1 Week') return 24 * 7;
    if (duration === '2 Weeks') return 24 * 14;
    if (duration === '1 Month') return 24 * 30;
    return Infinity;
  }
  // Helper: get recovery category label based on MTPD
  function getRecoveryCategory(mt) {
    const h = durationToHours(mt);
    if (h <= 24) return 'CRITICAL IT services';
    if (h > 24 && h <= 24 * 5) return 'Essential IT services';
    if (h > 24 * 5 && h <= 24 * 14) return 'Necessary IT services';
    if (h > 24 * 14 && h <= 24 * 30) return 'Desirable IT services';
    return '';
  }
  // Helper: get recovery category roman numeral based on MTPD
  function getRecoveryCategoryRoman(mt) {
    const h = durationToHours(mt);
    if (h <= 24) return 'I';
    if (h > 24 && h <= 24 * 5) return 'II';
    if (h > 24 * 5 && h <= 24 * 14) return 'III';
    if (h > 24 * 14 && h <= 24 * 30) return 'IV';
    return '';
  }

  if (loading) return <div style={{ color: '#FFD700', textAlign: 'center', margin: 32 }}>Loading...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center', margin: 32 }}>{error}</div>;

  return (
    <div style={{ background: '#181818', minHeight: '100vh', padding: '32px 0', color: '#FFD700' }}>
      <div style={{ maxWidth: 1800, margin: '0 auto', background: '#232323', borderRadius: 16, boxShadow: '0 4px 32px #000a', padding: 32, position: 'relative' }}>
        <h2 style={{ color: '#FFD700', textAlign: 'center', marginBottom: 32, fontWeight: 800, fontSize: 32 }}>Business Information Table</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'transparent', color: '#FFD700', fontSize: 15, minWidth: 1600 }}>
            <thead>
              <tr>
                <th rowSpan={2} style={thStyle}>S/N</th>
                <th rowSpan={2} style={thStyle}>Application/IT Service</th>
                <th rowSpan={2} style={thStyle}>Department</th>
                <th rowSpan={2} style={thStyle}>Impact Category</th>
                <th colSpan={DURATION_COLUMNS.length} style={thStyle}>Duration of Impact</th>
                <th rowSpan={2} style={{ ...thStyle, background: '#3a2e6b', color: '#FFD700' }}>MTPD</th>
                <th rowSpan={2} style={{ ...thStyle, background: '#3a2e6b', color: '#FFD700' }}>RTO</th>
                <th rowSpan={2} style={{ ...thStyle, background: '#3a2e6b', color: '#FFD700' }}>RPO</th>
                <th rowSpan={2} style={thStyle}>Recovery Category</th>
                <th rowSpan={2} style={thStyle}>Interdependency: Applications and IT Services</th>
                <th rowSpan={2} style={thStyle}>External Application Service, if any</th>
                <th rowSpan={2} style={thStyle}>Desktop Software List</th>
              </tr>
              <tr>
                {DURATION_COLUMNS.map((d) => (
                  <th key={d} style={thStyle}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                // Build a matrix of impact values for this row
                const impactMatrix = {};
                IMPACT_CATEGORIES.forEach(cat => {
                  impactMatrix[cat] = DURATION_COLUMNS.map(duration =>
                    getCellValue(row, cat, 'impact', duration)
                  );
                });
                // Calculate Overall Impact row
                const overallRow = DURATION_COLUMNS.map((_, colIdx) => {
                  // For each duration, get max of all categories except Overall Impact
                  const values = IMPACT_CATEGORIES.filter(c => c !== 'Overall Impact').map(cat => impactMatrix[cat][colIdx]);
                  return getMaxNumeric(values);
                });
                // Calculate RTO (last 2), MTPD (first 3), RPO (same as RTO)
                const rtoIdx = getDurationByValue(overallRow, 2, true);
                const mtpdIdx = getDurationByValue(overallRow, 3, false);
                const rpoIdx = rtoIdx;
                const rto = rtoIdx !== '' ? DURATION_COLUMNS[rtoIdx] : '';
                const mtpd = mtpdIdx !== '' ? DURATION_COLUMNS[mtpdIdx] : '';
                const rpo = rpoIdx !== '' ? DURATION_COLUMNS[rpoIdx] : '';
                const recoveryCategory = getRecoveryCategory(mtpd);
                const recoveryCategoryRoman = getRecoveryCategoryRoman(mtpd);

                return IMPACT_CATEGORIES.map((cat, catIdx) => (
                  <tr key={row.mor_id + '-' + cat}>
                    {catIdx === 0 && (
                      <td rowSpan={IMPACT_CATEGORIES.length} style={{ ...cellStyle, fontWeight: 700, fontSize: 16 }}>{idx + 1}</td>
                    )}
                    {catIdx === 0 && (
                      <td rowSpan={IMPACT_CATEGORIES.length} style={{ ...cellStyle, fontWeight: 700, fontSize: 16 }}>{row.it_applications}</td>
                    )}
                    {catIdx === 0 && (
                      <td rowSpan={IMPACT_CATEGORIES.length} style={{ ...cellStyle, fontWeight: 700, fontSize: 16 }}>{row.department_name}</td>
                    )}
                    <td style={{ ...cellStyle, fontWeight: 600 }}>{cat}</td>
                    {DURATION_COLUMNS.map((duration, colIdx) => (
                      <td key={duration} style={cellStyle}>
                        {/* For Overall Impact row, show calculated value, else input */}
                        {cat === 'Overall Impact' ? (
                          <span style={{ fontWeight: 700 }}>{overallRow[colIdx]}</span>
                        ) : (
                          <input
                            type="text"
                            value={getCellValue(row, cat, 'impact', duration)}
                            onChange={e => handleInputChange(row.mor_id, cat, duration, e.target.value)}
                            style={inputStyle}
                            onFocus={e => e.target.style.boxShadow = '0 0 0 2px #FFD70055'} onBlur={e => e.target.style.boxShadow = 'none'}
                          />
                        )}
                      </td>
                    ))}
                    {catIdx === 0 && (
                      <td rowSpan={IMPACT_CATEGORIES.length} style={purpleCellStyle}>{mtpd}</td>
                    )}
                    {catIdx === 0 && (
                      <td rowSpan={IMPACT_CATEGORIES.length} style={purpleCellStyle}>{rto}</td>
                    )}
                    {catIdx === 0 && (
                      <td rowSpan={IMPACT_CATEGORIES.length} style={purpleCellStyle}>{rpo}</td>
                    )}
                    {catIdx === 0 && (
                      <td rowSpan={IMPACT_CATEGORIES.length} style={cellStyle}>{recoveryCategoryRoman}</td>
                    )}
                    {catIdx === 0 && (
                      <td rowSpan={IMPACT_CATEGORIES.length} style={cellStyle}>
                        <input
                          type="text"
                          value={getRowValue(row, 'it_applications')}
                          onChange={e => handleRowInputChange(row.mor_id, 'it_applications', e.target.value)}
                          style={wideInputStyle}
                          onFocus={e => e.target.style.boxShadow = '0 0 0 2px #FFD70055'} onBlur={e => e.target.style.boxShadow = 'none'}
                        />
                      </td>
                    )}
                    {catIdx === 0 && (
                      <td rowSpan={IMPACT_CATEGORIES.length} style={cellStyle}>
                        <input
                          type="text"
                          value={getRowValue(row, 'vendor_name')}
                          onChange={e => handleRowInputChange(row.mor_id, 'vendor_name', e.target.value)}
                          style={wideInputStyle}
                          onFocus={e => e.target.style.boxShadow = '0 0 0 2px #FFD70055'} onBlur={e => e.target.style.boxShadow = 'none'}
                        />
                      </td>
                    )}
                    {catIdx === 0 && (
                      <td rowSpan={IMPACT_CATEGORIES.length} style={cellStyle}>
                        <input
                          type="text"
                          value={getRowValue(row, 'software_names')}
                          onChange={e => handleRowInputChange(row.mor_id, 'software_names', e.target.value)}
                          style={wideInputStyle}
                          onFocus={e => e.target.style.boxShadow = '0 0 0 2px #FFD70055'} onBlur={e => e.target.style.boxShadow = 'none'}
                        />
                      </td>
                    )}
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
        <button onClick={handleSave} style={{ marginTop: 24, background: '#FFD700', color: '#232323', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 17, padding: '12px 32px', cursor: 'pointer' }}>Save</button>
      </div>
    </div>
  );
}

const thStyle = {
  background: '#232323',
  color: '#FFD700',
  fontWeight: 700,
  fontSize: 16,
  padding: '14px 10px', // more padding
  border: '2px solid #FFD700',
  minWidth: 60,
  textAlign: 'center',
  verticalAlign: 'middle',
};
const cellStyle = {
  border: '2px solid #FFD700',
  textAlign: 'center',
  minWidth: 40,
  background: 'transparent',
  color: '#FFD700',
  fontWeight: 500,
  height: 48, // taller rows
  padding: '6px 4px', // more padding
  verticalAlign: 'middle',
  transition: 'background 0.2s',
};
const purpleCellStyle = {
  ...cellStyle,
  background: '#3a2e6b',
  color: '#FFD700',
  fontWeight: 700,
};
const inputStyle = {
  width: 60,
  height: 38,
  background: 'rgba(30,30,30,0.95)', // subtle dark background for contrast
  color: '#FFD700',
  border: '2px solid #FFD700',
  textAlign: 'center',
  fontWeight: 700,
  outline: 'none',
  fontSize: 18,
  borderRadius: 6,
  margin: 0,
  padding: '0 8px',
  boxSizing: 'border-box',
  verticalAlign: 'middle',
  transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  fontFamily: 'inherit',
};
const wideInputStyle = {
  ...inputStyle,
  width: 140,
  fontWeight: 500,
  fontSize: 16,
}; 