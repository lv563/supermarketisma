import type { ExpenseCategory } from '@/types';
import { CATEGORIES } from '@/constants/categories';

export interface OcrResult {
  supplier: string | null;
  amount: number | null;
  dueDate: string | null;
  category: ExpenseCategory | null;
  rawText: string;
}

/**
 * OCR básico de una factura con Tesseract.js.
 * Heurísticas simples para extraer proveedor, monto y vencimiento.
 * (Fase 3: reemplazar por un modelo en Cloud Functions para mayor precisión.)
 */
export async function scanInvoice(
  file: File,
  onProgress?: (p: number) => void,
): Promise<OcrResult> {
  // Carga diferida: Tesseract solo se descarga al escanear, no en el arranque.
  const Tesseract = (await import('tesseract.js')).default;
  const { data } = await Tesseract.recognize(file, 'spa+eng', {
    logger: (m) => {
      if (m.status === 'recognizing text') onProgress?.(Math.round(m.progress * 100));
    },
  });

  const text = data.text || '';
  return {
    rawText: text,
    supplier: guessSupplier(text),
    amount: guessAmount(text),
    dueDate: guessDueDate(text),
    category: guessCategory(text),
  };
}

function guessSupplier(text: string): string | null {
  const line = text
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 3 && /[a-zA-ZáéíóúñÑ]/.test(l));
  return line ?? null;
}

function guessAmount(text: string): number | null {
  // Busca el mayor número con formato de dinero (RD$ 1,200.00 / 5000.00)
  const matches = text.match(/(?:rd\$|\$)?\s?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?/gi) ?? [];
  const numbers = matches
    .map((m) => parseFloat(m.replace(/[rd$\s]/gi, '').replace(/[.,](?=\d{3}\b)/g, '').replace(',', '.')))
    .filter((n) => !Number.isNaN(n) && n > 0);
  return numbers.length ? Math.max(...numbers) : null;
}

function guessDueDate(text: string): string | null {
  // dd/mm/yyyy o dd-mm-yyyy
  const m = text.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const year = y!.length === 2 ? `20${y}` : y!;
  return `${year}-${mo!.padStart(2, '0')}-${d!.padStart(2, '0')}`;
}

function guessCategory(text: string): ExpenseCategory | null {
  const lower = text.toLowerCase();
  for (const c of CATEGORIES) {
    if (c.keywords.some((k) => lower.includes(k))) return c.id;
  }
  return 'factura';
}
