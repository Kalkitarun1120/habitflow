import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F17] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full glass-card rounded-3xl p-8 space-y-6 border border-slate-200 dark:border-slate-800">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto shadow-md">
          <AlertCircle className="w-8 h-8 stroke-[2.2]" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white">404</h1>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Page Not Found</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            The habit page you are looking for does not exist or has been moved.
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-sm shadow-md shadow-emerald-600/20 dark:shadow-emerald-500/25 transition-all"
        >
          <Home className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};
