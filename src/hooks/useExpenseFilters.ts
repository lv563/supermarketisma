import { useMemo, useState } from 'react';
import type { Expense, ExpenseCategory } from '@/types';

export interface ExpenseFilters {
  text: string;
  category: ExpenseCategory | 'todas';
  from: string;
  to: string;
  minAmount: string;
  maxAmount: string;
}

const EMPTY: ExpenseFilters = {
  text: '',
  category: 'todas',
  from: '',
  to: '',
  minAmount: '',
  maxAmount: '',
};

/** Filtros del Historial: texto/nota, categoría, rango de fecha y de monto. */
export function useExpenseFilters(expenses: Expense[]) {
  const [filters, setFilters] = useState<ExpenseFilters>(EMPTY);

  const update = (patch: Partial<ExpenseFilters>) =>
    setFilters((f) => ({ ...f, ...patch }));
  const reset = () => setFilters(EMPTY);

  const filtered = useMemo(() => {
    const min = filters.minAmount ? parseFloat(filters.minAmount) : null;
    const max = filters.maxAmount ? parseFloat(filters.maxAmount) : null;
    const text = filters.text.trim().toLowerCase();

    return expenses.filter((e) => {
      if (filters.category !== 'todas' && e.category !== filters.category) return false;
      if (filters.from && e.date < filters.from) return false;
      if (filters.to && e.date > filters.to) return false;
      if (min !== null && e.amount < min) return false;
      if (max !== null && e.amount > max) return false;
      if (text) {
        const hay = `${e.note ?? ''} ${e.category}`.toLowerCase();
        if (!hay.includes(text)) return false;
      }
      return true;
    });
  }, [expenses, filters]);

  const total = useMemo(() => filtered.reduce((s, e) => s + e.amount, 0), [filtered]);

  return { filters, update, reset, filtered, total };
}
