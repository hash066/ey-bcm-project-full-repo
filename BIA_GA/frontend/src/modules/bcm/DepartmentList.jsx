import React from 'react';
import { FaArrowLeft, FaBuilding } from 'react-icons/fa';

const DepartmentList = ({ departments, onSelectDepartment, onBack }) => (
  <div style={{
    padding: '48px 0',
    background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
    minHeight: '100vh',
    width: '100%',
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      maxWidth: 1400,
      margin: '0 auto 36px auto',
      padding: '0 32px',
    }}>
      <h1 style={{
        color: '#FFD700',
        fontWeight: 900,
        fontSize: 38,
        margin: 0,
        letterSpacing: 1,
        textShadow: '0 2px 16px #FFD70033',
      }}>
        Departments
      </h1>
      <button
        onClick={onBack}
        style={{
          background: 'linear-gradient(90deg, #FFD700 0%, #facc15 100%)',
          color: '#232323',
          border: 'none',
          borderRadius: 18,
          fontWeight: 900,
          fontSize: 20,
          padding: '14px 38px',
          cursor: 'pointer',
          boxShadow: '0 4px 24px #FFD70055',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <FaArrowLeft style={{ fontSize: 22 }} /> Back to Dashboard
      </button>
    </div>
    <div style={{
      maxWidth: 1400,
      margin: '0 auto',
      padding: '0 32px',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: 32,
    }}>
      {departments.map(dept => (
        <div
          key={dept.id}
          onClick={() => onSelectDepartment(dept)}
          style={{
            background: 'rgba(32,32,32,0.75)',
            color: '#FFD700',
            borderRadius: 24,
            padding: '32px 28px',
            boxShadow: '0 0 0 3px #FFD70033, 0 8px 32px #000a',
            backdropFilter: 'blur(10px)',
            border: '2px solid #FFD70033',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = 'scale(1.03)';
            e.currentTarget.style.boxShadow = '0 0 0 4px #FFD70066, 0 12px 40px #000c';
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 0 0 3px #FFD70033, 0 8px 32px #000a';
          }}
        >
          <FaBuilding size={36} color="#FFD700" style={{ marginBottom: 16 }} />
          <h2 style={{ color: '#FFD700', fontWeight: 800, fontSize: 22, marginBottom: 8 }}>{dept.name}</h2>
          <p style={{ color: '#fff', fontSize: 16 }}>{dept.description}</p>
        </div>
      ))}
    </div>
  </div>
);

export default DepartmentList;
