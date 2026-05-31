import React from 'react';
import { PackageSearch } from 'lucide-react';

/**
 * EmptyState — Centered illustration with message and optional CTA.
 */
export default function EmptyState({ message = 'No data found', action, icon: Icon = PackageSearch }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 bg-bg rounded-2xl flex items-center justify-center mb-4 border border-border">
        <Icon size={28} className="text-grayMid" />
      </div>
      <p className="text-navy font-semibold font-display mb-1">{message}</p>
      <p className="text-gray text-sm mb-4">Try adjusting your filters or add new data.</p>
      {action && <div>{action}</div>}
    </div>
  );
}
