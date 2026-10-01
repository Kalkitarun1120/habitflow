import React, { useState, useEffect, useCallback } from 'react';
import { Calendar as CalendarIcon, Check, FastForward, X, CheckCircle2, Undo2 } from 'lucide-react';
import type { CalendarDayData, CalendarDayDetail, Habit } from '../types';
import { calendarService, habitService } from '../services/api';
import { Calendar } from '../components/Calendar';
import { HabitHistoryModal } from '../components/HabitHistoryModal';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useToast } from '../components/Toast';

export const CalendarPage: React.FC = () => {
  const { addToast } = useToast();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [calendarData, setCalendarData] = useState<CalendarDayData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Day breakdown modal/drawer state
  const [selectedDayDetail, setSelectedDayDetail] = useState<CalendarDayDetail | null>(null);
  const [historyHabit, setHistoryHabit] = useState<Habit | null>(null);

  const fetchCalendar = useCallback(async () => {
    try {
      const data = await calendarService.getCalendarData(year, month);
      setCalendarData(data);
    } catch {
      addToast('error', 'Error Loading Calendar', 'Could not sync calendar data');
    } finally {
      setIsLoading(false);
    }
  }, [year, month, addToast]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const handleToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
  };

  const handleSelectDay = async (day: CalendarDayData) => {
    try {
      const detail = await calendarService.getDayDetail(day.date);
      setSelectedDayDetail(detail);
    } catch {
      addToast('error', 'Details Unavailable', 'Could not retrieve day habit records.');
    }
  };

  const handleOpenHabitHistory = async (habitId: number) => {
    try {
      const habit = await habitService.getHabitById(habitId);
      setHistoryHabit(habit);
    } catch {
      addToast('error', 'Error', 'Could not load habit details.');
    }
  };

  const handleDayAction = async (habitId: number, action: 'complete' | 'skip' | 'undo') => {
    if (!selectedDayDetail) return;
    const dateStr = selectedDayDetail.date;
    try {
      if (action === 'complete') {
        await habitService.completeHabit(habitId, dateStr);
        addToast('success', 'Habit Completed', `Marked as done for ${dateStr}`);
      } else if (action === 'skip') {
        await habitService.skipHabit(habitId, dateStr);
        addToast('info', 'Habit Skipped', `Recorded skip for ${dateStr}`);
      } else if (action === 'undo') {
        await habitService.uncompleteHabit(habitId, dateStr);
        addToast('info', 'Completion Undone', `Reset record for ${dateStr}`);
      }
      // Refresh both calendar and day detail
      const [updatedDetail, updatedCal] = await Promise.all([
        calendarService.getDayDetail(dateStr),
        calendarService.getCalendarData(year, month)
      ]);
      setSelectedDayDetail(updatedDetail);
      setCalendarData(updatedCal);
    } catch {
      addToast('error', 'Action Failed', 'Could not update habit record.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-8 space-y-6 max-w-6xl mx-auto">
        <LoadingSkeleton type="card" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-8 max-w-6xl mx-auto pb-24 md:pb-12 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Habit Calendar</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Unified single source of truth for monthly compliance and completion intensity.
          </p>
        </div>
      </div>

      <Calendar
        year={year}
        month={month}
        calendarData={calendarData}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
        onSelectDay={handleSelectDay}
      />

      {/* Interactive Day Detail Modal */}
      {selectedDayDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#0D2328] border border-slate-200 dark:border-[#16383B] rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {(() => {
                    try {
                      return new Date(selectedDayDetail.date + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      });
                    } catch {
                      return selectedDayDetail.date;
                    }
                  })()}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedDayDetail.completed_count ?? 0} of {selectedDayDetail.total_scheduled ?? 0} completed ({selectedDayDetail.completion_rate ?? 0}%)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Habit List for the Selected Day */}
            <div className="space-y-2">
              {(!selectedDayDetail.habits || selectedDayDetail.habits.length === 0) ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  No habits were active on this date.
                </p>
              ) : (
                selectedDayDetail.habits.map((item, idx) => {
                  const habitName = item.habit_name || (item as any).name || 'Habit';
                  const isCompleted = item.completed || (item as any).status === 'completed';
                  const isSkipped = item.skipped || (item as any).status === 'skipped';
                  const isScheduled = item.is_scheduled ?? true;
                  const targetVal = item.target_value ?? (item as any).target ?? 1;
                  const targetUnit = item.target_unit ?? 'times';
                  const category = item.category ?? 'General';
                  const color = item.color || '#10B981';

                  return (
                    <div
                      key={item.habit_id || idx}
                      onClick={() => handleOpenHabitHistory(item.habit_id)}
                      className="p-3 rounded-xl border border-slate-200 dark:border-[#16383B] bg-slate-50/50 dark:bg-[#07191C] flex items-center justify-between gap-3 hover:border-emerald-500/50 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs flex-shrink-0 font-bold"
                          style={{ backgroundColor: color }}
                        >
                          {habitName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-slate-900 dark:text-white truncate block">
                            {habitName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {category} • {targetVal} {targetUnit}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        {isCompleted ? (
                          <div className="flex items-center gap-1">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800/40">
                              <Check className="w-3 h-3 stroke-[3]" /> Done
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDayAction(item.habit_id, 'undo')}
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800"
                              title="Undo completion"
                            >
                              <Undo2 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : isSkipped ? (
                          <div className="flex items-center gap-1">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-800/40">
                              <FastForward className="w-3 h-3" /> Skipped
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDayAction(item.habit_id, 'complete')}
                              className="p-1 text-emerald-600 hover:text-emerald-700 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              title="Mark Done"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDayAction(item.habit_id, 'undo')}
                              className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800"
                              title="Undo Skip"
                            >
                              <Undo2 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : isScheduled ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDayAction(item.habit_id, 'complete')}
                              className="px-2 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-950 rounded-md transition-colors flex items-center gap-1 shadow-xs"
                            >
                              <Check className="w-3 h-3 stroke-[2.5]" /> Done
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDayAction(item.habit_id, 'skip')}
                              className="px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md transition-colors"
                            >
                              Skip
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 px-2 py-0.5">
                            Off Schedule
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedDayDetail(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Habit History Modal */}
      <HabitHistoryModal
        habit={historyHabit}
        isOpen={!!historyHabit}
        onClose={() => setHistoryHabit(null)}
      />
    </div>
  );
};

