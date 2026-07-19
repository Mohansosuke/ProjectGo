import React from 'react';
import { cn } from '../../lib/utils';

const Skeleton = ({ className = '', ...props }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-gradient-to-r from-slate-100 via-slate-200/70 to-slate-100 bg-[length:200%_100%]',
        className
      )}
      {...props}
    />
  );
};

// Common presets
Skeleton.Text = ({ lines = 3, className = '' }) => (
  <div className={cn('space-y-2.5', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={cn('h-3.5', i === lines - 1 ? 'w-3/4' : 'w-full')}
      />
    ))}
  </div>
);

Skeleton.Avatar = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-12 w-12' };
  return <Skeleton className={cn('rounded-full', sizes[size], className)} />;
};

Skeleton.Card = ({ className = '' }) => (
  <div className={cn('rounded-xl border border-slate-100 p-5 space-y-4', className)}>
    <div className="flex items-center gap-3">
      <Skeleton.Avatar size="sm" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
    <Skeleton.Text lines={2} />
  </div>
);

export default Skeleton;
