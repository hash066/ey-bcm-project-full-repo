import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Users, Shield, Key, Database } from 'lucide-react';
import { toast } from 'sonner';

const AdminPanel = () => {
  const handleUserManagement = () => {
    toast.info('User management interface opened');
  };

  const handleRoleManagement = () => {
    toast.info('Role configuration interface opened');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-destructive rounded-lg">
          <Settings className="h-6 w-6 text-destructive-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">System Administration</h2>
          <p className="text-muted-foreground">Manage users, roles, and system configuration</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              User Management
            </CardTitle>
            <CardDescription>Manage user accounts and access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Users</span>
                <span className="font-semibold text-foreground">4</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Sessions</span>
                <span className="font-semibold text-foreground">1</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pending Invites</span>
                <span className="font-semibold text-foreground">0</span>
              </div>
            </div>
            <Button onClick={handleUserManagement} className="w-full gap-2">
              <Users className="h-4 w-4" />
              Manage Users
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" />
              Role & Permissions
            </CardTitle>
            <CardDescription>Configure role-based access control</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {['System Admin', 'BCM Coordinator', 'Sales Manager', 'Viewer'].map((role) => (
                <div key={role} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm font-medium text-foreground">{role}</span>
                  <span className="text-xs text-muted-foreground">1 user</span>
                </div>
              ))}
            </div>
            <Button onClick={handleRoleManagement} variant="outline" className="w-full gap-2">
              <Key className="h-4 w-4" />
              Configure Roles
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Permission Matrix
          </CardTitle>
          <CardDescription>Overview of role permissions across the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 font-semibold text-foreground">Permission</th>
                  <th className="text-center p-2 font-semibold text-foreground">Admin</th>
                  <th className="text-center p-2 font-semibold text-foreground">BCM Coord</th>
                  <th className="text-center p-2 font-semibold text-foreground">Sales Mgr</th>
                  <th className="text-center p-2 font-semibold text-foreground">Viewer</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'BCM View Dashboard', admin: true, bcm: true, sales: true, viewer: true },
                  { name: 'BCM Edit Plan', admin: true, bcm: true, sales: false, viewer: false },
                  { name: 'BCM Run Test', admin: true, bcm: true, sales: false, viewer: false },
                  { name: 'CRM View Accounts', admin: true, bcm: true, sales: true, viewer: true },
                  { name: 'CRM Create Lead', admin: true, bcm: false, sales: true, viewer: false },
                  { name: 'CRM Delete Account', admin: true, bcm: false, sales: false, viewer: false },
                  { name: 'System Manage Users', admin: true, bcm: false, sales: false, viewer: false },
                ].map((perm, index) => (
                  <tr key={index} className="border-b border-border">
                    <td className="p-2 text-muted-foreground">{perm.name}</td>
                    <td className="text-center p-2">{perm.admin ? '✓' : '—'}</td>
                    <td className="text-center p-2">{perm.bcm ? '✓' : '—'}</td>
                    <td className="text-center p-2">{perm.sales ? '✓' : '—'}</td>
                    <td className="text-center p-2">{perm.viewer ? '✓' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanel;
