import React, { useEffect, useState, useCallback } from 'react';
import {
  Flame,
  CheckCircle2,
  TrendingUp,
  Plus,
  Target,
  Award,
  Lightbulb,
  Search,
  Calendar
} from 'lucide-react';
import type { DashboardOverview, Habit, HabitCreateInput, Category, InsightItem } from '../types';
import { dashboardService, habitService, categoryService, insightsService } from '../services/api';
import { HabitCard } from '../components/HabitCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { HabitModal } from '../components/HabitModal';
import { HabitHistoryModal } from '../components/HabitHistoryModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';

export const DashboardPage: React.FC = () => {
  const { addToast } = useToast();
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Modal states
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);
  const [historyHabit, setHistoryHabit] = useState<Habit | null>(null);
  const [deleteHabitId, setDeleteHabitId] = useState<number | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const [overview, cats, ins] = await Promise.all([
        dashboardService.getOverview(),
        categoryService.getCategories(),
        insightsService.getInsights(),
      ]);
      setData(overview);
      setCategories(cats);
      setInsights(ins);
    } catch (err) {
      console.error(err);
      addToast('error', 'Connection Error', 'Unable to sync dashboard with server.');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleToggleComplete = async (habitId: number, currentCompleted: boolean) => {
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      if (currentCompleted) {
        await habitService.uncompleteHabit(habitId, todayStr);
        addToast('info', 'Habit Marked Incomplete', 'Status reverted for today.');
      } else {
        await habitService.completeHabit(habitId, todayStr, 1);
        addToast('success', 'Habit Completed', 'Great job! Streak maintained 🔥');
      }
      fetchDashboard();
    } catch {
      addToast('error', 'Update Failed', 'Could not record habit completion.');
    }
  };

  const handleSkipToday = async (habitId: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      await habitService.skipHabit(habitId, todayStr, 'Rest / Planned Skip');
      addToast('info', 'Habit Skipped', 'Today was marked as skipped without breaking your streak.');
      fetchDashboard();
    } catch {
      addToast('error', 'Skip Failed', 'Could not record skipped status.');
    }
  };

  const handlePauseToggle = async (habit: Habit) => {
    const isPaused = Boolean(habit.is_paused || habit.is_active === false || habit.streak?.is_paused);
    try {
      if (isPaused) {
        await habitService.resumeHabit(habit.id);
        addToast('success', 'Habit Resumed', `"${habit.name}" is active again.`);
      } else {
        await habitService.pauseHabit(habit.id);
        addToast('info', 'Habit Paused', `"${habit.name}" paused. Streaks won't be penalized.`);
      }
      fetchDashboard();
    } catch {
      addToast('error', 'Action Failed', 'Could not update habit pause state.');
    }
  };

  const handleDuplicate = async (habitId: number) => {
    try {
      await habitService.duplicateHabit(habitId);
      addToast('success', 'Habit Duplicated', 'A copy of this habit was created.');
      fetchDashboard();
    } catch {
      addToast('error', 'Duplicate Failed', 'Could not duplicate habit.');
    }
  };

  const handleArchive = async (habitId: number) => {
    try {
      await habitService.archiveHabit(habitId);
      addToast('info', 'Habit Archived', 'Habit moved to archive.');
      fetchDashboard();
    } catch {
      addToast('error', 'Archive Failed', 'Could not archive habit.');
    }
  };

  const handleCreateOrUpdateHabit = async (habitInput: HabitCreateInput) => {
    try {
      if (habitToEdit) {
        await habitService.updateHabit(habitToEdit.id, habitInput);
        addToast('success', 'Habit Updated', `"${habitInput.name}" saved.`);
      } else {
        await habitService.createHabit(habitInput);
        addToast('success', 'Habit Created', `"${habitInput.name}" added to your routine.`);
      }
      fetchDashboard();
    } catch {
      addToast('error', 'Save Failed', 'Could not save habit details.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteHabitId) return;
    try {
      await habitService.deleteHabit(deleteHabitId);
      addToast('info', 'Habit Deleted', 'Habit and history removed.');
      setDeleteHabitId(null);
      fetchDashboard();
    } catch {
      addToast('error', 'Delete Failed', 'Could not delete habit.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-8 max-w-6xl mx-auto">
        <LoadingSkeleton type="stats" />
        <LoadingSkeleton type="card" />
      </div>
    );
  }

  const allHabits = data?.habits_today || [];
  const remainingHabits = allHabits.filter(
    h => !h.streak?.completed_today && !h.streak?.skipped_today && !h.is_paused && h.is_active !== false && !h.streak?.is_paused
  );
  const remainingCount = data?.remaining_today !== undefined ? data.remaining_today : remainingHabits.length;

  const filteredHabits = allHabits.filter((h) => {
    const matchesCategory =
      selectedCategory === 'All' || h.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.description && h.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (statusFilter === 'pending') {
      return matchesCategory && matchesSearch && !h.streak?.completed_today;
    } else if (statusFilter === 'completed') {
      return matchesCategory && matchesSearch && h.streak?.completed_today;
    }
    return matchesCategory && matchesSearch;
  });

  // Calculate current week rhythm
  const currentDay = new Date();
  const dayOfWeek = currentDay.getDay();
  const distanceToMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(currentDay);
  monday.setDate(currentDay.getDate() - distanceToMonday);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const isToday = d.toDateString() === currentDay.toDateString();
    return {
      name: d.toLocaleDateString('en-US', { weekday: 'short' }),
      num: d.getDate(),
      isToday,
    };
  });

  return (
    <div className="space-y-6 p-4 sm:p-8 animate-fadeIn max-w-6xl mx-auto pb-24 md:pb-12">
      {/* Action-Oriented Hero Header */}
      <div className="bg-white dark:bg-[#0C1E22] p-5 sm:p-7 rounded-2xl border border-slate-200/90 dark:border-[#16383B] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span>Today's Focus</span>
            <span>•</span>
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {data?.greeting ? `${data.greeting} 👋` : 'Welcome back 👋'}
          </h1>

          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {remainingCount === 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                ✓ All scheduled habits for today are completed! Excellent job.
              </span>
            ) : (
              <span>
                You have <strong className="text-slate-900 dark:text-white">{remainingCount} {remainingCount === 1 ? 'habit' : 'habits'}</strong> left to complete today's routine.
              </span>
            )}
          </p>

          {/* Mini progress bar */}
          <div className="flex items-center gap-3 mt-3 max-w-md">
            <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${data?.today_progress_percent || 0}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {data?.completed_today || 0} / {data?.total_habits || 0} ({data?.today_progress_percent || 0}%)
            </span>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={() => {
            setHabitToEdit(null);
            setIsHabitModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400 text-white font-semibold text-xs shadow-sm transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Week-at-a-Glance Strip */}
      <div className="bg-white dark:bg-[#0C1E22] rounded-xl p-4 border border-slate-200/90 dark:border-[#16383B] shadow-sm">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Weekly Rhythm
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {data?.completed_today || 0} of {data?.total_habits || 0} completed
          </span>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-lg text-center flex flex-col items-center justify-center transition-all ${
                day.isToday
                  ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-50 dark:bg-[#07191C] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800'
              }`}
            >
              <span className="text-[10px] uppercase font-semibold opacity-80">
                {day.name}
              </span>
              <span className="text-sm font-bold mt-0.5">
                {day.num}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Real-Data Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-[#0C1E22] border border-slate-200/90 dark:border-[#16383B]">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Today's Rate
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {data?.today_progress_percent || 0}%
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {data?.completed_today || 0} of {data?.total_habits || 0} done
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0C1E22] border border-slate-200/90 dark:border-[#16383B]">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-500" /> Current Streak
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {data?.current_streak || 0} {data?.current_streak === 1 ? 'Day' : 'Days'}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Active streak
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0C1E22] border border-slate-200/90 dark:border-[#16383B]">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-indigo-500" /> Best Streak
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {data?.longest_streak || 0} Days
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Personal record
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0C1E22] border border-slate-200/90 dark:border-[#16383B]">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> 30-Day Avg
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {data?.overall_completion_rate || 0}%
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Historical consistency
          </span>
        </div>
      </div>

      {/* Behavioral Insight Note */}
      {insights.length > 0 && (
        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-[#16383B] bg-slate-50/70 dark:bg-[#07191C] flex items-start gap-3">
          <Lightbulb className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-slate-900 dark:text-white">
              {insights[0].title}:{' '}
            </span>
            <span className="text-slate-600 dark:text-slate-300">
              {insights[0].description}
            </span>
          </div>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Category & Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['All', 'Health', 'Fitness', 'Mindset', 'Work'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                  : 'bg-white dark:bg-[#0C1E22] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#16383B] hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          <button
            onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              statusFilter === 'pending'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-[#0C1E22] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#16383B]'
            }`}
          >
            Remaining ({remainingHabits.length})
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-56">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filter habits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#16383B] bg-white dark:bg-[#0C1E22] text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Habits Grid */}
      {filteredHabits.length === 0 ? (
        <EmptyState
          title="No Habits Found"
          description={
            searchQuery || selectedCategory !== 'All'
              ? 'No habits match your active filter.'
              : 'You have no habits scheduled for today.'
          }
          actionLabel="Create a Habit"
          onAction={() => {
            setHabitToEdit(null);
            setIsHabitModalOpen(true);
          }}
          icon={Target}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onToggleComplete={handleToggleComplete}
              onSkipToday={handleSkipToday}
              onPauseToggle={handlePauseToggle}
              onDuplicate={handleDuplicate}
              onArchive={handleArchive}
              onViewHistory={(h) => setHistoryHabit(h)}
              onEdit={(h) => {
                setHabitToEdit(h);
                setIsHabitModalOpen(true);
              }}
              onDelete={(id) => setDeleteHabitId(id)}
            />
          ))}
        </div>
      )}

      {/* Habit Create / Edit Modal */}
      <HabitModal
        isOpen={isHabitModalOpen}
        habitToEdit={habitToEdit}
        categories={categories}
        onClose={() => {
          setIsHabitModalOpen(false);
          setHabitToEdit(null);
        }}
        onSubmit={handleCreateOrUpdateHabit}
      />

      {/* Habit History Drawer/Modal */}
      <HabitHistoryModal
        habit={historyHabit}
        isOpen={!!historyHabit}
        onClose={() => setHistoryHabit(null)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteHabitId}
        title="Delete Habit?"
        message="This action will permanently remove this habit and all associated completion history records."
        confirmLabel="Delete Habit"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteHabitId(null)}
      />
    </div>
  );
};

