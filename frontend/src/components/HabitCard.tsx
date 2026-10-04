import React, { useState } from 'react';
import {
  Check,
  RotateCcw,
  Flame,
  Clock,
  MoreVertical,
  Edit2,
  Trash2,
  Calendar,
  Copy,
  Pause,
  Play,
  Archive,
  FastForward,
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
import type { Habit } from '../types';

interface HabitCardProps {
  habit: Habit;
  onToggleComplete: (habitId: number, currentCompleted: boolean) => void;
  onSkipToday?: (habitId: number) => void;
  onPauseToggle?: (habit: Habit) => void;
  onDuplicate?: (habitId: number) => void;
  onArchive?: (habitId: number) => void;
  onViewHistory?: (habit: Habit) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: number) => void;
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

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  onToggleComplete,
  onSkipToday,
  onPauseToggle,
  onDuplicate,
  onArchive,
  onViewHistory,
  onEdit,
  onDelete,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const streak = habit.streak;
  const isCompleted = streak?.completed_today || false;
  const isSkipped = streak?.skipped_today || false;
  const isPaused = Boolean(habit.is_paused || habit.is_active === false || streak?.is_paused);
  const isArchived = Boolean(habit.is_archived);
  const isScheduledToday = habit.is_scheduled_today !== false;
  const currentStreak = streak?.current_streak || 0;

  const HabitIcon = ICON_MAP[habit.icon] || Sparkles;

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSubmitting || isPaused || isArchived) return;
    setIsSubmitting(true);
    try {
      await onToggleComplete(habit.id, isCompleted);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSubmitting || !onSkipToday || isCompleted || isPaused) return;
    setIsSubmitting(true);
    try {
      await onSkipToday(habit.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFrequency = (freq?: string) => {
    if (!freq || freq === 'daily') return 'Daily';
    if (freq === 'weekdays') return 'Mon – Fri';
    if (freq === 'weekends') return 'Sat – Sun';
    if (freq === 'weekly') return 'Once / week';
    return freq.split(',').map(s => s.trim().charAt(0).toUpperCase() + s.trim().slice(1)).join(', ');
  };

  return (
    <div
      onClick={() => onViewHistory && onViewHistory(habit)}
      className={`relative group bg-[#151719] border rounded-xl p-4 sm:p-5 transition-all duration-150 cursor-pointer ${
        isCompleted
          ? 'border-[#35C86B]/60 bg-[#16291E]'
          : isSkipped
          ? 'border-amber-500/40 bg-amber-950/20'
          : isPaused
          ? 'border-slate-800 opacity-70 bg-[#121416]'
          : 'border-[#23272D] hover:border-[#35C86B]/50 shadow-sm'
      }`}
    >
      {/* Top row: Icon, Name, Category, Frequency, Menu */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm"
            style={{ backgroundColor: habit.color || '#10B981' }}
          >
            <HabitIcon className="w-5 h-5 stroke-[2.2]" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                {habit.name}
              </h3>

              {isPaused && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  Paused
                </span>
              )}
              {isArchived && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                  Archived
                </span>
              )}
              {isSkipped && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                  Skipped Today
                </span>
              )}
              {!isScheduledToday && !isCompleted && !isSkipped && !isPaused && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                  Not today
                </span>
              )}
            </div>

            {habit.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {habit.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-[#133036] text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/40">
                {habit.category}
              </span>

              <span className="text-[11px] font-medium flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <Target className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                {habit.target_value} {habit.target_unit}
              </span>

              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                • {formatFrequency(habit.frequency)}
              </span>

              {habit.reminder_time && (
                <span className="text-[11px] font-medium flex items-center gap-0.5 text-slate-400">
                  <Clock className="w-3 h-3 text-amber-500" />
                  {habit.reminder_time}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3-Dot Options Menu */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
            aria-label="Habit menu"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div
              className="absolute right-0 top-8 z-30 w-44 bg-white dark:bg-[#0D2328] rounded-xl shadow-xl border border-slate-200 dark:border-slate-700/70 py-1 text-xs"
              onClick={() => setShowMenu(false)}
            >
              <button
                onClick={() => onViewHistory && onViewHistory(habit)}
                className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#12383F] font-medium"
              >
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                View History
              </button>

              <button
                onClick={() => onEdit(habit)}
                className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#12383F] font-medium"
              >
                <Edit2 className="w-3.5 h-3.5 text-emerald-500" />
                Edit Habit
              </button>

              {onDuplicate && (
                <button
                  onClick={() => onDuplicate(habit.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#12383F] font-medium"
                >
                  <Copy className="w-3.5 h-3.5 text-indigo-400" />
                  Duplicate
                </button>
              )}

              {onSkipToday && !isCompleted && !isSkipped && !isPaused && (
                <button
                  onClick={() => onSkipToday(habit.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 font-medium"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  Skip Today
                </button>
              )}

              {onPauseToggle && (
                <button
                  onClick={() => onPauseToggle(habit)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#12383F] font-medium"
                >
                  {isPaused ? (
                    <>
                      <Play className="w-3.5 h-3.5 text-emerald-500" />
                      Resume Habit
                    </>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5 text-amber-500" />
                      Pause Habit
                    </>
                  )}
                </button>
              )}

              {onArchive && (
                <button
                  onClick={() => onArchive(habit.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#12383F] font-medium"
                >
                  <Archive className="w-3.5 h-3.5 text-slate-400" />
                  {isArchived ? 'Unarchive' : 'Archive'}
                </button>
              )}

              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

              <button
                onClick={() => onDelete(habit.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: Streak and Action Button */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#153438] flex items-center justify-between gap-3">
        {/* Streak indicator */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
          <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
          <span>{currentStreak} {currentStreak === 1 ? 'day streak' : 'days streak'}</span>
        </div>

        {/* Action Button: Clear ✓ Complete / ✓ Completed (Undo) */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {isCompleted ? (
            <button
              onClick={handleToggle}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400 transition-all shadow-sm"
              title="Click to mark incomplete"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Completed</span>
              <RotateCcw className="w-3 h-3 ml-1 opacity-70 hover:opacity-100" />
            </button>
          ) : isSkipped ? (
            <button
              onClick={handleToggle}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 hover:bg-amber-200 transition-all"
            >
              <span>Skipped</span>
              <RotateCcw className="w-3 h-3 ml-0.5 opacity-70" />
            </button>
          ) : isPaused ? (
            <span className="text-xs text-slate-400 font-medium px-2 py-1">
              Paused
            </span>
          ) : (
            <div className="flex items-center gap-1.5">
              {onSkipToday && (
                <button
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Skip today without breaking streak"
                >
                  Skip
                </button>
              )}

              <button
                onClick={handleToggle}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-emerald-600 dark:hover:bg-emerald-400 dark:hover:text-slate-950 transition-all shadow-sm active:scale-95"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Complete</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

