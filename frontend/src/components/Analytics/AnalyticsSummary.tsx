import React from 'react';
import { CheckCircle2, Flame, Award, TrendingUp } from 'lucide-react';
import type { StatisticsResponse } from '../../types';

interface AnalyticsSummaryProps {
  stats: StatisticsResponse | null;
}

export const AnalyticsSummary: React.FC<AnalyticsSummaryProps> = ({ stats }) => {
  const totalCompletions = stats?.total_completions || 0;
  const currentStreak = stats?.current_streak || 0;
  const longestStreak = stats?.longest_streak || 0;
  const completionRate = stats?.completion_rate || 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Total Check-ins */}
      <div className="bg-[#151719] border border-[#23272D] rounded-xl p-4 sm:p-5 shadow-sm space-y-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#35C86B]" />
          <span>Total Check-ins</span>
        </span>
        <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {totalCompletions.toLocaleString()}
        </div>
        <p className="text-[11px] text-slate-500">
          Verified completions
        </p>
      </div>

      {/* Current Streak */}
      <div className="bg-[#151719] border border-[#23272D] rounded-xl p-4 sm:p-5 shadow-sm space-y-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-amber-500" />
          <span>Current Streak</span>
        </span>
        <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {currentStreak} <span className="text-sm font-semibold text-slate-400">{currentStreak === 1 ? 'day' : 'days'}</span>
        </div>
        <p className="text-[11px] text-slate-500">
          Active momentum
        </p>
      </div>

      {/* Best Streak */}
      <div className="bg-[#151719] border border-[#23272D] rounded-xl p-4 sm:p-5 shadow-sm space-y-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-indigo-400" />
          <span>Best Streak</span>
        </span>
        <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {longestStreak} <span className="text-sm font-semibold text-slate-400">{longestStreak === 1 ? 'day' : 'days'}</span>
        </div>
        <p className="text-[11px] text-slate-500">
          Personal record
        </p>
      </div>

      {/* Completion Rate */}
      <div className="bg-[#151719] border border-[#23272D] rounded-xl p-4 sm:p-5 shadow-sm space-y-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-[#35C86B]" />
          <span>Completion Rate</span>
        </span>
        <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {completionRate}%
        </div>
        <p className="text-[11px] text-slate-500">
          Schedule compliance
        </p>
      </div>
    </div>
  );
};
