import React from 'react';
import { cn } from '../../utils/cn';

export default function SkeletonLoader({ rows = 5, cols = 4, cardCount, cardHeight = 'h-28' }) {
  // Card grid skeleton
  if (cardCount) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(cardCount)].map((_, i) => (
          <div key={i} className={cn('bg-white border border-border rounded-2xl animate-pulse', cardHeight)} />
        ))}
      </div>
    );
  }

  // Table skeleton
  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-bg border-b border-border px-4 py-3 flex gap-6">
        {[...Array(cols)].map((_, i) => (
          <div key={i} className="h-3 bg-border rounded-full flex-1 animate-pulse" />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y divide-border">
        {[...Array(rows)].map((_, r) => (
          <div key={r} className="px-4 py-3.5 flex gap-6">
            {[...Array(cols)].map((_, c) => (
              <div
                key={c}
                className={cn('h-4 bg-border/60 rounded-full animate-pulse', c === 0 ? 'w-8' : 'flex-1')}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
