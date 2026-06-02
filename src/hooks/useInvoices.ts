import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { effectiveStatus, subscribeInvoices } from '@/services/invoices.service';
import { daysUntil } from '@/lib/utils';
import type { Invoice } from '@/types';

export function useInvoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsub = subscribeInvoices(
      user.uid,
      (data) => {
        setInvoices(data);
        setLoading(false);
      },
      (e) => {
        setError(e.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [user]);

  const derived = useMemo(() => {
    const withStatus = invoices.map((i) => ({ ...i, status: effectiveStatus(i) }));
    const pending = withStatus.filter((i) => i.status === 'pendiente');
    const overdue = withStatus.filter((i) => i.status === 'vencida');
    const paid = withStatus.filter((i) => i.status === 'pagada');

    const dueToday = pending.filter((i) => daysUntil(i.dueDate) === 0);
    const dueTomorrow = pending.filter((i) => daysUntil(i.dueDate) === 1);
    const upcoming = [...pending]
      .filter((i) => daysUntil(i.dueDate) >= 0)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5);

    return { withStatus, pending, overdue, paid, dueToday, dueTomorrow, upcoming };
  }, [invoices]);

  return { invoices, loading, error, ...derived };
}
