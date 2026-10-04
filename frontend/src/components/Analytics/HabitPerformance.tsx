import React, { useState, useMemo } from 'react';
import {
  Flame,
  Award,
  TrendingUp,
  Clock,
  CheckCircle2,
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
import type { HabitPerformanceItem } from '../../types';

interface HabitPerformanceProps {
  items: HabitPerformanceItem[];
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

export const HabitPerformance: React.FC<HabitPerformanceProps> = ({ items }) => {
  const [selectedHabitId, setSelectedHabitId] = useState<number | null>(null);

  // Determine active selected habit (default to first/top habit if none selected)
  const activeHabit = useMemo(() => {
    if (!items || items.length === 0) return null;
    if (selectedHabitId !== null) {
      const found = items.find((h) => h.habit_id === selectedHabitId);
      if (found) return found;
    }
    return items[0];
  }, [items, selectedHabitId]);

  const maxCompletions = useMemo(() => {
    if (!items || items.length === 0) return 1;
    return Math.max(...items.map((h) => h.completions_count), 1);
  }, [items]);

  const formatLastCompleted = (dateStr?: string) => {
    if (!dateStr) return 'No completions yet';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (dateStr === todayStr) return 'Today';
      if (dateStr === yesterdayStr) return 'Yesterday';
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="bg-[#151719] border border-[#23272D] rounded-xl p-8 text-center text-slate-400 text-sm">
        No habit completion logs available in this timeframe.
      </div>
    );
  }

  const ActiveIcon = activeHabit ? ICON_MAP[activeHabit.icon] || Sparkles : Sparkles;

  return (
    <div className="bg-[#151719] border border-[#23272D] rounded-xl p-5 sm:p-6 shadow-sm space-y-5">
      {/* Section Header */}
      <div>
        <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
          Habit Performance
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Compare your habits by completion count • Tap any habit to inspect deep-dive metrics
        </p>
      </div>

      {/* Main Grid: Chart List + Selected Detail Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Interactive Performance Bar List (7 cols) */}
        <div className="lg:col-span-7 space-y-2.5">
          {items.map((habit) => {
            const isSelected = activeHabit?.habit_id === habit.habit_id;
            const pct = Math.max(Math.round((habit.completions_count / maxCompletions) * 100), 4);
            const Icon = ICON_MAP[habit.icon] || Sparkles;

            return (
              <button
                key={habit.habit_id}
                type="button"
                onClick={() => setSelectedHabitId(habit.habit_id)}
                className={`w-full text-left p-3 rounded-xl border transition-all duration-150 flex flex-col gap-2 ${
                  isSelected
                    ? 'bg-[#1B1D20] border-[#35C86B] ring-1 ring-[#35C86B]/40 shadow-sm'
                    : 'bg-[#181A1D]/60 border-[#23272D] hover:border-slate-600 hover:bg-[#1B1D20]'
                }`}
                aria-label={`Select ${habit.name} with ${habit.completions_count} completions`}
              >
                {/* Row Header */}
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${habit.color}20`, color: habit.color }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-white truncate">
                      {habit.name}
                    </span>
                    <span className="text-[10px] uppercase px-1.5 py-0.2 rounded-full bg-[#151719] text-slate-400 border border-[#23272D]">
                      {habit.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-slate-400 font-semibold text-[11px]">
                      {habit.completion_rate}%
                    </span>
                    <span className="font-extrabold text-[#35C86B] text-xs">
                      {habit.completions_count} {habit.completions_count === 1 ? 'check-in' : 'check-ins'}
                    </span>
                  </div>
                </div>

                {/* Progress Visual Bar */}
                <div className="w-full h-2.5 bg-[#121416] rounded-full overflow-hidden border border-[#23272D]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: isSelected ? '#35C86B' : habit.color || '#35C86B',
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Selected Habit Deep-Dive Detail Card (5 cols) */}
        {activeHabit && (
          <div className="lg:col-span-5 bg-[#1B1D20] border border-[#2A2E35] rounded-xl p-5 space-y-4 shadow-sm animate-fadeIn">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-[#23272D] pb-3.5">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                style={{ backgroundColor: `${activeHabit.color}25`, color: activeHabit.color }}
              >
                <ActiveIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white truncate">
                  {activeHabit.name}
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                  {activeHabit.category}
                </span>
              </div>
            </div>

            {/* Total Completions Highlight */}
            <div className="bg-[#151719] border border-[#23272D] rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Completions
                </span>
                <span className="text-2xl font-black text-[#35C86B]">
                  {activeHabit.completions_count}
                </span>
              </div>
              <CheckCircle2 className="w-8 h-8 text-[#35C86B]/20" />
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="bg-[#151719] border border-[#23272D] rounded-lg p-3 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-[#35C86B]" /> Rate
                </span>
                <span className="text-base font-bold text-white block">
                  {activeHabit.completion_rate}%
                </span>
              </div>

              <div className="bg-[#151719] border border-[#23272D] rounded-lg p-3 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-500" /> Current Streak
                </span>
                <span className="text-base font-bold text-white block">
                  {activeHabit.current_streak} {activeHabit.current_streak === 1 ? 'day' : 'days'}
                </span>
              </div>

              <div className="bg-[#151719] border border-[#23272D] rounded-lg p-3 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Award className="w-3 h-3 text-indigo-400" /> Best Streak
                </span>
                <span className="text-base font-bold text-white block">
                  {activeHabit.longest_streak} {activeHabit.longest_streak === 1 ? 'day' : 'days'}
                </span>
              </div>

              <div className="bg-[#151719] border border-[#23272D] rounded-lg p-3 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" /> Last Done
                </span>
                <span className="text-xs font-bold text-slate-200 block truncate">
                  {formatLastCompleted(activeHabit.last_completed)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
