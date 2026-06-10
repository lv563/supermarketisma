import type { CustomCategory, ExpenseCategory } from '@/types';

export interface CategoryMeta {
  id: ExpenseCategory;
  label: string;
  emoji: string;
  /** clases tailwind para el chip/botón */
  color: string;
  /** palabras clave para el registro por voz */
  keywords: string[];
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'combustible',
    label: 'Combustible',
    emoji: '⛽',
    color: 'bg-amber-100 text-amber-800 ring-amber-200',
    keywords: ['combustible', 'gasolina', 'gasoil', 'diesel', 'gas', 'nafta', 'bomba'],
  },
  {
    id: 'comida',
    label: 'Comida',
    emoji: '🍔',
    color: 'bg-rose-100 text-rose-800 ring-rose-200',
    keywords: ['comida', 'almuerzo', 'desayuno', 'cena', 'restaurante', 'colmado', 'super'],
  },
  {
    id: 'transporte',
    label: 'Transporte',
    emoji: '🚚',
    color: 'bg-sky-100 text-sky-800 ring-sky-200',
    keywords: ['transporte', 'pasaje', 'uber', 'taxi', 'flete', 'peaje', 'parqueo'],
  },
  {
    id: 'factura',
    label: 'Factura',
    emoji: '🧾',
    color: 'bg-violet-100 text-violet-800 ring-violet-200',
    keywords: ['factura', 'luz', 'agua', 'internet', 'telefono', 'claro', 'edesur', 'edenorte'],
  },
  {
    id: 'materiales',
    label: 'Materiales',
    emoji: '🛠',
    color: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
    keywords: ['materiales', 'material', 'ferreteria', 'herramienta', 'cemento', 'pintura'],
  },
];

// "Otros" sigue existiendo como categoría válida y de respaldo, aunque ya no se
// muestre como botón fijo (su lugar lo ocupa el botón "+" para crear categorías).
export const OTHERS: CategoryMeta = {
  id: 'otros',
  label: 'Otros',
  emoji: '📦',
  color: 'bg-slate-100 text-slate-700 ring-slate-200',
  keywords: ['otros', 'otro', 'varios', 'misc'],
};

export const CATEGORY_MAP: Record<string, CategoryMeta> = [...CATEGORIES, OTHERS].reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<string, CategoryMeta>,
);

// Paleta para asignar color estable a las categorías personalizadas.
const CUSTOM_COLORS = [
  'bg-indigo-100 text-indigo-800 ring-indigo-200',
  'bg-pink-100 text-pink-800 ring-pink-200',
  'bg-teal-100 text-teal-800 ring-teal-200',
  'bg-orange-100 text-orange-800 ring-orange-200',
  'bg-lime-100 text-lime-800 ring-lime-200',
  'bg-cyan-100 text-cyan-800 ring-cyan-200',
];

function colorFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return CUSTOM_COLORS[hash % CUSTOM_COLORS.length];
}

/** Devuelve la metadata de una categoría, sea predefinida o personalizada. */
export function resolveCategory(
  id: ExpenseCategory,
  custom: CustomCategory[] = [],
): CategoryMeta {
  if (CATEGORY_MAP[id]) return CATEGORY_MAP[id];
  const c = custom.find((x) => x.id === id);
  if (c) return { id: c.id, label: c.label, emoji: c.emoji, color: colorFor(c.id), keywords: [] };
  return OTHERS;
}
