import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../utils/cn';

const itemVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

/**
 * StatCard — Dashboard summary card with icon, value, trend indicator.
 * 
 * @param {React.ReactNode} icon - Lucide icon element
 * @param {string} title - Card label
 * @param {string|number} value - Main display value
 * @param {string} trend - Trend text e.g. "+12.4%"
 * @param {'up'|'down'} trendDirection
 * @param {string} subtitle - Secondary caption
 * @param {'neon'|'red'|'amber'} accent - Accent color variant
 */
export default function StatCard({ icon, title, value, trend, trendDirection, subtitle, accent = 'neon' }) {
  const accentMap = {
    neon: 'bg-neon/15 text-navyDeep',
    red:  'bg-red-100 text-red-600',
    amber: 'bg-amber-100 text-amber-700',
    lime: 'bg-lime/20 text-navyDeep',
  };

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(27,25,70,0.12)' }}
      transition={{ duration: 0.2 }}
      className="card flex flex-col gap-3"
    >
      <div className="flex items-start justify-between">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', accentMap[accent])}>
          {React.cloneElement(icon, { size: 18 })}
        </div>
        {trend && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg',
            trendDirection === 'up'
              ? 'bg-neon/15 text-navyDeep'
              : 'bg-red-50 text-red-600'
          )}>
            {trendDirection === 'up'
              ? <TrendingUp size={11} />
              : <TrendingDown size={11} />
            }
            {trend}
          </div>
        )}
      </div>

      <div>
        <p className="text-grayMid text-xs font-medium uppercase tracking-wide mb-1">{title}</p>
        <p className="font-display font-bold text-2xl text-navy leading-none">{value ?? '—'}</p>
        {subtitle && (
          <p className="text-gray text-xs mt-1">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}
