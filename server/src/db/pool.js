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

/** Devuelve true si TiDB responde; si no, la app corre con el store en memoria. */
export async function ping() {
  if (!config.db.enabled) return false;
  try {
    const p = createPool();
    await p.query('SELECT 1 AS ok');
    return true;
  } catch (err) {
    console.warn(`[db] TiDB no disponible (${err.code || err.message}). Usando almacenamiento en memoria.`);
    pool = null;
    return false;
  }
}
