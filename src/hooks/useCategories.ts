import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeCategories } from '@/services/categories.service';
import type { CustomCategory } from '@/types';

/** Categorías personalizadas del usuario (en tiempo real tras crear/eliminar). */
export function useCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsub = subscribeCategories(
      (data) => {
        setCategories(data);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [user]);

  return { categories, loading };
}
