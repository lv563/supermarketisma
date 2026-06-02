import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = process.env.DB_PATH || join(DATA_DIR, 'gastospro.db');

export const db = new DatabaseSync(DB_PATH);

// Mejoras de fiabilidad/concurrencia para SQLite.
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// ---------- Esquema ----------
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id           TEXT PRIMARY KEY,
    email        TEXT NOT NULL UNIQUE,
    name         TEXT NOT NULL DEFAULT '',
    password     TEXT NOT NULL,            -- scrypt: salt:hash
    createdAt    INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id           TEXT PRIMARY KEY,
    amount       REAL NOT NULL,
    category     TEXT NOT NULL,
    date         TEXT NOT NULL,            -- 'yyyy-MM-dd' (día del registro)
    time         TEXT NOT NULL,            -- 'HH:mm'
    note         TEXT,
    photoUrl     TEXT,
    createdBy    TEXT NOT NULL,
    createdAt    INTEGER NOT NULL,
    FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id            TEXT PRIMARY KEY,
    supplier      TEXT NOT NULL,
    invoiceNumber TEXT NOT NULL DEFAULT '',
    amount        REAL NOT NULL,
    issueDate     TEXT NOT NULL,
    dueDate       TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'pendiente',
    createdBy     TEXT NOT NULL,
    createdAt     INTEGER NOT NULL,
    FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_expenses_user_created
    ON expenses (createdBy, createdAt DESC);
  CREATE INDEX IF NOT EXISTS idx_expenses_user_date
    ON expenses (createdBy, date);
  CREATE INDEX IF NOT EXISTS idx_invoices_user_due
    ON invoices (createdBy, dueDate);
`);

// ---------- Migraciones ligeras ----------
// Añade columnas nuevas a tablas existentes sin perder datos.
function ensureColumn(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

// Marcas para no reenviar el mismo recordatorio (guardan la fecha 'yyyy-MM-dd' del envío).
ensureColumn('invoices', 'remindedDueSoon', 'TEXT');
ensureColumn('invoices', 'remindedOverdue', 'TEXT');

export function uid() {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  );
}
