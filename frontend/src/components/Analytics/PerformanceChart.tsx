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
    <div className="bg-[#151719] dark:bg-[#151719] border border-[#23272D] dark:border-[#23272D] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      {/* Header & Chart Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Completion Trends & Volume
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Smooth behavioral trajectory across scheduled habits
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-[#1B1D20] p-1 border border-[#2A2E35] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setChartType('trend')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              chartType === 'trend'
                ? 'bg-white text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Smooth Curve
          </button>
          <button
            type="button"
            onClick={() => setChartType('volume')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              chartType === 'volume'
                ? 'bg-white text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Rounded Bars
          </button>
        </div>
      </div>

      {/* Interactive Chart Container */}
      <div className="h-64 sm:h-72 w-full pt-2">
        {formattedWeeklyData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500">
            No completion trend logs available.
          </div>
        ) : chartType === 'trend' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedWeeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="emeraldCurveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#35C86B" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#35C86B" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#23272D" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#23272D' }}
              />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#23272D' }}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-[#1B1D20] border border-[#2A2E35] rounded-xl p-3 shadow-xl text-xs space-y-1">
                        <span className="font-bold text-white block">
                          {item.name} ({item.date})
                        </span>
                        <div className="flex items-center gap-2 text-[#35C86B] font-extrabold">
                          <span>{item.completed} completed</span>
                          <span className="text-slate-500">•</span>
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
                stroke="#35C86B"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#emeraldCurveGradient)"
                dot={{ r: 4, fill: '#35C86B', stroke: '#151719', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#35C86B', stroke: '#FFFFFF', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedWeeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#23272D" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#23272D' }}
              />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#23272D' }}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-[#1B1D20] border border-[#2A2E35] rounded-xl p-3 shadow-xl text-xs space-y-1">
                        <span className="font-bold text-white block">
                          {item.name} ({item.date})
                        </span>
                        <div className="flex items-center gap-2 text-[#35C86B] font-extrabold">
                          <span>{item.completed} completed</span>
                          <span className="text-slate-500">•</span>
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
                fill="#35C86B"
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
