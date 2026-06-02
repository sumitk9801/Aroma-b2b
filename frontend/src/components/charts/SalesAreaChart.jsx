import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { formatCurrency, formatShortDate } from '../../utils/formatters';
import { cn } from '../../utils/cn';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-xl px-3 py-2 shadow-dropdown">
      <p className="text-grayMid text-xs mb-1">{label}</p>
      <p className="font-display font-bold text-navy text-sm">{formatCurrency(payload[0]?.value)}</p>
    </div>
  );
};

export default function SalesAreaChart({ last7Days = [], last30Days = [] }) {
  const [range, setRange] = useState('7');

  const rawData = range === '7' ? last7Days : last30Days;
  const data = rawData.map((item) => ({
    date: formatShortDate(item.date || item.day || item.label),
    revenue: Number(item.revenue || item.totalRevenue || item.amount || 0),
  }));

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-display font-semibold text-navy">Sales Revenue</h3>
          <p className="text-gray text-xs mt-0.5">Revenue trend over selected period</p>
        </div>
        <div className="flex items-center gap-1 bg-bg rounded-xl p-1 border border-border">
          {['7', '30'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-xs font-semibold transition-all',
                range === r
                  ? 'bg-neon text-white shadow-sm'
                  : 'text-grayMid hover:text-navy'
              )}
            >
              {r} Days
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7dad3f" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#7dad3f" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fill: '#9D9DA3', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#1B1946"
            strokeWidth={2}
            fill="url(#salesGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#7dad3f', stroke: '#1B1946', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
