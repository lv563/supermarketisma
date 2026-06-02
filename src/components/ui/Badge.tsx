import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { InvoiceStatus } from '@/types';

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        className,
      )}
    >
      {children}
    </span>
  );
}

const statusStyles: Record<InvoiceStatus, string> = {
  pagada: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  pendiente: 'bg-amber-100 text-amber-800 ring-amber-200',
  vencida: 'bg-rose-100 text-rose-700 ring-rose-200',
};

const statusLabel: Record<InvoiceStatus, string> = {
  pagada: 'Pagada',
  pendiente: 'Pendiente',
  vencida: 'Vencida',
};

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  return <Badge className={statusStyles[status]}>{statusLabel[status]}</Badge>;
}
