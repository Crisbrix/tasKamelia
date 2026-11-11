import { motion } from 'framer-motion';
import { ZONE_LIST } from '../lib/constants';

export function ZoneTabs({ value, onChange, overview }) {
  return (
    <div className="flex w-full gap-1 rounded-lg border border-white/[0.07] bg-night-900 p-1 light:border-black/[0.08] light:bg-zinc-200/60" role="tablist" aria-label="Zonas">
      {ZONE_LIST.map((zone) => {
        const active = zone.id === value;
        const pending = zone.rating ? overview?.zones?.[zone.id]?.pendingReview || 0 : 0;
        return (
          <button
            key={zone.id}
            type="button"
            role="tab"
            onClick={() => onChange(zone.id)}
            aria-selected={active}
            aria-pressed={active}
            className="relative flex-1 rounded-md px-3 py-2 outline-none transition focus-visible:ring-2 focus-visible:ring-white/30"
          >
            {active && (
              <motion.span
                layoutId="zone-tab-pill"
                transition={{ type: 'spring', stiffness: 420, damping: 38 }}
                className="absolute inset-0 rounded-md border border-white/[0.08] bg-night-700 shadow-glow light:border-black/[0.06] light:bg-white"
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: zone.accent, opacity: active ? 1 : 0.5 }} />
              <span className={`text-sm font-medium ${active ? 'text-zinc-50 light:text-zinc-900' : 'text-zinc-400 light:text-zinc-500'}`}>
                {zone.label}
              </span>
              {pending > 0 && (
                <span
                  title={`${pending} por revisar`}
                  className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-neon-amber/15 px-1.5 text-[10px] font-semibold tabular-nums text-neon-amber light:text-amber-700"
                >
                  {pending}
                </span>
              )}
            </span>
            <span className={`relative z-10 mt-0.5 hidden text-[11px] sm:block ${active ? 'text-zinc-400 light:text-zinc-500' : 'text-zinc-600 light:text-zinc-400'}`}>
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
    { label: 'Total', value: data.total ?? 0 },
    { label: 'Por hacer', value: data.todo ?? 0 },
    { label: 'Haciendo', value: data.doing ?? 0 },
    { label: 'Hecho', value: data.done ?? 0 },
    ...(zone.rating
      ? [
          { label: 'Por revisar', value: data.pendingReview ?? 0, warn: (data.pendingReview ?? 0) > 0 },
          { label: 'Auditado', value: data.auditado ?? 0 },
          { label: 'Promedio', value: data.avgStars ? `${data.avgStars} ★` : '—' },
        ]
      : []),
    { label: 'Personal', value: data.staff ?? 0 },
  ];

  return (
    <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <dl className="glass flex w-max divide-x divide-white/[0.07] rounded-lg light:divide-black/[0.07]">
        {items.map((item) => (
          <div key={item.label} className="px-3.5 py-2">
            <dt className="whitespace-nowrap text-[11px] text-zinc-500">{item.label}</dt>
            <dd
              className={`text-sm font-semibold tabular-nums ${
                item.warn ? 'text-neon-amber light:text-amber-700' : 'text-zinc-100 light:text-zinc-900'
              }`}
            >
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
