import React, { useState } from 'react';
import { maturityScore } from '../data/mockData';

const getTrend = (score) => {
  // Dummy logic for trend: you can replace with real data
  if (score > 80) return { icon: 'fas fa-arrow-up', color: '#28a745', label: 'Improving' };
  if (score < 70) return { icon: 'fas fa-arrow-down', color: '#dc3545', label: 'Declining' };
  return { icon: 'fas fa-arrows-alt-h', color: '#ffc107', label: 'Stable' };
};

const MaturityScore = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const trend = getTrend(maturityScore.overall);

  return (
    <div className="card bcm-score">
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        BCM Maturity Score
        <span
          style={{ cursor: 'pointer', marginLeft: 6 }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <i className="fas fa-info-circle" style={{ color: '#ffcc00', fontSize: '1rem' }}></i>
          {showTooltip && (
            <span style={{
              position: 'absolute',
              background: '#222',
              color: '#fff',
              padding: '0.5rem 1rem',
              borderRadius: 8,
              fontSize: '0.95rem',
              zIndex: 10,
              marginLeft: 20,
              marginTop: -10,
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
            }}>
              The BCM Maturity Score reflects your organization's overall business continuity maturity, based on key categories.
            </span>
          )}
        </span>
      </h2>
      <div className="gauge-container" style={{ position: 'relative' }}>
        <div
          className="gauge-circle"
          style={{
            '--score': `${maturityScore.overall}%`,
            animation: 'gauge-animate 1.2s cubic-bezier(.68,-0.55,.27,1.55)',
            position: 'relative',
          }}
        >
          {maturityScore.overall}%
          <span style={{
            position: 'absolute',
            right: 10,
            bottom: 10,
            fontSize: '1.2rem',
            color: trend.color,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}>
            <i className={trend.icon}></i>
          </span>
        </div>
        <span className="gauge-label">Current Score</span>
      </div>
      <div className="category-scores">
        {maturityScore.categories.map((cat) => (
          <div key={cat.name} className="progress">
            <span>{cat.name}</span>
            <div className="bar">
              <div className="fill" style={{ width: `${cat.score}%` }}></div>
            </div>
            <span style={{ marginLeft: 8, color: '#ffcc00', fontWeight: 600 }}>{cat.score}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MaturityScore;

// Add keyframes for gauge animation in App.css:
// @keyframes gauge-animate { from { --score: 0%; } to { --score: var(--score); } }