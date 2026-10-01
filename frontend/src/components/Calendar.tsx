import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import type { CalendarDayData } from '../types';
import { CalendarDay } from './CalendarDay';

interface CalendarProps {
  year: number;
  month: number;
  calendarData: CalendarDayData[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onSelectDay?: (day: CalendarDayData) => void;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const Calendar: React.FC<CalendarProps> = ({
  year,
  month,
  calendarData,
  onPrevMonth,
  onNextMonth,
  onToday,
  onSelectDay,
}) => {
  const monthName = MONTH_NAMES[month - 1] || '';

  return (
    <div className="bg-white dark:bg-[#0C1E22] rounded-xl p-5 sm:p-7 space-y-5 border border-slate-200/90 dark:border-[#16383B] shadow-sm">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CalendarIcon className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {monthName} {year}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click any day to view detailed habit breakdown
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToday}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 rounded-lg border border-emerald-200/60 dark:border-emerald-800/40 transition-colors"
          >
            Today
          </button>
          <div className="flex items-center bg-slate-100 dark:bg-[#07191C] rounded-lg p-0.5 border border-slate-200 dark:border-slate-800">
            <button
              onClick={onPrevMonth}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-md transition-colors"
              title="Previous Month"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onNextMonth}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-md transition-colors"
              title="Next Month"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
        {WEEKDAYS.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
        {calendarData.map((dayData, idx) => (
          <CalendarDay key={idx} day={dayData} onClick={onSelectDay} />
        ))}
      </div>

      {/* Progressive Emerald Intensity Legend */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-400">Less</span>
          <div className="flex items-center gap-1">
            <div className="w-3.5 h-3.5 rounded-sm bg-white dark:bg-[#0C1E22] border border-slate-200 dark:border-[#16383B]" title="0%" />
            <div className="w-3.5 h-3.5 rounded-sm bg-emerald-100/90 dark:bg-emerald-950/40 border border-emerald-200/60" title="1-24%" />
            <div className="w-3.5 h-3.5 rounded-sm bg-emerald-200/90 dark:bg-emerald-900/50 border border-emerald-300/60" title="25-49%" />
            <div className="w-3.5 h-3.5 rounded-sm bg-emerald-300 dark:bg-emerald-800/60 border border-emerald-400/60" title="50-74%" />
            <div className="w-3.5 h-3.5 rounded-sm bg-emerald-400 dark:bg-emerald-600 border border-emerald-500/60" title="75-99%" />
            <div className="w-3.5 h-3.5 rounded-sm bg-emerald-600 dark:bg-emerald-500 border border-emerald-700 dark:border-emerald-400" title="100%" />
          </div>
          <span className="text-[11px] font-medium text-slate-400">More</span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
            <span className="font-bold">✓</span>
            <span>100% Completed</span>
          </div>
          <div className="flex items-center gap-1 font-medium text-amber-700 dark:text-amber-400">
            <span className="font-bold">◐</span>
            <span>Partial</span>
          </div>
          <div className="flex items-center gap-1 font-medium text-rose-700 dark:text-rose-400">
            <span className="font-bold">×</span>
            <span>Missed</span>
          </div>
        </div>
      </div>
    </div>
  );
};

