import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, UserPlus, Trash2, TrendingUp, Users, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const CRMDashboard = () => {
  const { hasPermission } = useAuth();

  const handleCreateLead = () => {
    toast.success('New lead creation form opened');
  };

  const handleDeleteAccount = () => {
    toast.error('Account deletion requires additional confirmation');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-accent rounded-lg">
          <Activity className="h-6 w-6 text-accent-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Customer Relationship Management</h2>
          <p className="text-muted-foreground">Manage customer accounts and sales pipeline</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">2,845</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">482</div>
            <p className="text-xs text-muted-foreground">+23% from last month</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">$1.2M</div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Customer Accounts</CardTitle>
          <CardDescription>Recent customer interactions and account status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {['Acme Corporation', 'Global Tech Inc', 'Summit Partners', 'Prime Industries'].map(
              (company, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div>
                    <div className="font-medium text-foreground">{company}</div>
                    <div className="text-sm text-muted-foreground">Active • Last contact: 2 days ago</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Actions & Management</CardTitle>
          <CardDescription>Available CRM operations based on your permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {hasPermission('CRM_CREATE_LEAD') && (
              <Button onClick={handleCreateLead} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Create New Lead
              </Button>
            )}
            {hasPermission('CRM_DELETE_ACCOUNT') && (
              <Button onClick={handleDeleteAccount} variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Delete Account
              </Button>
            )}
            {!hasPermission('CRM_CREATE_LEAD') && !hasPermission('CRM_DELETE_ACCOUNT') && (
              <div className="text-sm text-muted-foreground">
                You have read-only access to the CRM Dashboard
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CRMDashboard;
