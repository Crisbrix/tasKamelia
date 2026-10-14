import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { ZONE_LIST } from '../lib/constants';

export function ZoneTabs({ value, onChange, overview }) {
  return (
    <div className="glass flex w-full gap-1.5 rounded-2xl p-1.5">
      {ZONE_LIST.map((zone) => {
        const active = zone.id === value;
        const pending = zone.rating ? overview?.zones?.[zone.id]?.pendingReview || 0 : 0;
        return (
          <button
            key={zone.id}
            type="button"
            onClick={() => onChange(zone.id)}
            aria-pressed={active}
            className="relative flex-1 rounded-xl px-3 py-2.5 outline-none transition focus-visible:ring-2 focus-visible:ring-white/40"
          >
            {active && (
              <motion.span
                layoutId="zone-tab-pill"
                transition={{ type: 'spring', stiffness: 320, damping: 34 }}
                className="absolute inset-0 rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${zone.accent}, ${zone.accent}B3)`,
                  boxShadow: `0 16px 40px -18px ${zone.accent}, inset 0 1px 0 rgba(255,255,255,0.35)`,
                }}
              />
            )}
            {!active && (
              <motion.span
                layoutId="zone-tab-ring"
                transition={{ type: 'spring', stiffness: 320, damping: 34 }}
                className="absolute inset-0 rounded-xl border border-white/10 light:border-black/10"
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-2">
              <span
                className={`text-sm font-extrabold tracking-tight ${active ? 'text-night-950' : 'text-zinc-300 light:text-zinc-600'}`}
              >
                {zone.label}
              </span>
              {pending > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                  className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-night-950/85 px-1.5 text-[10px] font-extrabold text-neon-amber"
                >
                  {pending}
                </motion.span>
              )}
            </span>
            <span className={`relative z-10 mt-0.5 block text-[10px] font-semibold ${active ? 'text-night-950/75' : 'text-zinc-500'}`}>
              {zone.subtitle}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function StatsBar({ zone, overview }) {
  const data = overview?.zones?.[zone.id] || {};
  const items = [
    { label: 'Total', value: data.total ?? 0, color: zone.accent },
    { label: 'Por hacer', value: data.todo ?? 0, color: '#7C4DFF' },
    { label: 'Haciendo', value: data.doing ?? 0, color: '#00B0FF' },
    { label: 'Hecho', value: data.done ?? 0, color: '#00E676' },
    ...(zone.rating
      ? [
          { label: 'Por revisar', value: data.pendingReview ?? 0, color: '#FFC400', warn: (data.pendingReview ?? 0) > 0 },
          { label: 'Promedio ★', value: data.avgStars ? `${data.avgStars}` : '—', color: '#FFC400' },
        ]
      : []),
    { label: 'Personal', value: data.staff ?? 0, color: '#FF6B00' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 340, damping: 32, delay: i * 0.04 }}
          className="glass flex items-center gap-2 rounded-xl px-3 py-2"
          style={item.warn ? { borderColor: 'rgba(255,196,0,0.55)', boxShadow: '0 0 24px -12px rgba(255,196,0,0.8)' } : undefined}
        >
          <span className="h-2 w-2 rounded-full" style={{ background: item.color, boxShadow: `0 0 10px ${item.color}` }} />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 light:text-zinc-500">{item.label}</span>
          <span className="text-sm font-extrabold text-white light:text-zinc-900">{item.value}</span>
          {item.warn && <AlertCircle size={13} className="text-neon-amber" />}
        </motion.div>
      ))}
    </div>
  );
}
