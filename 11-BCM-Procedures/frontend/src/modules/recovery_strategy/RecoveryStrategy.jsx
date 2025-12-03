import React, { useState, useEffect } from 'react';
import { FaUserFriends, FaServer, FaBuilding, FaHandshake, FaInfoCircle, FaSave } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const API_URL = 'http://localhost:8000';

const statusOptions = ['Not Implemented', 'In Progress', 'Implemented'];

const strategyCategories = [
  {
    key: 'people_unavailability_strategy',
    reasoningKey: 'people_reasoning',
    statusKey: 'people_status',
    title: 'People Unavailability',
    icon: <FaUserFriends size={28} color="#FFD700" />,
  },
  {
    key: 'technology_data_unavailability_strategy',
    reasoningKey: 'technology_reasoning',
    statusKey: 'technology_status',
    title: 'Technology/Data Unavailability',
    icon: <FaServer size={28} color="#FFD700" />,
  },
  {
    key: 'site_unavailability_strategy',
    reasoningKey: 'site_reasoning',
    statusKey: 'site_status',
    title: 'Site Unavailability',
    icon: <FaBuilding size={28} color="#FFD700" />,
  },
  {
    key: 'third_party_vendors_unavailability_strategy',
    reasoningKey: 'vendor_reasoning',
    statusKey: 'vendor_status',
    title: 'Third-Party Vendor Unavailability',
    icon: <FaHandshake size={28} color="#FFD700" />,
  },
];

const RecoveryStrategy = ({ functionObj }) => {
  const [strategyGroups, setStrategyGroups] = useState([]);
  const [selectValues, setSelectValues] = useState({});
  const [openSelect, setOpenSelect] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');

  useEffect(() => {
    if (functionObj && functionObj.recovery_strategies && functionObj.recovery_strategies.length > 0) {
      const strategies = functionObj.recovery_strategies[0];
      
      const groups = strategyCategories.map(category => ({
        ...category,
        strategy: strategies[category.key] || 'No strategy defined.',
        reasoning: strategies[category.reasoningKey] || 'No reasoning available for this strategy.',
      }));

      setStrategyGroups(groups);

      // Initialize select values with existing status or default
      const initialSelectValues = {};
      groups.forEach(group => {
        initialSelectValues[group.key] = strategies[group.statusKey] || 'Not Implemented';
      });
      setSelectValues(initialSelectValues);
    }
  }, [functionObj]);

  const handleUpdateStatus = async () => {
    if (!functionObj?.recovery_strategies?.[0]?.process_id) {
      setUpdateMessage('Error: No strategy ID found');
      return;
    }

    setIsUpdating(true);
    setUpdateMessage('');

    try {
      const response = await fetch(`${API_URL}/recovery-strategies/${functionObj.recovery_strategies[0].process_id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          people_status: selectValues['people_unavailability_strategy'],
          technology_status: selectValues['technology_data_unavailability_strategy'],
          site_status: selectValues['site_unavailability_strategy'],
          vendor_status: selectValues['third_party_vendors_unavailability_strategy'],
        }),
      });

      if (response.ok) {
        setUpdateMessage('✓ Strategy status updated successfully!');
        setTimeout(() => setUpdateMessage(''), 3000);
      } else {
        const errorData = await response.json();
        setUpdateMessage(`Error: ${errorData.detail || 'Failed to update status'}`);
      }
    } catch (error) {
      setUpdateMessage(`Error: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const exportToExcel = () => {
    const exportData = strategyGroups.map(group => ({
      'Category': group.title,
      'Strategy': group.strategy,
      'Reasoning': group.reasoning,
      'Status': selectValues[group.key] || 'Not Implemented',
      'Process': functionObj?.name || 'N/A',
      'Timestamp': new Date().toISOString(),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    ws['!cols'] = [{ wch: 35 }, { wch: 80 }, { wch: 50 }, { wch: 20 }, { wch: 30 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Recovery Strategies');

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `recovery_strategies_${functionObj?.name || 'export'}_${timestamp}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  return (
    <div style={{
      background: '#181818',
      minHeight: '100vh',
      width: '100%',
      padding: '32px 0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      {/* CSS for hover tooltips */}
      <style>
        {`
          .info-button-container {
            position: relative;
            display: inline-block;
          }
          
          .info-button {
            background: none;
            border: none;
            color: #FFD700;
            cursor: pointer;
            padding: 4px;
            border-radius: 50%;
            transition: all 0.2s ease;
            margin-left: 8px;
          }
          
          .info-button:hover {
            background: rgba(255, 215, 0, 0.1);
            transform: scale(1.1);
          }
          
          .tooltip {
            visibility: hidden;
            width: 300px;
            background-color: #2A2A2A;
            color: #FFD700;
            text-align: left;
            border-radius: 8px;
            padding: 12px;
            position: absolute;
            z-index: 1000;
            top: 125%;
            left: 50%;
            margin-left: -150px;
            opacity: 0;
            transition: opacity 0.3s;
            border: 1px solid #FFD700;
            box-shadow: 0 4px 15px rgba(255, 215, 0, 0.2);
            font-size: 13px;
            line-height: 1.4;
          }
          
          .tooltip::after {
            content: "";
            position: absolute;
            bottom: 100%;
            left: 50%;
            margin-left: -5px;
            border-width: 5px;
            border-style: solid;
            border-color: transparent transparent #FFD700 transparent;
          }
          
          .info-button-container:hover .tooltip {
            visibility: visible;
            opacity: 1;
          }
        `}
      </style>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: 1200,
        margin: '0 auto 32px auto',
        padding: '0 24px',
        width: '100%',
      }}>
        <h1 style={{ color: '#FFD700', fontWeight: 800, fontSize: 32, letterSpacing: 1 }}>
          {functionObj ? `${functionObj.name} Recovery Strategies` : 'Recovery Strategies'}
        </h1>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            className="update-button" 
            onClick={handleUpdateStatus}
            disabled={isUpdating}
            style={{
              background: isUpdating ? '#666' : '#28a745', 
              color: '#fff', 
              border: 'none', 
              borderRadius: 10,
              padding: '12px 24px', 
              fontSize: 17, 
              fontWeight: 700, 
              cursor: isUpdating ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)', 
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => { 
              if (!isUpdating) {
                e.target.style.background = '#218838'; 
                e.target.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseOut={(e) => { 
              if (!isUpdating) {
                e.target.style.background = '#28a745'; 
                e.target.style.transform = 'translateY(0px)';
              }
            }}
          >
            <FaSave size={16} />
            {isUpdating ? 'Updating...' : 'Update Status'}
          </button>
          <button 
            className="export-button" 
            onClick={exportToExcel}
            style={{
              background: '#232323', color: '#FFD700', border: '2px solid #FFD700', borderRadius: 10,
              padding: '12px 32px', fontSize: 17, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 15px #FFD70022', transition: 'background 0.2s, color 0.2s',
            }}
            onMouseOver={(e) => { e.target.style.background = '#FFD700'; e.target.style.color = '#232323'; }}
            onMouseOut={(e) => { e.target.style.background = '#232323'; e.target.style.color = '#FFD700'; }}
          >
            Export to Excel
          </button>
        </div>
      </div>

      {/* Update Message */}
      {updateMessage && (
        <div style={{
          maxWidth: 1200,
          width: '100%',
          padding: '0 24px',
          marginBottom: '16px'
        }}>
          <div style={{
            background: updateMessage.includes('Error') ? '#dc3545' : '#28a745',
            color: '#fff',
            padding: '12px 16px',
            borderRadius: 8,
            textAlign: 'center',
            fontWeight: 600
          }}>
            {updateMessage}
          </div>
        </div>
      )}

      <div style={{
        width: '100%',
        maxWidth: 1200,
        padding: '0 24px',
        flex: 1,
        overflowY: 'auto',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '32px',
        }}>
          {strategyGroups.length > 0 ? (
            strategyGroups.map((group) => (
              <div key={group.key} style={{
                background: '#232323', borderRadius: 18, boxShadow: '0 8px 32px #FFD70022',
                padding: '28px 24px', color: '#FFD700', display: 'flex', flexDirection: 'column', gap: 18,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                  {group.icon}
                  <h2 style={{ color: '#FFD700', fontWeight: 900, fontSize: 22, margin: 0, flex: 1 }}>
                    {group.title}
                  </h2>
                  <div className="info-button-container">
                    <button className="info-button" type="button">
                      <FaInfoCircle size={18} />
                    </button>
                    <div className="tooltip">
                      <strong>Why this strategy?</strong><br />
                      {group.reasoning}
                    </div>
                  </div>
                </div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 15, background: '#181818', borderRadius: 10, padding: '16px 18px', minHeight: 80 }}>
                  {group.strategy}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                  <span style={{fontWeight: 700, fontSize: 16}}>Status:</span>
                  <div className="custom-select-container" style={{ position: 'relative', width: 180 }} tabIndex={0} onBlur={() => setOpenSelect(null)}>
                    <div
                      className="custom-select-trigger"
                      style={{
                        background: '#181818', color: '#FFD700', border: '1.5px solid #FFD700', borderRadius: 6,
                        padding: '8px 32px 8px 14px', cursor: 'pointer', fontWeight: 700, width: '100%',
                        textAlign: 'center', fontSize: 14, position: 'relative',
                      }}
                      onClick={() => setOpenSelect(openSelect === group.key ? null : group.key)}
                    >
                      {selectValues[group.key]}
                      <span style={{
                        position: 'absolute', top: '50%', right: 10, transform: 'translateY(-50%)',
                        width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
                        borderTop: '7px solid #FFD700',
                      }} />
                    </div>
                    <div
                      className="custom-options"
                      style={{
                        position: 'absolute', bottom: '100%', left: 0, right: 0, background: '#232323',
                        border: '1.5px solid #FFD700', borderRadius: 6, marginBottom: 4, zIndex: 10,
                        maxHeight: 120, overflowY: 'auto',
                        opacity: openSelect === group.key ? 1 : 0,
                        visibility: openSelect === group.key ? 'visible' : 'hidden',
                        transform: openSelect === group.key ? 'scaleY(1) translateY(0)' : 'scaleY(0.98) translateY(5px)',
                        transformOrigin: 'bottom', transition: 'opacity 0.2s, transform 0.2s, visibility 0.2s',
                      }}
                    >
                      {statusOptions.map((option) => (
                        <div
                          key={option}
                          className={`custom-option${selectValues[group.key] === option ? ' selected' : ''}`}
                          style={{
                            padding: '8px 12px', color: '#FFD700', cursor: 'pointer',
                            background: selectValues[group.key] === option ? '#383838' : undefined,
                            fontSize: 14, textAlign: 'center', fontWeight: 600,
                          }}
                          onClick={() => {
                            setSelectValues(vals => ({ ...vals, [group.key]: option }));
                            setOpenSelect(null);
                          }}
                        >{option}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: '#fff', textAlign: 'center', fontSize: 18, gridColumn: '1 / -1' }}>
              No recovery strategies found for this process.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecoveryStrategy;
