import { format, parseISO, isValid } from 'date-fns';

/**
 * Format a number as Indian Rupee currency.
 * e.g. 84200 → "₹84,200"
 */
export const formatCurrency = (n) => {
  const num = Number(n) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

/**
 * Format a number with Indian locale separators.
 * e.g. 1234567 → "12,34,567"
 */
export const formatNumber = (n) => {
  const num = Number(n) || 0;
  return new Intl.NumberFormat('en-IN').format(num);
};

/**
 * Format a date string or Date object.
 * e.g. "2024-01-15T10:30:00Z" → "15 Jan 2024, 10:30 AM"
 */
export const formatDate = (d) => {
  if (!d) return '—';
  try {
    const date = typeof d === 'string' ? parseISO(d) : new Date(d);
    if (!isValid(date)) return '—';
    return format(date, 'dd MMM yyyy, hh:mm a');
  } catch {
    return '—';
  }
};

/**
 * Format a date string as short date only.
 * e.g. "2024-01-15" → "15 Jan"
 */
export const formatShortDate = (d) => {
  if (!d) return '—';
  try {
    const date = typeof d === 'string' ? parseISO(d) : new Date(d);
    if (!isValid(date)) return '—';
    return format(date, 'dd MMM');
  } catch {
    return '—';
  }
};

/**
 * Format a date string as full date only (no time).
 * e.g. "2024-01-15" → "15 Jan 2024"
 */
export const formatDateOnly = (d) => {
  if (!d) return '—';
  try {
    const date = typeof d === 'string' ? parseISO(d) : new Date(d);
    if (!isValid(date)) return '—';
    return format(date, 'dd MMM yyyy');
  } catch {
    return '—';
  }
};

/**
 * Truncate a string to a given max length with ellipsis.
 */
export const truncate = (str, maxLen = 30) => {
  if (!str) return '';
  return str.length > maxLen ? `${str.slice(0, maxLen)}…` : str;
};

/**
 * Calculate percentage change between two values.
 * Returns a formatted string like "+12.4%" or "-3.2%"
 */
export const formatPercentChange = (current, previous) => {
  if (!previous || previous === 0) return null;
  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
};

/**
 * Format a percentage number.
 * e.g. 0.245 → "24.5%"
 */
export const formatPercent = (n, decimals = 1) => {
  const num = Number(n) || 0;
  return `${num.toFixed(decimals)}%`;
};
