import React, { useState, useEffect } from 'react';
import { X, Flame, CheckCircle, Calendar, RefreshCw, Award, AlertCircle, Clock } from 'lucide-react';
import { habitService } from '../services/api';
import type { Habit, HabitHistoryDetail } from '../types';

interface HabitHistoryModalProps {
  habit: Habit | null;
  isOpen: boolean;
  onClose: () => void;
}

export const HabitHistoryModal: React.FC<HabitHistoryModalProps> = ({
  habit,
  isOpen,
  onClose,
}) => {
  const [rangeDays, setRangeDays] = useState<number>(30);
  const [historyData, setHistoryData] = useState<HabitHistoryDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !habit) return;

    let isMounted = true;
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await habitService.getHabitHistoryDetail(habit.id, rangeDays);
        if (isMounted) setHistoryData(data);
      } catch (err: any) {
        if (isMounted) {
          setError(err.response?.data?.detail || 'Unable to load habit history.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [isOpen, habit, rangeDays]);

  if (!isOpen || !habit) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-[#0D191F] border border-slate-200 dark:border-emerald-900/30 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#092328]/40">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: habit.color || '#10B981' }}
            >
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {habit.name}
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {habit.frequency || 'Daily'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Detailed schedule compliance & completion history
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close history modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Range Selector */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Timeframe
            </span>
            <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200 dark:border-slate-700/60">
              {[
                { label: '7 Days', days: 7 },
                { label: '30 Days', days: 30 },
                { label: '90 Days', days: 90 },
                { label: 'All Time', days: 365 },
              ].map((item) => (
                <button
                  key={item.days}
                  onClick={() => setRangeDays(item.days)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    rangeDays === item.days
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
              <span className="text-xs font-medium">Loading history records...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : historyData ? (
            <>
              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-500" /> Current Streak
                  </span>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    {historyData.current_streak} {historyData.current_streak === 1 ? 'day' : 'days'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-emerald-500" /> Longest Streak
                  </span>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    {historyData.longest_streak} {historyData.longest_streak === 1 ? 'day' : 'days'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Total Done
                  </span>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    {historyData.total_completions}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-500" /> Consistency
                  </span>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    {historyData.completion_rate}%
                  </div>
                </div>
              </div>

              {/* Day-by-Day Grid Matrix */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Day Matrix ({historyData.days.length} days)
                  </span>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Completed
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> Skipped
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-slate-200 dark:bg-slate-700 inline-block" /> Missed
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-slate-100 dark:bg-slate-850 inline-block opacity-40" /> Off Schedule
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-15 gap-1.5 p-3 rounded-xl bg-slate-50/70 dark:bg-[#07191C]/60 border border-slate-200 dark:border-slate-800">
                  {historyData.days.map((day) => {
                    let bgClass = 'bg-slate-200/40 dark:bg-slate-800/30 text-slate-400';
                    let label = 'Off Schedule';
                    if (day.completed) {
                      bgClass = 'bg-emerald-500 text-white font-bold';
                      label = 'Completed';
                    } else if (day.skipped) {
                      bgClass = 'bg-amber-500 text-white font-bold';
                      label = 'Skipped (Preserved)';
                    } else if (day.is_scheduled) {
                      bgClass = 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30';
                      label = 'Scheduled & Missed';
                    }

                    return (
                      <div
                        key={day.date}
                        className={`h-7 rounded-md flex items-center justify-center text-[10px] cursor-default transition-transform hover:scale-110 ${bgClass}`}
                        title={`${day.date}: ${label}${day.notes ? ` (${day.notes})` : ''}`}
                      >
                        {day.date.slice(-2)}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800/80 flex justify-end bg-slate-50/50 dark:bg-[#092328]/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
