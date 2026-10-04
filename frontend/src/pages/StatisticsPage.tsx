import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart3,
  Calendar,
  PieChart as PieIcon
} from 'lucide-react';
import type { StatisticsResponse } from '../types';
import { statisticsService } from '../services/api';
import { AnalyticsSummary } from '../components/Analytics/AnalyticsSummary';
import { HabitPerformance } from '../components/Analytics/HabitPerformance';
import { PerformanceChart } from '../components/Analytics/PerformanceChart';
import { HabitComparisonTable } from '../components/Analytics/HabitComparisonTable';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useToast } from '../components/Toast';

export const StatisticsPage: React.FC = () => {
  const { addToast } = useToast();
  const [range, setRange] = useState<'7d' | '30d' | 'all'>('30d');
  const [stats, setStats] = useState<StatisticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await statisticsService.getStats(range);
      setStats(data);
    } catch {
      addToast('error', 'Error Loading Analytics', 'Could not sync real database statistics.');
    } finally {
      setIsLoading(false);
    }
  }, [range, addToast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const habitPerformanceItems = stats?.habit_performance || [];
  const weeklyChartData = stats?.weekly_chart || [];
  const categoryPerformance = stats?.category_performance || [];
  const dayOfWeekStats = stats?.day_of_week_performance || stats?.day_of_week || [];

  return (
    <div className="space-y-6 p-4 sm:p-8 max-w-6xl mx-auto pb-24 md:pb-12 animate-fadeIn">
      {/* Analytics Header & Timeframe Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#35C86B]" />
            <span>Statistics</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Behavioral patterns, completion trends, and consistency metrics calculated from your real logs.
          </p>
        </div>

        {/* Range Filter Buttons */}
        <div className="inline-flex rounded-xl bg-[#151719] p-1 border border-[#23272D] self-start sm:self-auto shadow-sm">
          {[
            { id: '7d', label: '7D' },
            { id: '30d', label: '30D' },
            { id: 'all', label: 'All' },
          ].map((item) => {
            const isSelected = range === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setRange(item.id as any)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  isSelected
                    ? 'bg-white text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                aria-pressed={isSelected}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <LoadingSkeleton type="stats" />
          <LoadingSkeleton type="card" />
        </div>
      ) : (
        <>
          {/* Summary Metric Cards */}
          <AnalyticsSummary stats={stats} />

          {/* Habit Performance Chart & Interactive Deep Dive */}
          <HabitPerformance items={habitPerformanceItems} />

          {/* Smooth Curved Trajectory & Rounded Volume Chart */}
          <PerformanceChart data={weeklyChartData} />

          {/* Habit Comparison Breakdown Table / Cards */}
          <HabitComparisonTable items={habitPerformanceItems} />

          {/* Additional Behavioral Insights (Categories & Day-of-week consistency) */}
          {(categoryPerformance.length > 0 || dayOfWeekStats.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category Breakdown */}
              {categoryPerformance.length > 0 && (
                <div className="bg-[#151719] border border-[#23272D] rounded-2xl p-5 space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                      <PieIcon className="w-4 h-4 text-[#35C86B]" />
                      <span>Category Distribution</span>
                    </h3>
                  </div>

                  <div className="space-y-2.5">
                    {categoryPerformance.map((cat, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-300">
                            {cat.category}
                          </span>
                          <span className="text-slate-400 font-bold">
                            {cat.completion_rate}% ({cat.habit_count} {cat.habit_count === 1 ? 'habit' : 'habits'})
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-[#121416] rounded-full overflow-hidden border border-[#23272D]">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.max(cat.completion_rate, 4)}%`,
                              backgroundColor: cat.color || '#35C86B',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Day of Week Consistency */}
              {dayOfWeekStats.length > 0 && (
                <div className="bg-[#151719] border border-[#23272D] rounded-2xl p-5 space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-500" />
                      <span>Day-of-Week Consistency</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5 text-center">
                    {dayOfWeekStats.map((dow, idx) => {
                      const rate = dow.rate ?? (dow as any).completion_rate ?? 0;
                      return (
                        <div
                          key={idx}
                          className="bg-[#1B1D20] border border-[#2A2E35] rounded-xl p-2 flex flex-col justify-between items-center gap-1.5"
                        >
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {dow.day_name.slice(0, 3)}
                          </span>
                          <div className="w-full h-12 bg-[#121416] rounded-md overflow-hidden flex flex-col justify-end p-0.5">
                            <div
                              className="w-full bg-[#35C86B] rounded-sm transition-all duration-300 shadow-[0_0_6px_rgba(53,200,107,0.4)]"
                              style={{ height: `${Math.max(rate, 8)}%` }}
                              title={`${dow.day_name}: ${rate}%`}
                            />
                          </div>
                          <span className="text-[10px] font-black text-slate-200">
                            {rate}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
