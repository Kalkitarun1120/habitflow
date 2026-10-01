import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle: React.FC<{ showLabel?: boolean }> = ({ showLabel = false }) => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-1 rounded-full border border-slate-200 dark:border-slate-700/60 shadow-inner">
      <button
        onClick={() => setTheme('light')}
        className={`p-1.5 rounded-full transition-all duration-150 ${
          theme === 'light'
            ? 'bg-white text-emerald-600 shadow-sm font-bold scale-105'
            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
        }`}
        title="Light Mode"
        aria-label="Light Mode"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-1.5 rounded-full transition-all duration-150 ${
          theme === 'dark'
            ? 'bg-[#131B26] text-emerald-400 shadow-sm font-bold scale-105 ring-1 ring-slate-700'
            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
        }`}
        title="Dark Mode"
        aria-label="Dark Mode"
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-1.5 rounded-full transition-all duration-150 ${
          theme === 'system'
            ? 'bg-white dark:bg-[#131B26] text-emerald-600 dark:text-emerald-400 shadow-sm font-bold scale-105'
            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
        }`}
        title="System Default"
        aria-label="System Default"
      >
        <Laptop className="w-4 h-4" />
      </button>
      {showLabel && (
        <span className="text-xs font-semibold px-2 text-slate-700 dark:text-slate-300">
          {theme.charAt(0).toUpperCase() + theme.slice(1)}
        </span>
      )}
    </div>
  );
};
