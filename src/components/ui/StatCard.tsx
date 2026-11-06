import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from './Card';

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  iconColor?: 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose';
  className?: string;
}

export function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  trend,
  iconColor = 'blue',
  className = '',
}: StatCardProps) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  };

  return (
    <Card className={`flex items-center gap-4 ${className}`}>
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorMap[iconColor]}`}
      >
        <Icon className="w-6 h-6" />
      </div>
      <div className="truncate">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
          {title}
        </p>
        <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5 tracking-tight truncate">
          {value}
        </h3>
        {(subtitle || trend) && (
          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
            {trend && <span className="font-semibold text-emerald-600 mr-1">{trend}</span>}
            {subtitle}
          </p>
        )}
      </div>
    </Card>
  );
}
