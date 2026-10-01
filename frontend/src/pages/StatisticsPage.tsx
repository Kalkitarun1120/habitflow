import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart3,
  Award,
  Flame,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';
import type { StatisticsResponse } from '../types';
import { statisticsService } from '../services/api';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useToast } from '../components/Toast';
import { useTheme } from '../context/ThemeContext';

export const StatisticsPage: React.FC = () => {
  const { addToast } = useToast();
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [range, setRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [stats, setStats] = useState<StatisticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await statisticsService.getStats(range);
      setStats(data);
    } catch {
      addToast('error', 'Error Loading Analytics', 'Could not fetch data-backed metrics.');
    } finally {
      setIsLoading(false);
    }
  }, [range, addToast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const weeklyReport = stats?.weekly_report;
  const habitsAtRisk = stats?.habits_at_risk || [];
  const dayOfWeekStats = stats?.day_of_week || [];

  return (
    <div className="space-y-6 p-4 sm:p-8 max-w-6xl mx-auto pb-24 md:pb-12 animate-fadeIn">
      {/* Header & Timeframe Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Analytics & Insights</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Behavioral patterns, completion trends, and consistency metrics calculated from your real logs.
          </p>
        </div>

        {/* Range Filter Buttons */}
        <div className="inline-flex rounded-xl bg-white dark:bg-[#0C1E22] p-1 border border-slate-200/90 dark:border-[#16383B] self-start sm:self-auto shadow-sm">
          {[
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: '90d', label: '90 Days' },
            { id: 'all', label: 'All Time' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setRange(item.id as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                range === item.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <LoadingSkeleton type="stats" />
          <LoadingSkeleton type="card" />
        </div>
      ) : (
        <>
          {/* Overview Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-white dark:bg-[#0C1E22] border border-slate-200/90 dark:border-[#16383B]">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Total Completed
              </span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {stats?.total_completions || 0}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Logged sessions
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#0C1E22] border border-slate-200/90 dark:border-[#16383B]">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" /> Current Streak
              </span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {stats?.current_streak || 0} {stats?.current_streak === 1 ? 'Day' : 'Days'}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Active momentum
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#0C1E22] border border-slate-200/90 dark:border-[#16383B]">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-indigo-500" /> Longest Streak
              </span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {stats?.longest_streak || 0} Days
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Personal record
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#0C1E22] border border-slate-200/90 dark:border-[#16383B]">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Success Rate
              </span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {stats?.completion_rate || 0}%
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Schedule compliance
              </span>
            </div>
          </div>

          {/* Weekly Report Card (Section 34) */}
          {weeklyReport && (
            <div className="bg-white dark:bg-[#0C1E22] rounded-xl p-5 border border-slate-200/90 dark:border-[#16383B] space-y-3 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Weekly Summary
                  </span>
                  <span className="text-xs text-slate-400">• {weeklyReport.period_label}</span>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold">
                  <span>Completion: <strong>{weeklyReport.completion_rate}%</strong></span>
                  {weeklyReport.rate_change >= 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center text-[11px] font-bold">
                      <ArrowUpRight className="w-3.5 h-3.5" /> +{weeklyReport.rate_change}%
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400 flex items-center text-[11px] font-bold">
                      <ArrowDownRight className="w-3.5 h-3.5" /> {weeklyReport.rate_change}%
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400 font-normal">vs prev week ({weeklyReport.prev_completion_rate}%)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                {weeklyReport.best_habit && (
                  <div className="p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 block">
                      Strongest Habit
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {weeklyReport.best_habit}
                    </span>
                  </div>
                )}

                {weeklyReport.best_day && (
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#07191C] border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                      Peak Consistency Day
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {weeklyReport.best_day}
                    </span>
                  </div>
                )}

                {weeklyReport.needs_attention_habit && (
                  <div className="p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                    <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300 block">
                      Needs Attention
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {weeklyReport.needs_attention_habit}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Habit Risk / Needs Attention Section (Section 15) */}
          {habitsAtRisk.length > 0 && (
            <div className="p-4 rounded-xl border border-amber-300/80 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4" />
                <span>Habit Attention Alerts (Data-Driven Risk)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {habitsAtRisk.map((item) => (
                  <div
                    key={item.habit_id}
                    className="p-3 rounded-lg bg-white dark:bg-[#0C1E22] border border-amber-200 dark:border-amber-900/50 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {item.habit_name}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {item.message}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                      Risk: {item.risk_level}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Completion Volume Bar Chart */}
            <div className="bg-white dark:bg-[#0C1E22] p-5 rounded-xl border border-slate-200/90 dark:border-[#16383B] space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Recent Completions by Day
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Total habits completed on each day
                </p>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.weekly_chart || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={isDark ? 0.15 : 0.4} stroke={isDark ? '#64748B' : '#CBD5E1'} />
                    <XAxis dataKey="day_name" stroke={isDark ? '#94A3B8' : '#64748B'} fontSize={11} tickLine={false} />
                    <YAxis stroke={isDark ? '#94A3B8' : '#64748B'} fontSize={11} allowDecimals={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#0D2328' : '#FFFFFF',
                        borderColor: isDark ? '#16383B' : '#E2E8F0',
                        borderRadius: '12px',
                        color: isDark ? '#F8FAFC' : '#0F172A',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="completed_count" fill="#10B981" radius={[4, 4, 0, 0]} name="Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Trend Line Chart */}
            <div className="bg-white dark:bg-[#0C1E22] p-5 rounded-xl border border-slate-200/90 dark:border-[#16383B] space-y-3 shadow-xs">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Consistency Trend Rate (%)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Completion percentage across historical intervals
                </p>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats?.monthly_chart || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={isDark ? 0.15 : 0.4} stroke={isDark ? '#64748B' : '#CBD5E1'} />
                    <XAxis dataKey="label" stroke={isDark ? '#94A3B8' : '#64748B'} fontSize={10} tickLine={false} />
                    <YAxis stroke={isDark ? '#94A3B8' : '#64748B'} fontSize={11} domain={[0, 100]} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#0D2328' : '#FFFFFF',
                        borderColor: isDark ? '#16383B' : '#E2E8F0',
                        borderRadius: '12px',
                        color: isDark ? '#F8FAFC' : '#0F172A',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                        fontSize: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="#10B981"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#10B981' }}
                      name="Rate %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Day-of-Week Consistency Matrix */}
          {dayOfWeekStats.length > 0 && (
            <div className="bg-white dark:bg-[#0C1E22] rounded-xl p-5 border border-slate-200/90 dark:border-[#16383B] space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Day-of-Week Performance
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {dayOfWeekStats.map((d) => (
                  <div
                    key={d.day_name}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800 text-center"
                  >
                    <span className="text-[11px] uppercase font-semibold text-slate-500 block">
                      {d.day_name.slice(0, 3)}
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
                      {d.rate}%
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {d.completed_count}/{d.scheduled_count} done
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Breakdown */}
          <div className="bg-white dark:bg-[#0C1E22] rounded-xl p-5 border border-slate-200/90 dark:border-[#16383B] space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Category Performance Breakdown
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(stats?.category_performance || []).map((cat, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900 dark:text-white">
                      {cat.category}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {cat.habit_count} Habits
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${cat.completion_rate}%` }}
                    />
                  </div>
                  <div className="text-right text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    {cat.completion_rate}% Success Rate
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

