import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Zap,
  ReceiptText,
  CalendarDays,
  History,
  BarChart3,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/registrar', label: 'Registro rápido', icon: Zap },
  { to: '/facturas', label: 'Facturas', icon: ReceiptText },
  { to: '/calendario', label: 'Calendario', icon: CalendarDays },
  { to: '/historial', label: 'Historial', icon: History },
  { to: '/reportes', label: 'Reportes', icon: BarChart3 },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
          <Wallet size={20} />
        </div>
        <div>
          <p className="text-base font-extrabold leading-tight text-slate-900">GastosPro</p>
          <p className="text-[11px] text-slate-400">Rápido. Simple. Tuyo.</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )
            }
          >
            <Icon size={19} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4">
        <div className="rounded-xl bg-slate-900 px-4 py-3 text-xs text-slate-300">
          <p className="font-semibold text-white">Regla #1</p>
          <p className="mt-1 leading-snug">Registrar algo debe tomar menos tiempo que ignorarlo.</p>
        </div>
        <p className="mt-2 text-center text-[10px] text-slate-400">v2 · categorías</p>
      </div>
    </aside>
  );
}
