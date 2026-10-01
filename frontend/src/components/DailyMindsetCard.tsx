import React, { useState, useEffect } from 'react';
import { Flame, RefreshCw } from 'lucide-react';
import { getRandomQuote, type MotivationalQuote } from '../config/developer';

interface DailyMindsetCardProps {
  compact?: boolean;
  className?: string;
}

export const DailyMindsetCard: React.FC<DailyMindsetCardProps> = ({
  compact = false,
  className = '',
}) => {
  const [quote, setQuote] = useState<MotivationalQuote>(() => getRandomQuote());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initialize from sessionStorage if available to persist for the session, or generate one
  useEffect(() => {
    const saved = sessionStorage.getItem('habitflow_daily_quote');
    if (saved) {
      try {
        setQuote(JSON.parse(saved));
      } catch {
        // fallback
      }
    } else {
      const q = getRandomQuote();
      setQuote(q);
      sessionStorage.setItem('habitflow_daily_quote', JSON.stringify(q));
    }
  }, []);

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshing(true);
    const next = getRandomQuote(quote.id);
    setQuote(next);
    sessionStorage.setItem('habitflow_daily_quote', JSON.stringify(next));
    setTimeout(() => setIsRefreshing(false), 300);
  };

  if (compact) {
    return (
      <div
        className={`rounded-2xl p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2 text-left relative group transition-all duration-150 ${className}`}
      >
        <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
              <Flame className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wide">Daily Mindset</span>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="p-1 rounded-md text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all focus:outline-none"
            title="New quote"
            aria-label="Refresh motivational quote"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <p className="text-xs italic text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
          "{quote.quote}"
        </p>

        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block">
          — {quote.author}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl p-5 bg-white dark:bg-[#0C1E22] border border-slate-200/90 dark:border-[#16383B] shadow-xs space-y-2.5 transition-all duration-150 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <div className="w-7 h-7 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
            <Flame className="w-4 h-4 fill-current" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider">Daily Mindset</span>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none"
          title="New quote"
          aria-label="Refresh quote"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">New Quote</span>
        </button>
      </div>

      <p className="text-xs sm:text-sm italic text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
        "{quote.quote}"
      </p>

      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block">
        — {quote.author}
      </span>
    </div>
  );
};
