import { CATEGORIES } from '@/constants/categories';
import { cn } from '@/lib/utils';
import type { ExpenseCategory } from '@/types';

interface CategoryPickerProps {
  value: ExpenseCategory | null;
  onChange: (c: ExpenseCategory) => void;
}

/** Botones grandes y tocables. Un toque = categoría seleccionada. */
export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {CATEGORIES.map((c) => {
        const active = value === c.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.id)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 rounded-2xl border-2 py-4 transition',
              'focus:outline-none focus:ring-2 focus:ring-brand-300',
              active
                ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
            )}
          >
            <span className="text-3xl">{c.emoji}</span>
            <span className={cn('text-sm font-semibold', active ? 'text-brand-700' : 'text-slate-600')}>
              {c.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
