import { Plus } from 'lucide-react';

/** Botón flotante "+ Registrar" siempre visible. */
export function FloatingRegisterButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Registrar gasto"
      className="fixed bottom-6 right-6 z-40 flex h-16 items-center gap-2 rounded-full bg-brand-600 px-6 text-lg font-bold text-white shadow-float transition hover:bg-brand-700 active:scale-95 sm:bottom-8 sm:right-8"
    >
      <Plus size={26} strokeWidth={2.5} />
      <span className="hidden sm:inline">Registrar</span>
    </button>
  );
}
