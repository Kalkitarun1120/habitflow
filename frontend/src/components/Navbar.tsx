import React, { useState } from 'react';
import { Plus, LogOut, User as UserIcon, Settings, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { UserAvatar } from './UserAvatar';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onOpenNewHabit: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenNewHabit }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  return (
    <header className="sticky top-0 z-30 w-full glass-panel px-4 sm:px-8 py-3 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80">
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Brand Logo & Name */}
        <div
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white dark:text-slate-950 shadow-md shadow-emerald-600/20 dark:shadow-emerald-500/25 group-hover:scale-105 transition-transform duration-150">
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white leading-none">
              Habit<span className="text-emerald-600 dark:text-emerald-400">Flow</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wide uppercase">
              Daily Routines
            </span>
          </div>
        </div>

        {/* Date indicator pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-xs font-semibold border border-slate-200/70 dark:border-slate-700/60">
          <CalendarIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{todayFormatted}</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Quick Add Habit Button (Desktop Only) */}
        <button
          onClick={onOpenNewHabit}
          className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs sm:text-sm shadow-sm hover:shadow-md shadow-emerald-600/20 dark:shadow-emerald-500/25 hover:scale-[1.02] active:scale-95 transition-all duration-150"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Habit</span>
        </button>

        {/* Light/Dark Mode Switcher */}
        <ThemeToggle />

        {/* User Profile Dropdown */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-emerald-500/40 transition-all focus:outline-none"
              aria-label="User menu"
            >
              <UserAvatar name={user.name} avatar={user.avatar} size="sm" />
            </button>

            {showDropdown && (
              <div
                className="absolute right-0 top-12 z-50 w-56 bg-white dark:bg-[#131B26] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 animate-fadeIn"
                onClick={() => setShowDropdown(false)}
              >
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/80">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user.email}
                  </p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => navigate('/profile')}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    My Profile
                  </button>

                  <button
                    onClick={() => navigate('/settings')}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Settings & Appearance
                  </button>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-1">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
