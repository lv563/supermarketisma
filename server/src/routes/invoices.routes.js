import { Router } from 'express';
import { db, uid } from '../db.js';
import { requireAuth } from '../auth.js';
import { sendEmail, invoicePaidEmail } from '../email.js';

export const invoicesRouter = Router();
invoicesRouter.use(requireAuth);

const VALID_STATUS = ['pendiente', 'pagada', 'vencida'];

const SELECT_COLS =
  'id, supplier, invoicenumber AS "invoiceNumber", amount, issuedate AS "issueDate", ' +
  'duedate AS "dueDate", status, createdby AS "createdBy", createdat AS "createdAt"';

// GET /api/invoices
invoicesRouter.get('/', async (req, res, next) => {
  try {
    const rows = await db.all(
      `SELECT ${SELECT_COLS} FROM invoices WHERE createdBy = $1 ORDER BY dueDate ASC`,
      [req.userId],
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// POST /api/invoices
invoicesRouter.post('/', async (req, res, next) => {
  try {
    const { supplier, invoiceNumber, amount, issueDate, dueDate, status } = req.body || {};
    const value = Number(amount);
    if (!supplier) return res.status(400).json({ error: 'Proveedor requerido' });
    if (!value || value <= 0) return res.status(400).json({ error: 'Monto inválido' });
    if (!dueDate) return res.status(400).json({ error: 'Fecha de vencimiento requerida' });

    const invoice = {
      id: uid(),
      supplier: String(supplier),
      invoiceNumber: invoiceNumber ? String(invoiceNumber) : '',
      amount: value,
      issueDate: issueDate || dueDate,
      dueDate,
      status: VALID_STATUS.includes(status) ? status : 'pendiente',
      createdBy: req.userId,
      createdAt: Date.now(),
    };

    await db.run(
      `INSERT INTO invoices (id, supplier, invoiceNumber, amount, issueDate, dueDate, status, createdBy, createdAt)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        invoice.id,
        invoice.supplier,
        invoice.invoiceNumber,
        invoice.amount,
        invoice.issueDate,
        invoice.dueDate,
        invoice.status,
        invoice.createdBy,
        invoice.createdAt,
      ],
    );

    res.status(201).json(invoice);
  } catch (e) {
    next(e);
  }
});

// PATCH /api/invoices/:id (cambiar estado u otros campos)
invoicesRouter.patch('/:id', async (req, res, next) => {
  try {
    const existing = await db.get(
      `SELECT ${SELECT_COLS} FROM invoices WHERE id = $1 AND createdBy = $2`,
      [req.params.id, req.userId],
    );
    if (!existing) return res.status(404).json({ error: 'No encontrada' });

    const { status, supplier, invoiceNumber, amount, issueDate, dueDate } = req.body || {};
    const next_ = {
      status: VALID_STATUS.includes(status) ? status : existing.status,
      supplier: supplier ?? existing.supplier,
      invoiceNumber: invoiceNumber ?? existing.invoiceNumber,
      amount: amount != null ? Number(amount) : existing.amount,
      issueDate: issueDate ?? existing.issueDate,
      dueDate: dueDate ?? existing.dueDate,
    };

    await db.run(
      `UPDATE invoices SET status=$1, supplier=$2, invoiceNumber=$3, amount=$4, issueDate=$5, dueDate=$6
       WHERE id=$7 AND createdBy=$8`,
      [
        next_.status,
        next_.supplier,
        next_.invoiceNumber,
        next_.amount,
        next_.issueDate,
        next_.dueDate,
        req.params.id,
        req.userId,
      ],
    );

    const updated = { ...existing, ...next_ };

    if (existing.status !== 'pagada' && next_.status === 'pagada') {
      const user = await db.get('SELECT email FROM users WHERE id = $1', [req.userId]);
      if (user?.email) {
        const m = invoicePaidEmail(updated);
        sendEmail({ to: user.email, subject: m.subject, html: m.html }).catch(() => {});
      }
    }

    res.json(updated);
  } catch (e) {
    next(e);
  }
});

// DELETE /api/invoices/:id
invoicesRouter.delete('/:id', async (req, res, next) => {
  try {
    const existing = await db.get('SELECT id FROM invoices WHERE id = $1 AND createdBy = $2', [
      req.params.id,
      req.userId,
    ]);
    if (!existing) return res.status(404).json({ error: 'No encontrada' });
    await db.run('DELETE FROM invoices WHERE id = $1 AND createdBy = $2', [req.params.id, req.userId]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
