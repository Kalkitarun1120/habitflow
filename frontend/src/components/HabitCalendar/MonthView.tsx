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
      return 'opacity-20 bg-transparent text-slate-600 border-transparent cursor-default pointer-events-none';
    }
    if (day.is_future) {
      return 'bg-[#141619]/50 text-slate-500 border-[#202327] hover:border-[#2D3138]';
    }

    const rate = day.completion_rate;

    if (day.status === 'missed' && day.total_habits > 0 && day.completed_count === 0) {
      return 'bg-rose-950/20 text-rose-300 border-rose-900/40 hover:border-rose-600 hover:shadow-[0_0_10px_rgba(244,63,94,0.25)]';
    }

    if (rate >= 100) {
      return 'bg-gradient-to-b from-[#32CD60] to-[#25A24B] text-black font-extrabold border-[#38E079] shadow-[0_0_12px_rgba(50,205,96,0.35)] hover:shadow-[0_0_20px_rgba(50,205,96,0.65)] hover:scale-[1.03]';
    }
    if (rate >= 75) {
      return 'bg-[#207D48] text-white font-bold border-[#279B59] shadow-[0_0_8px_rgba(39,155,89,0.3)] hover:shadow-[0_0_15px_rgba(39,155,89,0.5)] hover:scale-[1.03]';
    }
    if (rate >= 50) {
      return 'bg-[#185E36] text-white font-medium border-[#1E7443] shadow-[0_0_6px_rgba(30,116,67,0.2)] hover:shadow-[0_0_12px_rgba(30,116,67,0.4)] hover:scale-[1.03]';
    }
    if (rate >= 25) {
      return 'bg-[#13492A] text-slate-100 font-medium border-[#165632] hover:border-[#35C86B]/60 hover:shadow-[0_0_8px_rgba(53,200,107,0.3)] hover:scale-[1.03]';
    }
    if (rate > 0) {
      return 'bg-[#0F351E] text-slate-200 border-[#144427] hover:border-[#35C86B]/50 hover:shadow-[0_0_8px_rgba(53,200,107,0.25)]';
    }

    // 0% / pending
    return 'bg-[#181A1D] text-slate-400 border-[#25282F] hover:border-[#35C86B]/50 hover:shadow-[0_0_8px_rgba(53,200,107,0.15)]';
  };

  return (
    <div className="bg-[#151719] border border-[#23272D] rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1D2024] border border-[#282B32] flex items-center justify-center text-[#35C86B]">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">
              {monthName} {year}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
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
              className="px-3 py-1.5 text-xs font-semibold text-[#35C86B] bg-[#35C86B]/10 hover:bg-[#35C86B]/20 rounded-lg border border-[#35C86B]/30 transition-colors cursor-pointer"
            >
              Current Month
            </button>
          )}

          <div className="flex items-center bg-[#1D2024] rounded-lg p-0.5 border border-[#282B32]">
            <button
              type="button"
              onClick={onPrevMonth}
              className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors cursor-pointer"
              title="Previous Month"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onNextMonth}
              className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors cursor-pointer"
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
        <div className="bg-[#191B1F] border border-[#262A31] rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#35C86B]/10 text-[#35C86B] flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-slate-400 truncate">Monthly Rate</div>
            <div className="text-base font-bold text-white">{stats.avgCompliance}%</div>
          </div>
        </div>

        <div className="bg-[#191B1F] border border-[#262A31] rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-slate-400 truncate">Total Check-ins</div>
            <div className="text-base font-bold text-white">{stats.totalCompleted}</div>
          </div>
        </div>

        <div className="bg-[#191B1F] border border-[#262A31] rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-slate-400 truncate">Active Days</div>
            <div className="text-base font-bold text-white">{stats.completedDays}d</div>
          </div>
        </div>

        <div className="bg-[#191B1F] border border-[#262A31] rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-slate-400 truncate">Perfect Days</div>
            <div className="text-base font-bold text-white">{stats.perfectDays}d</div>
          </div>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-[#23272D]">
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
                  ? 'ring-2 ring-[#35C86B] ring-offset-2 ring-offset-[#151719] shadow-[0_0_14px_rgba(53,200,107,0.6)] z-10'
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
                  <span className="text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full bg-[#35C86B]/20 text-[#35C86B] border border-[#35C86B]/40">
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
                  <div className="w-full h-1 bg-black/30 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isFullDone
                          ? 'bg-white'
                          : dayData.completion_rate > 50
                          ? 'bg-[#35C86B]'
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#23272D] text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-400">Less</span>
          <div className="flex items-center gap-1">
            <div className="w-3.5 h-3.5 rounded-xs bg-[#181A1D] border border-[#25282F]" title="0%" />
            <div className="w-3.5 h-3.5 rounded-xs bg-[#0F351E] border border-[#144427]" title="1-24%" />
            <div className="w-3.5 h-3.5 rounded-xs bg-[#13492A] border border-[#165632]" title="25-49%" />
            <div className="w-3.5 h-3.5 rounded-xs bg-[#185E36] border border-[#1E7443]" title="50-74%" />
            <div className="w-3.5 h-3.5 rounded-xs bg-[#207D48] border border-[#279B59]" title="75-99%" />
            <div className="w-3.5 h-3.5 rounded-xs bg-[#32CD60] border border-[#38E079] shadow-[0_0_6px_rgba(50,205,96,0.6)]" title="100%" />
          </div>
          <span className="text-[11px] font-medium text-slate-400">More</span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5 font-medium text-[#35C86B]">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>100% Completed</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-amber-400">
            <span className="font-bold">◐</span>
            <span>Partial Day</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-rose-400">
            <span className="font-bold">×</span>
            <span>Missed</span>
          </div>
        </div>
      </div>
    </div>
  );
};
