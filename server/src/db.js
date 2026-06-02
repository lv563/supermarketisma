/**
 * Capa de base de datos con doble motor:
 *  - Local (sin DATABASE_URL): SQLite vía node:sqlite, archivo en disco.
 *  - Producción (con DATABASE_URL): PostgreSQL (Render gratis, persistente).
 *
 * Toda la app usa la misma API async: db.get / db.all / db.run.
 * El SQL se escribe con placeholders estilo Postgres ($1, $2, …); para SQLite
 * se convierten a "?" automáticamente.
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATABASE_URL = process.env.DATABASE_URL || '';
export const USING_POSTGRES = !!DATABASE_URL;

const __dirname = dirname(fileURLToPath(import.meta.url));

let driver; // { get, all, run }

// ---------- IDs ----------
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

// ---------- SQLite (local) ----------
async function initSqlite() {
  const { DatabaseSync } = await import('node:sqlite');

  const DB_PATH = process.env.DB_PATH || join(__dirname, '..', 'data', 'gastospro.db');
  mkdirSync(dirname(DB_PATH), { recursive: true });

  const sqlite = new DatabaseSync(DB_PATH);
  sqlite.exec('PRAGMA journal_mode = WAL');
  sqlite.exec('PRAGMA foreign_keys = ON');

  // Convierte $1,$2 -> ? (SQLite usa posicionales).
  const toQ = (sql) => sql.replace(/\$\d+/g, '?');

  driver = {
    async get(sql, params = []) {
      return sqlite.prepare(toQ(sql)).get(...params) ?? null;
    },
    async all(sql, params = []) {
      return sqlite.prepare(toQ(sql)).all(...params);
    },
    async run(sql, params = []) {
      sqlite.prepare(toQ(sql)).run(...params);
    },
    async exec(sql) {
      sqlite.exec(sql);
    },
  };
}

// ---------- PostgreSQL (producción) ----------
async function initPostgres() {
  const { default: pg } = await import('pg');
  const pool = new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Render requiere SSL
  });

  driver = {
    async get(sql, params = []) {
      const r = await pool.query(sql, params);
      return r.rows[0] ?? null;
    },
    async all(sql, params = []) {
      const r = await pool.query(sql, params);
      return r.rows;
    },
    async run(sql, params = []) {
      await pool.query(sql, params);
    },
    async exec(sql) {
      await pool.query(sql);
    },
  };
}

// ---------- Esquema ----------
async function createSchema() {
  // Tipos compatibles con ambos motores.
  const INT = USING_POSTGRES ? 'BIGINT' : 'INTEGER';
  const REAL = USING_POSTGRES ? 'DOUBLE PRECISION' : 'REAL';

  await driver.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id        TEXT PRIMARY KEY,
      email     TEXT NOT NULL UNIQUE,
      name      TEXT NOT NULL DEFAULT '',
      password  TEXT NOT NULL,
      createdAt ${INT} NOT NULL
    );
  `);

  await driver.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id        TEXT PRIMARY KEY,
      amount    ${REAL} NOT NULL,
      category  TEXT NOT NULL,
      date      TEXT NOT NULL,
      time      TEXT NOT NULL,
      note      TEXT,
      photoUrl  TEXT,
      createdBy TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      createdAt ${INT} NOT NULL
    );
  `);

  await driver.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id            TEXT PRIMARY KEY,
      supplier      TEXT NOT NULL,
      invoiceNumber TEXT NOT NULL DEFAULT '',
      amount        ${REAL} NOT NULL,
      issueDate     TEXT NOT NULL,
      dueDate       TEXT NOT NULL,
      status        TEXT NOT NULL DEFAULT 'pendiente',
      remindedDueSoon TEXT,
      remindedOverdue TEXT,
      createdBy     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      createdAt     ${INT} NOT NULL
    );
  `);

  await driver.exec(`CREATE INDEX IF NOT EXISTS idx_expenses_user_created ON expenses (createdBy, createdAt);`);
  await driver.exec(`CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses (createdBy, date);`);
  await driver.exec(`CREATE INDEX IF NOT EXISTS idx_invoices_user_due ON invoices (createdBy, dueDate);`);
}

// ---------- Init ----------
export async function initDb() {
  if (USING_POSTGRES) await initPostgres();
  else await initSqlite();
  await createSchema();
  console.log(`🗄️  Base de datos lista: ${USING_POSTGRES ? 'PostgreSQL' : 'SQLite (local)'}`);
}

// API pública (async, idéntica para ambos motores).
export const db = {
  get: (sql, params) => driver.get(sql, params),
  all: (sql, params) => driver.all(sql, params),
  run: (sql, params) => driver.run(sql, params),
};
