import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Flame,
  Activity,
  BookOpen,
  Droplet,
  Code,
  Smile,
  Sparkles,
  Heart,
  Brain,
  Briefcase,
  Zap,
  Target
} from 'lucide-react';
import type { HabitWeekStatus, HabitWeekDayStatus } from '../../types';

interface WeekViewProps {
  habits: HabitWeekStatus[];
  startDate: string;
  endDate: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onToggleCompleteToday: (habitId: number, currentCompleted: boolean) => Promise<void> | void;
  onSelectDay?: (habitId: number, day: HabitWeekDayStatus) => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  activity: Activity,
  'book-open': BookOpen,
  droplet: Droplet,
  code: Code,
  smile: Smile,
  sparkles: Sparkles,
  heart: Heart,
  brain: Brain,
  briefcase: Briefcase,
  zap: Zap,
  target: Target,
};

export const WeekView: React.FC<WeekViewProps> = ({
  habits,
  startDate,
  endDate,
  onPrevWeek,
  onNextWeek,
  onToday,
  onToggleCompleteToday,
  onSelectDay,
}) => {
  const [togglingHabitId, setTogglingHabitId] = useState<number | null>(null);

  const formatWeekRange = (start: string, end: string) => {
    if (!start || !end) return '';
    try {
      const s = new Date(start + 'T00:00:00');
      const e = new Date(end + 'T00:00:00');
      const sMonth = s.toLocaleDateString('en-US', { month: 'short' });
      const eMonth = e.toLocaleDateString('en-US', { month: 'short' });
      const sDay = s.getDate();
      const eDay = e.getDate();
      const year = e.getFullYear();

      if (sMonth === eMonth) {
        return `${sMonth} ${sDay} – ${eDay}, ${year}`;
      }
      return `${sMonth} ${sDay} – ${eMonth} ${eDay}, ${year}`;
    } catch {
      return `${start} – ${end}`;
    }
  };

  const handleTodayClick = async (e: React.MouseEvent, habit: HabitWeekStatus) => {
    e.stopPropagation();
    if (togglingHabitId === habit.habit_id) return;
    setTogglingHabitId(habit.habit_id);
    try {
      await onToggleCompleteToday(habit.habit_id, habit.completed_today);
    } finally {
      setTogglingHabitId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Week Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#151719] border border-[#23272D] rounded-xl p-3.5 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white tracking-tight">
            {formatWeekRange(startDate, endDate)}
          </span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={onToday}
            className="px-3 py-1.5 text-xs font-semibold text-[#35C86B] bg-[#35C86B]/10 hover:bg-[#35C86B]/20 rounded-lg border border-[#35C86B]/30 transition-colors"
          >
            Today
          </button>
          <div className="flex items-center bg-[#1B1D20] rounded-lg p-0.5 border border-[#2A2E35]">
            <button
              type="button"
              onClick={onPrevWeek}
              className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors"
              title="Previous Week"
              aria-label="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onNextWeek}
              className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors"
              title="Next Week"
              aria-label="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Habits Week Cards List */}
      {habits.length === 0 ? (
        <div className="bg-[#151719] border border-[#23272D] rounded-xl p-8 text-center text-slate-400 text-sm">
          No active habits found. Create a habit to begin tracking your weekly consistency.
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map((habit) => {
            const Icon = ICON_MAP[habit.icon] || Sparkles;
            return (
              <div
                key={habit.habit_id}
                className="bg-[#151719] border border-[#23272D] rounded-xl p-4 sm:p-5 transition-all hover:border-[#2E333B] shadow-sm space-y-3.5"
              >
                {/* Top Row: Habit Identity & Stats */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${habit.color}20`, color: habit.color }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white truncate">
                          {habit.name}
                        </h3>
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-[#1B1D20] text-slate-400 border border-[#2A2E35]">
                          {habit.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1 font-medium">
                          <Flame className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-slate-300 font-semibold">{habit.current_streak}d</span> streak
                        </span>
                        <span className="text-slate-600">•</span>
                        <span>
                          <span className="text-slate-300 font-semibold">{habit.completion_rate}%</span> rate
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Today Action Button */}
                  <button
                    type="button"
                    onClick={(e) => handleTodayClick(e, habit)}
                    disabled={togglingHabitId === habit.habit_id}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                      habit.completed_today
                        ? 'bg-gradient-to-r from-[#38E079] to-[#2DBA60] text-black shadow-[0_0_14px_rgba(53,200,107,0.45)] hover:shadow-[0_0_20px_rgba(53,200,107,0.65)] hover:scale-105'
                        : 'bg-[#1B1D20] text-slate-300 hover:text-white border border-[#2A2E35] hover:border-[#35C86B]/60 hover:shadow-[0_0_10px_rgba(53,200,107,0.2)]'
                    }`}
                    aria-label={`Mark ${habit.name} as ${habit.completed_today ? 'incomplete' : 'completed'} today`}
                  >
                    <span>Today</span>
                    <Check className={`w-3.5 h-3.5 ${habit.completed_today ? 'stroke-[3]' : 'text-slate-500'}`} />
                  </button>
                </div>

                {/* 7-Day Matrix Row */}
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {habit.days.map((day) => {
                    const isDone = day.completed;
                    const isSkipped = day.skipped;
                    const isToday = day.is_today;
                    const isFuture = day.is_future;

                    return (
                      <button
                        key={day.date}
                        type="button"
                        onClick={() => onSelectDay && onSelectDay(habit.habit_id, day)}
                        className={`group relative flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 border ${
                          isDone
                            ? 'bg-gradient-to-b from-[#38E079] to-[#28AC56] text-black font-extrabold border-[#38E079] shadow-[0_0_12px_rgba(53,200,107,0.45)] hover:shadow-[0_0_18px_rgba(53,200,107,0.7)] hover:scale-105'
                            : isSkipped
                            ? 'bg-amber-950/30 text-amber-300 border-amber-800/40'
                            : isFuture
                            ? 'bg-[#121416]/50 text-slate-600 border-[#1B1D20]'
                            : 'bg-[#1B1D20] text-slate-400 border-[#2A2E35] hover:border-[#35C86B]/50 hover:shadow-[0_0_8px_rgba(53,200,107,0.2)]'
                        } ${
                          isToday
                            ? 'ring-2 ring-[#35C86B] ring-offset-2 ring-offset-[#151719] shadow-[0_0_12px_rgba(53,200,107,0.5)]'
                            : ''
                        }`}
                        title={`${habit.name} on ${day.date}: ${isDone ? 'Completed ✓' : isSkipped ? 'Skipped' : isFuture ? 'Upcoming' : 'Not completed'}`}
                        aria-label={`${habit.name} ${day.day_name} ${day.day_number}: ${isDone ? 'Completed' : 'Not completed'}`}
                      >
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isDone ? 'text-black/80' : 'text-slate-400'}`}>
                          {day.day_name}
                        </span>
                        <span className={`text-xs mt-0.5 ${isDone ? 'font-black text-black' : 'font-medium'}`}>
                          {day.day_number}
                        </span>
                        <div className="mt-1 h-3 flex items-center justify-center">
                          {isDone ? (
                            <Check className="w-3 h-3 stroke-[3]" />
                          ) : isSkipped ? (
                            <span className="text-[9px] font-bold text-amber-400">↷</span>
                          ) : isFuture ? (
                            <span className="text-[10px] text-slate-600">·</span>
                          ) : (
                            <span className="text-[10px] text-slate-500">□</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
