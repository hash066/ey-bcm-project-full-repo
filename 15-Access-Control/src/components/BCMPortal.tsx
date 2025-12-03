import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, FileEdit, PlayCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const BCMPortal = () => {
  const { hasPermission } = useAuth();

  const handleEditPlan = () => {
    toast.success('BCM Plan editor opened');
  };

  const handleRunTest = () => {
    toast.info('Disaster recovery test initiated');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary rounded-lg">
          <Shield className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Business Continuity Management</h2>
          <p className="text-muted-foreground">Monitor and manage business continuity plans</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-accent" />
              BCM Dashboard Overview
            </CardTitle>
            <CardDescription>Current business continuity status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Recovery Plans</span>
                <span className="font-semibold text-foreground">12 Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Last Test Date</span>
                <span className="font-semibold text-foreground">Nov 15, 2025</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Risk Level</span>
                <span className="font-semibold text-accent">Low</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Recent Incidents
            </CardTitle>
            <CardDescription>Latest recorded incidents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm">
                <div className="font-medium text-foreground">Network Outage - Resolved</div>
                <div className="text-muted-foreground text-xs">Nov 18, 2025 • 15 min</div>
              </div>
              <div className="text-sm">
                <div className="font-medium text-foreground">Power Failure - Backup Activated</div>
                <div className="text-muted-foreground text-xs">Nov 10, 2025 • 2 hours</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Actions & Management</CardTitle>
          <CardDescription>Available BCM operations based on your permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {hasPermission('BCM_EDIT_PLAN') && (
              <Button onClick={handleEditPlan} className="gap-2">
                <FileEdit className="h-4 w-4" />
                Edit BCM Plan
              </Button>
            )}
            {hasPermission('BCM_RUN_TEST') && (
              <Button onClick={handleRunTest} variant="outline" className="gap-2">
                <PlayCircle className="h-4 w-4" />
                Run Disaster Test
              </Button>
            )}
            {!hasPermission('BCM_EDIT_PLAN') && !hasPermission('BCM_RUN_TEST') && (
              <div className="text-sm text-muted-foreground">
                You have read-only access to the BCM Portal
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BCMPortal;
