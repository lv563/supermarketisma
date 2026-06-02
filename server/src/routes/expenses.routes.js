import { Router } from 'express';
import { db, uid } from '../db.js';
import { requireAuth } from '../auth.js';

export const expensesRouter = Router();
expensesRouter.use(requireAuth);

const VALID_CATEGORIES = ['combustible', 'comida', 'transporte', 'factura', 'materiales', 'otros'];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// GET /api/expenses  -> historial completo del usuario (orden cronológico inverso)
expensesRouter.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM expenses WHERE createdBy = ? ORDER BY createdAt DESC')
    .all(req.userId);
  res.json(rows);
});

// POST /api/expenses -> fecha, hora y usuario se agregan automáticamente
expensesRouter.post('/', (req, res) => {
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

  db.prepare(
    `INSERT INTO expenses (id, amount, category, date, time, note, photoUrl, createdBy, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    expense.id,
    expense.amount,
    expense.category,
    expense.date,
    expense.time,
    expense.note,
    expense.photoUrl,
    expense.createdBy,
    expense.createdAt,
  );

  res.status(201).json(expense);
});

// DELETE /api/expenses/:id
expensesRouter.delete('/:id', (req, res) => {
  const result = db
    .prepare('DELETE FROM expenses WHERE id = ? AND createdBy = ?')
    .run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'No encontrado' });
  res.json({ ok: true });
});
