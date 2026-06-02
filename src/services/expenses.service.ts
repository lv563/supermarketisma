import { api } from './api';
import type { Expense, NewExpense } from '@/types';

const REFRESH_EVENT = 'data:expenses';

// Las fotos se guardan como data URL completo, listas para usar directamente.
function normalize(e: Expense): Expense {
  return e;
}

/**
 * "Suscripción" a los gastos: hace fetch inicial y vuelve a consultar cada vez
 * que se crea/elimina un gasto (evento interno). Devuelve unsubscribe.
 */
export function subscribeExpenses(
  _uid: string,
  onData: (expenses: Expense[]) => void,
  onError?: (e: Error) => void,
): () => void {
  let active = true;

  async function load() {
    try {
      const data = await api<Expense[]>('/expenses');
      if (active) onData(data.map(normalize));
    } catch (e) {
      if (active) onError?.(e instanceof Error ? e : new Error('Error al cargar gastos'));
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

export async function fetchExpenses(): Promise<Expense[]> {
  const data = await api<Expense[]>('/expenses');
  return data.map(normalize);
}

/** Crea un gasto. El backend agrega fecha, hora y usuario automáticamente. */
export async function createExpense(_uid: string, input: NewExpense): Promise<void> {
  await api<Expense>('/expenses', { method: 'POST', body: input });
  window.dispatchEvent(new Event(REFRESH_EVENT));
}

export async function deleteExpense(id: string): Promise<void> {
  await api<{ ok: true }>(`/expenses/${id}`, { method: 'DELETE' });
  window.dispatchEvent(new Event(REFRESH_EVENT));
}
