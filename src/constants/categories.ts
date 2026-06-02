import type { ExpenseCategory } from '@/types';

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
  {
    id: 'otros',
    label: 'Otros',
    emoji: '📦',
    color: 'bg-slate-100 text-slate-700 ring-slate-200',
    keywords: ['otros', 'otro', 'varios', 'misc'],
  },
];

export const CATEGORY_MAP: Record<ExpenseCategory, CategoryMeta> = CATEGORIES.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<ExpenseCategory, CategoryMeta>,
);
