import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { initStore, getStore } from './store/index.js';
import { requireAuth, asyncHandler } from './auth.js';
import { canListUsers, canAccessAdmin, HttpError } from './rbac.js';
import { ZONES } from './constants.js';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { tasksRouter } from './routes/tasks.js';

export const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) =>
  res.json({ ok: true, store: getStore().mode, dbConfigured: config.db.enabled }),
);
app.use('/api/auth', authRouter);
app.use('/api/users', requireAuth, usersRouter);
app.use('/api/tasks', requireAuth, tasksRouter);

app.get(
  '/api/overview',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { zones, users, tasks } = await getStore().overview();
    res.json({ zones, users, tasks });
  }),
);

/** Tablero completo de una zona en una sola respuesta: tareas + personal + métricas. */
app.get(
  '/api/board',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { zone } = req.query;
    if (zone && !ZONES[zone]) throw new HttpError(400, 'Zona no reconocida', 'validation');
    const store = getStore();
    const [tasks, staff, { zones }] = await Promise.all([
      store.listTasks({ zone }),
      (async () => {
        if (!zone || !canListUsers(req.user, zone)) return [];
        const list = await store.listUsers({ zone });
        if (req.user.role !== 'gerente') return list.filter((u) => u.zone === req.user.zone);
        return list;
      })(),
      store.overview(),
    ]);
    res.json({ tasks, staff, zones });
  }),
);

/** Reporte de calificaciones: promedio semanal, peores tareas e historial por semana. */
app.get(
  '/api/ratings/report',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!canAccessAdmin(req.user)) {
      throw new HttpError(403, 'Solo el Gerente consulta el reporte de calificaciones', 'forbidden');
    }
    const rows = (await getStore().listRatings()).filter((r) => r.zone === 'cocina');

    const now = new Date();
    const startOfWeek = (d) => {
      const x = new Date(d);
      const day = (x.getDay() + 6) % 7; // lunes = 0
      x.setDate(x.getDate() - day);
      x.setHours(0, 0, 0, 0);
      return x;
    };
    const fmt = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const weekKey = (d) => fmt(startOfWeek(d));
    const thisWeek = weekKey(now);

    const cocinaWeek = rows.filter((r) => weekKey(new Date(r.createdAt)) === thisWeek);
    const weeklyAvg = cocinaWeek.length
      ? Number((cocinaWeek.reduce((a, r) => a + r.stars, 0) / cocinaWeek.length).toFixed(1))
      : null;

    // Peores calificadas (1-2 estrellas primero, más recientes)
    const worst = [...rows]
      .sort((a, b) => a.stars - b.stars || new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);

    // Historial: promedio de Cocina por semana en las últimas 8 semanas
    const weeks = [];
    for (let i = 7; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const key = weekKey(d);
      weeks.push({ week: key, label: key.slice(5), avg: null, count: 0 });
    }
    for (const r of rows) {
      const key = weekKey(new Date(r.createdAt));
      const bucket = weeks.find((w) => w.week === key);
      if (bucket) {
        bucket.avg = ((bucket.avg ?? 0) * bucket.count + r.stars) / (bucket.count + 1);
        bucket.count += 1;
        bucket.avg = Number(bucket.avg.toFixed(1));
      }
    }

    res.json({
      total: rows.length,
      weeklyAvg,
      weeklyCount: cocinaWeek.length,
      worst,
      history: weeks.map(({ week, label, avg, count }) => ({ week, label, avg, count })),
    });
  }),
);

app.use((req, res) => res.status(404).json({ message: 'Ruta no encontrada', code: 'not_found' }));

app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) console.error('[error]', err);
  res.status(status).json({ message: err.message || 'Error interno', code: err.code || 'server_error' });
});

/** Se resuelve cuando el store (TiDB o memoria) está listo. En serverless se espera por invocación. */
export const ready = initStore().then(() => getStore());
