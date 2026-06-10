import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/Card';
import { PageLoader, EmptyState } from '@/components/ui/Spinner';
import { useExpenses } from '@/hooks/useExpenses';
import { useInvoices } from '@/hooks/useInvoices';
import { useCategories } from '@/hooks/useCategories';
import { formatMoney, toISODate } from '@/lib/utils';
import { resolveCategory } from '@/constants/categories';

const PIE_COLORS = ['#f59e0b', '#f43f5e', '#0ea5e9', '#8b5cf6', '#10b981', '#94a3b8', '#6366f1', '#ec4899', '#14b8a6'];

export function ReportsPage() {
  const { expenses, loading: le } = useExpenses();
  const { pending, paid, overdue, loading: li } = useInvoices();
  const { categories } = useCategories();

  // Agrupa por la categoría real de cada gasto (incluye personalizadas).
  const byCategory = useMemo(() => {
    const totals = new Map<string, number>();
    for (const e of expenses) totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
    return [...totals.entries()]
      .map(([id, value]) => {
        const meta = resolveCategory(id, categories);
        return { name: meta.label, emoji: meta.emoji, value };
      })
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [expenses, categories]);

  // Últimos 7 días
  const weekly = useMemo(() => {
    const days: { label: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = toISODate(new Date(Date.now() - i * 86_400_000));
      const total = expenses.filter((e) => e.date === date).reduce((s, e) => s + e.amount, 0);
      days.push({
        label: new Date(date + 'T00:00:00').toLocaleDateString('es-DO', { weekday: 'short' }),
        total,
      });
    }
    return days;
  }, [expenses]);

  // Últimos 6 meses
  const monthly = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      const key = e.date.slice(0, 7); // yyyy-MM
      map.set(key, (map.get(key) ?? 0) + e.amount);
    }
    const out: { label: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      out.push({
        label: d.toLocaleDateString('es-DO', { month: 'short' }),
        total: map.get(key) ?? 0,
      });
    }
    return out;
  }, [expenses]);

  if (le || li) return <PageLoader />;

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reportes</h1>
        <p className="text-sm text-slate-500">Entiende a dónde va tu dinero.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Gasto total" value={formatMoney(totalSpent)} accent="brand" />
        <StatCard label="Pendientes" value={pending.length} accent="amber" />
        <StatCard label="Pagadas" value={paid.length} accent="emerald" />
        <StatCard label="Vencidas" value={overdue.length} accent="rose" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold text-slate-900">Gastos por categoría</h2>
          {byCategory.length === 0 ? (
            <EmptyState title="Sin datos todavía" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                  {byCategory.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatMoney(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold text-slate-900">Gastos de la semana</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(v: number) => formatMoney(v)} />
              <Bar dataKey="total" fill="#1d5cf5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="mb-4 font-semibold text-slate-900">Gastos por mes</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(v: number) => formatMoney(v)} />
              <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top categorías */}
      <Card>
        <h2 className="mb-4 font-semibold text-slate-900">Detalle por categoría</h2>
        <div className="space-y-2">
          {byCategory.map((d) => {
              const pct = totalSpent ? Math.round((d.value / totalSpent) * 100) : 0;
              return (
                <div key={d.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">
                      {d.emoji} {d.name}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {formatMoney(d.value)} · {pct}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
        </div>
      </Card>
    </div>
  );
}
