import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeExpenses, expensesLoaded } from '@/services/expenses.service';
import { todayISO } from '@/lib/utils';
import type { Expense } from '@/types';

export function useExpenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  // Si el store ya cargó antes, no mostramos "Cargando" de nuevo.
  const [loading, setLoading] = useState(!expensesLoaded());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeExpenses(
      user.uid,
      (data) => {
        setExpenses(data);
        setLoading(false);
      },
      (e) => {
        setError(e.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [user]);

  const today = todayISO();
  const todayExpenses = useMemo(
    () => expenses.filter((e) => e.date === today),
    [expenses, today],
  );
  const todayTotal = useMemo(
    () => todayExpenses.reduce((sum, e) => sum + e.amount, 0),
    [todayExpenses],
  );

  return { expenses, todayExpenses, todayTotal, loading, error };
}
