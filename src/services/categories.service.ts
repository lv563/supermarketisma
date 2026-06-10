import { api } from './api';
import type { CustomCategory } from '@/types';

const REFRESH_EVENT = 'data:categories';

export function subscribeCategories(
  onData: (categories: CustomCategory[]) => void,
  onError?: (e: Error) => void,
): () => void {
  let active = true;

  async function load() {
    try {
      const data = await api<CustomCategory[]>('/categories');
      if (active) onData(data);
    } catch (e) {
      if (active) onError?.(e instanceof Error ? e : new Error('Error al cargar categorías'));
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

export async function createCategory(label: string, emoji: string): Promise<CustomCategory> {
  const cat = await api<CustomCategory>('/categories', { method: 'POST', body: { label, emoji } });
  window.dispatchEvent(new Event(REFRESH_EVENT));
  return cat;
}

export async function deleteCategory(id: string): Promise<void> {
  await api<{ ok: true }>(`/categories/${id}`, { method: 'DELETE' });
  window.dispatchEvent(new Event(REFRESH_EVENT));
}
