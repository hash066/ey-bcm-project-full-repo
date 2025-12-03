import React, { useEffect, useState } from 'react';
import './index.css'; // Ensure global styles are imported

const ProcessServiceMaps = () => {
  const [dashboardData, setDashboardData] = useState({
    totalDepartments: 0,
    totalSubDepartments: 0,
    totalProcesses: 0,
    totalSubProcesses: 0,
    totalBCMCoordinators: 0,
  });

  useEffect(() => {
    // Fetch data from details.json
    fetch('/details.json')
      .then((response) => response.json())
      .then((data) => {
        setDashboardData({
          totalDepartments: data.totalDepartments || 0,
          totalSubDepartments: data.totalSubDepartments || 0,
          totalProcesses: data.totalProcesses || 0,
          totalSubProcesses: data.totalSubProcesses || 0,
          totalBCMCoordinators: data.totalBCMCoordinators || 0,
        });
      })
      .catch((error) => {
        console.error('Error fetching dashboard data:', error);
      });
  }, []);

  return (
    <div className="main-content">
      <h1>Process-Service Map Dashboard</h1>
      <div className="dashboard-stats">
        <div className="stat-item">
          <h2>Total Departments</h2>
          <p>{dashboardData.totalDepartments}</p>
        </div>
        <div className="stat-item">
          <h2>Total Sub-Departments</h2>
          <p>{dashboardData.totalSubDepartments}</p>
        </div>
        <div className="stat-item">
          <h2>Total Processes</h2>
          <p>{dashboardData.totalProcesses}</p>
        </div>
        <div className="stat-item">
          <h2>Total Sub-Processes</h2>
          <p>{dashboardData.totalSubProcesses}</p>
        </div>
        <div className="stat-item">
          <h2>Total BCM Coordinators</h2>
          <p>{dashboardData.totalBCMCoordinators}</p>
        </div>
      </div>
    </div>
  );
};

export default ProcessServiceMaps;