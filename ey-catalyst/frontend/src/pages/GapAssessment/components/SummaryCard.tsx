import { ReactNode } from 'react';

interface SummaryCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  variant?: 'default' | 'warning' | 'success' | 'info';
}

export default function SummaryCard({ icon, title, value, variant = 'default' }: SummaryCardProps) {
  const getBorderColor = () => {
    switch (variant) {
      case 'warning': return 'border-l-red-500';
      case 'info': return 'border-l-orange-500';
      case 'success': return 'border-l-yellow-400';
      default: return 'border-l-blue-500';
    }
  };

  const getValueColor = () => {
    switch (variant) {
      case 'warning': return 'text-red-300';
      case 'info': return 'text-orange-300';
      case 'success': return 'text-yellow-400';
      default: return 'text-yellow-400';
    }
  };

  return (
    <div
      className={`bg-slate-800 p-6 border-l-4 ${getBorderColor()} rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1 border border-slate-700`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="text-slate-300 text-sm font-medium mb-2 uppercase tracking-wide">{title}</div>
      <div className={`text-3xl font-bold ${getValueColor()}`}>{value}</div>
    </div>
  );
}
