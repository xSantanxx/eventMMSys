require('dotenv').config();
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL?.trim();

const isRemoteHost = process.env.dbHost && process.env.dbHost !== 'localhost';
const useSsl =
  process.env.DATABASE_SSL === 'true' ||
  process.env.NODE_ENV === 'production' ||
  isRemoteHost ||
  Boolean(connectionString?.includes('supabase'));

const ssl = useSsl ? { rejectUnauthorized: false } : false;

const poolConfig = connectionString
  ? { connectionString, ssl }
  : {
      user: process.env.dbUser?.trim(),
      password: process.env.dbPass?.trim(),
      host: process.env.dbHost?.trim(),
      port: Number(process.env.dbPort) || 5432,
      database: process.env.db?.trim(),
      ssl,
    };

const pool = new Pool({
  ...poolConfig,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (error) => {
  console.error('Unexpected database pool error:', error.message);
});

async function query(text, params) {
  return pool.query(text, params);
}

module.exports = { query, pool };