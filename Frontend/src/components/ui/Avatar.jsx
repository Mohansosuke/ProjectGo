import React from 'react';
import { cn, getInitials } from '../../lib/utils';

const sizeMap = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-xl',
  '2xl': 'h-24 w-24 text-2xl',
};

const statusDotSize = {
  xs: 'h-1.5 w-1.5',
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
  xl: 'h-3.5 w-3.5',
  '2xl': 'h-4 w-4',
};

const statusColors = {
  Online: 'bg-emerald-500',
  Offline: 'bg-slate-400',
  Busy: 'bg-amber-500',
  Away: 'bg-yellow-400',
};

/**
 * @typedef {Object} AvatarProps
 * @property {string} [src]
 * @property {string} [name]
 * @property {'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'} [size]
 * @property {string} [className]
 * @property {'Online' | 'Offline' | 'Busy' | 'Away'} [status]
 * @property {boolean} [ring]
 */

/**
 * @param {AvatarProps} props
 */
const Avatar = ({ src, name = '', size = 'md', className = '', status, ring = false }) => {
  return (
    <div className="relative inline-flex shrink-0">
      <div
        className={cn(
          'relative flex shrink-0 overflow-hidden rounded-full items-center justify-center',
          'bg-gradient-to-br from-slate-100 to-slate-200 font-semibold text-slate-600',
          ring && 'ring-2 ring-white',
          sizeMap[size],
          className
        )}
      >
        {src ? (
          <img
            src={src}
            alt={name || 'Avatar'}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>

      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-white',
            statusColors[status] || 'bg-slate-400',
            statusDotSize[size]
          )}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
};

export default Avatar;
