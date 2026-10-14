import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, Star } from 'lucide-react';

const ToastContext = createContext(null);

const styles = {
  success: { color: '#00E676', Icon: CheckCircle2 },
  error: { color: '#FF2E63', Icon: AlertTriangle },
  audit: { color: '#FFC400', Icon: Star },
  info: { color: '#00B0FF', Icon: Info },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (message, type = 'info') => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t.slice(-3), { id, message, type }]);
      setTimeout(() => remove(id), 3800);
    },
    [remove],
  );

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[90] flex w-[320px] flex-col gap-2">
        <AnimatePresence>
          {toasts.map(({ id, message, type }) => {
            const { color, Icon } = styles[type] || styles.info;
            return (
              <motion.div
                key={id}
                layout
                initial={{ opacity: 0, x: 48, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 32, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                className="glass-strong pointer-events-auto overflow-hidden rounded-xl"
                style={{ borderLeft: `3px solid ${color}` }}
              >
                <div className="flex items-start gap-3 px-4 py-3">
                  <Icon size={16} style={{ color }} className="mt-0.5 shrink-0" />
                  <p className="text-sm font-medium leading-snug text-zinc-100 light:text-zinc-800">{message}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
}
