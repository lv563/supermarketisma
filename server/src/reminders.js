import { db } from './db.js';
import {
  sendEmail,
  invoiceDueSoonEmail,
  invoiceOverdueEmail,
} from './email.js';

// Días de anticipación para el aviso "por vencer".
const DUE_SOON_DAYS = Number(process.env.REMINDER_DAYS_AHEAD || 2);

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysBetween(fromISO, toISO) {
  const a = new Date(fromISO + 'T00:00:00').getTime();
  const b = new Date(toISO + 'T00:00:00').getTime();
  return Math.round((b - a) / 86_400_000);
}

/**
 * Revisa todas las facturas pendientes y envía:
 *  - "por vencer" si faltan <= DUE_SOON_DAYS (incluye hoy y mañana)
 *  - "vencida" si la fecha ya pasó
 * Usa las columnas remindedDueSoon / remindedOverdue para no repetir el mismo día.
 */
export async function runInvoiceReminders() {
  const today = todayISO();

  const invoices = db
    .prepare(`SELECT * FROM invoices WHERE status = 'pendiente'`)
    .all();

  let sent = 0;

  for (const inv of invoices) {
    const diff = daysBetween(today, inv.dueDate); // >0 futuro, 0 hoy, <0 vencida
    const user = db.prepare('SELECT email FROM users WHERE id = ?').get(inv.createdBy);
    if (!user?.email) continue;

    // Vencida
    if (diff < 0) {
      if (inv.remindedOverdue === today) continue; // ya avisado hoy
      const mail = invoiceOverdueEmail(inv, Math.abs(diff));
      const ok = await sendEmail({ to: user.email, subject: mail.subject, html: mail.html });
      if (ok) {
        db.prepare('UPDATE invoices SET remindedOverdue = ? WHERE id = ?').run(today, inv.id);
        sent++;
      }
      continue;
    }

    // Por vencer (hoy, mañana, … hasta DUE_SOON_DAYS)
    if (diff <= DUE_SOON_DAYS) {
      if (inv.remindedDueSoon === today) continue;
      const mail = invoiceDueSoonEmail(inv, diff);
      const ok = await sendEmail({ to: user.email, subject: mail.subject, html: mail.html });
      if (ok) {
        db.prepare('UPDATE invoices SET remindedDueSoon = ? WHERE id = ?').run(today, inv.id);
        sent++;
      }
    }
  }

  if (sent > 0) console.log(`🔔 Recordatorios de facturas enviados: ${sent}`);
  return sent;
}

/**
 * Programa la revisión: una al arrancar (tras 10s) y luego cada 12 horas.
 * Simple y suficiente para un negocio pequeño; en producción puede sustituirse
 * por un cron real del sistema o del proveedor de hosting.
 */
export function startReminderScheduler() {
  const TWELVE_HOURS = 12 * 60 * 60 * 1000;
  setTimeout(() => {
    runInvoiceReminders().catch((e) => console.error('Error en recordatorios:', e));
  }, 10_000);
  setInterval(() => {
    runInvoiceReminders().catch((e) => console.error('Error en recordatorios:', e));
  }, TWELVE_HOURS);
}
