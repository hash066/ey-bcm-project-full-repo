import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Sidebar.css';
import { FaHome, FaProjectDiagram, FaChartBar, FaShieldAlt, FaSyncAlt, FaClipboardList, FaExclamationTriangle, FaChalkboardTeacher, FaBook, FaUserShield, FaLock, FaChartLine, FaClipboardCheck, FaTools, FaUserCheck } from 'react-icons/fa';
import { jwtDecode } from 'jwt-decode';
import { getUserLicensedModules, isModuleLicensed } from '../../services/moduleService';

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
        const decoded = jwtDecode(token);
        setIsAdmin(decoded.groups && decoded.groups.includes('Administrators'));
        
        // Extract role from JWT token's roles array
        const roles = decoded.roles || [];
        const primaryRole = roles.length > 0 ? roles[0] : '';
        setUserRole(primaryRole);
        
        console.log('Decoded JWT:', decoded);
        console.log('User roles:', roles);
        console.log('Primary role:', primaryRole);
        
        // Fetch licensed modules
        fetchLicensedModules();
      } catch (error) {
        console.error('Error decoding token:', error);
        setIsAdmin(false);
      }
    }
  }, []);

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

  // Check if a module is licensed
  const checkModuleAccess = (moduleName) => {
    if (isAdmin) return true; // Admins can access all modules
    if (moduleName === "Home") return true; // Home is always accessible
    if (moduleName === "Admin Panel") return isAdmin; // Only admins can access admin panel
    if (moduleName === "Module Approvals") {
      // Only Client Head and Project Sponsor can access module approvals
      console.log('Checking module approvals access for role:', userRole);
      return userRole === 'Client Head' || userRole === 'Project Sponsor';
    }
    
    return isModuleLicensed(moduleName, licensedModules);
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
    { name: "KPIs & BCM Maturity", path: "/kpis-maturity", short: "KM", icon: <FaChartLine /> },
    { name: "Continual Improvement", path: "/continual-improvement", short: "CI", icon: <FaSyncAlt /> },
  ];

  // Add module approvals link if user is Client Head or Project Sponsor
  console.log('Current user role for menu items:', userRole);
  if (userRole === 'Client Head' || userRole === 'Project Sponsor') {
    console.log('Adding Module Approvals to menu');
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
