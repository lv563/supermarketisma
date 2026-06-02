import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CATEGORIES } from '@/constants/categories';
import type { ExpenseCategory } from '@/types';

/** Une clases tailwind sin conflictos. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const currency = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** RD$5,000 */
export function formatMoney(value: number): string {
  return currency.format(value || 0);
}

/** 'yyyy-MM-dd' de hoy en hora local. */
export function todayISO(): string {
  return toISODate(new Date());
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function nowTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Días entre hoy y una fecha ISO (negativo = ya pasó). */
export function daysUntil(iso: string): number {
  const today = new Date(todayISO()).getTime();
  const target = new Date(iso).getTime();
  return Math.round((target - today) / 86_400_000);
}

export function formatDateLong(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-DO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function formatDateShort(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-DO', {
    day: '2-digit',
    month: 'short',
  });
}

/**
 * Interpreta una frase de voz tipo "450 gasolina" o "gasté 1200 en comida".
 * Devuelve monto + categoría detectada (o null si no hay match claro).
 */
export function parseVoiceExpense(
  transcript: string,
): { amount: number | null; category: ExpenseCategory | null; raw: string } {
  const raw = transcript.trim().toLowerCase();

  // Primer número (admite 1,200 / 1.200 / 450.50)
  const numMatch = raw.replace(/(\d)[,.](?=\d{3}\b)/g, '$1').match(/\d+(?:[.,]\d{1,2})?/);
  const amount = numMatch ? parseFloat(numMatch[0].replace(',', '.')) : null;

  let category: ExpenseCategory | null = null;
  for (const c of CATEGORIES) {
    if (c.keywords.some((k) => raw.includes(k))) {
      category = c.id;
      break;
    }
  }

  return { amount, category, raw: transcript.trim() };
}
