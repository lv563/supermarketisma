import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Modal } from '@/components/ui/Modal';
import { QuickExpenseForm } from '@/components/expenses/QuickExpenseForm';
import { FloatingRegisterButton } from '@/components/expenses/FloatingRegisterButton';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Sidebar desktop */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Sidebar móvil */}
      <div className={cn('fixed inset-0 z-50 lg:hidden', mobileOpen ? 'block' : 'hidden')}>
        <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileOpen(false)} />
        <div className="absolute left-0 top-0 h-full">
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </div>
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-6xl pb-24">
            <Outlet context={{ openQuick: () => setQuickOpen(true) }} />
          </div>
        </main>
      </div>

      <FloatingRegisterButton onClick={() => setQuickOpen(true)} />

      <Modal open={quickOpen} onClose={() => setQuickOpen(false)} title="Registrar gasto">
        <QuickExpenseForm
          onSaved={() => {
            setQuickOpen(false);
            navigate('/');
          }}
        />
      </Modal>
    </div>
  );
}
