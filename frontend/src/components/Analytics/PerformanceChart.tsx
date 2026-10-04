import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import type { DailyCompletionCount } from '../../types';

interface PerformanceChartProps {
  data: DailyCompletionCount[];
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
}) => {
  const [chartType, setChartType] = React.useState<'trend' | 'volume'>('trend');

  const formattedWeeklyData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((d) => ({
      name: d.day_name.slice(0, 3),
      date: d.date,
      completed: d.completed_count,
      total: d.total_habits,
      rate: d.rate,
    }));
  }, [data]);

  return (
    <div className="bg-white dark:bg-[#151719] border border-slate-200 dark:border-[#23272D] rounded-2xl p-5 sm:p-6 shadow-xs dark:shadow-sm space-y-4 transition-colors">
      {/* Header & Chart Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Completion Trends & Volume
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Smooth behavioral trajectory across scheduled habits
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-[#1B1D20] p-1 border border-slate-200 dark:border-[#2A2E35] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setChartType('trend')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              chartType === 'trend'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-extrabold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Smooth Curve
          </button>
          <button
            type="button"
            onClick={() => setChartType('volume')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              chartType === 'volume'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-extrabold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Rounded Bars
          </button>
        </div>
      </div>

      {/* Interactive Chart Container */}
      <div className="h-64 sm:h-72 w-full pt-2">
        {formattedWeeklyData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
            No completion trend logs available.
          </div>
        ) : chartType === 'trend' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedWeeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="emeraldCurveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" opacity={0.25} vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#CBD5E1', opacity: 0.4 }}
              />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#CBD5E1', opacity: 0.4 }}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-[#1B1D20] border border-slate-200 dark:border-[#2A2E35] rounded-xl p-3 shadow-xl text-xs space-y-1">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {item.name} ({item.date})
                        </span>
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-[#35C86B] font-extrabold">
                          <span>{item.completed} completed</span>
                          <span className="text-slate-400 dark:text-slate-500">•</span>
                          <span>{item.rate}% rate</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="completed"
                stroke="#10B981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#emeraldCurveGradient)"
                dot={{ r: 4, fill: '#10B981', stroke: '#FFFFFF', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#10B981', stroke: '#0F172A', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedWeeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" opacity={0.25} vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#CBD5E1', opacity: 0.4 }}
              />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#CBD5E1', opacity: 0.4 }}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-[#1B1D20] border border-slate-200 dark:border-[#2A2E35] rounded-xl p-3 shadow-xl text-xs space-y-1">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {item.name} ({item.date})
                        </span>
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-[#35C86B] font-extrabold">
                          <span>{item.completed} completed</span>
                          <span className="text-slate-400 dark:text-slate-500">•</span>
                          <span>{item.rate}% compliance</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="completed"
                fill="#10B981"
                radius={[6, 6, 0, 0]}
                maxBarSize={42}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
