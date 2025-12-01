import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, ChevronDown, ChevronRight, FileJson, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface StatDetailModalProps {
  open: boolean;
  onClose: () => void;
  stat: {
    label: string;
    icon: string;
    description: string;
    value: number;
    details: Record<string, any>;
  } | null;
}

export const StatDetailModal: React.FC<StatDetailModalProps> = ({ open, onClose, stat }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  if (!stat) return null;

  const toggleNode = (nodeKey: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeKey)) {
        newSet.delete(nodeKey);
      } else {
        newSet.add(nodeKey);
      }
      return newSet;
    });
  };

  const exportToJSON = () => {
    const data = {
      label: stat.label,
      value: stat.value,
      details: stat.details,
      description: stat.description
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${stat.label.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported to JSON successfully!');
  };

  const exportToCSV = () => {
    const rows = [['Field', 'Value']];
    rows.push(['Label', stat.label]);
    rows.push(['Total', stat.value.toString()]);
    
    const flattenObject = (obj: any, prefix = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          flattenObject(value, newKey);
        } else {
          rows.push([newKey, String(value)]);
        }
      });
    };
    
    flattenObject(stat.details, 'details');
    
    const csvContent = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${stat.label.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported to CSV successfully!');
  };

  const renderTreeNode = (label: string, value: any, level: number = 0, parentKey: string = '') => {
    const isObject = typeof value === 'object' && value !== null && !Array.isArray(value);
    const nodeKey = `${parentKey}.${label}`;
    const isExpanded = expandedNodes.has(nodeKey);
    
    return (
      <div key={nodeKey} className="relative" style={{ marginLeft: `${level * 24}px` }}>
        {level > 0 && (
          <div className="absolute left-0 top-0 w-px h-full bg-border -ml-3" />
        )}
        <div className="flex items-center gap-2 py-2 group">
          {level > 0 && (
            <div className="absolute left-0 top-1/2 w-3 h-px bg-border -ml-3" />
          )}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors flex-1 ${
            isObject ? 'bg-muted/50' : 'bg-card hover:bg-accent'
          }`}>
            {isObject && (
              <button
                onClick={() => toggleNode(nodeKey)}
                className="p-0.5 hover:bg-accent rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            )}
            <span className="text-sm font-medium text-foreground">{label}:</span>
            {!isObject && (
              <span className="text-sm text-primary font-semibold">{value}</span>
            )}
          </div>
        </div>
        {isObject && isExpanded && (
          <div className="mt-1">
            {Object.entries(value).map(([key, val]) => renderTreeNode(key, val, level + 1, nodeKey))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <span className="text-4xl">{stat.icon}</span>
              <span>{stat.label}</span>
            </DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToJSON}
                className="gap-2"
              >
                <FileJson className="w-4 h-4" />
                JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                CSV
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          <div className="p-4 bg-muted/30 rounded-lg border border-border">
            <p className="text-muted-foreground">{stat.description}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Details Tree</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (expandedNodes.size > 0) {
                    setExpandedNodes(new Set());
                  } else {
                    const allKeys = new Set<string>();
                    const collectKeys = (obj: any, prefix = '') => {
                      Object.entries(obj).forEach(([key, value]) => {
                        const nodeKey = `${prefix}.${key}`;
                        if (typeof value === 'object' && value !== null) {
                          allKeys.add(nodeKey);
                          collectKeys(value, nodeKey);
                        }
                      });
                    };
                    collectKeys({ Total: stat.value, ...stat.details });
                    setExpandedNodes(allKeys);
                  }
                }}
                className="text-xs"
              >
                {expandedNodes.size > 0 ? 'Collapse All' : 'Expand All'}
              </Button>
            </div>
            <div className="bg-card/50 border border-border rounded-lg p-4">
              {renderTreeNode('Total', stat.value, 0, 'root')}
              {Object.entries(stat.details).map(([key, value]) => 
                renderTreeNode(key, value, 1, 'root')
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <div className="text-3xl font-bold text-primary">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">Total Count</div>
            </div>
            <div className="text-center p-4 bg-accent/10 rounded-lg">
              <div className="text-3xl font-bold text-foreground">
                {Object.keys(stat.details).length}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Sub-categories</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
