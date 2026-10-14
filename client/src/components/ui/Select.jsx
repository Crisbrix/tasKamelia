import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';

export function Select({ value, onChange, options, placeholder = 'Seleccionar…', disabled = false, accent }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <motion.button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.98 }}
        className="field flex items-center justify-between gap-2 text-left disabled:opacity-50"
        style={accent ? { borderColor: `${accent}55` } : undefined}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected?.color && (
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: selected.color, boxShadow: `0 0 12px ${selected.color}` }} />
          )}
          <span className={`truncate ${selected ? 'text-white light:text-zinc-900' : 'text-zinc-500'}`}>{selected?.label || placeholder}</span>
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
          <ChevronDown size={16} className="text-zinc-400" />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            style={{ transformOrigin: 'top' }}
            className="menu absolute left-0 right-0 z-50 mt-2 max-h-64 overflow-y-auto p-1.5"
          >
            {options.map((opt) => {
              const active = opt.value === value;
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                      active
                        ? 'bg-kamelia/15 text-white light:bg-kamelia/10 light:text-zinc-900'
                        : 'text-zinc-300 hover:bg-white/[0.06] hover:text-white light:text-zinc-700 light:hover:bg-black/[0.05] light:hover:text-zinc-900'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {opt.color && (
                        <span className="h-2 w-2 rounded-full" style={{ background: opt.color }} />
                      )}
                      {opt.label}
                    </span>
                    {active && <Check size={14} style={{ color: opt.color || '#FF2E63' }} />}
                  </button>
                </li>
              );
            })}
            {!options.length && <li className="px-3 py-2 text-xs text-zinc-500">Sin opciones disponibles</li>}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
