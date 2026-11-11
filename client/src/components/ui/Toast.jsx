import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, Star } from 'lucide-react';

const ToastContext = createContext(null);

const styles = {
  success: { color: '#10B981', Icon: CheckCircle2 },
  error: { color: '#F43F5E', Icon: AlertTriangle },
  audit: { color: '#F59E0B', Icon: Star },
  info: { color: '#3B82F6', Icon: Info },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (message, type = 'info') => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t.slice(-2), { id, message, type }]);
      setTimeout(() => remove(id), 3000);
    },
    [remove],
  );

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-3 top-3 z-[90] flex flex-col gap-2 sm:inset-x-auto sm:right-4 sm:top-16 sm:w-[340px]">
        <AnimatePresence>
          {toasts.map(({ id, message, type }) => {
            const { color, Icon } = styles[type] || styles.info;
            return (
              <motion.div
                key={id}
                layout
                initial={{ opacity: 0, y: -12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                className="glass-strong pointer-events-auto overflow-hidden rounded-lg"
              >
                <div className="flex items-start gap-2.5 px-3.5 py-3">
                  <Icon size={16} style={{ color }} className="mt-0.5 shrink-0" />
                  <p className="text-[13px] font-medium leading-snug text-zinc-100 light:text-zinc-800">{message}</p>
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
