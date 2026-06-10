import { useEffect, useRef, useState } from 'react';
import { Camera, Mic, MicOff, StickyNote } from 'lucide-react';
import { CategoryPicker } from './CategoryPicker';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { createExpense } from '@/services/expenses.service';
import { uploadPhoto } from '@/services/storage.service';
import { cn, formatMoney, parseVoiceExpense } from '@/lib/utils';
import { resolveCategory } from '@/constants/categories';
import { useCategories } from '@/hooks/useCategories';
import type { ExpenseCategory, NewExpense } from '@/types';

interface QuickExpenseFormProps {
  /** Se llama tras guardar con éxito (p. ej. cerrar modal o navegar). */
  onSaved?: () => void;
  autoFocus?: boolean;
}

/**
 * El corazón de la app. Monto + categoría = guardado.
 * Fecha, hora y usuario se agregan solos. Nota y foto son opcionales.
 */
export function QuickExpenseForm({ onSaved, autoFocus = true }: QuickExpenseFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { categories } = useCategories();
  const voice = useVoiceInput();

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory | null>(null);
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const amountRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) amountRef.current?.focus();
  }, [autoFocus]);

  // Interpreta el dictado "450 gasolina" en vivo.
  useEffect(() => {
    if (!voice.transcript) return;
    const { amount: a, category: c } = parseVoiceExpense(voice.transcript);
    if (a) setAmount(String(a));
    if (c) setCategory(c);
  }, [voice.transcript]);

  // Al terminar de hablar, si tenemos monto + categoría, guarda solo.
  useEffect(() => {
    if (!voice.listening && voice.transcript) {
      const { amount: a, category: c } = parseVoiceExpense(voice.transcript);
      if (a && c) void submit(a, c);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.listening]);

  async function submit(amountValue: number, categoryValue: ExpenseCategory) {
    if (!user) return;
    if (!amountValue || amountValue <= 0) {
      toast('Escribe un monto válido', 'error');
      amountRef.current?.focus();
      return;
    }
    setSaving(true);
    try {
      const payload: NewExpense = { amount: amountValue, category: categoryValue };
      const trimmedNote = note.trim();
      if (trimmedNote) payload.note = trimmedNote;
      if (photo) payload.photoUrl = await uploadPhoto(user.uid, photo);
      await createExpense(user.uid, payload);
      toast(`Guardado: ${formatMoney(amountValue)} · ${resolveCategory(categoryValue, categories).label}`);
      // reset para registrar otro de inmediato
      setAmount('');
      setCategory(null);
      setNote('');
      setShowNote(false);
      setPhoto(null);
      amountRef.current?.focus();
      onSaved?.();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudo guardar', 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category) {
      toast('Selecciona una categoría', 'error');
      return;
    }
    void submit(parseFloat(amount), category);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Monto: campo protagonista */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-500">Monto</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">
            RD$
          </span>
          <input
            ref={amountRef}
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-2xl border-2 border-slate-200 bg-white py-5 pl-20 pr-4 text-right text-4xl font-bold tracking-tight outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          />
        </div>
      </div>

      {/* Categorías */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-500">Categoría</label>
        <CategoryPicker value={category} onChange={setCategory} />
      </div>

      {/* Opcionales: nota, foto, voz */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowNote((s) => !s)}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition',
            showNote ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50',
          )}
        >
          <StickyNote size={16} /> Nota
        </button>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition',
            photo ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50',
          )}
        >
          <Camera size={16} /> {photo ? 'Foto lista' : 'Foto'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
        />

        {voice.supported && (
          <button
            type="button"
            onClick={voice.listening ? voice.stop : voice.start}
            className={cn(
              'ml-auto inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition',
              voice.listening
                ? 'border-rose-300 bg-rose-50 text-rose-700 animate-pulse'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50',
            )}
          >
            {voice.listening ? <MicOff size={16} /> : <Mic size={16} />}
            {voice.listening ? 'Escuchando…' : 'Voz'}
          </button>
        )}
      </div>

      {voice.transcript && (
        <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-500">
          🎙️ "{voice.transcript}"
        </p>
      )}

      {showNote && (
        <textarea
          placeholder="Nota corta (opcional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="field resize-none"
        />
      )}

      <Button type="submit" size="xl" fullWidth loading={saving} variant="success">
        ✅ Guardar
      </Button>

      <p className="text-center text-xs text-slate-400">
        Fecha, hora y usuario se agregan automáticamente.
      </p>
    </form>
  );
}
