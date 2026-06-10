import { api } from './api';
import type { Expense, NewExpense } from '@/types';

/**
 * Store en memoria de gastos, compartido por todas las pantallas (dashboard,
 * historial, reportes). Al crear/eliminar se actualiza al instante (optimista)
 * y `seq` descarta respuestas GET lentas que llegarían a destiempo.
 */
let cache: Expense[] = [];
let seq = 0;
let everLoaded = false;
let refreshing = false;
const listeners = new Set<(e: Expense[]) => void>();

function emit() {
  for (const l of listeners) l(cache);
}

function sortByCreated(list: Expense[]): Expense[] {
  return [...list].sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
}

async function refresh(): Promise<void> {
  if (refreshing) return;
  refreshing = true;
  const mySeq = seq;
  try {
    const data = await api<Expense[]>('/expenses');
    if (mySeq !== seq) return; // hubo un cambio local mientras esperábamos
    cache = sortByCreated(data);
    everLoaded = true;
    emit();
  } finally {
    refreshing = false;
  }
}

export function subscribeExpenses(
  _uid: string,
  onData: (expenses: Expense[]) => void,
  onError?: (e: Error) => void,
): () => void {
  listeners.add(onData);
  onData(cache);
  // Refresca siempre desde el servidor al montar (trae cambios desde otros equipos).
  refresh().catch((e) =>
    onError?.(e instanceof Error ? e : new Error('Error al cargar gastos')),
  );
  return () => {
    listeners.delete(onData);
  };
}

export async function fetchExpenses(): Promise<Expense[]> {
  return api<Expense[]>('/expenses');
}

/** Crea un gasto. El backend agrega fecha, hora y usuario automáticamente. */
export async function createExpense(_uid: string, input: NewExpense): Promise<void> {
  const created = await api<Expense>('/expenses', { method: 'POST', body: input });
  seq++;
  cache = sortByCreated([created, ...cache]);
  everLoaded = true;
  emit();
}

export async function deleteExpense(id: string): Promise<void> {
  await api<{ ok: true }>(`/expenses/${id}`, { method: 'DELETE' });
  seq++;
  cache = cache.filter((e) => e.id !== id);
  emit();
}

export function resetExpenses(): void {
  seq++;
  cache = [];
  everLoaded = false;
  emit();
}

export function expensesLoaded(): boolean {
  return everLoaded;
}
