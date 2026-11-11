import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, CalendarClock, RefreshCw, Star, TrendingDown } from 'lucide-react';
import { api } from '../lib/api';
import { StarRating } from '../components/audit/StarRating';

const barColor = (avg) => {
  if (avg == null) return '#3F3F46';
  if (avg >= 4.5) return '#10B981';
  if (avg >= 3.5) return '#F59E0B';
  if (avg >= 2.5) return '#D97706';
  return '#F43F5E';
};

const fecha = (iso) =>
  new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });

function Kpi({ Icon, label, value, sub, color, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      className="glass rounded-xl p-5"
    >
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: `${color}1F`, color }}>
          <Icon size={15} />
        </span>
        <span className="text-[13px] font-medium text-zinc-400 light:text-zinc-500">{label}</span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-white light:text-zinc-900">{value}</p>
      {children}
      <p className="mt-1 text-[11px] font-semibold text-zinc-500 light:text-zinc-500">{sub}</p>
    </motion.div>
  );
}

export function ReportPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = () => {
    setError(null);
    setData(null);
    api
      .report()
      .then(setData)
      .catch((e) => setError(e.message));
  };

  useEffect(load, []);

  if (error) {
    return (
      <div className="glass grid place-items-center gap-3 rounded-xl p-10 text-center">
        <p className="text-sm font-bold text-kamelia">{error}</p>
        <button
          type="button"
          onClick={load}
          className="flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-zinc-200 transition hover:border-white/35 light:border-black/15 light:text-zinc-700"
        >
          <RefreshCw size={14} /> Reintentar
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="glass h-24 animate-pulse rounded-xl opacity-60" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="glass h-36 animate-pulse rounded-xl opacity-60" />
          ))}
        </div>
        <div className="glass h-64 animate-pulse rounded-xl opacity-60" />
      </div>
    );
  }

  const { total, weeklyAvg, weeklyCount, worst, history } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-white light:text-zinc-900">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-neon-amber text-night-950">
            <BarChart3 size={17} />
          </span>
          Reporte de calificaciones
        </h1>
        <p className="mt-1 text-sm text-zinc-400 light:text-zinc-500">
          Promedio semanal de Cocina, tareas peor calificadas e historial de auditorías · Solo Gerente
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi
          Icon={Star}
          label="Promedio semanal Cocina"
          value={weeklyAvg != null ? `${weeklyAvg}.0` : '—'}
          sub={weeklyCount ? `${weeklyCount} calificación${weeklyCount > 1 ? 'es' : ''} esta semana` : 'Sin calificaciones esta semana'}
          color="#F59E0B"
        >
          <div className="mt-1.5">
            <StarRating value={Math.round(weeklyAvg || 0)} size={15} />
          </div>
        </Kpi>
        <Kpi Icon={CalendarClock} label="Calificaciones totales" value={total} sub="Historial completo de Cocina" color="#3B82F6" />
        <Kpi
          Icon={TrendingDown}
          label="Peor calificación"
          value={worst[0] ? `${worst[0].stars}.0` : '—'}
          sub={worst[0] ? worst[0].title : 'Sin datos'}
          color="#F43F5E"
        />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.08 }}
        className="glass rounded-xl p-5"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-zinc-200 light:text-zinc-800">
            Historial por semana · últimas 8 semanas
          </h2>
          <span className="flex items-center gap-2 text-[11px] font-medium text-zinc-500">
            <span className="h-2 w-2 rounded-full bg-neon-green" /> 5.0
            <span className="h-2 w-2 rounded-full bg-neon-amber" /> 3.5
            <span className="h-2 w-2 rounded-full bg-kamelia" /> 2.5
          </span>
        </div>

        <div className="flex h-48 items-end gap-2 sm:gap-3">
          {history.map((w, i) => {
            const pct = w.avg != null ? Math.max(8, (w.avg / 5) * 100) : 5;
            const color = barColor(w.avg);
            return (
              <div
                key={w.week}
                className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                title={`${w.week} · ${w.avg != null ? `${w.avg} ★` : 'sin datos'} · ${w.count} calificación${w.count === 1 ? '' : 'es'}`}
              >
                <span className="text-[10px] font-semibold" style={{ color: w.avg != null ? color : '#52525b' }}>
                  {w.avg != null ? w.avg : '·'}
                </span>
                <div className="flex w-full flex-1 items-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${pct}%` }}
                    transition={{ type: 'spring', stiffness: 240, damping: 28, delay: i * 0.06 }}
                    className="w-full rounded-md"
                    style={
                      w.avg != null
                        ? { background: color }
                        : { background: 'rgba(127,127,140,0.18)' }
                    }
                  />
                </div>
                <span className="text-[10px] font-medium text-zinc-500 light:text-zinc-400">{w.label}</span>
              </div>
            );
          })}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.16 }}
        className="glass rounded-xl p-5"
      >
        <h2 className="mb-4 text-sm font-medium text-zinc-200 light:text-zinc-800">
          Tareas peor calificadas
        </h2>
        {worst.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-500">Aún no hay calificaciones en Cocina.</p>
        ) : (
          <ol className="space-y-2">
            {worst.map((r, i) => (
              <motion.li
                key={r.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: 'spring', stiffness: 340, damping: 30, delay: 0.2 + i * 0.05 }}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 light:border-black/10 light:bg-white"
              >
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[11px] font-semibold"
                  style={{ background: `${barColor(r.stars)}1F`, color: barColor(r.stars) }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white light:text-zinc-900">{r.title}</p>
                  <p className="text-[11px] text-zinc-500 light:text-zinc-500">
                    {fecha(r.createdAt)}
                    {r.ratedByName ? ` · por ${r.ratedByName}` : ''}
                  </p>
                </div>
                <StarRating value={r.stars} size={15} />
              </motion.li>
            ))}
          </ol>
        )}
      </motion.section>
    </div>
  );
}
