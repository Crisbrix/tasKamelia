import mysql from 'mysql2/promise';
import { config } from '../config.js';

let pool = null;

export function createPool() {
  const { url, host, ssl, ...rest } = config.db;
  const base = url
    ? { uri: url }
    : { host, port: rest.port, user: rest.user, password: rest.password, database: rest.database };

  pool = mysql.createPool({
    ...base,
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
    timezone: 'Z',
    ...(ssl ? { ssl: { minVersion: 'TLSv1.2' } } : {}),
  });
  return pool;
}

export function getPool() {
  if (!pool) throw new Error('Pool de TiDB no inicializado');
  return pool;
}

/**
 * Devuelve true si TiDB responde. Reintenta varias veces porque los
 * clusters serverless pausados tardan en despertar. Si agota los
 * intentos, la app corre con el store en memoria (datos volátiles).
 */
export async function ping() {
  if (!config.db.enabled) return false;
  const attempts = Number(process.env.DB_RETRY_ATTEMPTS || 4);
  const delayMs = Number(process.env.DB_RETRY_DELAY_MS || 5000);
  for (let i = 1; i <= attempts; i++) {
    try {
      const p = createPool();
      await p.query('SELECT 1 AS ok');
      if (i > 1) console.log(`[db] TiDB respondió en el intento ${i}.`);
      return true;
    } catch (err) {
      console.warn(`[db] TiDB no disponible (intento ${i}/${attempts}): ${err.code || err.message}`);
      pool = null;
      if (i < attempts) await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  console.warn('[db] ATENCIÓN: usando almacenamiento en memoria. Los datos creados se perderán al reiniciar.');
  return false;
}
