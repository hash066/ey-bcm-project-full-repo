import React from 'react';
import { BrowserRouter as Router, Route, Routes, Outlet, useLocation, Navigate } from 'react-router-dom';
import Login from '../auth/components/Login.jsx';
import Signup from '../auth/components/Signup.jsx';
import Dashboard from '../process-service-mapping/components/process_service_mapping.jsx';
import '../../index.css';
import ProcessMap from '../process-service-mapping/components/process_map.jsx'; // Ensure correct import
import ServiceMap from '../process-service-mapping/components/ServiceMap.jsx';
import BusinessImpactAnalysisPage from '../bia/components/BusinessImpactAnalysisPage.jsx';
import OrganizationImpactScale from '../bia/components/OrganizationImpactScale.jsx';
import Sidebar from '../../common/components/Sidebar.jsx';
import UserProfile from '../../common/components/UserProfile.jsx';
import HomePage from '../export/components/HomePage.jsx';
import ManualInputPage from '../export/components/ManualInputPage.jsx';
import { BIAContainer } from '../bia';

function Layout() {
  const location = useLocation();
  let activePage = '';
  let pageTitle = '';
  
  if (location.pathname.startsWith('/home')) {
    activePage = 'Home';
    pageTitle = 'Dashboard';
  } else if (location.pathname.startsWith('/process-service-mapping')) {
    activePage = 'Process and Service Mapping';
    pageTitle = 'Process & Service Mapping';
  } else if (location.pathname.startsWith('/business-impact-analysis') || location.pathname.startsWith('/bia')) {
    activePage = 'Business Impact Analysis';
    pageTitle = 'Business Impact Analysis';
  } else if (location.pathname.startsWith('/process_map')) {
    activePage = 'Process and Service Mapping';
    pageTitle = 'Process Map';
  } else if (location.pathname.startsWith('/service_map')) {
    activePage = 'Process and Service Mapping';
    pageTitle = 'Service Map';
  } else if (location.pathname.startsWith('/manual-input')) {
    activePage = 'Manual Input';
    pageTitle = 'Manual Input';
  } else if (location.pathname.startsWith('/organization-impact-scale')) {
    activePage = 'Business Impact Analysis';
    pageTitle = 'Organization Impact Scale';
  }

  return (
    <div className="dashboard">
      <Sidebar activePage={activePage} />
      <div className="main-content">
        {/* Fixed Header */}
        <header className="page-header">
          <h1 className="page-title">{pageTitle}</h1>
          <div className="profile-wrapper">
            <UserProfile />
          </div>
        </header>
        {/* Scrollable Content */}
        <div className="content-scrollable">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route element={<Layout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/process-service-mapping" element={<Dashboard />} />
          <Route path="/process_map" element={<ProcessMap />} />
          <Route path="/service_map" element={<ServiceMap />} />
          <Route path="/business-impact-analysis" element={<BusinessImpactAnalysisPage />} />
          <Route path="/organization-impact-scale" element={<OrganizationImpactScale />} />
          <Route path="/bia/add/*" element={<Navigate to="/bia/bia-information" replace />} />
          <Route path="/bia/*" element={<BIAContainer />} />
          <Route path="/manual-input" element={<ManualInputPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;