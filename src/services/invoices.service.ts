import { api } from './api';
import { daysUntil } from '@/lib/utils';
import type { Invoice, InvoiceStatus, NewInvoice } from '@/types';

const REFRESH_EVENT = 'data:invoices';

/** Estado efectivo: una factura pendiente cuyo vencimiento ya pasó es "vencida". */
export function effectiveStatus(inv: Invoice): InvoiceStatus {
  if (inv.status === 'pagada') return 'pagada';
  return daysUntil(inv.dueDate) < 0 ? 'vencida' : 'pendiente';
}

export function subscribeInvoices(
  _uid: string,
  onData: (invoices: Invoice[]) => void,
  onError?: (e: Error) => void,
): () => void {
  let active = true;

  async function load() {
    try {
      const data = await api<Invoice[]>('/invoices');
      if (active) onData(data);
    } catch (e) {
      if (active) onError?.(e instanceof Error ? e : new Error('Error al cargar facturas'));
    }
  }

  void load();
  const handler = () => void load();
  window.addEventListener(REFRESH_EVENT, handler);
  return () => {
    active = false;
    window.removeEventListener(REFRESH_EVENT, handler);
  };
}

export async function fetchInvoices(): Promise<Invoice[]> {
  return api<Invoice[]>('/invoices');
}

export async function createInvoice(_uid: string, input: NewInvoice): Promise<void> {
  await api<Invoice>('/invoices', { method: 'POST', body: input });
  window.dispatchEvent(new Event(REFRESH_EVENT));
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<void> {
  await api<Invoice>(`/invoices/${id}`, { method: 'PATCH', body: { status } });
  window.dispatchEvent(new Event(REFRESH_EVENT));
}

export async function deleteInvoice(id: string): Promise<void> {
  await api<{ ok: true }>(`/invoices/${id}`, { method: 'DELETE' });
  window.dispatchEvent(new Event(REFRESH_EVENT));
}
