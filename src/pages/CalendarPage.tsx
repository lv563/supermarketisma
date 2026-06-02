import { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg } from '@fullcalendar/core';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Spinner';
import { useInvoices } from '@/hooks/useInvoices';
import { formatMoney, formatDateLong } from '@/lib/utils';
import type { Invoice } from '@/types';

export function CalendarPage() {
  const { withStatus, loading } = useInvoices();
  const [selected, setSelected] = useState<string | null>(null);

  // Eventos: una entrada por día con el total a pagar + cantidad.
  const { events, byDay } = useMemo(() => {
    const map = new Map<string, Invoice[]>();
    for (const inv of withStatus) {
      const arr = map.get(inv.dueDate) ?? [];
      arr.push(inv);
      map.set(inv.dueDate, arr);
    }
    const events = [...map.entries()].map(([date, list]) => {
      const total = list.reduce((s, i) => s + i.amount, 0);
      const anyOverdue = list.some((i) => i.status === 'vencida');
      const allPaid = list.every((i) => i.status === 'pagada');
      return {
        id: date,
        start: date,
        title: `${formatMoney(total)} · ${list.length}`,
        backgroundColor: allPaid ? '#10b981' : anyOverdue ? '#e11d48' : '#1d5cf5',
        borderColor: 'transparent',
      };
    });
    return { events, byDay: map };
  }, [withStatus]);

  if (loading) return <PageLoader />;

  const dayList = selected ? byDay.get(selected) ?? [] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Calendario</h1>
        <p className="text-sm text-slate-500">Qué vence cada día y cuánto dinero sale.</p>
      </div>

      <Card>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="es"
          height="auto"
          buttonText={{ today: 'Hoy' }}
          headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
          events={events}
          eventClick={(arg: EventClickArg) => setSelected(arg.event.id)}
          dateClick={(arg) => setSelected(arg.dateStr)}
        />
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? formatDateLong(selected) : ''}>
        {dayList.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No hay facturas este día.</p>
        ) : (
          <div className="space-y-3">
            {dayList.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                <div>
                  <p className="font-semibold text-slate-800">{inv.supplier}</p>
                  <p className="text-xs text-slate-400">#{inv.invoiceNumber}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={inv.status} />
                  <span className="font-bold text-slate-900">{formatMoney(inv.amount)}</span>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-sm font-medium text-slate-500">Total del día</span>
              <span className="text-lg font-bold text-slate-900">
                {formatMoney(dayList.reduce((s, i) => s + i.amount, 0))}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
