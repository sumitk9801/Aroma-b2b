import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility to merge Tailwind CSS classes safely using clsx + tailwind-merge.
 * Prevents conflicting Tailwind classes and handles conditional class logic.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
