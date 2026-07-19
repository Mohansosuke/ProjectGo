import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = {
  primary:
    'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 active:bg-indigo-800 focus-visible:ring-indigo-500/30',
  secondary:
    'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 focus-visible:ring-gray-400/30',
  outline:
    'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 focus-visible:ring-gray-400/30',
  ghost:
    'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 focus-visible:ring-gray-400/30',
  danger:
    'bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500/30',
  success:
    'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 focus-visible:ring-emerald-500/30',
  violet:
    'bg-violet-600 text-white shadow-sm hover:bg-violet-700 active:bg-violet-800 focus-visible:ring-violet-500/30',
  'ghost-danger':
    'bg-transparent text-red-600 hover:bg-red-50 hover:text-red-700 active:bg-red-100 focus-visible:ring-red-400/30',
};

const buttonSizes = {
  xs: 'h-7 px-2.5 text-xs gap-1.5 rounded-md',
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
  md: 'h-9 px-4 text-sm gap-2 rounded-md',
  lg: 'h-10 px-5 text-sm gap-2 rounded-md',
  xl: 'h-11 px-6 text-sm gap-2.5 rounded-md',
  icon: 'h-9 w-9 rounded-md',
  'icon-sm': 'h-7 w-7 rounded-md',
  'icon-lg': 'h-10 w-10 rounded-md',
};

/**
 * @typedef {Object} ButtonProps
 * @property {string} [className]
 * @property {'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'violet' | 'ghost-danger'} [variant]
 * @property {'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon' | 'icon-sm' | 'icon-lg'} [size]
 * @property {React.ReactNode} [children]
 * @property {boolean} [isLoading]
 * @property {React.ComponentType<any>} [icon]
 * @property {React.ComponentType<any>} [iconRight]
 * @property {boolean} [asChild]
 */

/** @type {React.ForwardRefExoticComponent<ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement>>} */
const Button = React.forwardRef(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      children,
      isLoading = false,
      icon: Icon = undefined,
      iconRight: IconRight = undefined,
      asChild = false,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.1 }}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
          'disabled:pointer-events-none disabled:opacity-50',
          'cursor-pointer select-none',
          buttonVariants[variant],
          buttonSizes[size],
          className
        )}
        disabled={isLoading || props.disabled}
        {.../** @type {any} */ (props)}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : Icon ? (
          <Icon className="h-3.5 w-3.5 shrink-0" />
        ) : null}
        {children}
        {IconRight && !isLoading && (
          <IconRight className="h-3.5 w-3.5 shrink-0" />
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
