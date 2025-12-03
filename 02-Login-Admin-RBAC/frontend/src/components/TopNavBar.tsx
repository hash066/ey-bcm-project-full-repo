import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Shield, LogOut, User } from 'lucide-react';

const TopNavBar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-border bg-card shadow-soft flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-corporate rounded-lg">
          <Shield className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">Enterprise RBAC System</h1>
          <p className="text-xs text-muted-foreground">Business Continuity & Customer Management</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-lg">
          <User className="h-4 w-4 text-muted-foreground" />
          <div className="text-right">
            <div className="text-sm font-medium text-foreground">{user?.email}</div>
            <div className="text-xs text-muted-foreground">{user?.role}</div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={logout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </header>
  );
};

export default TopNavBar;
