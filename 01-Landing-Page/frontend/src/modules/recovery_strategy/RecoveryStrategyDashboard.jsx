import React, { useState, useEffect } from 'react';
import { FaBuilding, FaUsers, FaList, FaChevronRight, FaChevronLeft, FaCogs, FaCheckCircle, FaExclamationTriangle, FaShieldAlt, FaClock } from 'react-icons/fa';
import RecoveryStrategy from './RecoveryStrategy.jsx';

const API_URL = 'http://localhost:8000';

const getStats = (departments) => {
  let totalDepartments = departments.length;
  let totalSubDepartments = departments.reduce((sum, d) => sum + d.sub_departments.length, 0);
  let totalFunctions = departments.reduce((sum, d) => sum + d.sub_departments.reduce((s, sd) => s + sd.functions.length, 0), 0);
  let totalStrategies = departments.reduce((sum, d) => sum + d.sub_departments.reduce((s, sd) => s + sd.functions.reduce((strSum, func) => strSum + (func.recovery_strategies ? func.recovery_strategies.length : 0), 0), 0), 0);
  return { totalDepartments, totalSubDepartments, totalFunctions, totalStrategies };
};

// Helper function to calculate department-specific statistics
const getDepartmentStats = (department) => {
  const totalSubDepts = department.sub_departments.length;
  const totalProcesses = department.sub_departments.reduce((sum, sd) => sum + sd.functions.length, 0);
  const totalStrategies = department.sub_departments.reduce((sum, sd) => 
    sum + sd.functions.reduce((strSum, func) => strSum + (func.recovery_strategies ? func.recovery_strategies.length : 0), 0), 0);
  
  const processesWithStrategies = department.sub_departments.reduce((sum, sd) => 
    sum + sd.functions.filter(func => func.recovery_strategies && func.recovery_strategies.length > 0).length, 0);
  
  const completionRate = totalProcesses > 0 ? Math.round((processesWithStrategies / totalProcesses) * 100) : 0;
  
  // Calculate strategy type distribution
  const strategyTypes = { people: 0, technology: 0, site: 0, vendor: 0 };
  department.sub_departments.forEach(sd => {
    sd.functions.forEach(func => {
      if (func.recovery_strategies && func.recovery_strategies.length > 0) {
        const strategy = func.recovery_strategies[0];
        if (strategy.people_unavailability_strategy) strategyTypes.people++;
        if (strategy.technology_data_unavailability_strategy) strategyTypes.technology++;
        if (strategy.site_unavailability_strategy) strategyTypes.site++;
        if (strategy.third_party_vendors_unavailability_strategy) strategyTypes.vendor++;
      }
    });
  });

  return { totalSubDepts, totalProcesses, totalStrategies, processesWithStrategies, completionRate, strategyTypes };
};

// Helper function to calculate subdepartment-specific statistics
const getSubDepartmentStats = (subDepartment) => {
  const totalProcesses = subDepartment.functions.length;
  const totalStrategies = subDepartment.functions.reduce((sum, func) => 
    sum + (func.recovery_strategies ? func.recovery_strategies.length : 0), 0);
  
  const processesWithStrategies = subDepartment.functions.filter(func => 
    func.recovery_strategies && func.recovery_strategies.length > 0).length;
  
  const completionRate = totalProcesses > 0 ? Math.round((processesWithStrategies / totalProcesses) * 100) : 0;
  
  // Calculate strategy type distribution
  const strategyTypes = { people: 0, technology: 0, site: 0, vendor: 0 };
  subDepartment.functions.forEach(func => {
    if (func.recovery_strategies && func.recovery_strategies.length > 0) {
      const strategy = func.recovery_strategies[0];
      if (strategy.people_unavailability_strategy) strategyTypes.people++;
      if (strategy.technology_data_unavailability_strategy) strategyTypes.technology++;
      if (strategy.site_unavailability_strategy) strategyTypes.site++;
      if (strategy.third_party_vendors_unavailability_strategy) strategyTypes.vendor++;
    }
  });

  // Calculate risk coverage
  const riskCategories = ['people', 'technology', 'site', 'vendor'];
  const coveredCategories = riskCategories.filter(cat => strategyTypes[cat] > 0).length;
  const riskCoverage = Math.round((coveredCategories / riskCategories.length) * 100);

  return { totalProcesses, totalStrategies, processesWithStrategies, completionRate, strategyTypes, riskCoverage };
};

const RecoveryStrategyDashboard = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [view, setView] = useState('stats');
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedSubDept, setSelectedSubDept] = useState(null);
  const [selectedFunction, setSelectedFunction] = useState(null);

  useEffect(() => {
    const fetchRecoveryData = async () => {
      try {
        const response = await fetch(`${API_URL}/recovery-strategies/`);
        if (!response.ok) {
          throw new Error('Failed to fetch recovery data');
        }
        const data = await response.json();
        console.log("API Response:", JSON.stringify(data, null, 2));
        setDepartments(data);
      } catch (err) {
        console.error("API Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecoveryData();
  }, []);

  if (loading) {
    return <div style={fullPageStyle} className="dashboard-container">Loading recovery strategies...</div>;
  }

  if (error) {
    return <div style={fullPageStyle} className="dashboard-container">Error: {error}</div>;
  }

  const stats = getStats(departments);

  // Dashboard-level summary
  const renderDashboardSummary = () => {
    const totalProcesses = stats.totalFunctions;
    const processesWithStrategies = departments.reduce((sum, dept) => 
      sum + dept.sub_departments.reduce((subSum, sd) => 
        subSum + sd.functions.filter(func => func.recovery_strategies && func.recovery_strategies.length > 0).length, 0), 0);
    
    const overallCompletion = totalProcesses > 0 ? Math.round((processesWithStrategies / totalProcesses) * 100) : 0;
    const avgStrategiesPerProcess = totalProcesses > 0 ? Math.round(stats.totalStrategies / totalProcesses * 100) / 100 : 0;

    return (
      <div style={summaryContainerStyle}>
        <h3 style={summaryTitleStyle}>Recovery Strategy Overview</h3>
        <div style={summaryWidgetContainerStyle}>
          <div style={summaryWidgetStyle}>
            <div style={summaryWidgetHeaderStyle}>
              <FaShieldAlt size={24} color="#FFD700" />
              <span>Strategy Coverage</span>
            </div>
            <div style={summaryContentStyle}>
              <div style={summaryStatStyle}>
                <span style={summaryStatLabelStyle}>Overall Completion:</span>
                <span style={summaryStatValueStyle}>{overallCompletion}%</span>
              </div>
              <div style={summaryStatStyle}>
                <span style={summaryStatLabelStyle}>Processes Covered:</span>
                <span style={summaryStatValueStyle}>{processesWithStrategies}/{totalProcesses}</span>
              </div>
              <div style={summaryStatStyle}>
                <span style={summaryStatLabelStyle}>Avg Strategies/Process:</span>
                <span style={summaryStatValueStyle}>{avgStrategiesPerProcess}</span>
              </div>
            </div>
          </div>
          <div style={summaryWidgetStyle}>
            <div style={summaryWidgetHeaderStyle}>
              <FaClock size={24} color="#FFD700" />
              <span>Readiness Status</span>
            </div>
            <div style={summaryContentStyle}>
              <div style={summaryStatStyle}>
                <span style={summaryStatLabelStyle}>Ready Departments:</span>
                <span style={summaryStatValueStyle}>
                  {departments.filter(dept => getDepartmentStats(dept).completionRate >= 80).length}/{departments.length}
                </span>
              </div>
              <div style={summaryStatStyle}>
                <span style={summaryStatLabelStyle}>Strategy Types:</span>
                <span style={summaryStatValueStyle}>4 Categories</span>
              </div>
              <div style={summaryStatStyle}>
                <span style={summaryStatLabelStyle}>Total Strategies:</span>
                <span style={summaryStatValueStyle}>{stats.totalStrategies}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Department-level summary
  const renderDepartmentSummary = () => {
    if (!selectedDept) return null;
    
    const deptStats = getDepartmentStats(selectedDept);
    
    return (
      <div style={summaryContainerStyle}>
        <h3 style={summaryTitleStyle}>{selectedDept.name} - Recovery Strategy Summary</h3>
        <div style={summaryWidgetContainerStyle}>
          <div style={summaryWidgetStyle}>
            <div style={summaryWidgetHeaderStyle}>
              <FaCheckCircle size={24} color="#FFD700" />
              <span>Department Coverage</span>
            </div>
            <div style={summaryContentStyle}>
              <div style={summaryStatStyle}>
                <span style={summaryStatLabelStyle}>Completion Rate:</span>
                <span style={{...summaryStatValueStyle, color: deptStats.completionRate >= 80 ? '#4CAF50' : deptStats.completionRate >= 50 ? '#FF9800' : '#F44336'}}>
                  {deptStats.completionRate}%
                </span>
              </div>
              <div style={summaryStatStyle}>
                <span style={summaryStatLabelStyle}>Sub-Departments:</span>
                <span style={summaryStatValueStyle}>{deptStats.totalSubDepts}</span>
              </div>
              <div style={summaryStatStyle}>
                <span style={summaryStatLabelStyle}>Total Processes:</span>
                <span style={summaryStatValueStyle}>{deptStats.totalProcesses}</span>
              </div>
              <div style={summaryStatStyle}>
                <span style={summaryStatLabelStyle}>Processes with Strategies:</span>
                <span style={summaryStatValueStyle}>{deptStats.processesWithStrategies}</span>
              </div>
            </div>
          </div>
          <div style={summaryWidgetStyle}>
            <div style={summaryWidgetHeaderStyle}>
              <FaExclamationTriangle size={24} color="#FFD700" />
              <span>Risk Category Coverage</span>
            </div>
            <div style={summaryContentStyle}>
              <div style={summaryStatStyle}>
                <span style={summaryStatLabelStyle}>People Strategies:</span>
                <span style={summaryStatValueStyle}>{deptStats.strategyTypes.people}</span>
              </div>
              <div style={summaryStatStyle}>
                <span style={summaryStatLabelStyle}>Technology Strategies:</span>
                <span style={summaryStatValueStyle}>{deptStats.strategyTypes.technology}</span>
              </div>
              <div style={summaryStatStyle}>
                <span style={summaryStatLabelStyle}>Site Strategies:</span>
                <span style={summaryStatValueStyle}>{deptStats.strategyTypes.site}</span>
              </div>
              <div style={summaryStatStyle}>
                <span style={summaryStatLabelStyle}>Vendor Strategies:</span>
                <span style={summaryStatValueStyle}>{deptStats.strategyTypes.vendor}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Subdepartment-level summary
  const renderSubDepartmentSummary = () => {
    if (!selectedSubDept) return null;
    
    const subDeptStats = getSubDepartmentStats(selectedSubDept);
    
    return (
      <div style={summaryContainerStyle}>
        <h3 style={summaryTitleStyle}>{selectedSubDept.name} - Recovery Strategy Summary</h3>
        <div style={summaryWidgetContainerStyle}>
          <div style={summaryWidgetStyle}>
            <div style={summaryWidgetHeaderStyle}>
              <FaCogs size={24} color="#FFD700" />
              <span>Process Coverage</span>
            </div>
            <div style={summaryContentStyle}>
              <div style={summaryStatStyle}>
                <span style={summaryStatLabelStyle}>Completion Rate:</span>
                <span style={{...summaryStatValueStyle, color: subDeptStats.completionRate >= 80 ? '#4CAF50' : subDeptStats.completionRate >= 50 ? '#FF9800' : '#F44336'}}>
                  {subDeptStats.completionRate}%
                </span>
              </div>
              <div style={summaryStatStyle}>
                <span style={summaryStatLabelStyle}>Total Processes:</span>
                <span style={summaryStatValueStyle}>{subDeptStats.totalProcesses}</span>
              </div>
              <div style={summaryStatStyle}>
                <span style={summaryStatLabelStyle}>Covered Processes:</span>
                <span style={summaryStatValueStyle}>{subDeptStats.processesWithStrategies}</span>
              </div>
              <div style={summaryStatStyle}>
                <span style={summaryStatLabelStyle}>Risk Coverage:</span>
                <span style={summaryStatValueStyle}>{subDeptStats.riskCoverage}%</span>
              </div>
            </div>
          </div>
          <div style={summaryWidgetStyle}>
            <div style={summaryWidgetHeaderStyle}>
              <FaShieldAlt size={24} color="#FFD700" />
              <span>Strategy Distribution</span>
            </div>
            <div style={summaryContentStyle}>
              <div style={summaryStatStyle}>
                <span style={summaryStatLabelStyle}>People Risk:</span>
                <span style={summaryStatValueStyle}>{subDeptStats.strategyTypes.people} strategies</span>
              </div>
              <div style={summaryStatStyle}>
                <span style={summaryStatLabelStyle}>Technology Risk:</span>
                <span style={summaryStatValueStyle}>{subDeptStats.strategyTypes.technology} strategies</span>
              </div>
              <div style={summaryStatStyle}>
                <span style={summaryStatLabelStyle}>Site Risk:</span>
                <span style={summaryStatValueStyle}>{subDeptStats.strategyTypes.site} strategies</span>
              </div>
              <div style={summaryStatStyle}>
                <span style={summaryStatLabelStyle}>Vendor Risk:</span>
                <span style={summaryStatValueStyle}>{subDeptStats.strategyTypes.vendor} strategies</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDepartmentList = () => (
    <>
      <div style={{ ...scrollGridStyle, flex: 1 }} className="dashboard-card-list">
        {departments.map((dept) => (
          <div key={dept.id} style={departmentCardStyle} className="dashboard-card" onClick={() => {
            setSelectedDept(dept);
            setSelectedSubDept(null);
            setView('department-detail');
          }}>
            <FaBuilding className="card-icon" size={24} color="#FFD700" />
            <h3 style={{ color: '#FFD700', fontWeight: 700, fontSize: 20 }}>{dept.name}</h3>
            <p style={{ color: '#fff', fontSize: 15, marginBottom: 8 }}>{dept.sub_departments.length} Sub-Departments</p>
            <p style={{ color: '#FFD700', fontSize: 14 }}>Processes: {dept.sub_departments.reduce((sum, sd) => sum + sd.functions.length, 0)}</p>
            <FaChevronRight style={{ color: '#FFD700', position: 'absolute', right: 18, bottom: 18, fontSize: 18 }} className="card-action-icon" />
          </div>
        ))}
      </div>
      {renderDashboardSummary()}
    </>
  );

  const renderDepartmentDetail = () => (
    <>
      <div className="dashboard-detail" style={{ ...fullPageStyle, flex: 1 }}>
        <button className="back-button" style={backButtonStyle} onClick={() => {
          setSelectedDept(null);
          setSelectedSubDept(null);
          setView('departments');
        }}>
          <FaChevronLeft /> Back to Departments
        </button>
        <h2 style={sectionTitleStyle}>{selectedDept?.name}</h2>
        <div className="dashboard-card-list" style={scrollGridStyle}>
          {selectedDept?.sub_departments.map((subDept) => (
            <div key={subDept.id} style={departmentCardStyle} className="dashboard-card" onClick={() => {
              setSelectedSubDept(subDept);
              setView('function-list');
            }}>
              <FaUsers className="card-icon" size={24} color="#FFD700" />
              <h3 style={{ color: '#FFD700', fontWeight: 700, fontSize: 20 }}>{subDept.name}</h3>
              <p style={{ color: '#fff', fontSize: 15, marginBottom: 8 }}>{subDept.functions.length} Processes</p>
              <FaChevronRight style={{ color: '#FFD700', position: 'absolute', right: 18, bottom: 18, fontSize: 18 }} className="card-action-icon" />
            </div>
          ))}
        </div>
      </div>
      {renderDepartmentSummary()}
    </>
  );

  // FIXED: This is the corrected renderFunctionList function
  const renderFunctionList = () => (
    <>
      <div className="dashboard-detail" style={{ ...fullPageStyle, flex: 1 }}>
        <button className="back-button" style={backButtonStyle} onClick={() => {
          setSelectedSubDept(null);
          setView('department-detail');
        }}>
          <FaChevronLeft /> Back to Sub-Departments
        </button>
        {/* FIXED: Removed the conditional logic that was causing the issue */}
        <h2 style={sectionTitleStyle}>
          Processes in {selectedSubDept?.name}
        </h2>
        <div className="dashboard-card-list" style={scrollGridStyle}>
          {selectedSubDept?.functions.map((func) => (
            <div key={func.id} style={functionCardStyle} className="dashboard-card" onClick={() => {
              console.log("Function object being passed:", JSON.stringify(func, null, 2)); 
              setSelectedFunction(func);
              setView('function-detail');
            }}>
              <FaCogs className="card-icon" size={24} color="#FFD700" />
              <h3 style={{ color: '#FFD700', fontWeight: 700, fontSize: 20 }}>{func.name}</h3>
              <p style={{ color: '#fff', fontSize: 15, marginBottom: 8 }}>{func.recovery_strategies ? func.recovery_strategies.length : 0} Strategies</p>
              <FaChevronRight style={{ color: '#FFD700', position: 'absolute', right: 18, bottom: 18, fontSize: 18 }} className="card-action-icon" />
            </div>
          ))}
        </div>
      </div>
      {renderSubDepartmentSummary()}
    </>
  );

  const renderFunctionDetail = () => (
    <div className="dashboard-detail" style={{ ...fullPageStyle, flex: 1 }}>
      <button className="back-button" style={backButtonStyle} onClick={() => setView('function-list')}>
        <FaChevronLeft /> Back to Processes
      </button>
      <RecoveryStrategy functionObj={selectedFunction} />
    </div>
  );

  // Add debug logging
  console.log("Current view:", view);
  console.log("Selected Department:", selectedDept?.name);
  console.log("Selected SubDepartment:", selectedSubDept?.name);

  switch (view) {
    case 'stats':
      return (
        <div className="dashboard-container" style={{ ...fullPageStyle, flex: 1, paddingTop: 0, paddingBottom: 0 }}>
          <h1 style={Object.assign({}, sectionTitleStyle, {fontSize: 32, marginBottom: 32})}>Recovery Strategy Dashboard</h1>
          <div className="stats-summary" style={{ display: 'flex', gap: 32, marginBottom: 40, flexWrap: 'wrap', justifyContent: 'center' }}>
            <div className="stat-card" style={statCardStyle} onClick={() => setView('departments')}>
              <FaBuilding size={32} color="#FFD700" />
              <div style={statLabelStyle}>Total Departments</div>
              <div style={statValueStyle}>{stats.totalDepartments}</div>
            </div>
            <div className="stat-card" style={statCardStyle} onClick={() => setView('departments')}>
              <FaUsers size={32} color="#FFD700" />
              <div style={statLabelStyle}>Total Sub-Departments</div>
              <div style={statValueStyle}>{stats.totalSubDepartments}</div>
            </div>
            <div className="stat-card" style={statCardStyle} onClick={() => setView('departments')}>
              <FaCogs size={32} color="#FFD700" />
              <div style={statLabelStyle}>Total Processes</div>
              <div style={statValueStyle}>{stats.totalFunctions}</div>
            </div>
            <div className="stat-card" style={statCardStyle} onClick={() => setView('departments')}>
              <FaList size={32} color="#FFD700" />
              <div style={statLabelStyle}>Total Strategies</div>
              <div style={statValueStyle}>{stats.totalStrategies}</div>
            </div>
          </div>
          {renderDashboardSummary()}
        </div>
      );
    case 'departments':
      return (
        <div className="dashboard-container" style={{ ...fullPageStyle, flex: 1, paddingTop: 0, paddingBottom: 0 }}>
          <button className="back-button" style={backButtonStyle} onClick={() => setView('stats')}>
            <FaChevronLeft /> Back to Dashboard
          </button>
          <h1 style={sectionTitleStyle}>All Departments</h1>
          {renderDepartmentList()}
        </div>
      );
    case 'department-detail':
      return (
        <div className="dashboard-container" style={{ ...fullPageStyle, flex: 1, paddingTop: 0, paddingBottom: 0 }}>
          {renderDepartmentDetail()}
        </div>
      );
    case 'function-list':
      return (
        <div className="dashboard-container" style={{ ...fullPageStyle, flex: 1, paddingTop: 0, paddingBottom: 0 }}>
          {renderFunctionList()}
        </div>
      );
    case 'function-detail':
      return (
        <div className="dashboard-container" style={{ ...fullPageStyle, flex: 1, paddingTop: 0, paddingBottom: 0 }}>
          {renderFunctionDetail()}
        </div>
      );
    default:
      return null;
  }
};

// --- Existing Styles + New Summary Styles ---
const fullPageStyle = {
  background: '#181818',
  width: '100%',
  paddingTop: '32px',
  paddingBottom: '32px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const scrollGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 24,
  width: '100%',
  maxWidth: 1100,
  overflowY: 'auto',
  padding: '0 24px',
  flex: 1,
};

const sectionTitleStyle = { color: '#FFD700', fontWeight: 800, fontSize: 28, marginBottom: 24, textAlign: 'center' };

const statCardStyle = {
  background: 'linear-gradient(135deg, #232526 60%, #FFD700 200%)',
  borderRadius: 14,
  boxShadow: '0 4px 24px #FFD70022',
  padding: '24px 20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  minWidth: 180,
  minHeight: 120,
  position: 'relative',
  border: '2px solid #FFD70044',
  transition: 'transform 0.18s, box-shadow 0.18s',
  marginBottom: 16,
  cursor: 'pointer',
};

const statLabelStyle = { color: '#FFD700', fontWeight: 700, fontSize: 16, marginTop: 10 };
const statValueStyle = { color: '#fff', fontWeight: 900, fontSize: 32, marginTop: 4 };

const departmentCardStyle = {
  background: '#232323',
  borderRadius: 16,
  boxShadow: '0 4px 24px #FFD70022',
  padding: '24px 20px',
  color: '#FFD700',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  minHeight: 140,
  position: 'relative',
  cursor: 'pointer',
  border: '2px solid #FFD70044',
  transition: 'transform 0.18s, box-shadow 0.18s',
};

const functionCardStyle = {
  ...departmentCardStyle,
  background: '#232323',
  color: '#FFD700',
};

const backButtonStyle = {
  background: 'none',
  color: '#FFD700',
  border: 'none',
  fontSize: 18,
  fontWeight: 700,
  cursor: 'pointer',
  marginBottom: 18,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

// NEW SUMMARY STYLES
const summaryContainerStyle = {
  width: '100%',
  maxWidth: 1100,
  padding: '32px 24px',
  marginTop: '24px',
  background: '#202020',
  borderRadius: 16,
  border: '1px solid #333',
};

const summaryTitleStyle = {
  color: '#FFD700',
  fontSize: 24,
  fontWeight: 800,
  marginBottom: 24,
  textAlign: 'center',
};

const summaryWidgetContainerStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 24,
};

const summaryWidgetStyle = {
  background: '#2A2A2A',
  borderRadius: 12,
  padding: '20px',
  border: '1px solid #FFD70040',
};

const summaryWidgetHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 16,
  color: '#FFD700',
  fontSize: 18,
  fontWeight: 700,
};

const summaryContentStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const summaryStatStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const summaryStatLabelStyle = {
  color: '#CCCCCC',
  fontSize: 14,
  fontWeight: 500,
};

const summaryStatValueStyle = {
  color: '#FFD700',
  fontSize: 16,
  fontWeight: 700,
};

export default RecoveryStrategyDashboard;
