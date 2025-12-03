import React from 'react';
import { BrowserRouter as Router, Route, Routes, Outlet, useLocation, Navigate } from 'react-router-dom';
import Login from '../auth/components/Login.jsx';
import Signup from '../auth/components/Signup.jsx';
import HomePage from '../export/components/HomePage.jsx';
import Dashboard from '../process-service-mapping/components/process_service_mapping.jsx';
import ProcessMap from '../process-service-mapping/components/process_map.jsx';
import ServiceMap from '../service-mapping/components/ServiceMap.jsx';
import BusinessImpactAnalysisPage from '../bia/components/BusinessImpactAnalysisPage.jsx';
import BIAContainer from '../bia/components/BIAContainer.jsx';
import ManualInputPage from '../export/components/ManualInputPage.jsx';
import OrganizationImpactScale from '../bia/components/OrganizationImpactScale.jsx';
import CriticalityAssessment from '../bia/components/CriticalityAssessment.jsx';
import ProceduresContainer from '../procedures/components/ProceduresContainer.jsx';
import { ImpactMatrixProvider } from '../bia/ImpactMatrixContext';
import AdminContainer from '../admin/components/AdminContainer.jsx';
import AdminLogin from '../admin/components/AdminLogin.jsx';
import ModuleLock from '../../common/components/ModuleLock.jsx';
import ModuleApprovals from '../admin/components/ModuleApprovals.jsx';
import BiaMatrix from '../bia/components/BiaMatrix.jsx';
import BusinessInformation from '../bia/components/BusinessInformation.jsx';
import TechnicalInfo from '../bia/components/TechnicalInfo.jsx';
import ApplicationBIAContainer from '../bia/components/ApplicationBIAContainer.jsx';
import Training from '../training/training.jsx';
import RecoveryStrategyDashboard from '../recovery_strategy/RecoveryStrategyDashboard.jsx';
import Home from "../policy/components/Home";
import Wizard from "../policy/components/Wizard";
import AIHelp from "../policy/components/AIHelp";
import ProgressTracker from "../policy/components/ProgressTracker";
import TemplateViewer from "../policy/components/TemplateViewer";
import BCMDashboard from '../../modules/bcm/BCMDashboard.jsx';
import GovernanceDashboard from '../../modules/governacnce-kri/App.jsx';
import CrisisManagement from '../crisis-management/components/CrisisManagement.jsx';
// import RiskAnalysis from '../risk-analysis/components/RiskAnalysis.jsx';
// import BCMDashboard from '../../modules/bcm/BCMDashboard.jsx';
import GapAssessmentPage from '../../pages/GapAssessment/GapAssessmentPage.tsx';

import Chatbot from '../../components/Chatbot.jsx';

import '../../index.css';
import Sidebar from '../../common/components/Sidebar.jsx';
import UserProfile from '../../common/components/UserProfile.jsx';
import { jwtDecode } from 'jwt-decode';

// Admin route protection component
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  // Check JWT token for ey_admin role
  try {
    const decoded = jwtDecode(token);
    const roles = decoded.roles || [];
    const primaryRole = roles.length > 0 ? roles[0] : '';

    // Allow ey_admin role to access admin panel
    if (primaryRole !== 'ey_admin') {
      return <Navigate to="/home" replace />;
    }

    return children;
  } catch (error) {
    console.error('Error decoding token:', error);
    return <Navigate to="/login" replace />;
  }
};

// Module Approvals route protection component
const ApprovalRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  try {
    const decoded = jwtDecode(token);
    const roles = decoded.roles || [];
    const primaryRole = roles.length > 0 ? roles[0] : '';
    
    // Only Client Head and Project Sponsor can access approvals
    if (primaryRole !== 'Client Head' && primaryRole !== 'Project Sponsor') {
      return <Navigate to="/home" replace />;
    }
    
    return children;
  } catch (error) {
    console.error('Error decoding token:', error);
    return <Navigate to="/login" replace />;
  }
};

function Layout() {
  const location = useLocation();
  let activePage = '';
  let pageTitle = '';
  let mainTitle = '';

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
  } else if (location.pathname.startsWith('/criticality-assessment')) {
    activePage = 'Criticality Assessment';
    pageTitle = 'Criticality Assessment';
  } else if (location.pathname.startsWith('/procedures')) {
    activePage = 'Procedures';
    pageTitle = 'Procedures';
  } else if (location.pathname.startsWith('/module-approvals')) {
    activePage = 'Module Approvals';
    pageTitle = 'Module Request Approvals';
  } else if (location.pathname.startsWith('/gap-assessment')) {
    activePage = 'Business Resilience Gap Assessment';
    mainTitle = '';
    pageTitle = 'Gap Assessment Dashboard';
  }

  return (
    <div className="dashboard">
      <Sidebar activePage={activePage} />
      <div className="main-content">
        {/* Fixed Header */}
        <header className="page-header">
          <div className="header-titles">
            {mainTitle && <h1 className="main-portal-title">{mainTitle}</h1>}
            <h1 className="page-title">{pageTitle}</h1>
          </div>
          <div className="profile-wrapper">
            <UserProfile />
          </div>
        </header>
        {/* Scrollable Content */}
        <div className="content-scrollable bg-[#0D0D0D]">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

// Helper function to get user role and organization ID from JWT
const getUserInfoFromToken = () => {
  const token = localStorage.getItem('access_token');
  if (!token) return { userRole: '', organizationId: '' };
  
  try {
    const decoded = jwtDecode(token);
    const roles = decoded.roles || [];
    const primaryRole = roles.length > 0 ? roles[0] : '';
    const organizationId = decoded.organization_id || '';
    
    console.log('getUserInfoFromToken - decoded:', decoded);
    console.log('getUserInfoFromToken - roles:', roles);
    console.log('getUserInfoFromToken - primaryRole:', primaryRole);
    console.log('getUserInfoFromToken - organizationId:', organizationId);
    
    return { userRole: primaryRole, organizationId };
  } catch (error) {
    console.error('Error decoding token:', error);
    return { userRole: '', organizationId: '' };
  }
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/*" element={
          <AdminRoute>
            <AdminContainer />
          </AdminRoute>
        } />
        
        {/* Regular App Routes */}
        <Route element={<Layout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/process-serving-mapping" element={<Dashboard />} />
          <Route path="/process_map" element={<ProcessMap />} />
          <Route path="/service_map" element={<ServiceMap />} />
          <Route path="/business-impact-analysis" element={<BusinessImpactAnalysisPage />} />
          <Route path="/bia/add/*" element={<Navigate to="/bia/bia-information" replace />} />
          <Route path="/bia/application-bia/*" element={<ApplicationBIAContainer />} />
          <Route path="/bia/bia-matrix" element={<BiaMatrix />} />
          <Route path="/bia/business-information" element={<BusinessInformation />} />
          <Route path="/bia/technical-info" element={<TechnicalInfo />} />
          {/* <Route path="/bia/impact-scale" element={<ImpactScale />} /> */}
          <Route path="/bia/*" element={
            <ImpactMatrixProvider>
              <BIAContainer />
            </ImpactMatrixProvider>
          } />
          <Route path="/procedures/*" element={<ProceduresContainer />} />
          <Route path="/manual-input" element={<ManualInputPage />} />
          <Route path="/organization-impact-scale" element={
            <ImpactMatrixProvider>
              <OrganizationImpactScale />
            </ImpactMatrixProvider>
          } />
          <Route path="/criticality-assessment" element={<CriticalityAssessment />} />
          <Route path="/module-lock/:moduleName" element={<ModuleLock />} />
          <Route path="/module-approvals" element={
            <ApprovalRoute>
              {(() => {
                const userInfo = getUserInfoFromToken();
                console.log('Module Approvals Route - userInfo:', userInfo);
                return (
                  <ModuleApprovals 
                    userRole={userInfo.userRole} 
                    organizationId={userInfo.organizationId} 
                  />
                );
              })()}
            </ApprovalRoute>
          } />
          <Route path="/training-testing" element={<Training />} />
          <Route path="/recovery-strategy" element={<RecoveryStrategyDashboard />} />
          <Route path="/bcm-dashboard" element={<BCMDashboard />} />
          <Route path="/policy" element={<Home />} />
          <Route path="/policy/wizard" element={<Wizard />} />
          <Route path="/policy/ai" element={<AIHelp />} />
          <Route path="/policy/progress" element={<ProgressTracker />} />
          <Route path="/policy/templates" element={<TemplateViewer />} />
          <Route path="/kpis-maturity" element={<GovernanceDashboard />} />
          <Route path="/crisis-management" element={<CrisisManagement />} />
          <Route path="/gap-assessment/*" element={<GapAssessmentPage />} />
          {/* <Route path="/risk-analysis" element={<RiskAnalysis />} /> */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
