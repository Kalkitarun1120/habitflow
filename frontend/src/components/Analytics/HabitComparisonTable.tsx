import React, { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  Flame,
  Award,
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

interface HabitComparisonTableProps {
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

type SortField = 'name' | 'completions' | 'rate' | 'current_streak' | 'longest_streak';

export const HabitComparisonTable: React.FC<HabitComparisonTableProps> = ({ items }) => {
  const [sortField, setSortField] = useState<SortField>('completions');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // Default descending for metrics
    }
  };

  const sortedItems = useMemo(() => {
    if (!items) return [];
    return [...items].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'completions') {
        comparison = a.completions_count - b.completions_count;
      } else if (sortField === 'rate') {
        comparison = a.completion_rate - b.completion_rate;
      } else if (sortField === 'current_streak') {
        comparison = a.current_streak - b.current_streak;
      } else if (sortField === 'longest_streak') {
        comparison = a.longest_streak - b.longest_streak;
      }
      return sortAsc ? comparison : -comparison;
    });
  }, [items, sortField, sortAsc]);

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#151719] border border-[#23272D] rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Habit Comparison
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cross-habit breakdown across completion counts, success rates, and streak momentum
          </p>
        </div>

        <div className="text-xs text-slate-400">
          Showing <span className="font-bold text-white">{sortedItems.length}</span> habits
        </div>
      </div>

      {/* Desktop Table (Hidden on small mobile) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#23272D] text-slate-400 font-bold uppercase tracking-wider">
              <th
                onClick={() => handleSort('name')}
                className="pb-3 pr-4 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Habit</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('completions')}
                className="pb-3 px-4 cursor-pointer hover:text-white transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Completions</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('rate')}
                className="pb-3 px-4 cursor-pointer hover:text-white transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Rate</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('current_streak')}
                className="pb-3 px-4 cursor-pointer hover:text-white transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Current Streak</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('longest_streak')}
                className="pb-3 pl-4 cursor-pointer hover:text-white transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Best Streak</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#23272D]/60 font-medium">
            {sortedItems.map((habit) => {
              const Icon = ICON_MAP[habit.icon] || Sparkles;
              return (
                <tr key={habit.habit_id} className="hover:bg-[#1B1D20]/50 transition-colors">
                  {/* Habit identity */}
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${habit.color}20`, color: habit.color }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-white block truncate">
                          {habit.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {habit.category}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Completions */}
                  <td className="py-3 px-4 text-right">
                    <span className="font-bold text-white">
                      {habit.completions_count}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      of {habit.total_scheduled}
                    </span>
                  </td>

                  {/* Rate */}
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`inline-block font-extrabold ${
                        habit.completion_rate >= 80
                          ? 'text-[#35C86B]'
                          : habit.completion_rate >= 50
                          ? 'text-amber-400'
                          : 'text-slate-300'
                      }`}
                    >
                      {habit.completion_rate}%
                    </span>
                  </td>

                  {/* Current Streak */}
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-1 font-bold text-slate-200">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      <span>{habit.current_streak}d</span>
                    </div>
                  </td>

                  {/* Best Streak */}
                  <td className="py-3 pl-4 text-right">
                    <div className="inline-flex items-center gap-1 font-bold text-indigo-300">
                      <Award className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{habit.longest_streak}d</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Responsive Cards (Visible only on mobile) */}
      <div className="sm:hidden space-y-2.5">
        {/* Mobile Sort Selector */}
        <div className="flex items-center justify-between bg-[#1B1D20] p-2 rounded-lg text-xs">
          <span className="text-slate-400 font-medium">Sort by:</span>
          <div className="flex items-center gap-1">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="bg-[#151719] border border-[#23272D] rounded-md px-2 py-1 text-slate-200 font-semibold focus:outline-none"
            >
              <option value="completions">Completions</option>
              <option value="rate">Completion Rate</option>
              <option value="current_streak">Current Streak</option>
              <option value="longest_streak">Best Streak</option>
              <option value="name">Name</option>
            </select>
            <button
              type="button"
              onClick={() => setSortAsc(!sortAsc)}
              className="p-1 text-slate-300 bg-[#151719] rounded-md border border-[#23272D]"
              title="Toggle sort direction"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {sortedItems.map((habit) => {
          const Icon = ICON_MAP[habit.icon] || Sparkles;
          return (
            <div
              key={habit.habit_id}
              className="bg-[#1B1D20] border border-[#2A2E35] rounded-xl p-3.5 space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${habit.color}20`, color: habit.color }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-xs truncate">
                      {habit.name}
                    </h3>
                    <span className="text-[10px] text-slate-400">
                      {habit.category}
                    </span>
                  </div>
                </div>

                <span className="text-xs font-black text-[#35C86B]">
                  {habit.completions_count} check-ins
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#23272D] text-center text-xs">
                <div className="bg-[#151719] p-1.5 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-semibold">Rate</span>
                  <span className="font-extrabold text-white">{habit.completion_rate}%</span>
                </div>
                <div className="bg-[#151719] p-1.5 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-semibold">Streak</span>
                  <span className="font-extrabold text-amber-400">{habit.current_streak}d</span>
                </div>
                <div className="bg-[#151719] p-1.5 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-semibold">Best</span>
                  <span className="font-extrabold text-indigo-300">{habit.longest_streak}d</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
