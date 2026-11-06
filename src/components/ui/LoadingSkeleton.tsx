import React from 'react';

export function LoadingSkeleton({
  className = '',
  rows = 1,
}: {
  className?: string;
  rows?: number;
}) {
  if (rows > 1) {
    return (
      <div className="space-y-2.5 animate-pulse">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className={`h-4 bg-slate-200/80 rounded-md ${className}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`animate-pulse bg-slate-200/80 rounded-md ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="p-5 bg-white rounded-saas border border-slate-200/80 shadow-xs animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl bg-slate-200" />
        <div className="w-16 h-5 rounded-full bg-slate-200" />
      </div>
      <div className="space-y-2">
        <div className="w-2/3 h-5 rounded bg-slate-200" />
        <div className="w-full h-3.5 rounded bg-slate-100" />
      </div>
      <div className="pt-3 border-t border-slate-100 flex justify-between">
        <div className="w-20 h-4 rounded bg-slate-100" />
        <div className="w-14 h-4 rounded bg-slate-200" />
      </div>
    </div>
  );
}
