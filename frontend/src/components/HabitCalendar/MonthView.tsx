import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Check, Award, Flame, Calendar as CalendarIcon, TrendingUp } from 'lucide-react';
import type { CalendarDayData } from '../../types';

interface MonthViewProps {
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

export const MonthView: React.FC<MonthViewProps> = ({
  year,
  month,
  calendarData,
  onPrevMonth,
  onNextMonth,
  onToday,
  onSelectDay,
}) => {
  const monthName = MONTH_NAMES[month - 1] || '';
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  const isCurrentMonth = year === currentYear && month === currentMonth;

  // Monthly summary metrics calculation
  const stats = useMemo(() => {
    let completedDays = 0;
    let perfectDays = 0;
    let totalCompleted = 0;
    let totalScheduled = 0;

    const daysInThisMonth = calendarData.filter((d) => d.is_current_month && !d.is_future);

    daysInThisMonth.forEach((d) => {
      if (d.completed_count > 0) completedDays++;
      if (d.total_habits > 0 && d.completion_rate >= 100) perfectDays++;
      totalCompleted += d.completed_count;
      totalScheduled += d.total_habits;
    });

    const avgCompliance = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;

    return {
      completedDays,
      perfectDays,
      totalCompleted,
      avgCompliance,
      trackedDays: daysInThisMonth.length,
    };
  }, [calendarData]);

  const getDayStyles = (day: CalendarDayData) => {
    if (!day.is_current_month) {
      return 'opacity-20 bg-transparent text-slate-300 dark:text-slate-600 border-transparent cursor-default pointer-events-none';
    }
    if (day.is_future) {
      return 'bg-slate-50/50 dark:bg-[#141619]/50 text-slate-400 dark:text-slate-500 border-slate-200/60 dark:border-[#202327] hover:border-slate-300 dark:hover:border-[#2D3138]';
    }

    const rate = day.completion_rate;

    if (day.status === 'missed' && day.total_habits > 0 && day.completed_count === 0) {
      return 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/40 hover:border-rose-400 dark:hover:border-rose-600';
    }

    if (rate >= 100) {
      return 'bg-emerald-500 dark:bg-gradient-to-b dark:from-[#32CD60] dark:to-[#25A24B] text-white dark:text-black font-extrabold border-emerald-600 dark:border-[#38E079] shadow-xs dark:shadow-[0_0_12px_rgba(50,205,96,0.35)] hover:shadow-md dark:hover:shadow-[0_0_20px_rgba(50,205,96,0.65)] hover:scale-[1.03]';
    }
    if (rate >= 75) {
      return 'bg-emerald-600 dark:bg-[#207D48] text-white font-bold border-emerald-700 dark:border-[#279B59] hover:scale-[1.03]';
    }
    if (rate >= 50) {
      return 'bg-emerald-700 dark:bg-[#185E36] text-white font-medium border-emerald-800 dark:border-[#1E7443] hover:scale-[1.03]';
    }
    if (rate >= 25) {
      return 'bg-emerald-800 dark:bg-[#13492A] text-emerald-100 dark:text-slate-100 font-medium border-emerald-900 dark:border-[#165632] hover:scale-[1.03]';
    }
    if (rate > 0) {
      return 'bg-emerald-900 dark:bg-[#0F351E] text-emerald-200 dark:text-slate-200 border-emerald-950 dark:border-[#144427]';
    }

    // 0% / pending
    return 'bg-slate-50 dark:bg-[#181A1D] text-slate-700 dark:text-slate-400 border-slate-200 dark:border-[#25282F] hover:border-emerald-500/50 dark:hover:border-[#35C86B]/50 hover:bg-slate-100 dark:hover:bg-[#1D2024]';
  };

  return (
    <div className="bg-white dark:bg-[#151719] border border-slate-200 dark:border-[#23272D] rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs dark:shadow-sm transition-colors">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#1D2024] border border-emerald-100 dark:border-[#282B32] flex items-center justify-center text-emerald-600 dark:text-[#35C86B]">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
              {monthName} {year}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Interactive monthly compliance matrix • Tap any day to inspect details
            </p>
          </div>
        </div>

        {/* Navigation & Today Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!isCurrentMonth && (
            <button
              type="button"
              onClick={onToday}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-[#35C86B] bg-emerald-50 dark:bg-[#35C86B]/10 hover:bg-emerald-100 dark:hover:bg-[#35C86B]/20 rounded-lg border border-emerald-200 dark:border-[#35C86B]/30 transition-colors cursor-pointer"
            >
              Current Month
            </button>
          )}

          <div className="flex items-center bg-slate-100 dark:bg-[#1D2024] rounded-lg p-0.5 border border-slate-200 dark:border-[#282B32]">
            <button
              type="button"
              onClick={onPrevMonth}
              className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-md transition-colors cursor-pointer"
              title="Previous Month"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onNextMonth}
              className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-md transition-colors cursor-pointer"
              title="Next Month"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Monthly KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 dark:bg-[#191B1F] border border-slate-200 dark:border-[#262A31] rounded-xl p-3 flex items-center gap-3 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-[#35C86B] flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">Monthly Rate</div>
            <div className="text-base font-bold text-slate-900 dark:text-white">{stats.avgCompliance}%</div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-[#191B1F] border border-slate-200 dark:border-[#262A31] rounded-xl p-3 flex items-center gap-3 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">Total Check-ins</div>
            <div className="text-base font-bold text-slate-900 dark:text-white">{stats.totalCompleted}</div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-[#191B1F] border border-slate-200 dark:border-[#262A31] rounded-xl p-3 flex items-center gap-3 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">Active Days</div>
            <div className="text-base font-bold text-slate-900 dark:text-white">{stats.completedDays}d</div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-[#191B1F] border border-slate-200 dark:border-[#262A31] rounded-xl p-3 flex items-center gap-3 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">Perfect Days</div>
            <div className="text-base font-bold text-slate-900 dark:text-white">{stats.perfectDays}d</div>
          </div>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-200 dark:border-[#23272D]">
        {WEEKDAYS.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* 7-Column Days Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
        {calendarData.map((dayData, idx) => {
          const dateObj = new Date(dayData.date + 'T00:00:00');
          const dayNum = dateObj.getDate();
          const isFullDone = dayData.status === 'complete' || (dayData.total_habits > 0 && dayData.completion_rate >= 100);

          return (
            <button
              key={idx}
              type="button"
              disabled={!dayData.is_current_month}
              onClick={() => onSelectDay && dayData.is_current_month && onSelectDay(dayData)}
              className={`relative h-15 sm:h-20 rounded-xl p-2 sm:p-2.5 flex flex-col justify-between transition-all duration-200 text-left border ${getDayStyles(
                dayData
              )} ${
                dayData.is_today
                  ? 'ring-2 ring-emerald-500 dark:ring-[#35C86B] ring-offset-2 ring-offset-white dark:ring-offset-[#151719] shadow-md dark:shadow-[0_0_14px_rgba(53,200,107,0.6)] z-10'
                  : ''
              } ${
                dayData.is_current_month ? 'cursor-pointer' : ''
              } focus:outline-none`}
              title={`${dayData.date}: ${dayData.completed_count}/${dayData.total_habits} habits completed (${dayData.completion_rate}%)`}
              aria-label={`${dayData.date}: ${dayData.completed_count} of ${dayData.total_habits} habits completed`}
            >
              {/* Day Number and Today Indicator */}
              <div className="flex items-center justify-between w-full">
                <span className="text-xs sm:text-sm font-bold tracking-tight">{dayNum}</span>
                {dayData.is_today && (
                  <span className="text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-[#35C86B]/20 text-emerald-800 dark:text-[#35C86B] border border-emerald-300 dark:border-[#35C86B]/40">
                    Today
                  </span>
                )}
              </div>

              {/* Progress & Check Indicator */}
              {dayData.total_habits > 0 && !dayData.is_future && dayData.is_current_month && (
                <div className="w-full space-y-1 mt-auto">
                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] w-full font-medium">
                    <span className="opacity-95 font-bold tracking-tight">
                      {dayData.completed_count}/{dayData.total_habits}
                    </span>

                    {isFullDone ? (
                      <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                    ) : dayData.completion_rate > 0 ? (
                      <span className="text-[10px] font-bold">◐</span>
                    ) : dayData.status === 'missed' ? (
                      <span className="text-[10px] font-bold">×</span>
                    ) : (
                      <span className="text-[10px] font-bold">•</span>
                    )}
                  </div>

                  {/* Micro Progress Bar */}
                  <div className="w-full h-1 bg-black/20 dark:bg-black/40 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isFullDone
                          ? 'bg-white'
                          : dayData.completion_rate > 50
                          ? 'bg-emerald-400 dark:bg-[#35C86B]'
                          : dayData.completion_rate > 0
                          ? 'bg-amber-400'
                          : 'bg-rose-500/40'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, dayData.completion_rate))}%` }}
                    />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Progressive Intensity Legend */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-[#23272D] text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Less</span>
          <div className="flex items-center gap-1">
            <div className="w-3.5 h-3.5 rounded-xs bg-slate-100 dark:bg-[#181A1D] border border-slate-200 dark:border-[#25282F]" title="0%" />
            <div className="w-3.5 h-3.5 rounded-xs bg-emerald-900 dark:bg-[#0F351E] border border-emerald-950 dark:border-[#144427]" title="1-24%" />
            <div className="w-3.5 h-3.5 rounded-xs bg-emerald-800 dark:bg-[#13492A] border border-emerald-900 dark:border-[#165632]" title="25-49%" />
            <div className="w-3.5 h-3.5 rounded-xs bg-emerald-700 dark:bg-[#185E36] border border-emerald-800 dark:border-[#1E7443]" title="50-74%" />
            <div className="w-3.5 h-3.5 rounded-xs bg-emerald-600 dark:bg-[#207D48] border border-emerald-700 dark:border-[#279B59]" title="75-99%" />
            <div className="w-3.5 h-3.5 rounded-xs bg-emerald-500 dark:bg-[#32CD60] border border-emerald-600 dark:border-[#38E079] shadow-xs dark:shadow-[0_0_6px_rgba(50,205,96,0.6)]" title="100%" />
          </div>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">More</span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-[#35C86B]">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>100% Completed</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
            <span className="font-bold">◐</span>
            <span>Partial Day</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-rose-600 dark:text-rose-400">
            <span className="font-bold">×</span>
            <span>Missed</span>
          </div>
        </div>
      </div>
    </div>
  );
};
