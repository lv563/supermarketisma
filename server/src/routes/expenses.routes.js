import { Router } from 'express';
import { db, uid } from '../db.js';
import { requireAuth } from '../auth.js';

export const expensesRouter = Router();
expensesRouter.use(requireAuth);

const VALID_CATEGORIES = ['combustible', 'comida', 'transporte', 'factura', 'materiales', 'otros'];

// Alias explícitos: Postgres pasa a minúsculas las columnas sin comillas, así que
// los renombramos para que el frontend siempre reciba camelCase.
const SELECT_COLS =
  'id, amount, category, date, time, note, photourl AS "photoUrl", createdby AS "createdBy", createdat AS "createdAt"';
// En SQLite los nombres se preservan, pero "photourl AS photoUrl" también funciona
// porque SQLite no distingue mayúsculas en identificadores.

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// GET /api/expenses -> historial del usuario (más reciente primero)
expensesRouter.get('/', async (req, res, next) => {
  try {
    const rows = await db.all(
      `SELECT ${SELECT_COLS} FROM expenses WHERE createdBy = $1 ORDER BY createdAt DESC`,
      [req.userId],
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// POST /api/expenses -> fecha, hora y usuario automáticos
expensesRouter.post('/', async (req, res, next) => {
  try {
    const { amount, category, note, photoUrl } = req.body || {};
    const value = Number(amount);
    if (!value || value <= 0) return res.status(400).json({ error: 'Monto inválido' });
    if (!VALID_CATEGORIES.includes(category)) return res.status(400).json({ error: 'Categoría inválida' });

    const expense = {
      id: uid(),
      amount: value,
      category,
      date: todayISO(),
      time: nowTime(),
      note: note ? String(note) : null,
      photoUrl: photoUrl ? String(photoUrl) : null,
      createdBy: req.userId,
      createdAt: Date.now(),
    };

    await db.run(
      `INSERT INTO expenses (id, amount, category, date, time, note, photoUrl, createdBy, createdAt)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        expense.id,
        expense.amount,
        expense.category,
        expense.date,
        expense.time,
        expense.note,
        expense.photoUrl,
        expense.createdBy,
        expense.createdAt,
      ],
    );

    res.status(201).json(expense);
  } catch (e) {
    next(e);
  }
});

// DELETE /api/expenses/:id
expensesRouter.delete('/:id', async (req, res, next) => {
  try {
    const existing = await db.get('SELECT id FROM expenses WHERE id = $1 AND createdBy = $2', [
      req.params.id,
      req.userId,
    ]);
    if (!existing) return res.status(404).json({ error: 'No encontrado' });
    await db.run('DELETE FROM expenses WHERE id = $1 AND createdBy = $2', [req.params.id, req.userId]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
