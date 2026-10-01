import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar as CalendarIcon,
  BarChart3,
  User as UserIcon
} from 'lucide-react';

const MOBILE_NAV_ITEMS = [
  { path: '/dashboard', label: 'Today', icon: LayoutDashboard },
  { path: '/habits', label: 'Habits', icon: CheckSquare },
  { path: '/calendar', label: 'Calendar', icon: CalendarIcon },
  { path: '/statistics', label: 'Stats', icon: BarChart3 },
  { path: '/profile', label: 'Profile', icon: UserIcon },
];

export const MobileBottomNav: React.FC = () => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#131B26]/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-2 shadow-xl flex items-center justify-around">
      {MOBILE_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
