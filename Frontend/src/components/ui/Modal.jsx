import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

const Modal = ({
  isOpen,
  onClose,
  title = undefined,
  description = undefined,
  children,
  maxWidth = 'max-w-lg',
  showClose = true,
  footer = undefined,
}) => {
  // Close on Escape key
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose?.();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-gray-950/40 backdrop-blur-[3px]"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Dialog */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
              className={cn(
                'w-full bg-white rounded-2xl border border-gray-200/80',
                'overflow-hidden flex flex-col max-h-[90vh]',
                'shadow-[0_20px_60px_rgb(0_0_0_/_0.15),_0_8px_20px_rgb(0_0_0_/_0.08)]',
                maxWidth
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              {(title || showClose) && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                  <div>
                    {title && (
                      <h3 className="text-base font-semibold text-gray-900">
                        {title}
                      </h3>
                    )}
                    {description && (
                      <p className="text-xs text-gray-500 mt-0.5 font-medium">{description}</p>
                    )}
                  </div>
                  {showClose && (
                    <button
                      onClick={onClose}
                      className="p-1.5 -mr-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
                      aria-label="Close dialog"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

              {/* Footer */}
              {footer && (
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-2 shrink-0">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Modal;
