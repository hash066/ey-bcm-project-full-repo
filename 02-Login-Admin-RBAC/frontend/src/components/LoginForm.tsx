import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertCircle } from 'lucide-react';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const success = login(email);
    if (!success) {
      setError('Invalid email address. Please use one of the demo accounts.');
    }
  };

  const demoAccounts = [
    { email: 'admin@ey.com', role: 'System Admin' },
    { email: 'bcm_coord@ey.com', role: 'BCM Coordinator' },
    { email: 'sales_mgr@ey.com', role: 'Sales Manager' },
    { email: 'viewer@ey.com', role: 'Viewer' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary to-accent p-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="p-3 bg-primary rounded-full">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">RBAC Demo Portal</CardTitle>
          <CardDescription className="text-center">
            Enterprise Role-Based Access Control System
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter demo account email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>

          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground text-center">
              Demo Accounts
            </div>
            <div className="space-y-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  onClick={() => setEmail(account.email)}
                  className="w-full text-left px-3 py-2 rounded-md bg-muted hover:bg-muted/80 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">{account.email}</span>
                    <span className="text-xs text-muted-foreground">{account.role}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
