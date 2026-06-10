import { Router } from 'express';
import { db, uid } from '../db.js';
import { requireAuth } from '../auth.js';

export const categoriesRouter = Router();
categoriesRouter.use(requireAuth);

const SELECT_COLS =
  'id, label, emoji, createdby AS "createdBy", createdat AS "createdAt"';

// GET /api/categories -> categorías personalizadas del usuario
categoriesRouter.get('/', async (req, res, next) => {
  try {
    const rows = await db.all(
      `SELECT ${SELECT_COLS} FROM categories WHERE createdBy = $1 ORDER BY createdAt ASC`,
      [req.userId],
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// POST /api/categories -> crear categoría { label, emoji }
categoriesRouter.post('/', async (req, res, next) => {
  try {
    const { label, emoji } = req.body || {};
    const name = String(label || '').trim();
    if (!name) return res.status(400).json({ error: 'Escribe un nombre' });
    if (name.length > 24) return res.status(400).json({ error: 'Nombre demasiado largo' });

    const cat = {
      id: uid(),
      label: name,
      emoji: emoji ? String(emoji).slice(0, 4) : '📦',
      createdBy: req.userId,
      createdAt: Date.now(),
    };

    await db.run(
      `INSERT INTO categories (id, label, emoji, createdBy, createdAt) VALUES ($1, $2, $3, $4, $5)`,
      [cat.id, cat.label, cat.emoji, cat.createdBy, cat.createdAt],
    );

    res.status(201).json(cat);
  } catch (e) {
    next(e);
  }
});

// DELETE /api/categories/:id
categoriesRouter.delete('/:id', async (req, res, next) => {
  try {
    const existing = await db.get('SELECT id FROM categories WHERE id = $1 AND createdBy = $2', [
      req.params.id,
      req.userId,
    ]);
    if (!existing) return res.status(404).json({ error: 'No encontrada' });
    await db.run('DELETE FROM categories WHERE id = $1 AND createdBy = $2', [req.params.id, req.userId]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
