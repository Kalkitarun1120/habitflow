import React, { useMemo, useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import type { YearCalendarResponse } from '../../types';

interface YearHeatmapProps {
  year: number;
  data: YearCalendarResponse | null;
  onPrevYear?: () => void;
  onNextYear?: () => void;
  onCurrentYear?: () => void;
  onSelectYear?: (year: number) => void;
  onSelectDate?: (dateStr: string, count: number) => void;
  habitName?: string;
}

interface DayCell {
  date: string;
  dayNumber: number;
  count: number;
  isToday: boolean;
}

interface MonthBlock {
  monthName: string;
  yearNumber: number;
  columns: (DayCell | null)[][];
}

export const YearHeatmap: React.FC<YearHeatmapProps> = ({
  year,
  data,
  onSelectYear,
  onSelectDate,
  habitName,
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedRange, setSelectedRange] = useState<number | 'current'>(
    year === currentYear ? 'current' : year
  );
  const [hoveredCell, setHoveredCell] = useState<{ date: string; count: number } | null>(null);

  const totalCheckins = data?.total_checkins || 0;
  const totalActiveDays = data?.total_active_days || 0;
  const maxStreak = data?.max_streak || 0;
  const dailyCounts = data?.daily_counts || {};

  // Build the 12 month blocks matching the reference structure
  const monthBlocks = useMemo(() => {
    const blocks: MonthBlock[] = [];
    const today = new Date();

    if (selectedRange === 'current') {
      // Past 12 rolling months: from 11 months ago to current month
      for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const mIdx = d.getMonth();
        const yNum = d.getFullYear();
        const monthName = d.toLocaleDateString('en-US', { month: 'short' });

        const daysInMonth = new Date(yNum, mIdx + 1, 0).getDate();
        const firstDayOfWeek = new Date(yNum, mIdx, 1).getDay(); // 0 is Sunday

        const columns: (DayCell | null)[][] = [];
        let currentCol: (DayCell | null)[] = [];

        // Leading pad to align 1st day of month to its weekday (Sun=0)
        for (let pad = 0; pad < firstDayOfWeek; pad++) {
          currentCol.push(null);
        }

        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${yNum}-${String(mIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday = dateStr === today.toISOString().split('T')[0];
          const count = dailyCounts[dateStr] || 0;

          currentCol.push({
            date: dateStr,
            dayNumber: day,
            count,
            isToday,
          });

          if (currentCol.length === 7) {
            columns.push(currentCol);
            currentCol = [];
          }
        }

        // Trailing pad to ensure every column is exactly 7 cells high
        if (currentCol.length > 0) {
          while (currentCol.length < 7) {
            currentCol.push(null);
          }
          columns.push(currentCol);
        }

        blocks.push({
          monthName,
          yearNumber: yNum,
          columns,
        });
      }
    } else {
      // Specific calendar year: Jan to Dec
      const targetYear = typeof selectedRange === 'number' ? selectedRange : year;
      for (let mIdx = 0; mIdx < 12; mIdx++) {
        const d = new Date(targetYear, mIdx, 1);
        const monthName = d.toLocaleDateString('en-US', { month: 'short' });
        const daysInMonth = new Date(targetYear, mIdx + 1, 0).getDate();
        const firstDayOfWeek = new Date(targetYear, mIdx, 1).getDay();

        const columns: (DayCell | null)[][] = [];
        let currentCol: (DayCell | null)[] = [];

        for (let pad = 0; pad < firstDayOfWeek; pad++) {
          currentCol.push(null);
        }

        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${targetYear}-${String(mIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday = dateStr === today.toISOString().split('T')[0];
          const count = dailyCounts[dateStr] || 0;

          currentCol.push({
            date: dateStr,
            dayNumber: day,
            count,
            isToday,
          });

          if (currentCol.length === 7) {
            columns.push(currentCol);
            currentCol = [];
          }
        }

        if (currentCol.length > 0) {
          while (currentCol.length < 7) {
            currentCol.push(null);
          }
          columns.push(currentCol);
        }

        blocks.push({
          monthName,
          yearNumber: targetYear,
          columns,
        });
      }
    }

    return blocks;
  }, [selectedRange, year, dailyCounts]);

  const maxCount = useMemo(() => {
    let max = 1;
    Object.values(dailyCounts).forEach((c) => {
      if (c > max) max = c;
    });
    return max;
  }, [dailyCounts]);

  const getCellColor = (count: number) => {
    if (count === 0) {
      return 'bg-[#202326] border border-transparent hover:border-slate-500';
    }
    const ratio = count / maxCount;
    if (ratio >= 0.75 || count >= 4) {
      // Level 4: Neon Green Glow
      return 'bg-[#39D353] border-[#39D353] text-black shadow-[0_0_8px_rgba(57,211,83,0.7)] hover:shadow-[0_0_14px_rgba(57,211,83,0.95)] hover:scale-125 z-10';
    }
    if (ratio >= 0.5 || count >= 3) {
      // Level 3: Bright Green
      return 'bg-[#26A641] border-[#26A641] text-white shadow-[0_0_5px_rgba(38,166,65,0.5)] hover:shadow-[0_0_10px_rgba(38,166,65,0.8)] hover:scale-125 z-10';
    }
    if (ratio >= 0.25 || count >= 2) {
      // Level 2: Medium Green
      return 'bg-[#006D32] border-[#006D32] text-white shadow-[0_0_3px_rgba(0,109,50,0.35)] hover:scale-125 z-10';
    }
    // Level 1: Dark Pine Green
    return 'bg-[#0E4429] border-[#0E4429] text-white hover:scale-125 z-10';
  };

  const handleRangeChange = (val: string) => {
    if (val === 'current') {
      setSelectedRange('current');
      if (onSelectYear) onSelectYear(0);
    } else {
      const num = Number(val);
      setSelectedRange(num);
      if (onSelectYear) onSelectYear(num);
    }
  };

  return (
    <div className="bg-[#151719] dark:bg-[#151719] border border-[#23272D] dark:border-[#23272D] rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm transition-all">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Total Submissions Counter with tooltip */}
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
            <span className="font-extrabold text-white text-lg sm:text-xl">
              {totalCheckins}
            </span>
            <span className="text-slate-300 font-medium">
              {selectedRange === 'current'
                ? 'submissions in the past one year'
                : `submissions in ${selectedRange}`}
            </span>
          </h2>
          <div className="relative group cursor-pointer" title="Verified habit completion entries recorded in database">
            <Info className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 transition-colors" />
          </div>
          {habitName && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#1B1D20] text-[#35C86B] border border-[#2A2E35] font-semibold ml-1">
              {habitName}
            </span>
          )}
        </div>

        {/* Right Stats & Timeframe Dropdown */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Total active days:</span>
            <span className="font-bold text-slate-100">{totalActiveDays}</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Max streak:</span>
            <span className="font-bold text-slate-100">{maxStreak}</span>
          </div>

          {/* Year/Timeframe Dropdown */}
          <div className="relative inline-block">
            <select
              value={selectedRange}
              onChange={(e) => handleRangeChange(e.target.value)}
              className="appearance-none bg-[#202327] hover:bg-[#282B30] text-slate-200 text-xs font-semibold py-1.5 pl-3 pr-7 rounded-lg border border-[#2E3238] focus:outline-none focus:border-[#35C86B] cursor-pointer transition-all"
              aria-label="Select heatmap period"
            >
              <option value="current">Current</option>
              <option value={currentYear}>{currentYear}</option>
              <option value={currentYear - 1}>{currentYear - 1}</option>
              <option value={currentYear - 2}>{currentYear - 2}</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Structured 12 Month Blocks with Aligned Bottom Labels */}
      <div className="w-full pt-1">
        <div className="w-full flex items-start justify-between gap-1 sm:gap-2 md:gap-2.5 lg:gap-3">
          {monthBlocks.map((block, bIdx) => (
            <div key={bIdx} className="flex flex-col items-center gap-2 shrink-0 sm:shrink">
              {/* Columns for this month (every column is exactly 7 cells high) */}
              <div className="flex gap-[1.5px] sm:gap-[2px] md:gap-[2.5px]">
                {block.columns.map((col, cIdx) => (
                  <div key={cIdx} className="flex flex-col gap-[1.5px] sm:gap-[2px] md:gap-[2.5px]">
                    {col.map((day, dIdx) => {
                      if (!day) {
                        return (
                          <div
                            key={dIdx}
                            className="w-[9px] h-[9px] sm:w-[11px] sm:h-[11px] md:w-[12px] md:h-[12px] lg:w-[13px] lg:h-[13px] rounded-[2px] opacity-0 pointer-events-none"
                          />
                        );
                      }

                      return (
                        <button
                          key={dIdx}
                          type="button"
                          onMouseEnter={() => setHoveredCell({ date: day.date, count: day.count })}
                          onMouseLeave={() => setHoveredCell(null)}
                          onClick={() => onSelectDate && onSelectDate(day.date, day.count)}
                          className={`w-[9px] h-[9px] sm:w-[11px] sm:h-[11px] md:w-[12px] md:h-[12px] lg:w-[13px] lg:h-[13px] rounded-[2px] transition-all duration-150 cursor-pointer ${getCellColor(
                            day.count
                          )} ${
                            day.isToday
                              ? 'ring-1.5 ring-white/90 ring-offset-1 ring-offset-[#151719]'
                              : ''
                          }`}
                          title={`${day.count} submissions on ${day.date}`}
                          aria-label={`${day.count} check-ins on ${day.date}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Month Label directly underneath each month block */}
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 select-none text-center">
                {block.monthName}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Hover Status Bar / Legend */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-[#23272D] text-xs text-slate-400">
        <div className="text-[11px] font-medium text-slate-400 min-h-[18px]">
          {hoveredCell ? (
            <span className="text-white font-semibold">
              <span className="text-[#39D353] font-bold">{hoveredCell.count}</span> check-in{hoveredCell.count === 1 ? '' : 's'} on{' '}
              {new Date(hoveredCell.date + 'T00:00:00').toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          ) : (
            <span>Hover or tap any cell to view daily habit records</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-slate-500">Less</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-[2.5px] bg-[#202326] border border-transparent" title="0" />
            <span className="w-3 h-3 rounded-[2.5px] bg-[#0E4429]" title="1" />
            <span className="w-3 h-3 rounded-[2.5px] bg-[#006D32]" title="2" />
            <span className="w-3 h-3 rounded-[2.5px] bg-[#26A641]" title="3" />
            <span className="w-3 h-3 rounded-[2.5px] bg-[#39D353] shadow-[0_0_6px_rgba(57,211,83,0.7)]" title="4+" />
          </div>
          <span className="text-slate-500">More</span>
        </div>
      </div>
    </div>
  );
};
