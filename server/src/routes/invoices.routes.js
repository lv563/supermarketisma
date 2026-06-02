import { Router } from 'express';
import { db, uid } from '../db.js';
import { requireAuth } from '../auth.js';
import { sendEmail, invoicePaidEmail } from '../email.js';

export const invoicesRouter = Router();
invoicesRouter.use(requireAuth);

const VALID_STATUS = ['pendiente', 'pagada', 'vencida'];

// GET /api/invoices
invoicesRouter.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM invoices WHERE createdBy = ? ORDER BY dueDate ASC')
    .all(req.userId);
  res.json(rows);
});

// POST /api/invoices
invoicesRouter.post('/', (req, res) => {
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

  db.prepare(
    `INSERT INTO invoices (id, supplier, invoiceNumber, amount, issueDate, dueDate, status, createdBy, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    invoice.id,
    invoice.supplier,
    invoice.invoiceNumber,
    invoice.amount,
    invoice.issueDate,
    invoice.dueDate,
    invoice.status,
    invoice.createdBy,
    invoice.createdAt,
  );

  res.status(201).json(invoice);
});

// PATCH /api/invoices/:id  (cambiar estado u otros campos)
invoicesRouter.patch('/:id', (req, res) => {
  const existing = db
    .prepare('SELECT * FROM invoices WHERE id = ? AND createdBy = ?')
    .get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'No encontrada' });

  const { status, supplier, invoiceNumber, amount, issueDate, dueDate } = req.body || {};
  const next = {
    status: VALID_STATUS.includes(status) ? status : existing.status,
    supplier: supplier ?? existing.supplier,
    invoiceNumber: invoiceNumber ?? existing.invoiceNumber,
    amount: amount != null ? Number(amount) : existing.amount,
    issueDate: issueDate ?? existing.issueDate,
    dueDate: dueDate ?? existing.dueDate,
  };

  db.prepare(
    `UPDATE invoices SET status=?, supplier=?, invoiceNumber=?, amount=?, issueDate=?, dueDate=?
     WHERE id=? AND createdBy=?`,
  ).run(
    next.status,
    next.supplier,
    next.invoiceNumber,
    next.amount,
    next.issueDate,
    next.dueDate,
    req.params.id,
    req.userId,
  );

  const updated = { ...existing, ...next };

  // Correo cuando una factura pasa a "pagada".
  if (existing.status !== 'pagada' && next.status === 'pagada') {
    const user = db.prepare('SELECT email FROM users WHERE id = ?').get(req.userId);
    if (user?.email) {
      const mail = invoicePaidEmail(updated);
      sendEmail({ to: user.email, subject: mail.subject, html: mail.html }).catch(() => {});
    }
  }

  res.json(updated);
});

// DELETE /api/invoices/:id
invoicesRouter.delete('/:id', (req, res) => {
  const result = db
    .prepare('DELETE FROM invoices WHERE id = ? AND createdBy = ?')
    .run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'No encontrada' });
  res.json({ ok: true });
});
