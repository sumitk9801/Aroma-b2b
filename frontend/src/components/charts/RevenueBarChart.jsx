import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency, formatShortDate } from '../../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-xl px-3 py-2 shadow-dropdown">
      <p className="text-grayMid text-xs mb-1">{label}</p>
      <p className="font-display font-bold text-navy text-sm">{formatCurrency(payload[0]?.value)}</p>
    </div>
  );
};

/**
 * RevenueBarChart — Vertical bar chart for daily/monthly sales data.
 */
export default function RevenueBarChart({ data = [], dataKey = 'revenue', labelKey = 'date', title }) {
  const chartData = data.map((item) => ({
    label: formatShortDate(item[labelKey] || item.date || item.day),
    value: Number(item[dataKey] || item.revenue || item.totalRevenue || 0),
  }));

  return (
    <div className="card">
      {title && (
        <h3 className="font-display font-semibold text-navy mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fill: '#9D9DA3', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F6F6F5' }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {chartData.map((_, i) => (
              <Cell key={i} fill="#7dad3f" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
