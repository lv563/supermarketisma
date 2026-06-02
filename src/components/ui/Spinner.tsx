import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('animate-spin text-brand-600', className)} />;
}

export function PageLoader({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="flex h-full min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-400">
      <Spinner className="h-8 w-8" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({ title, hint, icon }: { title: string; hint?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white/60 py-12 text-center">
      {icon && <div className="text-slate-300">{icon}</div>}
      <p className="font-semibold text-slate-600">{title}</p>
      {hint && <p className="max-w-xs text-sm text-slate-400">{hint}</p>}
    </div>
  );
}
