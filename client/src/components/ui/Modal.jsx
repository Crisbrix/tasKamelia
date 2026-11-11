import { useEffect } from 'react';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { X } from 'lucide-react';
import { useIsMobile } from '../../lib/hooks';

/**
 * Diálogo centrado en escritorio; en mobile se presenta como hoja inferior
 * (bottom sheet) que se cierra arrastrando la barra superior hacia abajo.
 */
export function Modal({ open, onClose, title, subtitle, children, width = 'max-w-lg' }) {
  const isMobile = useIsMobile();
  const dragControls = useDragControls();

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className={`fixed inset-0 z-[60] flex justify-center ${isMobile ? 'items-end' : 'items-center p-4'}`}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 light:bg-black/30"
          />
          <motion.div
            initial={isMobile ? { y: '100%' } : { opacity: 0, y: 8, scale: 0.98 }}
            animate={isMobile ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={isMobile ? { y: '100%' } : { opacity: 0, y: 6, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            drag={isMobile ? 'y' : false}
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 500) onClose?.();
            }}
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === 'string' ? title : undefined}
            className={`glass-strong relative z-10 w-full ${
              isMobile ? 'max-h-[88vh] overflow-y-auto rounded-t-2xl px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2' : `${width} rounded-xl p-6`
            }`}
          >
            {isMobile && (
              <div
                className="-mx-5 mb-2 flex cursor-grab touch-none justify-center pb-2 pt-1 active:cursor-grabbing"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <span className="h-1 w-10 rounded-full bg-zinc-600 light:bg-zinc-300" />
              </div>
            )}
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-base font-semibold tracking-tight text-white light:text-zinc-900">{title}</h2>
                {subtitle && <p className="mt-1 text-[13px] text-zinc-400 light:text-zinc-500">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="-mr-1.5 -mt-1 rounded-md p-1.5 text-zinc-500 transition hover:bg-white/10 hover:text-white light:hover:bg-black/5 light:hover:text-zinc-900"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
