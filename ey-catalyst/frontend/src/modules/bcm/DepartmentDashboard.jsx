import React, { useState, useEffect } from 'react';
import { FaChartBar, FaCogs, FaUserShield, FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';
import apiService from './apiService';

const DepartmentDashboard = ({ department, onBack }) => {
  const [departmentData, setDepartmentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDepartmentData = async () => {
      try {
        setLoading(true);
        // Use the department data passed from parent which already has stats
        setDepartmentData(department);
      } catch (err) {
        console.error('Failed to load department data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (department) {
      loadDepartmentData();
    }
  }, [department]);

  if (loading) {
    return (
      <div style={{
        padding: '48px 0',
        background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#FFD700',
        fontSize: '20px'
      }}>
        Loading department data...
      </div>
    );
  }

  const cardStyle = {
    background: 'rgba(32,32,32,0.75)',
    color: '#FFD700',
    borderRadius: 24,
    padding: '32px 28px',
    margin: 12,
    boxShadow: '0 0 0 3px #FFD70033, 0 8px 32px #000a',
    minWidth: 260,
    flex: 1,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '2px solid #FFD70033',
  };

  const sectionTitleStyle = {
    color: '#FFD700',
    fontWeight: 800,
    fontSize: 22,
    marginBottom: 16,
    letterSpacing: 0.5,
    textShadow: '0 2px 8px #FFD70033',
  };

  return (
    <div style={{
      padding: '48px 0',
      background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
      minHeight: '100vh',
      width: '100%',
      position: 'relative',
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
          {departmentData?.name || 'Department'} BCM Plan
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
          <FaArrowLeft style={{ fontSize: 22 }} /> Back to Departments
        </button>
      </div>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginBottom: 36 }}>
          <div style={cardStyle}>
            <FaChartBar size={36} color="#FFD700" />
            <div style={sectionTitleStyle}>BIA Status</div>
            <div style={{ color: '#fff', fontWeight: 700 }}>
              Completed: {departmentData?.completed_bia || 0} / {departmentData?.total_processes || 0}
            </div>
            <div style={{ color: '#fff' }}>Pending: {departmentData?.pending_bia || 0}</div>
            <div style={{ color: '#fff' }}>Critical: {departmentData?.critical_processes || 0}</div>
          </div>
          <div style={cardStyle}>
            <FaCogs size={36} color="#FFD700" />
            <div style={sectionTitleStyle}>Recovery Strategies</div>
            <div style={{ color: '#fff' }}>Implemented: 3</div>
            <div style={{ color: '#fff' }}>In Progress: 2</div>
            <div style={{ color: '#fff' }}>Not Started: 1</div>
            <div style={{ fontSize: '12px', color: '#ccc', marginTop: '8px' }}>
              *Data from strategy module
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          <div style={cardStyle}>
            <FaUserShield size={36} color="#FFD700" />
            <div style={sectionTitleStyle}>Department Info</div>
            <div style={{ color: '#fff' }}>
              <strong>Head:</strong> {departmentData?.head_name || 'Not specified'}
            </div>
            <div style={{ color: '#fff' }}>
              <strong>Total Processes:</strong> {departmentData?.total_processes || 0}
            </div>
            <div style={{ color: '#fff' }}>
              <strong>Critical Processes:</strong> {departmentData?.critical_processes || 0}
            </div>
          </div>
          <div style={{ ...cardStyle, minWidth: 340 }}>
            <FaExclamationTriangle size={36} color="#FFD700" />
            <div style={sectionTitleStyle}>Process Overview</div>
            <div style={{ color: '#fff' }}>
              This department has {departmentData?.total_processes || 0} total processes with{' '}
              {departmentData?.completed_bia || 0} BIA assessments completed and{' '}
              {departmentData?.critical_processes || 0} marked as critical.
            </div>
            <div style={{ fontSize: '12px', color: '#ccc', marginTop: '8px' }}>
              *Process details available in process management
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentDashboard;
