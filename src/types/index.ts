// ---------- Categorías de gasto ----------
// Las predefinidas tienen id fijo; las personalizadas usan su id de la BD.
export type BuiltinCategory =
  | 'combustible'
  | 'comida'
  | 'transporte'
  | 'factura'
  | 'materiales'
  | 'otros';

/** Una categoría puede ser predefinida o personalizada (id arbitrario). */
export type ExpenseCategory = BuiltinCategory | (string & {});

/** Categoría personalizada creada por el usuario, guardada en la BD. */
export interface CustomCategory {
  id: string;
  label: string;
  emoji: string;
  createdBy: string;
  createdAt: number;
}

// ---------- Gastos ----------
export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  /** ISO date 'yyyy-MM-dd' (registrada automáticamente) */
  date: string;
  /** 'HH:mm' (registrada automáticamente) */
  time: string;
  note?: string;
  photoUrl?: string;
  createdBy: string;
  /** epoch ms */
  createdAt: number;
}

/** Payload para crear un gasto (el sistema completa fecha/hora/usuario). */
export interface NewExpense {
  amount: number;
  category: ExpenseCategory;
  note?: string;
  photoUrl?: string;
}

// ---------- Facturas ----------
export type InvoiceStatus = 'pendiente' | 'pagada' | 'vencida';

export interface Invoice {
  id: string;
  supplier: string;
  invoiceNumber: string;
  amount: number;
  /** ISO 'yyyy-MM-dd' */
  issueDate: string;
  /** ISO 'yyyy-MM-dd' */
  dueDate: string;
  status: InvoiceStatus;
  createdBy: string;
  createdAt: number;
}

export interface NewInvoice {
  supplier: string;
  invoiceNumber: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
}

// ---------- Usuario ----------
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}
