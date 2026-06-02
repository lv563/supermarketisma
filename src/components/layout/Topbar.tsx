import { useState } from 'react';
import { LogOut, Menu, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const today = new Date().toLocaleDateString('es-DO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenu} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden">
          <Menu size={22} />
        </button>
        <div>
          <p className="text-sm font-semibold text-slate-900">Hola, {user?.displayName || 'Bienvenido'} 👋</p>
          <p className="text-xs capitalize text-slate-400">{today}</p>
        </div>
      </div>

      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700 hover:bg-brand-200"
        >
          <User size={18} />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              <div className="px-3 py-2">
                <p className="truncate text-sm font-medium text-slate-900">{user?.displayName}</p>
                <p className="truncate text-xs text-slate-400">{user?.email}</p>
              </div>
              <button
                onClick={() => signOut()}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
                  'text-rose-600 hover:bg-rose-50',
                )}
              >
                <LogOut size={16} /> Cerrar sesión
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
