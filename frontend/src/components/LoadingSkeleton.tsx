import React from 'react';

export const LoadingSkeleton: React.FC<{ type?: 'card' | 'table' | 'list' | 'stats' }> = ({
  type = 'card',
}) => {
  if (type === 'stats') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-200/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800/60" />
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-slate-200/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800/60" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-44 rounded-2xl bg-slate-200/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800/60" />
      ))}
    </div>
  );
};
