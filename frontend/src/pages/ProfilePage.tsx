import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Mail,
  Globe,
  Calendar,
  ShieldCheck,
  Flame,
  Award,
  Download,
  KeyRound,
  LogOut,
  Trash2,
  X,
  ExternalLink,
  Code2,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserAvatar } from '../components/UserAvatar';
import { statisticsService, authService } from '../services/api';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { DEVELOPER_INFO, PRODUCT_INFO } from '../config/developer';
import type { StatisticsResponse } from '../types';

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
);

const LinkedinIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const [stats, setStats] = useState<StatisticsResponse | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Change Password state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Delete Account state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    statisticsService.getStats('all').then(setStats).catch(() => {});
  }, []);

  if (!user) return null;

  const joinedDate = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handleExport = async (format: 'json' | 'csv') => {
    setIsExporting(true);
    try {
      const data = await authService.exportData(format);
      let blob: Blob;
      let filename = `habitflow_export_${new Date().toISOString().split('T')[0]}.${format}`;

      if (format === 'csv') {
        blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
      } else {
        blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast('success', 'Export Complete', `Your data was downloaded as ${format.toUpperCase()}.`);
    } catch {
      addToast('error', 'Export Failed', 'Could not export user data.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      addToast('warning', 'Weak Password', 'New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('warning', 'Mismatch', 'New passwords do not match.');
      return;
    }

    setIsSubmittingPassword(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      addToast('success', 'Password Changed', 'Your account password has been updated.');
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      addToast('error', 'Password Error', err.response?.data?.detail || 'Current password incorrect.');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await authService.deleteAccount();
      addToast('info', 'Account Deleted', 'Your account and data have been removed.');
      logout();
    } catch {
      addToast('error', 'Delete Failed', 'Could not delete account.');
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-8 max-w-4xl mx-auto pb-24 md:pb-12 animate-fadeIn">
      {/* 1. Profile Header */}
      <div className="bg-white dark:bg-[#0C1E22] rounded-2xl p-6 sm:p-7 border border-slate-200/90 dark:border-[#16383B] shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <UserAvatar name={user.name} avatar={user.avatar} size="lg" className="w-20 h-20 text-2xl shadow-sm ring-2 ring-emerald-500/30" />
        <div className="text-center sm:text-left space-y-1 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {user.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1.5 font-medium">
            <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            {user.email}
          </p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-800/40">
              <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Verified Account
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-[#07191C] text-slate-600 dark:text-slate-400 text-xs font-semibold border border-slate-200 dark:border-slate-800">
              <Globe className="w-3 h-3" /> {user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-[#07191C] text-slate-600 dark:text-slate-400 text-xs font-semibold border border-slate-200 dark:border-slate-800">
              <Calendar className="w-3 h-3" /> Member since {joinedDate}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Account Performance Statistics */}
      <div className="bg-white dark:bg-[#0C1E22] rounded-xl p-5 border border-slate-200/90 dark:border-[#16383B] space-y-4 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Overall Account Statistics
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Active Habits
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 block">
              {stats?.active_habits || 0}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Done
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 block">
              {stats?.total_completions || 0}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" /> Current Streak
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 block">
              {stats?.current_streak || 0} Days
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-indigo-500" /> Best Streak
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 block">
              {stats?.longest_streak || 0} Days
            </span>
          </div>
        </div>
      </div>

      {/* 3. Account Actions & Data Portability */}
      <div className="bg-white dark:bg-[#0C1E22] rounded-xl p-5 border border-slate-200/90 dark:border-[#16383B] space-y-4 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Account Actions & Data Portability
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Export JSON */}
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Export Data (JSON)
              </span>
              <span className="text-[11px] text-slate-500">
                Download your habits and completions in JSON format
              </span>
            </div>
            <button
              onClick={() => handleExport('json')}
              disabled={isExporting}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-[#12383F] text-slate-800 dark:text-slate-200 hover:bg-slate-300 flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              JSON
            </button>
          </div>

          {/* Export CSV */}
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Export Logs (CSV)
              </span>
              <span className="text-[11px] text-slate-500">
                Download spreadsheet-ready completion entries
              </span>
            </div>
            <button
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-[#12383F] text-slate-800 dark:text-slate-200 hover:bg-slate-300 flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
          </div>

          {/* Change Password */}
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Security & Password
              </span>
              <span className="text-[11px] text-slate-500">
                Update account password
              </span>
            </div>
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-[#12383F] text-slate-800 dark:text-slate-200 hover:bg-slate-300 flex items-center gap-1 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Update
            </button>
          </div>

          {/* Logout */}
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Session
              </span>
              <span className="text-[11px] text-slate-500">
                Sign out on this device
              </span>
            </div>
            <button
              onClick={logout}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-[#12383F] text-slate-800 dark:text-slate-200 hover:bg-slate-300 flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Delete Account */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block">
              Delete Account
            </span>
            <span className="text-[11px] text-slate-500">
              Permanently erase your account and all associated habit tracking history
            </span>
          </div>
          <button
            onClick={() => setIsDeleteDialogOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Account
          </button>
        </div>
      </div>

      {/* 4. Developer & Contact Section */}
      <div className="bg-white dark:bg-[#0C1E22] rounded-xl p-5 sm:p-6 border border-slate-200/90 dark:border-[#16383B] space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Code2 className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Developer & Contact
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Created & engineered by {DEVELOPER_INFO.name}
              </p>
            </div>
          </div>

          {/* Contact Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {DEVELOPER_INFO.github && (
              <a
                href={DEVELOPER_INFO.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#07191C] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-semibold transition-colors"
                title="GitHub Profile"
              >
                <GithubIcon className="w-3.5 h-3.5" />
                <span>GitHub</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
              </a>
            )}

            {DEVELOPER_INFO.linkedin && (
              <a
                href={DEVELOPER_INFO.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#07191C] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-semibold transition-colors"
                title="LinkedIn Profile"
              >
                <LinkedinIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>LinkedIn</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
              </a>
            )}

            {DEVELOPER_INFO.email && (
              <a
                href={`mailto:${DEVELOPER_INFO.email}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#07191C] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-semibold transition-colors"
                title="Contact via Email"
              >
                <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Email</span>
              </a>
            )}
          </div>
        </div>

        {/* Developer Academic & Technical Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
              Education & Institution
            </span>
            <p className="font-bold text-sm text-slate-900 dark:text-white">
              {DEVELOPER_INFO.name}
            </p>
            <p className="text-slate-700 dark:text-slate-300 font-medium">
              Education: <strong className="text-slate-800 dark:text-slate-200">{DEVELOPER_INFO.degree}</strong>
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              Department: <strong className="text-slate-800 dark:text-slate-200">{DEVELOPER_INFO.department}</strong>
            </p>
            <p className="text-slate-500 dark:text-slate-500 text-[11px]">
              Institution: {DEVELOPER_INFO.institution}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
              Technical Focus
            </span>
            <div className="flex flex-wrap gap-1.5">
              {DEVELOPER_INFO.focusAreas.map((area) => (
                <span
                  key={area}
                  className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white dark:bg-[#0C1E22] border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. About HabitFlow Section */}
      <div className="bg-white dark:bg-[#0C1E22] rounded-xl p-5 sm:p-6 border border-slate-200/90 dark:border-[#16383B] space-y-3 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900 dark:text-white">
              About HabitFlow
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Release v{PRODUCT_INFO.version}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            © {PRODUCT_INFO.copyrightYear} HabitFlow
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          HabitFlow is a modern habit-tracking platform designed to help users build consistent daily routines, understand their progress, and make meaningful improvements through schedule-aware tracking.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-[11px]">
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#07191C] text-center font-medium text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800/60">
            ✓ Habit Tracking
          </div>
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#07191C] text-center font-medium text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800/60">
            ✓ Interactive Calendar
          </div>
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#07191C] text-center font-medium text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800/60">
            ✓ Streak Tracking
          </div>
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#07191C] text-center font-medium text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800/60">
            ✓ Analytics
          </div>
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#07191C] text-center font-medium text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800/60 col-span-2 sm:col-span-1">
            ✓ Data Export
          </div>
        </div>
      </div>

      {/* 6. Contact Me Section */}
      <div className="bg-white dark:bg-[#0C1E22] rounded-xl p-5 sm:p-6 border border-slate-200/90 dark:border-[#16383B] space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <MessageSquare className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Contact Me
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Have feedback, questions, or collaboration ideas? Reach out to {DEVELOPER_INFO.name}.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Email */}
          {DEVELOPER_INFO.email && (
            <a
              href={`mailto:${DEVELOPER_INFO.email}`}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all flex flex-col justify-between gap-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Email
                </span>
                <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                {DEVELOPER_INFO.email}
              </p>
            </a>
          )}

          {/* GitHub */}
          {DEVELOPER_INFO.github && (
            <a
              href={DEVELOPER_INFO.github}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all flex flex-col justify-between gap-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  GitHub
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <GithubIcon className="w-3.5 h-3.5" />
                <span className="truncate">github.com/kalkitarun</span>
              </div>
            </a>
          )}

          {/* LinkedIn */}
          {DEVELOPER_INFO.linkedin && (
            <a
              href={DEVELOPER_INFO.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all flex flex-col justify-between gap-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  LinkedIn
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <LinkedinIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="truncate">linkedin.com/in/kalkitarun</span>
              </div>
            </a>
          )}

          {/* Portfolio */}
          {DEVELOPER_INFO.portfolio && (
            <a
              href={DEVELOPER_INFO.portfolio}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all flex flex-col justify-between gap-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Portfolio
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 dark:hover:text-emerald-400" />
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="truncate">kalkitarun.dev</span>
              </div>
            </a>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#0D2328] border border-slate-200 dark:border-[#16383B] rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Change Password
              </h3>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#07191C] text-slate-900 dark:text-white text-xs font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Password (8+ chars)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#07191C] text-slate-900 dark:text-white text-xs font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#07191C] text-slate-900 dark:text-white text-xs font-medium focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPassword}
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {isSubmittingPassword ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Permanently Delete Account?"
        message="This action cannot be undone. All your habits, streaks, and historical completion entries will be erased permanently."
        confirmLabel="Delete Everything"
        onConfirm={handleDeleteAccount}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
};
