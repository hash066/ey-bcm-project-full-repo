import { ReactNode } from 'react';

interface SummaryCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  variant?: 'default' | 'warning' | 'success' | 'info';
}

export default function SummaryCard({ icon, title, value, variant = 'default' }: SummaryCardProps) {
  const iconBgColors = {
    default: 'bg-zinc-800',
    warning: 'bg-red-950/50',
    success: 'bg-yellow-900/30',
    info: 'bg-orange-950/50'
  };

  const valueColors = {
    default: 'text-yellow-400',
    warning: 'text-red-400',
    success: 'text-yellow-400',
    info: 'text-orange-400'
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors">
      <div className={`w-12 h-12 ${iconBgColors[variant]} rounded-lg flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <div className="text-zinc-400 text-sm mb-2">{title}</div>
      <div className={`text-4xl font-bold ${valueColors[variant]}`}>{value}</div>
    </div>
  );
}
