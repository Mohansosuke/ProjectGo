import React, { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

// ─── Toast Context ───────────────────────────────────────────
const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};

const toastConfig = {
  success: {
    bg: 'bg-white border-emerald-200',
    text: 'text-gray-900',
    sub: 'text-gray-500',
    iconBg: 'bg-emerald-100 text-emerald-600',
    Icon: CheckCircle2,
  },
  error: {
    bg: 'bg-white border-red-200',
    text: 'text-gray-900',
    sub: 'text-gray-500',
    iconBg: 'bg-red-100 text-red-600',
    Icon: AlertCircle,
  },
  warning: {
    bg: 'bg-white border-amber-200',
    text: 'text-gray-900',
    sub: 'text-gray-500',
    iconBg: 'bg-amber-100 text-amber-600',
    Icon: AlertTriangle,
  },
  info: {
    bg: 'bg-white border-indigo-200',
    text: 'text-gray-900',
    sub: 'text-gray-500',
    iconBg: 'bg-indigo-100 text-indigo-600',
    Icon: Info,
  },
};

const Toast = ({ id, message, variant = 'success', onRemove }) => {
  const config = toastConfig[variant];
  const Icon = config.Icon;

  useEffect(() => {
    const timer = setTimeout(() => onRemove(id), 4000);
    return () => clearTimeout(timer);
  }, [id, onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 16, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 16, scale: 0.96 }}
      transition={{ type: 'spring', duration: 0.35, bounce: 0.05 }}
      className={cn(
        'flex items-center gap-3 px-4 py-3.5 rounded-lg border shadow-[0_8px_24px_rgb(0_0_0_/_0.1),_0_2px_6px_rgb(0_0_0_/_0.06)]',
        'min-w-[300px] max-w-[400px] backdrop-blur-sm',
        config.bg
      )}
    >
      <div
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
          config.iconBg
        )}
      >
        <Icon className="w-4 h-4" />
      </div>
      <p className={cn('text-sm font-medium flex-1', config.text)}>{message}</p>
      <button
        onClick={() => onRemove(id)}
        className="text-gray-400 hover:text-gray-600 transition-colors shrink-0 p-1 rounded-md hover:bg-gray-100"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const addToast = useCallback((message, variant = 'success') => {
    const id = ++counterRef.current;
    setToasts((prev) => [...prev, { id, message, variant }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    warning: (msg) => addToast(msg, 'warning'),
    info: (msg) => addToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-auto">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <Toast key={t.id} {...t} onRemove={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
