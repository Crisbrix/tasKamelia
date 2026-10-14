import { app, ready } from '../server/src/app.js';

export default async function handler(req, res) {
  try {
    await ready;
  } catch (err) {
    console.error('[api] store no disponible:', err?.message || err);
    return res.status(500).json({ message: 'Base de datos no disponible', code: 'store_error' });
  }
  return app(req, res);
}
