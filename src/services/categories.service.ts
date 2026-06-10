import { api } from './api';
import type { CustomCategory } from '@/types';

/**
 * Store en memoria de categorías. Todos los componentes leen de aquí y se
 * actualizan al instante al crear/eliminar (sin esperar a la red).
 *
 * `seq` se incrementa en cada cambio local: si una petición GET lenta resuelve
 * DESPUÉS de que el usuario ya creó/eliminó algo, se descarta para no pisar el
 * estado más reciente (evita la condición de carrera con el backend lento).
 */
let cache: CustomCategory[] = [];
let seq = 0;
let refreshing = false;
let everLoaded = false;
const listeners = new Set<(c: CustomCategory[]) => void>();

function emit() {
  for (const l of listeners) l(cache);
}

async function refresh(force = false): Promise<void> {
  if (refreshing && !force) return;
  refreshing = true;
  const mySeq = seq;
  try {
    const data = await api<CustomCategory[]>('/categories');
    // Si hubo un cambio local mientras esperábamos, esta respuesta quedó vieja.
    if (mySeq !== seq) return;
    cache = data;
    everLoaded = true;
    emit();
  } finally {
    refreshing = false;
  }
}

export function subscribeCategories(
  onData: (categories: CustomCategory[]) => void,
  onError?: (e: Error) => void,
): () => void {
  listeners.add(onData);

  // Entrega lo que ya haya en memoria de inmediato.
  onData(cache);

  // Solo la primera vez disparamos la carga desde el servidor (las demás
  // suscripciones reutilizan el cache para no inundar de peticiones).
  if (!everLoaded) {
    refresh().catch((e) =>
      onError?.(e instanceof Error ? e : new Error('Error al cargar categorías')),
    );
  }

  return () => {
    listeners.delete(onData);
  };
}

export async function createCategory(label: string, emoji: string): Promise<CustomCategory> {
  const cat = await api<CustomCategory>('/categories', { method: 'POST', body: { label, emoji } });
  seq++; // invalida cualquier GET en vuelo que pudiera pisar este cambio
  cache = [...cache, cat];
  everLoaded = true;
  emit();
  return cat;
}

export async function deleteCategory(id: string): Promise<void> {
  await api<{ ok: true }>(`/categories/${id}`, { method: 'DELETE' });
  seq++;
  cache = cache.filter((c) => c.id !== id);
  emit();
}

/** Reinicia el store al cerrar sesión para no mezclar datos entre usuarios. */
export function resetCategories(): void {
  seq++;
  cache = [];
  everLoaded = false;
  emit();
}
