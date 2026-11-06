import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export function Card({ children, className = '', hoverable = false, ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-saas border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-5 transition-all ${
        hoverable ? 'hover:shadow-md hover:border-slate-300' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
