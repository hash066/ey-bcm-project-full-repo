import React, { useState, useEffect, useRef } from 'react';
import { FaDownload, FaEdit, FaArrowLeft, FaFileAlt } from 'react-icons/fa';
import bcmService from './services/bcmService';

console.log('🟢 OrganizationBCMPlan.jsx file loaded!');

const OrganizationBCMPlan = () => {
  console.log('🟢 OrganizationBCMPlan component initialized');
  
  const [planData, setPlanData] = useState(null);
  const [editedPlanData, setEditedPlanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  console.log('🟢 State initialized:', { loading, error, planData });
  
  const handleBack = () => {
    console.log('🔙 Back button clicked');
    window.location.href = '/bcm';
  };

  useEffect(() => {
    console.log('🟢 First useEffect triggered - loading plan');
    loadOrganizationPlan();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadOrganizationPlan = async () => {
    try {
      setLoading(true);
      console.log('📥 Fetching organization BCM plan...');
      
      const organizationId = localStorage.getItem('organizationId') || '11110413-8907-4b2a-a44e-58b43a172788';
      console.log('Organization ID:', organizationId);
      
      const data = await bcmService.getOrganizationPlan(organizationId);
      console.log('✅ Plan data received:', data);
      
      setPlanData(data);
      setEditedPlanData(data);
      setError(null);
    } catch (err) {
      console.error('❌ Error loading organization plan:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    console.log('✏️ Edit mode activated');
    setEditing(true);
    setEditedPlanData({ ...planData });
  };

  const handleCancelEdit = () => {
    console.log('❌ Edit cancelled');
    setEditing(false);
    setEditedPlanData(planData);
  };

  const handleSave = async () => {
    try {
      console.log('💾 Saving changes...');
      const organizationId = localStorage.getItem('organizationId') || '11110413-8907-4b2a-a44e-58b43a172788';
      
      await bcmService.updateOrganizationPlan(organizationId, editedPlanData);
      
      setPlanData(editedPlanData);
      setEditing(false);
      setSaveSuccess(true);
      
      setTimeout(() => setSaveSuccess(false), 3000);
      
      console.log('✅ Changes saved successfully');
    } catch (err) {
      console.error('❌ Error saving changes:', err);
      alert(`Failed to save changes: ${err.message}`);
    }
  };

  const downloadPDF = async () => {
    try {
      console.log('📥 Downloading PDF...');
      setShowExportDropdown(false);
      const organizationId = localStorage.getItem('organizationId') || '11110413-8907-4b2a-a44e-58b43a172788';
      
      const blob = await bcmService.generateBCMPDF(organizationId, 'organization', null);
      
      if (!blob || blob.size === 0) {
        throw new Error('Received empty PDF');
      }
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `organization_bcm_plan_${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      console.log('✅ PDF downloaded successfully');
    } catch (error) {
      console.error('❌ PDF download error:', error);
      alert(`Failed to download PDF: ${error.message}`);
    }
  };

  const downloadDOC = () => {
    console.log('📝 Downloading DOC...');
    setShowExportDropdown(false);
    window.print();
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#FFD700',
        fontSize: '20px'
      }}>
        Loading Organization BCM Plan...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        color: '#ff6b6b',
        fontSize: '18px',
        textAlign: 'center',
        gap: '20px'
      }}>
        <div>❌ {error}</div>
        <button
          onClick={loadOrganizationPlan}
          style={{
            background: '#FFD700',
            color: '#000',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const displayData = editing ? editedPlanData : planData;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={handleBack}
              style={{
                background: 'rgba(255,215,0,0.1)',
                border: '1px solid #FFD700',
                color: '#FFD700',
                padding: '10px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              <FaArrowLeft /> Back
            </button>
            <h1 style={{
              color: '#FFD700',
              fontSize: '32px',
              fontWeight: 900,
              margin: 0
            }}>
              Organization-Level BCM Plan
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {saveSuccess && (
              <span style={{
                color: '#4CAF50',
                fontSize: '14px',
                fontWeight: 600
              }}>
                ✓ Saved Successfully
              </span>
            )}

            {editing ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid #666',
                    color: '#ccc',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  style={{
                    background: 'linear-gradient(90deg, #FFD700 0%, #facc15 100%)',
                    border: 'none',
                    color: '#000',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 700,
                    boxShadow: '0 4px 12px rgba(255,215,0,0.3)'
                  }}
                >
                  Save Changes
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleEdit}
                  style={{
                    background: 'rgba(255,215,0,0.1)',
                    border: '1px solid #FFD700',
                    color: '#FFD700',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: 600
                  }}
                >
                  <FaEdit /> Edit Plan
                </button>

                {/* Export Dropdown */}
                <div style={{ position: 'relative' }} ref={dropdownRef}>
                  <button
                    onClick={() => setShowExportDropdown(!showExportDropdown)}
                    style={{
                      background: 'linear-gradient(90deg, #FFD700 0%, #facc15 100%)',
                      border: 'none',
                      color: '#000',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      fontWeight: 700,
                      boxShadow: '0 4px 12px rgba(255,215,0,0.3)'
                    }}
                  >
                    <FaDownload /> Export
                    <span style={{ fontSize: 10 }}>▼</span>
                  </button>

                  {showExportDropdown && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '8px',
                      backgroundColor: '#1a1a1a',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                      minWidth: '220px',
                      overflow: 'hidden',
                      zIndex: 1000,
                      border: '1px solid #FFD70033'
                    }}>
                      <button
                        onClick={downloadPDF}
                        style={{
                          width: '100%',
                          padding: '16px 20px',
                          backgroundColor: 'transparent',
                          color: '#fff',
                          border: 'none',
                          textAlign: 'left',
                          fontSize: '15px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFD70015'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <span style={{ fontSize: '20px' }}>📄</span>
                        <div>
                          <div style={{ fontWeight: '600', color: '#FFD700' }}>Export as PDF</div>
                          <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                            Download in PDF format
                          </div>
                        </div>
                      </button>

                      <div style={{ height: '1px', backgroundColor: '#333' }} />

                      <button
                        onClick={downloadDOC}
                        style={{
                          width: '100%',
                          padding: '16px 20px',
                          backgroundColor: 'transparent',
                          color: '#fff',
                          border: 'none',
                          textAlign: 'left',
                          fontSize: '15px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFD70015'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <span style={{ fontSize: '20px' }}>📝</span>
                        <div>
                          <div style={{ fontWeight: '600', color: '#FFD700' }}>Export as Word</div>
                          <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                            Download in DOC format
                          </div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Plan Sections - DYNAMIC RENDERING */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {displayData && Object.keys(displayData).length > 0 ? (
            <>
              {Object.entries(displayData).map(([key, value]) => {
                // Skip metadata fields
                if (['organization_name', 'plan_type', 'plan_version', 'generated_date', '_timestamp'].includes(key)) {
                  return null;
                }

                return (
                  <div
                    key={key}
                    style={{
                      background: 'rgba(32,32,32,0.75)',
                      borderRadius: '16px',
                      padding: '28px',
                      border: '1px solid #FFD70033',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '20px',
                      color: '#FFD700',
                      fontSize: '20px',
                      fontWeight: 700
                    }}>
                      <FaFileAlt />
                      <h2 style={{ margin: 0, textTransform: 'capitalize' }}>
                        {key.replace(/_/g, ' ')}
                      </h2>
                    </div>

                    {editing ? (
                      <textarea
                        value={editedPlanData[key] || ''}
                        onChange={(e) => setEditedPlanData({
                          ...editedPlanData,
                          [key]: e.target.value
                        })}
                        style={{
                          width: '100%',
                          minHeight: '150px',
                          padding: '12px',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid #FFD70033',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          resize: 'vertical',
                          lineHeight: '1.6'
                        }}
                      />
                    ) : (
                      <div style={{
                        padding: '12px',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '8px',
                        color: '#e0e0e0',
                        fontSize: '14px',
                        lineHeight: '1.8',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {value || 'Not specified'}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#999',
              fontSize: '18px'
            }}>
              No plan data available. Click "Edit Plan" to add content.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizationBCMPlan;
