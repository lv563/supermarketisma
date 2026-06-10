import { Search, Trash2, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageLoader, EmptyState } from '@/components/ui/Spinner';
import { useExpenses } from '@/hooks/useExpenses';
import { useExpenseFilters } from '@/hooks/useExpenseFilters';
import { useToast } from '@/contexts/ToastContext';
import { deleteExpense } from '@/services/expenses.service';
import { formatMoney, formatDateShort } from '@/lib/utils';
import { CATEGORIES, OTHERS, resolveCategory } from '@/constants/categories';

export function HistoryPage() {
  const { expenses, loading } = useExpenses();
  const { filters, update, reset, filtered, total } = useExpenseFilters(expenses);
  const { toast } = useToast();

  if (loading) return <PageLoader />;

  async function remove(id: string) {
    await deleteExpense(id);
    toast('Gasto eliminado', 'info');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Historial</h1>
        <p className="text-sm text-slate-500">Busca y filtra todos tus gastos.</p>
      </div>

      <Card className="space-y-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Buscar por nota o categoría…"
            value={filters.text}
            onChange={(e) => update({ text: e.target.value })}
            className="field pl-10"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <select
            className="field"
            value={filters.category}
            onChange={(e) => update({ category: e.target.value as never })}
          >
            <option value="todas">Toda categoría</option>
            {[...CATEGORIES, OTHERS].map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
          <Input type="date" value={filters.from} onChange={(e) => update({ from: e.target.value })} />
          <Input type="date" value={filters.to} onChange={(e) => update({ to: e.target.value })} />
          <Input
            type="number"
            placeholder="Monto mín."
            value={filters.minAmount}
            onChange={(e) => update({ minAmount: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Monto máx."
            value={filters.maxAmount}
            onChange={(e) => update({ maxAmount: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {filtered.length} resultado(s) · Total{' '}
            <span className="font-bold text-slate-900">{formatMoney(total)}</span>
          </p>
          <Button variant="ghost" size="sm" onClick={reset}>
            <X size={16} /> Limpiar
          </Button>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState title="Sin resultados" hint="Prueba con otros filtros." />
      ) : (
        <Card className="overflow-hidden p-0">
          <ul className="divide-y divide-slate-100">
            {filtered.map((e) => {
              const cat = resolveCategory(e.category);
              return (
                <li key={e.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                  <span className="text-2xl">{cat.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-800">{cat.label}</p>
                    <p className="truncate text-xs text-slate-400">
                      {formatDateShort(e.date)} · {e.time}
                      {e.note ? ` · ${e.note}` : ''}
                    </p>
                  </div>
                  <span className="font-bold text-slate-900">{formatMoney(e.amount)}</span>
                  <button
                    onClick={() => remove(e.id)}
                    className="rounded-lg p-2 text-slate-300 hover:bg-rose-50 hover:text-rose-500"
                    aria-label="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
