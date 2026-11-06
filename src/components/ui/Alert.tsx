import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export function Alert({
  variant = 'info',
  title,
  children,
  onDismiss,
  className = '',
}: AlertProps) {
  const variantStyles = {
    info: 'bg-blue-50/80 border-blue-200/80 text-blue-900',
    success: 'bg-emerald-50/80 border-emerald-200/80 text-emerald-900',
    warning: 'bg-amber-50/80 border-amber-200/80 text-amber-900',
    danger: 'bg-rose-50/80 border-rose-200/80 text-rose-900',
  };

  const icons = {
    info: <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />,
    danger: <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />,
  };

  return (
    <div
      role="alert"
      className={`p-3.5 rounded-saas border text-xs flex items-start gap-2.5 transition-all ${variantStyles[variant]} ${className}`}
    >
      {icons[variant]}
      <div className="flex-1 leading-relaxed">
        {title && <h4 className="font-bold mb-0.5 tracking-tight">{title}</h4>}
        <div className="text-[11px] opacity-95">{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
