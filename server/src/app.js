import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { initStore, getStore } from './store/index.js';
import { requireAuth, asyncHandler } from './auth.js';
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

app.use((req, res) => res.status(404).json({ message: 'Ruta no encontrada', code: 'not_found' }));

app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) console.error('[error]', err);
  res.status(status).json({ message: err.message || 'Error interno', code: err.code || 'server_error' });
});

/** Se resuelve cuando el store (TiDB o memoria) está listo. En serverless se espera por invocación. */
export const ready = initStore().then(() => getStore());
