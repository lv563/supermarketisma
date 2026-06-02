import { db } from './db.js';
import { sendEmail, invoiceDueSoonEmail, invoiceOverdueEmail } from './email.js';

const DUE_SOON_DAYS = Number(process.env.REMINDER_DAYS_AHEAD || 2);

const SELECT_COLS =
  'id, supplier, invoicenumber AS "invoiceNumber", amount, issuedate AS "issueDate", ' +
  'duedate AS "dueDate", status, createdby AS "createdBy", ' +
  'remindedduesoon AS "remindedDueSoon", remindedoverdue AS "remindedOverdue"';

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
 * Revisa facturas pendientes y envía recordatorios de "por vencer" y "vencida",
 * sin repetir el mismo aviso el mismo día.
 */
export async function runInvoiceReminders() {
  const today = todayISO();
  const invoices = await db.all(`SELECT ${SELECT_COLS} FROM invoices WHERE status = 'pendiente'`);

  let sent = 0;

  for (const inv of invoices) {
    const diff = daysBetween(today, inv.dueDate);
    const user = await db.get('SELECT email FROM users WHERE id = $1', [inv.createdBy]);
    if (!user?.email) continue;

    if (diff < 0) {
      if (inv.remindedOverdue === today) continue;
      const m = invoiceOverdueEmail(inv, Math.abs(diff));
      const ok = await sendEmail({ to: user.email, subject: m.subject, html: m.html });
      if (ok) {
        await db.run('UPDATE invoices SET remindedOverdue = $1 WHERE id = $2', [today, inv.id]);
        sent++;
      }
      continue;
    }

    if (diff <= DUE_SOON_DAYS) {
      if (inv.remindedDueSoon === today) continue;
      const m = invoiceDueSoonEmail(inv, diff);
      const ok = await sendEmail({ to: user.email, subject: m.subject, html: m.html });
      if (ok) {
        await db.run('UPDATE invoices SET remindedDueSoon = $1 WHERE id = $2', [today, inv.id]);
        sent++;
      }
    }
  }

  if (sent > 0) console.log(`🔔 Recordatorios de facturas enviados: ${sent}`);
  return sent;
}

export function startReminderScheduler() {
  const TWELVE_HOURS = 12 * 60 * 60 * 1000;
  setTimeout(() => {
    runInvoiceReminders().catch((e) => console.error('Error en recordatorios:', e));
  }, 10_000);
  setInterval(() => {
    runInvoiceReminders().catch((e) => console.error('Error en recordatorios:', e));
  }, TWELVE_HOURS);
}
