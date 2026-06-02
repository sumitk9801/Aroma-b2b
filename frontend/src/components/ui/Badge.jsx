import React from 'react';
import { cn } from '../../utils/cn';

const variants = {
  active:   'bg-neon/20 text-navyDeep border border-neon/30',
  inactive: 'bg-red-50 text-red-600 border border-red-200',
  warning:  'bg-amber-50 text-amber-700 border border-amber-200',
  info:     'bg-paleGreen text-navyDeep border border-softGreen',
  admin:    'bg-navyDeep text-neon border border-navyDeep',
  customer: 'bg-border/40 text-grayMid border border-border',
  cash:     'bg-paleGreen text-navyDeep border border-softGreen',
  card:     'bg-blue-50 text-blue-700 border border-blue-200',
  upi:      'bg-purple-50 text-purple-700 border border-purple-200',
  other:    'bg-gray/10 text-grayMid border border-border',
  addition: 'bg-additionGreen/15 text-navyDeep border border-additionGreen/30',
  reduction:'bg-red-50 text-red-600 border border-red-200',
  manual:   'bg-gray/10 text-grayMid border border-border',
  success:  'bg-neon/20 text-navyDeep border border-neon/30',
  danger:   'bg-red-50 text-red-600 border border-red-200',
  sale:     'bg-saleBlue/10 text-saleBlue border border-saleBlue/30',
  purchase: 'bg-purple-50 text-purple-700 border border-purple-200',
};

/**
 * Badge — Pill-shaped semantic label component.
 * 
 * @param {'active'|'inactive'|'warning'|'info'|'admin'|'customer'|'cash'|'card'|'upi'|'other'|'addition'|'reduction'} variant
 * @param {string} className - Extra Tailwind classes
 */
export default function Badge({ children, variant = 'info', className }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
      variants[variant] || variants.info,
      className
    )}>
      {children}
    </span>
  );
}
