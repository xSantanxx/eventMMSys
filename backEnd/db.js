require('dotenv').config();
const { Pool } = require('pg');

const isRemoteHost = process.env.dbHost && process.env.dbHost !== 'localhost';
const useSsl =
  process.env.DATABASE_SSL === 'true' ||
  process.env.NODE_ENV === 'production' ||
  isRemoteHost ||
  Boolean(process.env.DATABASE_URL?.includes('supabase'));

const ssl = useSsl ? { rejectUnauthorized: false } : false;

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl,
    })
  : new Pool({
      user: process.env.dbUser,
      password: process.env.dbPass,
      host: process.env.dbHost,
      port: process.env.dbPort,
      database: process.env.db,
      ssl,
    });

module.exports = {
  query: (text, params) => pool.query(text, params),
};