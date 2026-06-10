import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { CATEGORIES, resolveCategory } from '@/constants/categories';
import { useCategories } from '@/hooks/useCategories';
import { createCategory, deleteCategory } from '@/services/categories.service';
import { useToast } from '@/contexts/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { ExpenseCategory } from '@/types';

interface CategoryPickerProps {
  value: ExpenseCategory | null;
  onChange: (c: ExpenseCategory) => void;
}

const EMOJI_OPTIONS = ['📦', '🏷️', '💡', '🧾', '🛒', '💊', '✂️', '🐾', '🎁', '🏠', '👕', '📱', '⚙️', '☕', '💼', '🚗'];

/** Botones grandes y tocables. Incluye las categorías personalizadas y un "+" para crear. */
export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  const { categories } = useCategories();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [emoji, setEmoji] = useState('📦');
  const [saving, setSaving] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = label.trim();
    if (!name) {
      toast('Escribe un nombre para la categoría', 'error');
      return;
    }
    setSaving(true);
    try {
      const cat = await createCategory(name, emoji);
      toast(`Categoría "${cat.label}" creada`);
      onChange(cat.id); // queda seleccionada de una vez
      setOpen(false);
      setLabel('');
      setEmoji('📦');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No se pudo crear', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteCategory(id);
      if (value === id) onChange('otros');
      toast('Categoría eliminada', 'info');
    } catch {
      toast('No se pudo eliminar', 'error');
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {/* Predefinidas */}
        {CATEGORIES.map((c) => (
          <CategoryButton
            key={c.id}
            emoji={c.emoji}
            label={c.label}
            active={value === c.id}
            onClick={() => onChange(c.id)}
          />
        ))}

        {/* Personalizadas */}
        {categories.map((c) => (
          <CategoryButton
            key={c.id}
            emoji={c.emoji}
            label={c.label}
            active={value === c.id}
            onClick={() => onChange(c.id)}
            onDelete={() => handleDelete(c.id)}
          />
        ))}

        {/* Botón agregar categoría (reemplaza a "Otros") */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            'flex flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed py-4 transition',
            'border-slate-300 bg-white text-slate-500 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600',
            'focus:outline-none focus:ring-2 focus:ring-brand-300',
          )}
        >
          <Plus size={26} strokeWidth={2.5} />
          <span className="text-sm font-semibold">Agregar</span>
        </button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva categoría">
        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">Ícono</label>
            <div className="grid grid-cols-8 gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={cn(
                    'flex h-10 items-center justify-center rounded-lg border text-xl transition',
                    emoji === e ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200' : 'border-slate-200 hover:bg-slate-50',
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Nombre</label>
            <input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={24}
              placeholder="Ej: Renta, Nómina, Limpieza…"
              className="field"
            />
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <span className="text-2xl">{emoji}</span>
            <span className="font-semibold text-slate-700">{label.trim() || 'Vista previa'}</span>
          </div>

          <Button type="submit" size="lg" fullWidth loading={saving}>
            Crear categoría
          </Button>
        </form>
      </Modal>
    </>
  );
}

interface CategoryButtonProps {
  emoji: string;
  label: string;
  active: boolean;
  onClick: () => void;
  onDelete?: () => void;
}

function CategoryButton({ emoji, label, active, onClick, onDelete }: CategoryButtonProps) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'flex w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 py-4 transition',
          'focus:outline-none focus:ring-2 focus:ring-brand-300',
          active
            ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200'
            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
        )}
      >
        <span className="text-3xl">{emoji}</span>
        <span className={cn('text-sm font-semibold', active ? 'text-brand-700' : 'text-slate-600')}>
          {label}
        </span>
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label={`Eliminar ${label}`}
          className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-400 shadow ring-1 ring-slate-200 hover:bg-rose-50 hover:text-rose-500"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}

// Helper reexportado para que otros componentes resuelvan etiquetas de categoría.
export { resolveCategory };
