import { useAuth } from '@/contexts/AuthContext';
import { Shield, Users, Settings, Activity } from 'lucide-react';

interface SideNavBarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const SideNavBar = ({ activeSection, onSectionChange }: SideNavBarProps) => {
  const { hasPermission } = useAuth();

  const navItems = [
    {
      id: 'bcm',
      label: 'BCM Portal',
      icon: Shield,
      permission: 'BCM_VIEW_DASHBOARD' as const,
    },
    {
      id: 'crm',
      label: 'CRM Dashboard',
      icon: Activity,
      permission: 'CRM_VIEW_ACCOUNTS' as const,
    },
    {
      id: 'admin',
      label: 'Admin Panel',
      icon: Settings,
      permission: 'SYS_MANAGE_USERS' as const,
    },
  ];

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const hasAccess = hasPermission(item.permission);
          const Icon = item.icon;

          if (!hasAccess) return null;

          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeSection === item.id
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
        <div className="text-xs text-sidebar-foreground/60 text-center">
          <Users className="h-4 w-4 mx-auto mb-1" />
          Role-Based Access Control
        </div>
      </div>
    </aside>
  );
};

export default SideNavBar;
