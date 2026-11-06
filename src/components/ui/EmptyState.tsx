import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`py-12 px-6 text-center flex flex-col items-center justify-center bg-white rounded-saas border border-dashed border-slate-300/80 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-400 flex items-center justify-center mb-3.5 shadow-2xs">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
