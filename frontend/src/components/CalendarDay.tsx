import React from 'react';
import { Check } from 'lucide-react';
import type { CalendarDayData } from '../types';

interface CalendarDayProps {
  day: CalendarDayData;
  onClick?: (day: CalendarDayData) => void;
}

export const CalendarDay: React.FC<CalendarDayProps> = ({ day, onClick }) => {
  const dateObj = new Date(day.date);
  const dayNum = dateObj.getDate();

  const getStatusStyles = () => {
    if (!day.is_current_month) {
      return 'opacity-25 bg-slate-50 dark:bg-slate-900/10 text-slate-400 border-transparent cursor-default';
    }
    if (day.is_future) {
      return 'bg-slate-50/50 dark:bg-[#07191C]/40 text-slate-400 border-slate-200/50 dark:border-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700';
    }

    const rate = day.completion_rate;

    if (day.status === 'missed' && day.total_habits > 0 && day.completed_count === 0) {
      return 'bg-rose-50/70 dark:bg-rose-950/25 text-rose-800 dark:text-rose-300 border-rose-200/70 dark:border-rose-900/30 hover:border-rose-400';
    }

    if (rate >= 100) {
      return 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 font-bold shadow-xs border-emerald-600 dark:border-emerald-400 hover:brightness-105';
    }
    if (rate >= 75) {
      return 'bg-emerald-400/90 dark:bg-emerald-600/90 text-slate-950 dark:text-white font-semibold border-emerald-500/80 dark:border-emerald-500 hover:border-emerald-600';
    }
    if (rate >= 50) {
      return 'bg-emerald-200/90 dark:bg-emerald-800/50 text-emerald-950 dark:text-emerald-100 font-medium border-emerald-300/80 dark:border-emerald-700/60 hover:border-emerald-400';
    }
    if (rate >= 25) {
      return 'bg-emerald-100/80 dark:bg-emerald-900/35 text-emerald-900 dark:text-emerald-200 border-emerald-200/80 dark:border-emerald-800/40 hover:border-emerald-300';
    }
    if (rate > 0) {
      return 'bg-emerald-50/70 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/30 hover:border-emerald-300';
    }

    // 0% or no habits
    return 'bg-white dark:bg-[#0C1E22] text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-[#16383B] hover:border-emerald-400/60';
  };

  const isFullDone = day.status === 'complete' || (day.total_habits > 0 && day.completion_rate >= 100);

  return (
    <button
      type="button"
      onClick={() => onClick && onClick(day)}
      className={`relative h-14 sm:h-18 rounded-xl p-2 sm:p-2.5 flex flex-col justify-between transition-all duration-150 text-left border ${getStatusStyles()} ${
        day.is_today
          ? 'ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-[#0C1E22] z-10'
          : ''
      } hover:scale-[1.02] active:scale-[0.98] focus:outline-none cursor-pointer`}
      title={`${day.date}: ${day.completed_count}/${day.total_habits} habits completed (${day.completion_rate}%)`}
    >
      <div className="flex items-center justify-between w-full">
        <span className="text-xs sm:text-sm font-semibold tracking-tight">{dayNum}</span>
        {day.is_today && (
          <span className="text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-900 dark:text-emerald-200">
            Today
          </span>
        )}
      </div>

      {day.total_habits > 0 && !day.is_future && day.is_current_month && (
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] w-full font-medium mt-1">
          <span className="opacity-90 font-semibold tracking-tight">
            {day.completed_count}/{day.total_habits}
          </span>

          {isFullDone ? (
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          ) : day.completion_rate > 0 ? (
            <span className="text-[10px] font-bold">◐</span>
          ) : day.status === 'missed' ? (
            <span className="text-[10px] font-bold">×</span>
          ) : (
            <span className="text-[10px] font-bold">•</span>
          )}
        </div>
      )}
    </button>
  );
};

