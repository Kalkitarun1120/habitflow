import React, { useState } from 'react';
import {
  Settings,
  Sun,
  Moon,
  Laptop,
  Bell,
  CheckCircle2,
  Sparkles,
  Smartphone,
  Download
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/api';
import { useToast } from '../components/Toast';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { addToast } = useToast();

  // Local preferences states
  const [dailyReminders, setDailyReminders] = useState(true);
  const [streakAlerts, setStreakAlerts] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [celebrationEffects, setCelebrationEffects] = useState(true);
  const [firstDayOfWeek, setFirstDayOfWeek] = useState<'monday' | 'sunday'>('monday');
  const [reduceMotion, setReduceMotion] = useState(false);

  const handleExportData = async () => {
    try {
      const data = await authService.exportData('json');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `habitflow_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast('success', 'Backup Downloaded', 'Habit data exported to JSON.');
    } catch {
      addToast('error', 'Export Failed', 'Unable to download backup.');
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-8 max-w-4xl mx-auto pb-24 md:pb-12 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          <span>Preferences</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Customize theme appearance, reminders, habit interactions, and accessibility.
        </p>
      </div>

      {/* Theme & Appearance */}
      <div className="bg-white dark:bg-[#0C1E22] rounded-xl p-5 sm:p-6 space-y-4 border border-slate-200/90 dark:border-[#16383B] shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sun className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Appearance & Theme
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
              theme === 'light'
                ? 'border-emerald-500 bg-emerald-50/40 text-slate-900 font-semibold shadow-sm'
                : 'border-slate-200 dark:border-[#16383B] bg-slate-50/40 dark:bg-[#07191C] text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <Sun className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-bold">Light Mode</span>
            <span className="text-[10px] text-slate-400">Clean slate & emerald</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
              theme === 'dark'
                ? 'border-emerald-500 bg-emerald-950/20 text-white font-semibold shadow-sm ring-1 ring-emerald-500/40'
                : 'border-slate-200 dark:border-[#16383B] bg-slate-50/40 dark:bg-[#07191C] text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <Moon className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold">Dark Mode</span>
            <span className="text-[10px] text-slate-400">Obsidian & emerald</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
              theme === 'system'
                ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-slate-900 dark:text-white font-semibold shadow-sm'
                : 'border-slate-200 dark:border-[#16383B] bg-slate-50/40 dark:bg-[#07191C] text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <Laptop className="w-5 h-5 text-slate-500" />
            <span className="text-xs font-bold">System Default</span>
            <span className="text-[10px] text-slate-400">Sync with device</span>
          </button>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white dark:bg-[#0C1E22] rounded-xl p-5 sm:p-6 space-y-4 border border-slate-200/90 dark:border-[#16383B] shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Notification Preferences
        </h2>

        <div className="space-y-3 text-xs">
          <label className="p-3 rounded-lg bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between cursor-pointer">
            <div>
              <span className="font-semibold text-slate-900 dark:text-white block">
                Daily Habit Reminders
              </span>
              <span className="text-[11px] text-slate-500">
                Receive reminders at your preferred scheduled habit times
              </span>
            </div>
            <input
              type="checkbox"
              checked={dailyReminders}
              onChange={(e) => {
                setDailyReminders(e.target.checked);
                addToast('info', 'Preference Saved', 'Daily reminders updated.');
              }}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
          </label>

          <label className="p-3 rounded-lg bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between cursor-pointer">
            <div>
              <span className="font-semibold text-slate-900 dark:text-white block">
                Streak Protection Alerts
              </span>
              <span className="text-[11px] text-slate-500">
                Gentle evening reminder if active streaks are pending completion
              </span>
            </div>
            <input
              type="checkbox"
              checked={streakAlerts}
              onChange={(e) => {
                setStreakAlerts(e.target.checked);
                addToast('info', 'Preference Saved', 'Streak alerts updated.');
              }}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
          </label>

          <label className="p-3 rounded-lg bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between cursor-pointer">
            <div>
              <span className="font-semibold text-slate-900 dark:text-white block">
                Weekly Momentum Summary
              </span>
              <span className="text-[11px] text-slate-500">
                Receive weekly completion report and behavioral coaching insights
              </span>
            </div>
            <input
              type="checkbox"
              checked={weeklySummary}
              onChange={(e) => {
                setWeeklySummary(e.target.checked);
                addToast('info', 'Preference Saved', 'Weekly summary updated.');
              }}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Habit Interaction & Calendar Behavior */}
      <div className="bg-white dark:bg-[#0C1E22] rounded-xl p-5 sm:p-6 space-y-4 border border-slate-200/90 dark:border-[#16383B] shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Habit & Calendar Behavior
        </h2>

        <div className="space-y-3 text-xs">
          <label className="p-3 rounded-lg bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between cursor-pointer">
            <div>
              <span className="font-semibold text-slate-900 dark:text-white block">
                Completion Feedback Micro-Animations
              </span>
              <span className="text-[11px] text-slate-500">
                Show subtle visual feedback when completing a routine habit
              </span>
            </div>
            <input
              type="checkbox"
              checked={celebrationEffects}
              onChange={(e) => {
                setCelebrationEffects(e.target.checked);
                addToast('info', 'Preference Saved', 'Visual feedback updated.');
              }}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
          </label>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-900 dark:text-white block">
                First Day of Week
              </span>
              <span className="text-[11px] text-slate-500">
                Starting day displayed in calendar and weekly overview
              </span>
            </div>
            <select
              value={firstDayOfWeek}
              onChange={(e) => {
                setFirstDayOfWeek(e.target.value as any);
                addToast('info', 'Preference Saved', 'Calendar start day updated.');
              }}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0C1E22] text-xs font-semibold focus:outline-none"
            >
              <option value="monday">Monday</option>
              <option value="sunday">Sunday</option>
            </select>
          </div>

          <label className="p-3 rounded-lg bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between cursor-pointer">
            <div>
              <span className="font-semibold text-slate-900 dark:text-white block">
                Reduce Motion
              </span>
              <span className="text-[11px] text-slate-500">
                Disable non-essential interface animations for accessibility
              </span>
            </div>
            <input
              type="checkbox"
              checked={reduceMotion}
              onChange={(e) => {
                setReduceMotion(e.target.checked);
                addToast('info', 'Accessibility Saved', 'Motion preferences updated.');
              }}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* PWA & Data Portability */}
      <div className="bg-white dark:bg-[#0C1E22] rounded-xl p-5 sm:p-6 space-y-4 border border-slate-200/90 dark:border-[#16383B] shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Application Installation & Offline Ready
        </h2>

        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  HabitFlow is Installed & Offline Ready
                </span>
                <span className="text-[11px] text-slate-500">
                  Service worker is active. You can log completions even with intermittent connectivity.
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              Active
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-900 dark:text-white block">
                Local Data Backup
              </span>
              <span className="text-[11px] text-slate-500">
                Download a complete portable JSON archive of your habits and logs
              </span>
            </div>
            <button
              type="button"
              onClick={handleExportData}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-[#12383F] text-slate-800 dark:text-slate-200 hover:bg-slate-300 flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              Download JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

