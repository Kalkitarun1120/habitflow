import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Activity,
  BookOpen,
  Droplet,
  Code,
  Smile,
  Heart,
  Brain,
  Briefcase,
  Zap,
  Target,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { Habit, HabitCreateInput, Category } from '../types';

interface HabitModalProps {
  isOpen: boolean;
  habitToEdit?: Habit | null;
  categories: Category[];
  onClose: () => void;
  onSubmit: (data: HabitCreateInput) => Promise<void>;
}

const ICONS = [
  { id: 'sparkles', label: 'Mindful', icon: Sparkles },
  { id: 'activity', label: 'Exercise', icon: Activity },
  { id: 'book-open', label: 'Reading', icon: BookOpen },
  { id: 'droplet', label: 'Hydration', icon: Droplet },
  { id: 'code', label: 'Coding', icon: Code },
  { id: 'smile', label: 'Wellbeing', icon: Smile },
  { id: 'heart', label: 'Health', icon: Heart },
  { id: 'brain', label: 'Learning', icon: Brain },
  { id: 'briefcase', label: 'Deep Work', icon: Briefcase },
  { id: 'zap', label: 'Energy', icon: Zap },
  { id: 'target', label: 'Goal', icon: Target },
];

const PRESET_COLORS = [
  '#10B981', // Emerald
  '#0D9488', // Teal
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
];

const DAYS_OF_WEEK = [
  { id: 'mon', label: 'M', full: 'Mon' },
  { id: 'tue', label: 'T', full: 'Tue' },
  { id: 'wed', label: 'W', full: 'Wed' },
  { id: 'thu', label: 'T', full: 'Thu' },
  { id: 'fri', label: 'F', full: 'Fri' },
  { id: 'sat', label: 'S', full: 'Sat' },
  { id: 'sun', label: 'S', full: 'Sun' },
];

const PRESETS = [
  { name: 'Drink 2.5L Water', category: 'Health', icon: 'droplet', frequency: 'daily', target_value: 2.5, target_unit: 'Liters', color: '#06B6D4' },
  { name: 'Read 20 Pages', category: 'Mindset', icon: 'book-open', frequency: 'daily', target_value: 20, target_unit: 'Pages', color: '#8B5CF6' },
  { name: 'Gym Workout', category: 'Fitness', icon: 'activity', frequency: 'mon,wed,fri', target_value: 45, target_unit: 'Minutes', color: '#F43F5E' },
  { name: 'Deep Coding Practice', category: 'Work', icon: 'code', frequency: 'weekdays', target_value: 2, target_unit: 'Hours', color: '#6366F1' },
];

export const HabitModal: React.FC<HabitModalProps> = ({
  isOpen,
  habitToEdit,
  categories,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [icon, setIcon] = useState('sparkles');
  const [color, setColor] = useState('#10B981');
  const [frequencyType, setFrequencyType] = useState<'daily' | 'weekdays' | 'weekends' | 'specific' | 'weekly'>('daily');
  const [selectedDays, setSelectedDays] = useState<string[]>(['mon', 'wed', 'fri']);
  const [targetValue, setTargetValue] = useState(1);
  const [targetUnit, setTargetUnit] = useState('times');
  const [reminderTime, setReminderTime] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (habitToEdit) {
      setName(habitToEdit.name);
      setDescription(habitToEdit.description || '');
      setCategory(habitToEdit.category);
      setIcon(habitToEdit.icon);
      setColor(habitToEdit.color);
      
      const freq = (habitToEdit.frequency || 'daily').toLowerCase();
      if (freq === 'daily' || freq === 'every day') {
        setFrequencyType('daily');
      } else if (freq === 'weekdays') {
        setFrequencyType('weekdays');
      } else if (freq === 'weekends') {
        setFrequencyType('weekends');
      } else if (freq === 'weekly') {
        setFrequencyType('weekly');
      } else {
        setFrequencyType('specific');
        const days = freq.split(',').map(d => d.trim());
        setSelectedDays(days.length ? days : ['mon', 'wed', 'fri']);
      }

      setTargetValue(habitToEdit.target_value);
      setTargetUnit(habitToEdit.target_unit);
      setReminderTime(habitToEdit.reminder_time || '');
      setStartDate(habitToEdit.start_date || new Date().toISOString().split('T')[0]);
    } else {
      setName('');
      setDescription('');
      setCategory('General');
      setIcon('sparkles');
      setColor('#10B981');
      setFrequencyType('daily');
      setSelectedDays(['mon', 'wed', 'fri']);
      setTargetValue(1);
      setTargetUnit('times');
      setReminderTime('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setShowAdvanced(false);
    }
  }, [habitToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleDay = (dayId: string) => {
    setSelectedDays(prev =>
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]
    );
  };

  const computeFinalFrequency = () => {
    if (frequencyType === 'specific') {
      return selectedDays.length > 0 ? selectedDays.join(',') : 'daily';
    }
    return frequencyType;
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setName(preset.name);
    setCategory(preset.category);
    setIcon(preset.icon);
    setTargetValue(preset.target_value);
    setTargetUnit(preset.target_unit);
    setColor(preset.color);
    if (preset.frequency.includes(',')) {
      setFrequencyType('specific');
      setSelectedDays(preset.frequency.split(','));
    } else if (preset.frequency === 'weekdays') {
      setFrequencyType('weekdays');
    } else {
      setFrequencyType('daily');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        icon,
        color,
        frequency: computeFinalFrequency(),
        target_value: Number(targetValue) || 1,
        target_unit: targetUnit.trim() || 'times',
        reminder_time: reminderTime || undefined,
        start_date: startDate || undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white dark:bg-[#0D2328] border border-slate-200 dark:border-[#16383B] rounded-2xl max-w-lg w-full p-5 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: color }}
            >
              <Sparkles className="w-4 h-4 stroke-[2.2]" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {habitToEdit ? 'Edit Habit' : 'Create New Habit'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick presets for new habits */}
        {!habitToEdit && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Quick Suggestions
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-[#12383F] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 hover:border-emerald-500 transition-colors"
                >
                  + {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Habit Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Read 20 Pages, Morning Workout"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-[#07191C] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
            />
          </div>

          {/* Category & Schedule Frequency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-[#07191C] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold"
              >
                <option value="General">General</option>
                <option value="Health">Health</option>
                <option value="Fitness">Fitness</option>
                <option value="Mindset">Mindset</option>
                <option value="Work">Work</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Schedule Frequency
              </label>
              <select
                value={frequencyType}
                onChange={(e) => setFrequencyType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-[#07191C] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold"
              >
                <option value="daily">Every Day (Daily)</option>
                <option value="weekdays">Weekdays (Mon – Fri)</option>
                <option value="weekends">Weekends (Sat – Sun)</option>
                <option value="specific">Specific Days</option>
                <option value="weekly">Once / Week</option>
              </select>
            </div>
          </div>

          {/* Specific Days Picker */}
          {frequencyType === 'specific' && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#07191C] border border-slate-200 dark:border-slate-800 space-y-2 animate-fadeIn">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Select Active Days:
              </label>
              <div className="flex gap-1.5 justify-between">
                {DAYS_OF_WEEK.map((d) => {
                  const isChecked = selectedDays.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDay(d.id)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isChecked
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Target Quantity & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Value
              </label>
              <input
                type="number"
                min="0.1"
                step="any"
                required
                value={targetValue}
                onChange={(e) => setTargetValue(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-[#07191C] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Unit
              </label>
              <input
                type="text"
                placeholder="e.g. times, pages, mins"
                value={targetUnit}
                onChange={(e) => setTargetUnit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-[#07191C] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-xs"
              />
            </div>
          </div>

          {/* Icon & Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Icon
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ICONS.slice(0, 8).map((item) => {
                  const IconComp = item.icon;
                  const isSelected = icon === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setIcon(item.id)}
                      className={`p-2 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-transparent shadow-sm scale-105'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                      }`}
                      title={item.label}
                    >
                      <IconComp className="w-3.5 h-3.5 stroke-[2.2]" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Color
              </label>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      color === c
                        ? 'ring-2 ring-emerald-400 dark:ring-emerald-500 scale-110 shadow-sm'
                        : 'hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Progressive Disclosure: Additional Options */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <span>{showAdvanced ? 'Hide additional settings' : '+ Reminder, Start Date & Notes'}</span>
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#07191C] border border-slate-200 dark:border-slate-800 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-500" /> Daily Reminder
                    </label>
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D2328] text-slate-900 dark:text-white text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-blue-500" /> Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D2328] text-slate-900 dark:text-white text-xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Description & Personal Motivation
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Why are you building this habit?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D2328] text-slate-900 dark:text-white text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Live Human-Readable Summary */}
          {name.trim().length > 0 && (
            <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 flex items-start gap-2.5 animate-fadeIn">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed font-medium">
                <span className="font-bold text-emerald-950 dark:text-white">{name}</span>
                {targetValue > 0 && ` for ${targetValue} ${targetUnit}`}
                {frequencyType === 'daily' && ' every day'}
                {frequencyType === 'weekdays' && ' every Monday–Friday'}
                {frequencyType === 'weekends' && ' every Saturday–Sunday'}
                {frequencyType === 'specific' && ` every ${selectedDays.map(d => DAYS_OF_WEEK.find(x => x.id === d)?.full || d).join(', ')}`}
                {frequencyType === 'weekly' && ' once per week'}
                {reminderTime ? ` at ${reminderTime}` : ''}
                {startDate ? ` starting ${startDate}` : ''}.
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400 rounded-xl shadow-sm transition-all"
            >
              {isSubmitting ? 'Saving...' : habitToEdit ? 'Save Changes' : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

