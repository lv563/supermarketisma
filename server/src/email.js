/**
 * Envío de correos con Resend (API HTTP, sin SDK).
 * Si no hay RESEND_API_KEY configurada, los correos se imprimen en consola
 * para que el sistema funcione en desarrollo sin claves.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.MAIL_FROM || 'GastosPro <onboarding@resend.dev>';
const APP_NAME = 'GastosPro';

const money = (n) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 2 }).format(n || 0);

const formatDate = (iso) => {
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('es-DO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};

/** Envía un correo. Devuelve true si se entregó (o se registró en consola). */
export async function sendEmail({ to, subject, html }) {
  if (!to) return false;

  if (!RESEND_API_KEY) {
    console.log('\n📧 [EMAIL · modo consola — configura RESEND_API_KEY para envío real]');
    console.log(`   Para:    ${to}`);
    console.log(`   Asunto:  ${subject}\n`);
    return true;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`❌ Error al enviar correo a ${to}: ${res.status} ${text}`);
      return false;
    }
    console.log(`📧 Correo enviado a ${to}: "${subject}"`);
    return true;
  } catch (err) {
    console.error(`❌ Fallo de red al enviar correo a ${to}:`, err.message);
    return false;
  }
}

// ---------- Plantilla base ----------
function layout(title, accent, bodyHtml) {
  return `
  <div style="font-family:Inter,Arial,sans-serif;background:#f1f5f9;padding:24px;margin:0">
    <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="background:${accent};padding:20px 24px">
        <h1 style="margin:0;color:#fff;font-size:18px">${APP_NAME}</h1>
      </div>
      <div style="padding:24px;color:#0f172a">
        <h2 style="margin:0 0 12px;font-size:20px">${title}</h2>
        ${bodyHtml}
      </div>
      <div style="padding:16px 24px;background:#f8fafc;color:#94a3b8;font-size:12px">
        Recibes este correo porque tienes una cuenta en ${APP_NAME}.
      </div>
    </div>
  </div>`;
}

function invoiceCard(inv) {
  return `
  <div style="border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin:12px 0">
    <p style="margin:0;font-weight:600;font-size:16px">${inv.supplier}
      ${inv.invoiceNumber ? `<span style="color:#94a3b8;font-weight:400">#${inv.invoiceNumber}</span>` : ''}</p>
    <p style="margin:8px 0 0;font-size:24px;font-weight:700">${money(inv.amount)}</p>
    <p style="margin:4px 0 0;color:#64748b;font-size:14px">Vence: ${formatDate(inv.dueDate)}</p>
  </div>`;
}

// ---------- Plantillas ----------
export function welcomeEmail(user) {
  return {
    subject: `¡Bienvenido a ${APP_NAME}! 🎉`,
    html: layout(
      `¡Hola ${user.name || ''}! 👋`,
      '#1d5cf5',
      `<p style="line-height:1.6;color:#334155">
         Tu cuenta está lista. Con ${APP_NAME} podrás registrar tus gastos en segundos
         y no perder de vista ninguna factura.
       </p>
       <p style="line-height:1.6;color:#334155">
         Te avisaremos por este correo cuando una factura esté <b>por vencer</b>,
         cuando se marque como <b>pagada</b> y si alguna llega a <b>vencerse</b>.
       </p>
       <p style="line-height:1.6;color:#334155">
         <b>Regla #1:</b> registrar algo debe tomar menos tiempo que ignorarlo. 🚀
       </p>`,
    ),
  };
}

export function invoicePaidEmail(inv) {
  return {
    subject: `Factura pagada: ${inv.supplier} ✅`,
    html: layout(
      'Factura marcada como pagada ✅',
      '#10b981',
      `<p style="line-height:1.6;color:#334155">Registramos el pago de esta factura:</p>
       ${invoiceCard(inv)}
       <p style="line-height:1.6;color:#334155">¡Una menos de qué preocuparte!</p>`,
    ),
  };
}

export function invoiceDueSoonEmail(inv, daysLeft) {
  const when = daysLeft === 0 ? 'vence hoy' : daysLeft === 1 ? 'vence mañana' : `vence en ${daysLeft} días`;
  return {
    subject: `Recordatorio: ${inv.supplier} ${when} 🔔`,
    html: layout(
      `Una factura ${when} 🔔`,
      '#f59e0b',
      `<p style="line-height:1.6;color:#334155">No olvides este pago próximo:</p>
       ${invoiceCard(inv)}
       <p style="line-height:1.6;color:#334155">Entra a ${APP_NAME} para marcarla como pagada cuando la cubras.</p>`,
    ),
  };
}

export function invoiceOverdueEmail(inv, daysLate) {
  return {
    subject: `⚠️ Factura vencida: ${inv.supplier}`,
    html: layout(
      'Tienes una factura vencida ⚠️',
      '#e11d48',
      `<p style="line-height:1.6;color:#334155">
         Esta factura venció hace ${daysLate} día${daysLate === 1 ? '' : 's'}:
       </p>
       ${invoiceCard(inv)}
       <p style="line-height:1.6;color:#334155">Te recomendamos atenderla cuanto antes.</p>`,
    ),
  };
}
