import React from 'react';
import type { CalendarDayData } from '../types';

interface CompletionHeatmapProps {
  data: CalendarDayData[];
  onSelectDay?: (day: CalendarDayData) => void;
}

export const CompletionHeatmap: React.FC<CompletionHeatmapProps> = ({ data, onSelectDay }) => {
  const getIntensityColor = (day: CalendarDayData) => {
    if (day.is_future) {
      return 'bg-slate-100 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-800/40 opacity-40';
    }
    if (day.completed_count === 0) {
      return day.total_habits > 0
        ? 'bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40'
        : 'bg-slate-100 dark:bg-[#07191C] border border-slate-200/50 dark:border-slate-800/60';
    }
    const rate = day.completion_rate;
    if (rate >= 100) return 'bg-emerald-600 dark:bg-emerald-500 text-white';
    if (rate >= 75) return 'bg-emerald-500 dark:bg-emerald-600 text-white';
    if (rate >= 50) return 'bg-emerald-400 dark:bg-emerald-700 text-white';
    return 'bg-emerald-200 dark:bg-emerald-900/70 text-slate-800 dark:text-emerald-200';
  };

  return (
    <div className="bg-white dark:bg-[#0C1E22] rounded-xl p-5 border border-slate-200/90 dark:border-[#16383B] space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Activity & Completion Matrix
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click any cell to inspect scheduled habits & compliance
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <span>Less</span>
          <span className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-[#07191C] border border-slate-200 dark:border-slate-800" />
          <span className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900" />
          <span className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-700" />
          <span className="w-3 h-3 rounded-sm bg-emerald-600 dark:bg-emerald-500" />
          <span>More</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 justify-start overflow-x-auto py-1">
        {data.map((day, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectDay && onSelectDay(day)}
            className={`w-7 h-7 rounded-md transition-all hover:scale-110 flex items-center justify-center text-[10px] font-semibold ${getIntensityColor(day)}`}
            title={`${day.date}: ${day.completed_count}/${day.total_habits} completed (${day.completion_rate}%) — Click to view day`}
          >
            {day.date.slice(-2)}
          </button>
        ))}
      </div>
    </div>
  );
};

