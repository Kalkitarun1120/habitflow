import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { ProgressRing } from './ProgressRing';

interface ProgressCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  progress?: number;
  color?: string;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  progress,
  color = '#10B981',
}) => {
  return (
    <div className="glass-card rounded-2xl p-5 card-3d flex items-center justify-between border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#131B26]">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shadow-sm">
            <Icon className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </span>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white pt-1 tracking-tight">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            {subtitle}
          </p>
        )}
      </div>

      {progress !== undefined && (
        <div className="pl-3">
          <ProgressRing
            progress={progress}
            size={64}
            strokeWidth={6}
            color={color}
          />
        </div>
      )}
    </div>
  );
};
