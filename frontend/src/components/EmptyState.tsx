import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Sparkles } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: LucideIcon;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = Sparkles,
}) => {
  return (
    <div className="glass-card rounded-3xl p-10 text-center flex flex-col items-center justify-center border-dashed border-2 border-slate-200 dark:border-slate-800">
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 shadow-sm">
        <Icon className="w-7 h-7 stroke-[2.2]" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-sm shadow-sm hover:shadow-md shadow-emerald-600/20 dark:shadow-emerald-500/25 hover:scale-[1.02] active:scale-95 transition-all duration-150"
        >
          <Sparkles className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};
