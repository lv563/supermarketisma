import { Link } from 'react-router-dom';
import {
  Wallet,
  ReceiptText,
  AlertTriangle,
  CalendarClock,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { StatCard } from '@/components/ui/Card';
import { Card } from '@/components/ui/Card';
import { AlertBanner } from '@/components/invoices/AlertBanner';
import { QuickExpenseForm } from '@/components/expenses/QuickExpenseForm';
import { PageLoader, EmptyState } from '@/components/ui/Spinner';
import { useExpenses } from '@/hooks/useExpenses';
import { useInvoices } from '@/hooks/useInvoices';
import { formatMoney, formatDateShort, daysUntil } from '@/lib/utils';
import { resolveCategory } from '@/constants/categories';

export function DashboardPage() {
  const { todayExpenses, todayTotal, loading: loadingExp } = useExpenses();
  const {
    pending,
    overdue,
    dueToday,
    dueTomorrow,
    upcoming,
    loading: loadingInv,
  } = useInvoices();

  if (loadingExp || loadingInv) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Todo lo importante de un vistazo.</p>
      </div>

      <AlertBanner dueToday={dueToday} dueTomorrow={dueTomorrow} overdue={overdue} />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total gastado hoy"
          value={formatMoney(todayTotal)}
          icon={<Wallet size={20} />}
          accent="brand"
          hint={`${todayExpenses.length} gasto(s)`}
        />
        <StatCard
          label="Facturas pendientes"
          value={pending.length}
          icon={<ReceiptText size={20} />}
          accent="amber"
        />
        <StatCard
          label="Facturas vencidas"
          value={overdue.length}
          icon={<AlertTriangle size={20} />}
          accent="rose"
        />
        <StatCard
          label="Vencen pronto"
          value={dueToday.length + dueTomorrow.length}
          icon={<CalendarClock size={20} />}
          accent="emerald"
          hint="Hoy y mañana"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Registro rápido embebido */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Zap className="text-brand-600" size={20} />
            <h2 className="text-lg font-semibold text-slate-900">Registro rápido</h2>
          </div>
          <QuickExpenseForm autoFocus={false} />
        </Card>

        <div className="space-y-6">
          {/* Próximos vencimientos */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Próximos vencimientos</h2>
              <Link to="/facturas" className="text-sm font-medium text-brand-600 hover:underline">
                Ver todas
              </Link>
            </div>
            {upcoming.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">Nada por vencer 🎉</p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((inv) => {
                  const d = daysUntil(inv.dueDate);
                  return (
                    <li key={inv.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{inv.supplier}</p>
                        <p className="text-xs text-slate-400">
                          {formatDateShort(inv.dueDate)} · {d === 0 ? 'hoy' : d === 1 ? 'mañana' : `en ${d} días`}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-slate-900">{formatMoney(inv.amount)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Gastos de hoy */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Gastos de hoy</h2>
              <Link to="/historial" className="text-sm font-medium text-brand-600 hover:underline">
                Historial <ArrowRight className="inline" size={14} />
              </Link>
            </div>
            {todayExpenses.length === 0 ? (
              <EmptyState title="Sin gastos aún" hint="Registra el primero arriba 👆" />
            ) : (
              <ul className="space-y-2">
                {todayExpenses.slice(0, 5).map((e) => {
                  const cat = resolveCategory(e.category);
                  return (
                    <li key={e.id} className="flex items-center gap-3">
                      <span className="text-xl">{cat.emoji}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800">{cat.label}</p>
                        <p className="text-xs text-slate-400">{e.time}</p>
                      </div>
                      <span className="text-sm font-bold text-slate-900">{formatMoney(e.amount)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
