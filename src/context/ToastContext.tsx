import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (options: {
    type?: ToastType;
    title?: string;
    message: string;
    duration?: number;
    action?: { label: string; onClick: () => void };
  }) => void;
  showSuccess: (message: string, title?: string, action?: { label: string; onClick: () => void }) => void;
  showError: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string, action?: { label: string; onClick: () => void }) => void;
  showWarning: (message: string, title?: string, action?: { label: string; onClick: () => void }) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({
      type = 'success',
      title,
      message,
      duration = 3500,
      action,
    }: {
      type?: ToastType;
      title?: string;
      message: string;
      duration?: number;
      action?: { label: string; onClick: () => void };
    }) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = { id, type, title, message, duration, action };

      setToasts((prev) => [...prev.slice(-4), newToast]); // Keep up to 5 toasts

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const showSuccess = useCallback(
    (message: string, title: string = 'Success', action?: { label: string; onClick: () => void }) => {
      showToast({ type: 'success', title, message, action });
    },
    [showToast]
  );

  const showError = useCallback(
    (message: string, title: string = 'Error') => {
      showToast({ type: 'error', title, message, duration: 5000 });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, title: string = 'Note', action?: { label: string; onClick: () => void }) => {
      showToast({ type: 'info', title, message, action });
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message: string, title: string = 'Warning', action?: { label: string; onClick: () => void }) => {
      showToast({ type: 'warning', title, message, duration: 4500, action });
    },
    [showToast]
  );

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />;
    }
  };

  const getColors = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-white/95 dark:bg-gray-900/95 border-emerald-500/30 text-gray-900 dark:text-white shadow-emerald-500/10';
      case 'error':
        return 'bg-white/95 dark:bg-gray-900/95 border-rose-500/30 text-gray-900 dark:text-white shadow-rose-500/10';
      case 'warning':
        return 'bg-white/95 dark:bg-gray-900/95 border-amber-500/30 text-gray-900 dark:text-white shadow-amber-500/10';
      case 'info':
      default:
        return 'bg-white/95 dark:bg-gray-900/95 border-indigo-500/30 text-gray-900 dark:text-white shadow-indigo-500/10';
    }
  };

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        showSuccess,
        showError,
        showInfo,
        showWarning,
        removeToast,
      }}
    >
      {children}

      {/* Floating Toasts Viewport */}
      <div
        aria-live="polite"
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm w-full px-4 sm:px-0"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-md transition-all ${getColors(
                toast.type
              )}`}
            >
              <div className="mt-0.5">{getIcon(toast.type)}</div>
              <div className="flex-1 min-w-0 pr-1">
                {toast.title && (
                  <p className="text-sm font-bold tracking-tight mb-0.5 leading-tight">{toast.title}</p>
                )}
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300 leading-relaxed break-words">
                  {toast.message}
                </p>
                {toast.action && (
                  <button
                    type="button"
                    onClick={() => {
                      toast.action?.onClick();
                      removeToast(toast.id);
                    }}
                    className="mt-2.5 inline-flex items-center text-xs font-bold px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 cursor-pointer"
                  >
                    {toast.action.label}
                  </button>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
                aria-label="Close notification"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
