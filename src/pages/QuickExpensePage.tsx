import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { QuickExpenseForm } from '@/components/expenses/QuickExpenseForm';

export function QuickExpensePage() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="text-brand-600" size={22} />
        <h1 className="text-2xl font-bold text-slate-900">Registro rápido</h1>
      </div>
      <p className="text-sm text-slate-500">
        Monto + categoría. Lo demás se agrega solo. Di "450 gasolina" con el micrófono y se guarda.
      </p>
      <Card>
        <QuickExpenseForm onSaved={() => navigate('/')} />
      </Card>
    </div>
  );
}
