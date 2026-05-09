import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { ToastContext, type ToastType } from './toastContext';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((items) => items.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (type: ToastType, message: string) => {
      const id = crypto.randomUUID?.() ?? `${Date.now()}`;
      setToasts((items) => [...items, { id, type, message }]);
      window.setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex w-[min(380px,calc(100vw-2rem))] flex-col gap-3">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className={`relative overflow-hidden rounded-sm p-4 text-sm font-semibold text-white shadow-float ${
                toast.type === 'success'
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                  : 'bg-gradient-to-br from-red-500 to-rose-700'
              }`}
              role="status"
            >
              <div className="flex items-center gap-3">
                {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                <span>{toast.message}</span>
              </div>
              <div className="toast-timer absolute bottom-0 left-0 h-1 w-full bg-white/45" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
