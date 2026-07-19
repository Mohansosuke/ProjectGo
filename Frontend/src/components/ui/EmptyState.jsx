import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * @typedef {Object} EmptyStateProps
 * @property {React.ComponentType<any>} [icon]
 * @property {string} [title]
 * @property {string} [description]
 * @property {React.ReactNode} [action]
 * @property {string} [className]
 * @property {boolean} [compact]
 */

/**
 * @param {EmptyStateProps} props
 */
const EmptyState = ({
  icon: Icon,
  title = '',
  description = '',
  action,
  className = '',
  compact = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8 px-4' : 'py-16 px-6',
        className
      )}
    >
      {Icon && (
        <div
          className={cn(
            'flex items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 mb-4',
            compact ? 'h-12 w-12' : 'h-16 w-16'
          )}
        >
          <Icon className={compact ? 'w-5 h-5' : 'w-7 h-7'} />
        </div>
      )}

      {title && (
        <h3
          className={cn(
            'font-semibold text-slate-800 mb-1.5',
            compact ? 'text-sm' : 'text-base'
          )}
        >
          {title}
        </h3>
      )}

      {description && (
        <p
          className={cn(
            'text-slate-500 max-w-sm leading-relaxed',
            compact ? 'text-xs mb-4' : 'text-sm mb-6'
          )}
        >
          {description}
        </p>
      )}

      {action && <div>{action}</div>}
    </motion.div>
  );
};

export default EmptyState;
