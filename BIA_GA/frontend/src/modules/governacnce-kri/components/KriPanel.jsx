import React, { useState } from 'react';
import { kris } from '../data/mockData';

const riskLevels = ['All', 'Low', 'Medium', 'High', 'Critical'];
const trendIcons = {
  Up: { icon: 'fas fa-arrow-up', color: '#28a745', label: 'Increasing' },
  Down: { icon: 'fas fa-arrow-down', color: '#dc3545', label: 'Decreasing' },
  Stable: { icon: 'fas fa-arrows-alt-h', color: '#ffc107', label: 'Stable' },
};

function getInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

const KriPanel = () => {
  const [filter, setFilter] = useState('All');
  const filteredKris = filter === 'All' ? kris : kris.filter(kri => kri.level.toLowerCase() === filter.toLowerCase());

  return (
    <div className="card">
      <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Key Risk Indicators (KRIs)
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ background: '#222', color: '#ffcc00', border: '1px solid #444', borderRadius: 6, padding: '0.2rem 0.6rem', fontWeight: 600 }}
        >
          {riskLevels.map(level => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
      </h2>
      <div className="kri-list">
        {filteredKris.length === 0 && (
          <div style={{ color: '#ccc', padding: '1rem 0' }}>No KRIs for this risk level.</div>
        )}
        {filteredKris.map(kri => (
          <div key={kri.id} className={`kri-item kri-${kri.level.toLowerCase()}`}
            style={{ display: 'flex', alignItems: 'center', gap: 16 }}
          >
            <i className={kri.icon} style={{ fontSize: '1.7rem' }}></i>
            <div className="kri-content" style={{ flex: 1 }}>
              <div className="kri-name" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {kri.name}
                <span title={trendIcons[kri.trend]?.label || kri.trend} style={{ color: trendIcons[kri.trend]?.color, marginLeft: 4 }}>
                  <i className={trendIcons[kri.trend]?.icon}></i>
                </span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-fill" style={{ width: `${kri.progress}%` }}></div>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#ccc', marginTop: 4, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{
                    background: '#ffcc00',
                    color: '#222',
                    borderRadius: '50%',
                    width: 28,
                    height: 28,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1rem',
                  }}>{getInitials(kri.owner)}</span>
                  <span style={{ color: '#ffcc00', fontWeight: 600, marginLeft: 4 }}>{kri.owner}</span>
                </span>
                <span style={{ color: '#888' }}>Last reviewed: {kri.lastReviewed}</span>
              </div>
            </div>
            <span className={`risk-badge ${kri.level.toLowerCase()}`} style={{ marginLeft: 12, minWidth: 70, textAlign: 'center' }}>{kri.level}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KriPanel;