import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { initStore, getStore } from './store/index.js';
import { requireAuth, asyncHandler } from './auth.js';
import { canListUsers, HttpError } from './rbac.js';
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

app.use((req, res) => res.status(404).json({ message: 'Ruta no encontrada', code: 'not_found' }));

app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) console.error('[error]', err);
  res.status(status).json({ message: err.message || 'Error interno', code: err.code || 'server_error' });
});

/** Se resuelve cuando el store (TiDB o memoria) está listo. En serverless se espera por invocación. */
export const ready = initStore().then(() => getStore());
