import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export function StarRating({ value = 0, onChange, disabled = false, size = 18, showLabel = false }) {
  const [hover, setHover] = useState(0);
  const { isLight } = useTheme();
  const interactive = Boolean(onChange) && !disabled;
  const active = hover || value;
  const emptyStroke = isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.28)';

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)} role="group" aria-label="Calificación de auditoría">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= active;
        return (
          <motion.button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(star)}
            onMouseEnter={() => interactive && setHover(star)}
            onFocus={() => interactive && setHover(star)}
            onBlur={() => setHover(0)}
            whileHover={interactive ? { scale: 1.18, y: -2 } : undefined}
            whileTap={interactive ? { scale: 0.88 } : undefined}
            transition={{ type: 'spring', stiffness: 420, damping: 24 }}
            className="relative grid place-items-center rounded-md p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-neon-amber/70 disabled:cursor-default"
            aria-label={`${star} estrella${star > 1 ? 's' : ''}`}
            aria-pressed={value === star}
          >
            <motion.span
              animate={{ scale: filled ? [0.6, 1.25, 1] : 1, rotate: filled ? [0, -14, 0] : 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="block"
            >
              <Star
                size={size}
                strokeWidth={2}
                fill={filled ? '#FFC400' : 'rgba(255,255,255,0.06)'}
                stroke={filled ? '#FFC400' : emptyStroke}
              />
            </motion.span>
            {filled && (
              <motion.span
                key={`glow-${star}`}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="pointer-events-none absolute inset-1 rounded-md"
                style={{ boxShadow: '0 0 16px rgba(255,196,0,0.55)' }}
              />
            )}
          </motion.button>
        );
      })}
      {showLabel && (
        <span className="ml-2 text-[11px] font-extrabold uppercase tracking-wider text-neon-amber light:text-amber-700">
          {value ? `${value}.0 / 5` : 'Pendiente'}
        </span>
      )}
    </div>
  );
}
