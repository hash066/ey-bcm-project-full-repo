import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/LoginForm';
import TopNavBar from '@/components/TopNavBar';
import SideNavBar from '@/components/SideNavBar';
import BCMPortal from '@/components/BCMPortal';
import CRMDashboard from '@/components/CRMDashboard';
import AdminPanel from '@/components/AdminPanel';

const Index = () => {
  const { user, hasPermission } = useAuth();
  const [activeSection, setActiveSection] = useState('bcm');

  if (!user) {
    return <LoginForm />;
  }

  // Determine initial section based on permissions
  const getInitialSection = () => {
    if (hasPermission('BCM_VIEW_DASHBOARD')) return 'bcm';
    if (hasPermission('CRM_VIEW_ACCOUNTS')) return 'crm';
    if (hasPermission('SYS_MANAGE_USERS')) return 'admin';
    return 'bcm';
  };

  // Set initial section on first render
  if (activeSection === 'bcm' && !hasPermission('BCM_VIEW_DASHBOARD')) {
    setActiveSection(getInitialSection());
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'bcm':
        return hasPermission('BCM_VIEW_DASHBOARD') ? <BCMPortal /> : null;
      case 'crm':
        return hasPermission('CRM_VIEW_ACCOUNTS') ? <CRMDashboard /> : null;
      case 'admin':
        return hasPermission('SYS_MANAGE_USERS') ? <AdminPanel /> : null;
      default:
        return <BCMPortal />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNavBar />
      <div className="flex flex-1">
        <SideNavBar activeSection={activeSection} onSectionChange={setActiveSection} />
        <main className="flex-1 overflow-auto">{renderContent()}</main>
      </div>
    </div>
  );
};

export default Index;
