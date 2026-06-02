import { AlertTriangle, BellRing, CalendarClock } from 'lucide-react';
import type { Invoice } from '@/types';

/** Alertas automáticas: vence hoy / vence mañana / X vencidas. */
export function AlertBanner({
  dueToday,
  dueTomorrow,
  overdue,
}: {
  dueToday: Invoice[];
  dueTomorrow: Invoice[];
  overdue: Invoice[];
}) {
  const alerts: { key: string; tone: string; icon: React.ReactNode; text: string }[] = [];

  if (overdue.length) {
    alerts.push({
      key: 'overdue',
      tone: 'bg-rose-50 text-rose-700 ring-rose-200',
      icon: <AlertTriangle size={18} />,
      text: `Tienes ${overdue.length} factura${overdue.length > 1 ? 's' : ''} vencida${overdue.length > 1 ? 's' : ''}`,
    });
  }
  if (dueToday.length) {
    alerts.push({
      key: 'today',
      tone: 'bg-amber-50 text-amber-800 ring-amber-200',
      icon: <BellRing size={18} />,
      text: `${dueToday.length} factura${dueToday.length > 1 ? 's' : ''} vence${dueToday.length > 1 ? 'n' : ''} hoy`,
    });
  }
  if (dueTomorrow.length) {
    alerts.push({
      key: 'tomorrow',
      tone: 'bg-sky-50 text-sky-700 ring-sky-200',
      icon: <CalendarClock size={18} />,
      text: `${dueTomorrow.length} factura${dueTomorrow.length > 1 ? 's' : ''} vence${dueTomorrow.length > 1 ? 'n' : ''} mañana`,
    });
  }

  if (!alerts.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {alerts.map((a) => (
        <div
          key={a.key}
          className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ring-1 ring-inset ${a.tone}`}
        >
          {a.icon}
          {a.text}
        </div>
      ))}
    </div>
  );
}
