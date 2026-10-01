import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar as CalendarIcon,
  BarChart3,
  User as UserIcon,
  Settings
} from 'lucide-react';
import { DailyMindsetCard } from './DailyMindsetCard';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/habits', label: 'Habits & Routines', icon: CheckSquare },
  { path: '/calendar', label: 'Calendar Grid', icon: CalendarIcon },
  { path: '/statistics', label: 'Analytics', icon: BarChart3 },
  { path: '/profile', label: 'Profile', icon: UserIcon },
  { path: '/settings', label: 'Preferences', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside
      className="hidden md:flex md:sticky top-14 left-0 z-30 h-[calc(100vh-3.5rem)] w-64 bg-white/95 dark:bg-[#131B26]/95 backdrop-blur-md border-r border-slate-200/80 dark:border-slate-800/80 p-5 flex-col justify-between transition-colors duration-200 shrink-0"
    >
      <div className="space-y-6">
        <div className="px-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Workspace
          </p>
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 dark:bg-emerald-500 dark:text-slate-950 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white font-medium'
                  }`
                }
              >
                <Icon className="w-4 h-4 stroke-[2.2]" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Dynamic Motivational Mindset Card */}
      <DailyMindsetCard compact />
    </aside>
  );
};
