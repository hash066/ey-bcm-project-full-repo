import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatDetailModal } from '@/components/StatDetailModal';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const statConfig = [
  { 
    key: 'totalDepartments', 
    label: 'Total Departments', 
    icon: '🏢', 
    description: 'Number of departments in your organization.',
    value: 12,
    details: {
      active: 10,
      inactive: 2,
      lastUpdated: '2025-01-15'
    }
  },
  { 
    key: 'totalSubDepartments', 
    label: 'Total Sub-Departments', 
    icon: '🗂️', 
    description: 'Number of sub-departments under all departments.',
    value: 48,
    details: {
      active: 45,
      inactive: 3,
      averagePerDepartment: 4
    }
  },
  { 
    key: 'totalProcesses', 
    label: 'Total Processes', 
    icon: '🔄', 
    description: 'Number of business processes mapped.',
    value: 156,
    details: {
      automated: 89,
      manual: 67,
      efficiency: '87%'
    }
  },
  { 
    key: 'totalSubProcesses', 
    label: 'Total Sub-Processes', 
    icon: '🧩', 
    description: 'Number of sub-processes mapped.',
    value: 342,
    details: {
      critical: 124,
      standard: 218,
      optimized: '72%'
    }
  },
  { 
    key: 'totalBCMCoordinators', 
    label: 'Total BCM Coordinators', 
    icon: '👤', 
    description: 'Number of BCM coordinators assigned.',
    value: 24,
    details: {
      active: 22,
      onLeave: 2,
      coverage: '98%'
    }
  },
];

const Dashboard = () => {
  const [clickedBox, setClickedBox] = useState<string | null>(null);
  const [selectedStat, setSelectedStat] = useState<typeof statConfig[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleBoxClick = (stat: typeof statConfig[0]) => {
    setClickedBox(stat.key);
    setSelectedStat(stat);
    
    // Remove glow after animation
    setTimeout(() => {
      setClickedBox(null);
    }, 2000);
  };

  const filteredStats = useMemo(() => {
    if (!searchQuery.trim()) return statConfig;
    
    const query = searchQuery.toLowerCase();
    return statConfig.filter(stat => 
      stat.label.toLowerCase().includes(query) ||
      stat.description.toLowerCase().includes(query) ||
      stat.value.toString().includes(query)
    );
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-primary">
            Process & Service Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Click on any box to view details and download options
          </p>
          
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search departments, processes, or values..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStats.length > 0 ? (
            filteredStats.map((stat) => (
              <Card
                key={stat.key}
                onClick={() => handleBoxClick(stat)}
                className={`cursor-pointer transition-all duration-300 hover:scale-105 border-primary/20 bg-card/50 backdrop-blur
                  ${clickedBox === stat.key ? 'glow-box-active' : 'hover:shadow-lg hover:shadow-primary/10'}
                `}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-primary">
                    <span className="text-4xl">{stat.icon}</span>
                    <span className="text-lg">{stat.label}</span>
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {stat.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-5xl font-bold text-foreground">
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground text-lg">No results found for "{searchQuery}"</p>
            </div>
          )}
        </div>

        <div className="bg-card/30 border border-primary/10 rounded-lg p-6 backdrop-blur">
          <h2 className="text-2xl font-semibold text-primary mb-4">Quick Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-3xl font-bold text-primary">98%</div>
              <div className="text-sm text-muted-foreground">Coverage</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-primary">87%</div>
              <div className="text-sm text-muted-foreground">Efficiency</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-primary">156</div>
              <div className="text-sm text-muted-foreground">Active Processes</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-primary">24</div>
              <div className="text-sm text-muted-foreground">Coordinators</div>
            </div>
          </div>
        </div>
      </div>

      <StatDetailModal
        open={!!selectedStat}
        onClose={() => setSelectedStat(null)}
        stat={selectedStat}
      />
    </div>
  );
};

export default Dashboard;
