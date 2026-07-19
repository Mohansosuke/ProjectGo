import React from 'react';
import { cn } from '../../lib/utils';

/**
 * @typedef {Object} InputProps
 * @property {string} [className]
 * @property {string} [label]
 * @property {string} [error]
 * @property {string} [hint]
 * @property {React.ComponentType<any>} [icon]
 * @property {React.ComponentType<any>} [iconRight]
 */

/** @type {React.ForwardRefExoticComponent<InputProps & React.InputHTMLAttributes<HTMLInputElement> & React.RefAttributes<HTMLInputElement>>} */
const Input = React.forwardRef(
  (
    {
      className = '',
      label = undefined,
      error = undefined,
      hint = undefined,
      icon: Icon = undefined,
      iconRight: IconRight = undefined,
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-xs font-semibold text-gray-600 tracking-[-0.005em]">
            {label}
            {props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900',
              'placeholder:text-gray-400 font-medium',
              'transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
              'hover:border-gray-300',
              'disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-gray-50',
              Icon && 'pl-9',
              IconRight && 'pr-9',
              error
                ? 'border-red-300 bg-red-50/30 focus:ring-red-500/20 focus:border-red-500'
                : 'border-gray-200',
              className
            )}
            {...props}
          />
          {IconRight && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 pointer-events-none">
              <IconRight className="h-4 w-4" />
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
            <span className="inline-block w-1 h-1 rounded-full bg-red-500 shrink-0" />
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-xs text-gray-400 font-medium">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
