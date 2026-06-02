import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.routes.js';
import { expensesRouter } from './routes/expenses.routes.js';
import { invoicesRouter } from './routes/invoices.routes.js';
import { uploadRouter } from './routes/upload.routes.js';
import { startReminderScheduler, runInvoiceReminders } from './reminders.js';
import { requireAuth } from './auth.js';
import { initDb } from './db.js';

const PORT = process.env.PORT || 4000;

const app = express();

app.use(cors());
app.use(express.json({ limit: '8mb' })); // 8mb para aceptar fotos en base64

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use('/api/auth', authRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/upload', uploadRouter);

// Disparo manual de recordatorios (útil para probar / cron externo). Requiere sesión.
app.post('/api/reminders/run', requireAuth, async (_req, res, next) => {
  try {
    const sent = await runInvoiceReminders();
    res.json({ ok: true, sent });
  } catch (e) {
    next(e);
  }
});

// 404 API
app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// Manejo de errores
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Inicializa la base de datos (SQLite local o Postgres) antes de escuchar.
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ GastosPro API en http://localhost:${PORT}`);
      startReminderScheduler();
    });
  })
  .catch((err) => {
    console.error('❌ No se pudo iniciar la base de datos:', err);
    process.exit(1);
  });
