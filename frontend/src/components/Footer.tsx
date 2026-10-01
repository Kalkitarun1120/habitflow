import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { PRODUCT_INFO } from '../config/developer';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white dark:bg-[#07191C] border-t border-slate-200/80 dark:border-[#16383B] text-slate-500 dark:text-slate-400 text-xs transition-colors duration-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand & Tagline */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white dark:text-slate-950 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">
              Habit<span className="text-emerald-600 dark:text-emerald-400">Flow</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden sm:inline">
              Daily Routines
            </span>
          </div>

          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>

          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Build better habits. Track your progress. Stay consistent.
          </span>
        </div>

        {/* Minimal Navigation & Copyright */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
          <Link
            to="/profile"
            className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium"
          >
            Data Export
          </Link>
          <Link
            to="/settings"
            className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium"
          >
            Preferences
          </Link>
          <Link
            to="/profile"
            className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium"
          >
            Profile
          </Link>

          <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>

          <span className="text-slate-400 dark:text-slate-500">
            © {PRODUCT_INFO.copyrightYear} {PRODUCT_INFO.name}. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
};
