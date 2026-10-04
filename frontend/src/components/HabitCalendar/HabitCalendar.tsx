import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  Check,
  FastForward,
  X,
  Undo2
} from 'lucide-react';
import type {
  CalendarDayData,
  CalendarDayDetail,
  WeekCalendarResponse,
  YearCalendarResponse,
  Habit,
  HabitWeekDayStatus
} from '../../types';
import { calendarService, habitService } from '../../services/api';
import { WeekView } from './WeekView';
import { MonthView } from './MonthView';
import { YearHeatmap } from './YearHeatmap';
import { HabitHistoryModal } from '../HabitHistoryModal';
import { LoadingSkeleton } from '../LoadingSkeleton';
import { useToast } from '../Toast';

interface HabitCalendarContainerProps {
  initialView?: 'week' | 'month' | 'year';
  onHabitUpdated?: () => void;
}

export const HabitCalendar: React.FC<HabitCalendarContainerProps> = ({
  initialView = 'month',
  onHabitUpdated,
}) => {
  const { addToast } = useToast();
  const today = new Date();

  const [activeTab, setActiveTab] = useState<'week' | 'month' | 'year'>(initialView);

  // Week state
  const [targetWeekDate, setTargetWeekDate] = useState<string>(today.toISOString().split('T')[0]);
  const [weekData, setWeekData] = useState<WeekCalendarResponse | null>(null);
  const [isWeekLoading, setIsWeekLoading] = useState(true);

  // Month state
  const [year, setYear] = useState<number>(today.getFullYear());
  const [month, setMonth] = useState<number>(today.getMonth() + 1);
  const [monthData, setMonthData] = useState<CalendarDayData[]>([]);
  const [isMonthLoading, setIsMonthLoading] = useState(false);

  // Year state
  const [heatYear, setHeatYear] = useState<number>(today.getFullYear());
  const [yearData, setYearData] = useState<YearCalendarResponse | null>(null);
  const [isYearLoading, setIsYearLoading] = useState(false);

  // Filter by habit (optional)
  const [habitsList, setHabitsList] = useState<Habit[]>([]);
  const [selectedHabitId, setSelectedHabitId] = useState<number | 'all'>('all');

  // Day drill-down modal
  const [selectedDayDetail, setSelectedDayDetail] = useState<CalendarDayDetail | null>(null);
  const [historyHabit, setHistoryHabit] = useState<Habit | null>(null);

  // Fetch week data
  const fetchWeek = useCallback(async () => {
    setIsWeekLoading(true);
    try {
      const data = await calendarService.getWeekCalendarData(targetWeekDate);
      setWeekData(data);
    } catch {
      addToast('error', 'Error Loading Week', 'Could not sync week habit records.');
    } finally {
      setIsWeekLoading(false);
    }
  }, [targetWeekDate, addToast]);

  // Fetch month data
  const fetchMonth = useCallback(async () => {
    setIsMonthLoading(true);
    try {
      const data = await calendarService.getCalendarData(year, month);
      setMonthData(data);
    } catch {
      addToast('error', 'Error Loading Month', 'Could not sync monthly calendar data.');
    } finally {
      setIsMonthLoading(false);
    }
  }, [year, month, addToast]);

  // Fetch year data
  const fetchYear = useCallback(async () => {
    setIsYearLoading(true);
    try {
      const hId = selectedHabitId === 'all' ? undefined : selectedHabitId;
      const data = await calendarService.getYearCalendarData(heatYear, hId);
      setYearData(data);
    } catch {
      addToast('error', 'Error Loading Year', 'Could not sync annual activity heatmap.');
    } finally {
      setIsYearLoading(false);
    }
  }, [heatYear, selectedHabitId, addToast]);

  // Fetch habits list for filter
  const fetchHabitsList = useCallback(async () => {
    try {
      const list = await habitService.getHabits();
      setHabitsList(list);
    } catch {
      // Non-blocking
    }
  }, []);

  useEffect(() => {
    fetchHabitsList();
  }, [fetchHabitsList]);

  useEffect(() => {
    if (activeTab === 'week') fetchWeek();
    if (activeTab === 'month') {
      fetchMonth();
      fetchYear();
    }
    if (activeTab === 'year') fetchYear();
  }, [activeTab, fetchWeek, fetchMonth, fetchYear]);

  // Week handlers
  const handlePrevWeek = () => {
    const current = new Date(targetWeekDate + 'T00:00:00');
    current.setDate(current.getDate() - 7);
    setTargetWeekDate(current.toISOString().split('T')[0]);
  };

  const handleNextWeek = () => {
    const current = new Date(targetWeekDate + 'T00:00:00');
    current.setDate(current.getDate() + 7);
    setTargetWeekDate(current.toISOString().split('T')[0]);
  };

  const handleTodayWeek = () => {
    setTargetWeekDate(today.toISOString().split('T')[0]);
  };

  const handleToggleCompleteToday = async (habitId: number, currentCompleted: boolean) => {
    const todayStr = today.toISOString().split('T')[0];
    try {
      if (currentCompleted) {
        await habitService.uncompleteHabit(habitId, todayStr);
        addToast('info', 'Habit Updated', 'Marked incomplete for today.');
      } else {
        await habitService.completeHabit(habitId, todayStr, 1);
        addToast('success', 'Habit Completed', 'Great job! Streak maintained.');
      }
      // Refresh current view & trigger parent update
      if (activeTab === 'week') fetchWeek();
      if (activeTab === 'month') fetchMonth();
      if (activeTab === 'year') fetchYear();
      if (onHabitUpdated) onHabitUpdated();
    } catch {
      addToast('error', 'Update Failed', 'Could not save habit status.');
    }
  };

  // Month handlers
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

  const handleTodayMonth = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
  };

  // Day inspection
  const handleSelectDay = async (day: CalendarDayData) => {
    try {
      const detail = await calendarService.getDayDetail(day.date);
      setSelectedDayDetail(detail);
    } catch {
      addToast('error', 'Details Unavailable', 'Could not retrieve day habit records.');
    }
  };

  const handleSelectWeekDay = async (_habitId: number, day: HabitWeekDayStatus) => {
    try {
      const detail = await calendarService.getDayDetail(day.date);
      setSelectedDayDetail(detail);
    } catch {
      addToast('error', 'Details Unavailable', 'Could not retrieve day habit records.');
    }
  };

  const handleSelectHeatmapDate = async (dateStr: string) => {
    try {
      const detail = await calendarService.getDayDetail(dateStr);
      setSelectedDayDetail(detail);
    } catch {
      addToast('error', 'Details Unavailable', 'Could not retrieve day habit records.');
    }
  };

  const handleDayAction = async (habitId: number, action: 'complete' | 'skip' | 'undo') => {
    if (!selectedDayDetail) return;
    const dateStr = selectedDayDetail.date;
    try {
      if (action === 'complete') {
        await habitService.completeHabit(habitId, dateStr);
        addToast('success', 'Habit Completed', `Marked done for ${dateStr}`);
      } else if (action === 'skip') {
        await habitService.skipHabit(habitId, dateStr);
        addToast('info', 'Habit Skipped', `Recorded skip for ${dateStr}`);
      } else if (action === 'undo') {
        await habitService.uncompleteHabit(habitId, dateStr);
        addToast('info', 'Completion Reset', `Reset record for ${dateStr}`);
      }
      // Refresh detail and views
      const updatedDetail = await calendarService.getDayDetail(dateStr);
      setSelectedDayDetail(updatedDetail);
      if (activeTab === 'week') fetchWeek();
      if (activeTab === 'month') fetchMonth();
      if (activeTab === 'year') fetchYear();
      if (onHabitUpdated) onHabitUpdated();
    } catch {
      addToast('error', 'Action Failed', 'Could not update habit record.');
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

  const selectedHabitName = habitsList.find((h) => h.id === selectedHabitId)?.name;

  return (
    <div className="space-y-6">
      {/* Top Controls: Title / Filter & View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#151719] border border-[#23272D] rounded-2xl p-4 sm:p-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#35C86B]/15 text-[#35C86B] flex items-center justify-center">
              <CalendarIcon className="w-4.5 h-4.5" />
            </div>
            <span>Habits Calendar</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete habit consistency and compliance tracking across weeks, months, and years.
          </p>
        </div>

        {/* View Switcher & Filter Controls */}
        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
          {habitsList.length > 0 && (
            <select
              value={selectedHabitId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedHabitId(val === 'all' ? 'all' : Number(val));
              }}
              className="px-3 py-2 rounded-xl bg-[#1D2024] hover:bg-[#23272D] text-xs font-semibold text-slate-200 border border-[#282B32] focus:outline-none focus:border-[#35C86B] cursor-pointer transition-colors"
              aria-label="Filter calendar by habit"
            >
              <option value="all">All Habits ({habitsList.length})</option>
              {habitsList.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          )}

          <div className="inline-flex rounded-xl bg-[#1D2024] p-1 border border-[#282B32] shadow-xs">
            {(
              [
                { id: 'week', label: 'Week' },
                { id: 'month', label: 'Month' },
                { id: 'year', label: 'Year' },
              ] as const
            ).map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white text-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  aria-pressed={isSelected}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main View Display */}
      {activeTab === 'week' && (
        <>
          {isWeekLoading ? (
            <LoadingSkeleton type="card" />
          ) : (
            <WeekView
              habits={weekData?.habits || []}
              startDate={weekData?.start_date || ''}
              endDate={weekData?.end_date || ''}
              onPrevWeek={handlePrevWeek}
              onNextWeek={handleNextWeek}
              onToday={handleTodayWeek}
              onToggleCompleteToday={handleToggleCompleteToday}
              onSelectDay={handleSelectWeekDay}
            />
          )}
        </>
      )}

      {activeTab === 'month' && (
        <div className="space-y-6">
          {isMonthLoading ? (
            <LoadingSkeleton type="card" />
          ) : (
            <MonthView
              year={year}
              month={month}
              calendarData={monthData}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onToday={handleTodayMonth}
              onSelectDay={handleSelectDay}
            />
          )}

          {/* Month-Segmented Annual Activity Heatmap */}
          <YearHeatmap
            year={heatYear}
            data={yearData}
            onSelectYear={(y) => {
              setHeatYear(y === 0 ? today.getFullYear() : y);
            }}
            onSelectDate={handleSelectHeatmapDate}
            habitName={selectedHabitName}
          />
        </div>
      )}

      {activeTab === 'year' && (
        <>
          {isYearLoading ? (
            <LoadingSkeleton type="card" />
          ) : (
            <YearHeatmap
              year={heatYear}
              data={yearData}
              onSelectYear={(y) => {
                setHeatYear(y === 0 ? today.getFullYear() : y);
              }}
              onSelectDate={handleSelectHeatmapDate}
              habitName={selectedHabitName}
            />
          )}
        </>
      )}

      {/* Interactive Day Detail Modal */}
      {selectedDayDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#151719] border border-[#23272D] rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#23272D] pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  {(() => {
                    try {
                      return new Date(selectedDayDetail.date + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      });
                    } catch {
                      return selectedDayDetail.date;
                    }
                  })()}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-400 font-medium">
                    {selectedDayDetail.completed_count} of {selectedDayDetail.total_scheduled} completed
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs font-bold text-[#35C86B]">
                    {selectedDayDetail.completion_rate}% compliance
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDayDetail(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1B1D20] transition-colors"
                aria-label="Close day detail modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of Habits on this Day */}
            <div className="space-y-2.5">
              {selectedDayDetail.habits.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  No habits were scheduled for this date.
                </div>
              ) : (
                selectedDayDetail.habits.map((h) => (
                  <div
                    key={h.habit_id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#1B1D20] border border-[#2A2E35] gap-3"
                  >
                    <div
                      className="min-w-0 cursor-pointer flex-1"
                      onClick={() => handleOpenHabitHistory(h.habit_id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">
                          {h.habit_name || (h as any).name || 'Habit'}
                        </span>
                        <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded-full bg-[#151719] text-slate-400 border border-[#23272D]">
                          {h.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <span
                          className={`font-semibold ${
                            h.completed
                              ? 'text-[#35C86B]'
                              : h.skipped
                              ? 'text-amber-400'
                              : 'text-slate-500'
                          }`}
                        >
                          {h.completed ? 'Completed ✓' : h.skipped ? 'Skipped' : 'Not completed'}
                        </span>
                        <span>•</span>
                        <span className="text-slate-400 hover:underline">View History →</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {h.completed ? (
                        <button
                          type="button"
                          onClick={() => handleDayAction(h.habit_id, 'undo')}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-[#151719] hover:bg-[#23272D] rounded-lg border border-[#2A2E35] flex items-center gap-1 transition-colors"
                          title="Undo completion"
                        >
                          <Undo2 className="w-3 h-3" />
                          <span>Undo</span>
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleDayAction(h.habit_id, 'complete')}
                            className="px-2.5 py-1 text-[11px] font-bold text-black bg-[#35C86B] hover:brightness-110 rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>Done</span>
                          </button>
                          {!h.skipped && (
                            <button
                              type="button"
                              onClick={() => handleDayAction(h.habit_id, 'skip')}
                              className="px-2 py-1 text-[11px] font-semibold text-slate-400 hover:text-amber-300 bg-[#151719] hover:bg-amber-950/30 rounded-lg border border-[#2A2E35] transition-colors"
                              title="Skip habit for today"
                            >
                              <FastForward className="w-3 h-3" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Habit History Modal */}
      {historyHabit && (
        <HabitHistoryModal
          habit={historyHabit}
          isOpen={!!historyHabit}
          onClose={() => setHistoryHabit(null)}
        />
      )}
    </div>
  );
};
