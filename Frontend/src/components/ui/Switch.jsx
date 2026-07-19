import React from 'react';
import { cn } from '../../lib/utils';

const Switch = ({ checked = false, onChange = undefined, label = undefined, description = undefined, disabled = false, className = '' }) => {
  return (
    <label
      className={cn(
        'flex items-center justify-between gap-4 cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {(label || description) && (
        <div className="flex-1 min-w-0">
          {label && (
            <span className="text-sm font-semibold text-slate-800 block">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-slate-500 mt-0.5 block">
              {description}
            </span>
          )}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange?.(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          checked ? 'bg-blue-500' : 'bg-slate-200'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200',
            'mt-0.5 ml-0.5',
            checked && 'translate-x-5'
          )}
        />
      </button>
    </label>
  );
};

export default Switch;
