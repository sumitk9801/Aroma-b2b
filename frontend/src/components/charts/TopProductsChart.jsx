import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { truncate } from '../../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-xl px-3 py-2 shadow-dropdown">
      <p className="text-grayMid text-xs mb-1">{label}</p>
      <p className="font-display font-bold text-navy text-sm">{payload[0]?.value} units</p>
    </div>
  );
};

/**
 * TopProductsChart — Horizontal bar chart of top-selling products.
 */
export default function TopProductsChart({ data = [] }) {
  const chartData = data.map((item) => ({
    name: truncate(item.name || item.productName || 'Unknown', 18),
    value: Number(item.quantitySold || item.totalQty || item.count || 0),
  }));

  return (
    <div className="card h-full">
      <h3 className="font-display font-semibold text-navy mb-4">Top Products</h3>
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-gray text-sm">No data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fill: '#5B5A6E', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F6F6F5' }} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={i === 0 ? '#7dad3f' : '#6b9835'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
