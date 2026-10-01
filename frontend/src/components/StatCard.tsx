import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  isPositive?: boolean;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  change,
  isPositive = true,
  color = '#10B981',
}) => {
  return (
    <div className="glass-card rounded-2xl p-5 card-3d flex flex-col justify-between border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div
          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-emerald-600 dark:text-emerald-400 shadow-sm"
          style={color ? { color } : undefined}
        >
          <Icon className="w-4 h-4 stroke-[2.2]" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {value}
        </span>
        {change && (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
              isPositive
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40'
            }`}
          >
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {change}
          </span>
        )}
      </div>
    </div>
  );
};
