import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

const Dropdown = ({
  trigger,
  children,
  align = 'right',
  width = 'w-56',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer"
        role="button"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ duration: 0.12 }}
            className={cn(
              'absolute z-50 mt-1.5 rounded-lg bg-white shadow-lg border border-slate-200/80',
              'ring-1 ring-black/5 focus:outline-none overflow-hidden',
              width,
              align === 'right'
                ? 'right-0 origin-top-right'
                : 'left-0 origin-top-left',
              className
            )}
          >
            <div
              className="py-1"
              onClick={() => setIsOpen(false)}
              role="menu"
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Dropdown sub-components
Dropdown.Item = ({ children, icon: Icon = undefined, danger = false, className = '', ...props }) => (
  <button
    className={cn(
      'w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors text-left',
      danger
        ? 'text-red-600 hover:bg-red-50'
        : 'text-slate-700 hover:bg-slate-50',
      className
    )}
    role="menuitem"
    {...props}
  >
    {Icon && <Icon className="w-4 h-4 shrink-0 opacity-60" />}
    {children}
  </button>
);

Dropdown.Label = ({ children, className = '' }) => (
  <div
    className={cn(
      'px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider',
      className
    )}
  >
    {children}
  </div>
);

Dropdown.Separator = () => (
  <div className="my-1 border-t border-slate-100" role="separator" />
);

export default Dropdown;
