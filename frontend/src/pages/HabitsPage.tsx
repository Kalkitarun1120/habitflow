import React, { useEffect, useState, useCallback } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Target
} from 'lucide-react';
import type { Habit, HabitCreateInput, Category } from '../types';
import { habitService, categoryService } from '../services/api';
import { HabitCard } from '../components/HabitCard';
import { HabitModal } from '../components/HabitModal';
import { HabitHistoryModal } from '../components/HabitHistoryModal';
import { HabitCalendar } from '../components/HabitCalendar/HabitCalendar';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';

export const HabitsPage: React.FC = () => {
  const { addToast } = useToast();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // View Mode: 'list' | 'week' | 'month' | 'year'
  const [viewMode, setViewMode] = useState<'list' | 'week' | 'month' | 'year'>('list');

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'paused' | 'archived'>('active');
  const [sortBy, setSortBy] = useState('created_at');

  // Modals
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);
  const [historyHabit, setHistoryHabit] = useState<Habit | null>(null);
  const [deleteHabitId, setDeleteHabitId] = useState<number | null>(null);

  const fetchHabits = useCallback(async () => {
    try {
      const [hList, catList] = await Promise.all([
        habitService.getHabits({
          category: selectedCategory,
          search,
          sort_by: sortBy,
        }),
        categoryService.getCategories(),
      ]);
      setHabits(hList);
      setCategories(catList);
    } catch {
      addToast('error', 'Sync Failed', 'Failed to fetch habits.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, search, sortBy, addToast]);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const handleToggleComplete = async (habitId: number, currentCompleted: boolean) => {
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      if (currentCompleted) {
        await habitService.uncompleteHabit(habitId, todayStr);
        addToast('info', 'Status Updated', 'Marked incomplete for today.');
      } else {
        await habitService.completeHabit(habitId, todayStr, 1);
        addToast('success', 'Habit Completed', 'Great job! Streak maintained.');
      }
      fetchHabits();
    } catch {
      addToast('error', 'Update Error', 'Could not record completion.');
    }
  };

  const handleSkipToday = async (habitId: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      await habitService.skipHabit(habitId, todayStr, 'Rest / Planned Skip');
      addToast('info', 'Habit Skipped', 'Today was recorded as skipped without breaking your streak.');
      fetchHabits();
    } catch {
      addToast('error', 'Skip Failed', 'Could not record skipped status.');
    }
  };

  const handlePauseToggle = async (habit: Habit) => {
    try {
      if (habit.is_paused) {
        await habitService.resumeHabit(habit.id);
        addToast('success', 'Habit Resumed', `"${habit.name}" is active again.`);
      } else {
        await habitService.pauseHabit(habit.id);
        addToast('info', 'Habit Paused', `"${habit.name}" paused.`);
      }
      fetchHabits();
    } catch {
      addToast('error', 'Action Failed', 'Could not update habit state.');
    }
  };

  const handleDuplicate = async (habitId: number) => {
    try {
      await habitService.duplicateHabit(habitId);
      addToast('success', 'Habit Duplicated', 'A duplicate copy was created.');
      fetchHabits();
    } catch {
      addToast('error', 'Duplicate Failed', 'Could not duplicate habit.');
    }
  };

  const handleArchive = async (habitId: number) => {
    try {
      await habitService.archiveHabit(habitId);
      addToast('info', 'Habit Archived', 'Habit moved to archive.');
      fetchHabits();
    } catch {
      addToast('error', 'Archive Failed', 'Could not archive habit.');
    }
  };

  const handleCreateOrUpdateHabit = async (input: HabitCreateInput) => {
    try {
      if (habitToEdit) {
        await habitService.updateHabit(habitToEdit.id, input);
        addToast('success', 'Habit Saved', `"${input.name}" updated.`);
      } else {
        await habitService.createHabit(input);
        addToast('success', 'Habit Created', `"${input.name}" created.`);
      }
      fetchHabits();
    } catch {
      addToast('error', 'Save Failed', 'Error saving habit.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteHabitId) return;
    try {
      await habitService.deleteHabit(deleteHabitId);
      addToast('info', 'Habit Removed', 'Habit and history removed.');
      setDeleteHabitId(null);
      fetchHabits();
    } catch {
      addToast('error', 'Delete Error', 'Could not delete habit.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-8 space-y-6 max-w-6xl mx-auto">
        <LoadingSkeleton type="card" />
      </div>
    );
  }

  // Filter based on selectedStatus
  const displayedHabits = habits.filter((h) => {
    if (selectedStatus === 'active') {
      return !h.is_paused && !h.is_archived;
    } else if (selectedStatus === 'paused') {
      return h.is_paused && !h.is_archived;
    } else if (selectedStatus === 'archived') {
      return h.is_archived;
    }
    return true;
  });

  return (
    <div className="space-y-6 p-4 sm:p-8 max-w-6xl mx-auto pb-24 md:pb-12 animate-fadeIn">
      {/* Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-[#35C86B]" />
            <span>Habits</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Manage your daily habits, custom schedules, targets, and active routines.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* View Selector */}
          <div className="inline-flex rounded-xl bg-[#151719] p-1 border border-[#23272D] shadow-sm">
            {[
              { id: 'list', label: 'List' },
              { id: 'week', label: 'Week' },
              { id: 'month', label: 'Month' },
              { id: 'year', label: 'Year' },
            ].map((v) => {
              const isSelected = viewMode === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setViewMode(v.id as any)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    isSelected
                      ? 'bg-white text-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  aria-pressed={isSelected}
                >
                  {v.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              setHabitToEdit(null);
              setIsHabitModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#35C86B] hover:brightness-110 text-black font-bold text-xs shadow-sm transition-all shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Habit</span>
          </button>
        </div>
      </div>

      {/* Calendar Views Mode */}
      {viewMode !== 'list' ? (
        <HabitCalendar initialView={viewMode} onHabitUpdated={fetchHabits} />
      ) : (
        <>
          {/* Control Bar: Status Tabs, Category Filter, Sort, Search */}
          <div className="bg-[#151719] rounded-xl p-3.5 border border-[#23272D] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: 'active', label: 'Active' },
                { id: 'all', label: 'All Habits' },
                { id: 'paused', label: 'Paused' },
                { id: 'archived', label: 'Archived' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedStatus(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    selectedStatus === tab.id
                      ? 'bg-white text-black shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-[#1B1D20]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search & Sort Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search habits..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#23272D] bg-[#1B1D20] text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#35C86B]"
                />
              </div>

              <div className="flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-[#23272D] bg-[#1B1D20] text-slate-200 text-xs font-semibold focus:outline-none"
                >
                  <option value="All">All Categories</option>
                  <option value="General">General</option>
                  <option value="Health">Health</option>
                  <option value="Fitness">Fitness</option>
                  <option value="Mindset">Mindset</option>
                  <option value="Work">Work</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-[#23272D] bg-[#1B1D20] text-slate-200 text-xs font-semibold focus:outline-none"
                >
                  <option value="created_at">Recently Created</option>
                  <option value="name">Name (A–Z)</option>
                  <option value="streak">Current Streak</option>
                  <option value="rate">Completion Rate</option>
                </select>
              </div>
            </div>
          </div>

          {/* Habits Grid */}
          {displayedHabits.length === 0 ? (
            <EmptyState
              title="No Habits In This View"
              description="Create your habits to start tracking consistency and streak momentum."
              actionLabel="Create a Habit"
              onAction={() => {
                setHabitToEdit(null);
                setIsHabitModalOpen(true);
              }}
              icon={Target}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedHabits.map((habit) => (
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
        </>
      )}

      {/* Habit Form Modal */}
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

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteHabitId}
        title="Delete Habit?"
        message="This action will permanently delete this habit and all associated completion history records."
        confirmLabel="Delete Habit"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteHabitId(null)}
      />
    </div>
  );
};
