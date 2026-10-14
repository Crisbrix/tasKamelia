import { ping } from '../db/pool.js';
import { createMemoryStore } from './memory.js';
import { createMysqlStore } from './mysql.js';

let store = null;

export async function initStore() {
  const useTiDB = await ping();
  store = useTiDB ? await createMysqlStore() : createMemoryStore();
  console.log(`[db] Store activo: ${store.mode === 'tidb' ? 'TiDB (MySQL compatible)' : 'en memoria (mock persistente durante el proceso)'}`);
  return store;
}

export function getStore() {
  if (!store) throw new Error('Store no inicializado');
  return store;
}
