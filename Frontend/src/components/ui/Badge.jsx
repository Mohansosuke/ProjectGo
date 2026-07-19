import React from 'react';
import { cn } from '../../lib/utils';

const badgeVariants = {
  default: 'bg-gray-100 text-gray-700 border-gray-200',
  primary: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  indigo:  'bg-indigo-50 text-indigo-700 border-indigo-200',
  violet:  'bg-violet-50 text-violet-700 border-violet-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger:  'bg-red-50 text-red-700 border-red-200',
  purple:  'bg-purple-50 text-purple-700 border-purple-200',
  pink:    'bg-pink-50 text-pink-700 border-pink-200',
  cyan:    'bg-cyan-50 text-cyan-700 border-cyan-200',
  blue:    'bg-blue-50 text-blue-700 border-blue-200',
  outline: 'bg-transparent text-gray-600 border-gray-200',
};

const badgeSizes = {
  xs: 'px-1.5 py-0.5 text-[10px] rounded-[5px]',
  sm: 'px-2 py-0.5 text-[11px] rounded-md',
  md: 'px-2.5 py-0.5 text-xs rounded-md',
  lg: 'px-3 py-1 text-xs rounded-lg',
};

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  dot = undefined,
  icon: Icon = undefined,
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 border font-semibold leading-none whitespace-nowrap',
        badgeVariants[variant],
        badgeSizes[size],
        className
      )}
    >
      {dot && (
        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', dot)} />
      )}
      {Icon && <Icon className="h-3 w-3 shrink-0" />}
      {children}
    </span>
  );
};

export default Badge;
