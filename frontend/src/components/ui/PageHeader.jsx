import React from 'react';

/**
 * PageHeader — Consistent page title bar with optional CTA button.
 */
export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-navy">{title}</h1>
        {subtitle && <p className="text-gray text-sm mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
}
