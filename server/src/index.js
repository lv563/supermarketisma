import express from 'express';
import cors from 'cors';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { authRouter } from './routes/auth.routes.js';
import { expensesRouter } from './routes/expenses.routes.js';
import { invoicesRouter } from './routes/invoices.routes.js';
import { uploadRouter } from './routes/upload.routes.js';
import { startReminderScheduler, runInvoiceReminders } from './reminders.js';
import { requireAuth } from './auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;

const app = express();

app.use(cors());
app.use(express.json({ limit: '8mb' })); // 8mb para aceptar fotos en base64

// Fotos servidas estáticamente
app.use('/uploads', express.static(join(__dirname, '..', 'data', 'uploads')));

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use('/api/auth', authRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/upload', uploadRouter);

// Disparo manual de recordatorios (útil para probar). Requiere sesión.
app.post('/api/reminders/run', requireAuth, async (_req, res) => {
  const sent = await runInvoiceReminders();
  res.json({ ok: true, sent });
});

// 404 API
app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// Manejo de errores
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`✅ GastosPro API en http://localhost:${PORT}`);
  startReminderScheduler();
});
