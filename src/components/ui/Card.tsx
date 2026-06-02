import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-2xl border border-slate-200 bg-white p-5 shadow-card', className)}
      {...props}
    />
  );
}

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: ReactNode;
  accent?: 'brand' | 'rose' | 'amber' | 'emerald' | 'slate';
}

const accents: Record<NonNullable<StatCardProps['accent']>, string> = {
  brand: 'bg-brand-50 text-brand-600',
  rose: 'bg-rose-50 text-rose-600',
  amber: 'bg-amber-50 text-amber-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  slate: 'bg-slate-100 text-slate-600',
};

export function StatCard({ label, value, icon, hint, accent = 'brand' }: StatCardProps) {
  return (
    <Card className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      </div>
      {icon && (
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', accents[accent])}>
          {icon}
        </div>
      )}
    </Card>
  );
}
