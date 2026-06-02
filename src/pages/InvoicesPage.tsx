import { useState } from 'react';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import { AlertBanner } from '@/components/invoices/AlertBanner';
import { InvoiceForm } from '@/components/invoices/InvoiceForm';
import { PageLoader, EmptyState } from '@/components/ui/Spinner';
import { useInvoices } from '@/hooks/useInvoices';
import { useToast } from '@/contexts/ToastContext';
import { deleteInvoice, updateInvoiceStatus } from '@/services/invoices.service';
import { cn, formatMoney, formatDateShort, daysUntil } from '@/lib/utils';
import type { Invoice, InvoiceStatus } from '@/types';

const filters: { id: InvoiceStatus | 'todas'; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'pendiente', label: 'Pendientes' },
  { id: 'vencida', label: 'Vencidas' },
  { id: 'pagada', label: 'Pagadas' },
];

/** Borde de color: verde pagada, amarillo pronto, rojo vencida. */
function borderTone(inv: Invoice): string {
  if (inv.status === 'pagada') return 'border-l-emerald-500';
  if (inv.status === 'vencida') return 'border-l-rose-500';
  return daysUntil(inv.dueDate) <= 2 ? 'border-l-amber-500' : 'border-l-slate-300';
}

export function InvoicesPage() {
  const { withStatus, dueToday, dueTomorrow, overdue, loading } = useInvoices();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<InvoiceStatus | 'todas'>('todas');

  if (loading) return <PageLoader />;

  const list = withStatus.filter((i) => active === 'todas' || i.status === active);

  async function markPaid(id: string) {
    await updateInvoiceStatus(id, 'pagada');
    toast('Factura marcada como pagada');
  }
  async function remove(id: string) {
    await deleteInvoice(id);
    toast('Factura eliminada', 'info');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Facturas</h1>
          <p className="text-sm text-slate-500">Controla pagos y vencimientos.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={18} /> Nueva factura
        </Button>
      </div>

      <AlertBanner dueToday={dueToday} dueTomorrow={dueTomorrow} overdue={overdue} />

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setActive(f.id)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-semibold transition',
              active === f.id ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState title="No hay facturas aquí" hint="Agrega una con el botón “Nueva factura”." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((inv) => {
            const d = daysUntil(inv.dueDate);
            return (
              <Card key={inv.id} className={cn('border-l-4 p-4', borderTone(inv))}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{inv.supplier}</p>
                    <p className="text-xs text-slate-400">#{inv.invoiceNumber}</p>
                  </div>
                  <StatusBadge status={inv.status} />
                </div>

                <p className="mt-3 text-2xl font-bold text-slate-900">{formatMoney(inv.amount)}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Vence {formatDateShort(inv.dueDate)}
                  {inv.status !== 'pagada' &&
                    ' · ' +
                      (d < 0 ? `hace ${Math.abs(d)} día(s)` : d === 0 ? 'hoy' : d === 1 ? 'mañana' : `en ${d} día(s)`)}
                </p>

                <div className="mt-4 flex gap-2">
                  {inv.status !== 'pagada' && (
                    <Button size="sm" variant="success" onClick={() => markPaid(inv.id)} className="flex-1">
                      <CheckCircle2 size={16} /> Pagar
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => remove(inv.id)} aria-label="Eliminar">
                    <Trash2 size={16} className="text-rose-500" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva factura">
        <InvoiceForm onSaved={() => setOpen(false)} />
      </Modal>
    </div>
  );
}
