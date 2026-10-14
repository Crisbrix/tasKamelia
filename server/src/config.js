import 'dotenv/config';

const bool = (v, fallback = false) =>
  v === undefined ? fallback : ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());

export const config = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || 'kamelia-dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  db: {
    enabled: bool(process.env.DB_ENABLED, Boolean(process.env.DATABASE_URL || process.env.TIDB_HOST || process.env.DB_HOST)),
    url: process.env.DATABASE_URL || null,
    host: process.env.TIDB_HOST || process.env.DB_HOST || null,
    port: Number(process.env.TIDB_PORT || process.env.DB_PORT || 4006),
    user: process.env.TIDB_USER || process.env.DB_USER || 'root',
    password: process.env.TIDB_PASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.TIDB_DATABASE || process.env.DB_NAME || 'kamelia',
    ssl: bool(process.env.DB_SSL, true),
  },
};
