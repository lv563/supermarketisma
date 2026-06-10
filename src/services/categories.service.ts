import { api } from './api';
import type { CustomCategory } from '@/types';

/**
 * Store en memoria de categorías. Todos los componentes leen de aquí y se
 * actualizan al instante cuando se crea/elimina una categoría (sin esperar a
 * que el navegador vuelva a pedir la lista).
 */
let cache: CustomCategory[] = [];
let loaded = false;
const listeners = new Set<(c: CustomCategory[]) => void>();

function emit() {
  for (const l of listeners) l(cache);
}

async function refresh(): Promise<void> {
  const data = await api<CustomCategory[]>('/categories');
  cache = data;
  loaded = true;
  emit();
}

export function subscribeCategories(
  onData: (categories: CustomCategory[]) => void,
  onError?: (e: Error) => void,
): () => void {
  listeners.add(onData);

  // Entrega lo que ya tengamos en cache de inmediato…
  onData(cache);
  // …y refresca desde el servidor (siempre, para traer cambios de otros equipos).
  refresh().catch((e) =>
    onError?.(e instanceof Error ? e : new Error('Error al cargar categorías')),
  );

  return () => {
    listeners.delete(onData);
  };
}

export async function createCategory(label: string, emoji: string): Promise<CustomCategory> {
  const cat = await api<CustomCategory>('/categories', { method: 'POST', body: { label, emoji } });
  // Actualización optimista: aparece al instante en toda la app.
  cache = [...cache, cat];
  loaded = true;
  emit();
  return cat;
}

export async function deleteCategory(id: string): Promise<void> {
  await api<{ ok: true }>(`/categories/${id}`, { method: 'DELETE' });
  cache = cache.filter((c) => c.id !== id);
  emit();
}

/** Reinicia el store al cerrar sesión para no mezclar datos entre usuarios. */
export function resetCategories(): void {
  cache = [];
  loaded = false;
  emit();
}

export function categoriesLoaded(): boolean {
  return loaded;
}
