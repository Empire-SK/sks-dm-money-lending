import React from 'react';
import { LucideIcon } from 'lucide-react';

interface DashboardStatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  accent: 'emerald' | 'amber' | 'violet' | 'sky';
}

const accentMap = {
  emerald: {
    icon: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    value: 'text-emerald-400',
    glow: 'before:bg-emerald-500/5',
  },
  amber: {
    icon: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    value: 'text-amber-400',
    glow: 'before:bg-amber-500/5',
  },
  violet: {
    icon: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    value: 'text-violet-400',
    glow: 'before:bg-violet-500/5',
  },
  sky: {
    icon: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    value: 'text-sky-400',
    glow: 'before:bg-sky-500/5',
  },
};

const DashboardStatsCard: React.FC<DashboardStatsCardProps> = ({ title, value, icon: Icon, accent, trend }) => {
  const colors = accentMap[accent];

  return (
    <div className="relative glass-card p-5 overflow-hidden group hover:border-zinc-700/80 transition-all duration-300">
      {/* Subtle top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-px ${
        accent === 'emerald' ? 'bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent' :
        accent === 'amber' ? 'bg-gradient-to-r from-transparent via-amber-500/40 to-transparent' :
        accent === 'violet' ? 'bg-gradient-to-r from-transparent via-violet-500/40 to-transparent' :
        'bg-gradient-to-r from-transparent via-sky-500/40 to-transparent'
      }`} />

      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider truncate">{title}</p>
          <p className={`text-2xl font-bold mt-2 ${colors.value} tabular-nums`}>{value}</p>
          {trend && (
            <p className="text-xs text-zinc-600 mt-1.5 truncate">{trend}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl border flex-shrink-0 ml-3 ${colors.icon}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
};

export default DashboardStatsCard;