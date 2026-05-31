import React from 'react';

export default function PageSkeleton() {
  return (
    <div className="flex h-screen bg-bg">
      {/* Sidebar skeleton */}
      <div className="w-64 bg-navyDeep flex-shrink-0 animate-pulse">
        <div className="p-5 border-b border-white/10">
          <div className="h-8 w-32 bg-white/10 rounded-xl" />
        </div>
        <div className="p-4 space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-9 bg-white/5 rounded-xl" />
          ))}
        </div>
      </div>
      {/* Main area skeleton */}
      <div className="flex-1 flex flex-col">
        <div className="h-16 bg-bg border-b border-border flex items-center px-6 gap-4">
          <div className="h-5 w-32 bg-border rounded-lg animate-pulse" />
          <div className="flex-1 max-w-md h-9 bg-border rounded-xl animate-pulse" />
        </div>
        <div className="flex-1 p-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-28 bg-white border border-border rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-white border border-border rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
