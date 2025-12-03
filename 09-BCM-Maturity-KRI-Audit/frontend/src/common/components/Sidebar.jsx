import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Sidebar.css';
import { FaHome, FaProjectDiagram, FaChartBar, FaShieldAlt, FaSyncAlt, FaClipboardList, FaExclamationTriangle, FaChalkboardTeacher, FaBook, FaUserShield, FaLock, FaChartLine, FaClipboardCheck, FaTools, FaUserCheck } from 'react-icons/fa';
import { decodeToken } from '../../services/authService';
import { getUserLicensedModules, isModuleLicensed } from '../../services/moduleService';

// Role hierarchy constants for UI permissions
const ROLE_HIERARCHY = {
  'process_owner': 1,
  'sub_department_head': 2,
  'department_head': 3,
  'bcm_coordinator': 4,
  'ceo': 5,
  'ey_admin': 6
};

const Sidebar = ({ activePage }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [licensedModules, setLicensedModules] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Check if user is admin and fetch licensed modules
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const decoded = decodeToken();

        // Extract role from JWT token's roles array
        const roles = decoded.roles || [];
        const primaryRole = roles.length > 0 ? roles[0] : '';
        setUserRole(primaryRole);

        setIsAdmin((decoded.groups && decoded.groups.includes('Administrators')) || primaryRole === 'ey_admin');

        console.log('Decoded JWT:', decoded);
        console.log('User roles:', roles);
        console.log('Primary role:', primaryRole);
        console.log('Sidebar refreshed with new token');

        // Fetch licensed modules
        fetchLicensedModules();
      } catch (error) {
        console.error('Error decoding token:', error);
        setIsAdmin(false);
        setUserRole('');
      }
    } else {
      // No token, reset state
      setIsAdmin(false);
      setUserRole('');
    }
  }, [location.pathname, localStorage.getItem('access_token')]); // Re-run when route changes or token updates

  // Fetch licensed modules for the user's organization
  const fetchLicensedModules = async () => {
    try {
      setLoading(true);
      const modules = await getUserLicensedModules();
      setLicensedModules(modules);
    } catch (error) {
      console.error('Error fetching licensed modules:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if user has access to a module (RBAC + Licensing)
  const checkModuleAccess = (moduleName) => {
    // Always allow admins access to everything
    console.log(`Checking access for "${moduleName}": isAdmin=${isAdmin}, userRole=${userRole}`);
    if (isAdmin || userRole === 'ey_admin') {
      console.log(`Granting admin access for "${moduleName}"`);
      return true;
    }

    // Home is always accessible
    if (moduleName === "Home") return true;

    // Admin Panel only for EY Admin
    if (moduleName === "Admin Panel") return userRole === 'ey_admin' || isAdmin;

    // Business Impact Analysis - BIA roles required
    if (moduleName === "Business Impact Analysis") {
      const biaRoles = ['process_owner', 'sub_department_head', 'department_head', 'bcm_coordinator', 'ceo', 'ey_admin'];
      return biaRoles.includes(userRole);
    }

    // Module Approvals - Senior management only
    if (moduleName === "Module Approvals") {
      const approvalRoles = ['department_head', 'bcm_coordinator', 'ceo', 'ey_admin'];
      return approvalRoles.includes(userRole);
    }

    // Check module licensing (for read-only or demo functionality) - by pass for admin
    if (userRole !== 'ey_admin' && !isAdmin && !isModuleLicensed(moduleName, licensedModules)) {
      return false;
    }

    // Role-based access for other modules
    // Higher-level roles get more access
    const userLevel = ROLE_HIERARCHY[userRole] || 0;

    // Define minimum role requirements for each module
    const roleRequirements = {
      'Process and Service Mapping': ['process_owner', 'sub_department_head', 'department_head', 'bcm_coordinator', 'ceo', 'ey_admin'],
      'Risk Analysis': ['sub_department_head', 'department_head', 'bcm_coordinator', 'ceo', 'ey_admin'],
      'Recovery Strategy': ['department_head', 'bcm_coordinator', 'ceo', 'ey_admin'],
      'BCM Plan': ['bcm_coordinator', 'ceo', 'ey_admin'],
      'Crisis Management': ['bcm_coordinator', 'ceo', 'ey_admin'],
      'Training and Testing': ['process_owner', 'sub_department_head', 'department_head', 'bcm_coordinator', 'ceo', 'ey_admin'],
      'Procedures': ['process_owner', 'sub_department_head', 'department_head', 'bcm_coordinator', 'ceo', 'ey_admin'],
      'Policy': ['department_head', 'bcm_coordinator', 'ceo', 'ey_admin'],
      'Business Resilience Gap Assessment': ['process_owner', 'sub_department_head', 'department_head', 'bcm_coordinator', 'ceo', 'ey_admin'],
      'KPIs & BCM Maturity': ['bcm_coordinator', 'ceo', 'ey_admin'],
      'Continual Improvement': ['process_owner', 'sub_department_head', 'department_head', 'bcm_coordinator', 'ceo', 'ey_admin']
    };

    const allowedRoles = roleRequirements[moduleName] || [];
    return allowedRoles.includes(userRole);
  };

  // Handle module click - redirect to lock screen if not licensed
  const handleModuleClick = (e, item) => {
    if (location.pathname === item.path) {
      e.preventDefault(); // Prevent navigation if already on the page
      return;
    }
    
    // Check if module is licensed
    if (!checkModuleAccess(item.name)) {
      e.preventDefault(); // Prevent default navigation
      navigate(`/module-lock/${encodeURIComponent(item.name)}`);
    }
  };

  const menuItems = [
    { name: "Home", path: "/home", short: "H", icon: <FaHome /> },
    { name: "Process and Service Mapping", path: "/process-serving-mapping", short: "P", icon: <FaProjectDiagram /> },
    //{ name: "Service Mapping", path: "/service-mapping", short: "S", icon: <FaProjectDiagram /> },
    { name: "Business Impact Analysis", path: "/business-impact-analysis", short: "B", icon: <FaChartBar /> },
    { name: "Risk Analysis", path: "/risk-analysis", short: "R", icon: <FaShieldAlt /> },
    { name: "Recovery Strategy", path: "/recovery-strategy", short: "RS", icon: <FaSyncAlt /> },
    { name: "BCM Plan", path: "/bcm-dashboard", short: "BP", icon: <FaClipboardList /> },
    { name: "Crisis Management", path: "/crisis-management", short: "CM", icon: <FaExclamationTriangle /> },
    { name: "Training and Testing", path: "/training-testing", short: "TT", icon: <FaChalkboardTeacher /> },
    { name: "Procedures", path: "/procedures", short: "PR", icon: <FaBook /> },
    { name: "Policy", path: "/policy", short: "P", icon: <FaBook /> },
    //{ name: "Internal Audit & Management Review", path: "/internal-audit", short: "IA", icon: <FaClipboardCheck /> },
    //{ name: "Business Resilience Gap Assessment", path: "/gap-assessment", short: "GA", icon: <FaTools /> },
    { name: "Business Resilience Gap Assessment", path: "/gap-assessment", short: "GA", icon: <FaTools /> },
    { name: "KPIs & BCM Maturity", path: "/kpis-maturity", short: "KM", icon: <FaChartLine /> },
    { name: "Continual Improvement", path: "/continual-improvement", short: "CI", icon: <FaSyncAlt /> },
  ];

  // Add module approvals link if user has approval permissions (senior management)
  console.log('Current user role for menu items:', userRole);
  if (userRole === 'department_head' || userRole === 'bcm_coordinator' || userRole === 'ceo' || userRole === 'ey_admin') {
    console.log('Adding Module Approvals to menu for senior management');
    menuItems.push({ name: "Module Approvals", path: "/module-approvals", short: "MA", icon: <FaUserCheck /> });
  }

  // Add admin panel link if user is admin
  if (isAdmin) {
    menuItems.push({ name: "Admin Panel", path: "/admin", short: "A", icon: <FaUserShield /> });
  }

  return (
    <div
      className={`sidebar${isCollapsed ? " collapsed" : ""}`}
      style={{ display: 'block', minWidth: isCollapsed ? 60 : 220, width: isCollapsed ? 80 : 250, paddingLeft: isCollapsed ? 4 : 10, paddingRight: isCollapsed ? 4 : 10 }}
    >
      <div 
        className="sidebar-header"
        style={{ marginBottom: 20, padding: isCollapsed ? "10px 5px" : "15px 10px" }}
      >
        {!isCollapsed && (
          <span 
            className="sidebar-title" 
            style={{ width: '100%', textAlign: 'center', display: 'block' }}
          >
            BCM Portal
          </span>
        )}
        <button 
          className="collapse-btn" 
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          ☰
        </button>
      </div>
      <ul 
        className="menu-list"
        style={{ gap: isCollapsed ? 8 : 6 }}
      >
        {menuItems.map((item, idx) => (
          <li 
            key={item.name} 
            className={`${item.name === activePage ? "active" : ""} ${!checkModuleAccess(item.name) ? "locked" : ""}`}
          >
            <Link 
              to={checkModuleAccess(item.name) ? item.path : "#"} 
              style={{ 
                color: 'inherit', 
                textDecoration: 'none', 
                display: 'flex', 
                alignItems: 'center', 
                gap: isCollapsed ? 0 : 12, 
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                opacity: checkModuleAccess(item.name) ? 1 : 0.6
              }} 
              onClick={(e) => handleModuleClick(e, item)}
            >
              <span 
                style={{ 
                  fontSize: 18, 
                  display: 'flex', 
                  alignItems: 'center', 
                  minWidth: 22, 
                  justifyContent: 'center', 
                }}
                title={item.name}
              >
                {checkModuleAccess(item.name) ? item.icon : <FaLock />}
              </span>
              {!isCollapsed && (
                <span
                  className="menu-label"
                  style={{ opacity: 1, fontSize: 12, fontWeight: 500, marginLeft: 12 }}
                >
                  {item.name}
                  {!checkModuleAccess(item.name) && <FaLock style={{ marginLeft: 5, fontSize: 10 }} />}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
