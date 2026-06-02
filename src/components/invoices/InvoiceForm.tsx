import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Camera, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { createInvoice } from '@/services/invoices.service';
import { scanInvoice } from '@/services/ocr.service';
import { todayISO } from '@/lib/utils';
import type { InvoiceStatus, NewInvoice } from '@/types';

export function InvoiceForm({ onSaved }: { onSaved?: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<NewInvoice>({
    defaultValues: {
      status: 'pendiente' as InvoiceStatus,
      issueDate: todayISO(),
      dueDate: todayISO(),
    },
  });

  async function onScan(file: File | undefined) {
    if (!file) return;
    setScanning(true);
    setScanProgress(0);
    try {
      const r = await scanInvoice(file, setScanProgress);
      if (r.supplier) setValue('supplier', r.supplier);
      if (r.amount) setValue('amount', r.amount);
      if (r.dueDate) setValue('dueDate', r.dueDate);
      toast('Factura leída. Revisa los campos.', 'info');
    } catch {
      toast('No se pudo leer la factura', 'error');
    } finally {
      setScanning(false);
    }
  }

  async function onSubmit(data: NewInvoice) {
    if (!user) return;
    setSaving(true);
    try {
      await createInvoice(user.uid, {
        supplier: data.supplier,
        invoiceNumber: data.invoiceNumber,
        amount: Number(data.amount),
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        status: data.status,
      });
      toast('Factura guardada');
      onSaved?.();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudo guardar', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* OCR */}
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-100">
        {scanning ? <ScanLine className="animate-pulse" size={18} /> : <Camera size={18} />}
        {scanning ? `Leyendo… ${scanProgress}%` : 'Escanear factura (foto)'}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          disabled={scanning}
          onChange={(e) => onScan(e.target.files?.[0])}
        />
      </label>

      <Input
        label="Proveedor"
        placeholder="Claro, Edesur, Ferretería…"
        error={errors.supplier?.message}
        {...register('supplier', { required: 'Requerido' })}
      />
      <Input
        label="Número de factura"
        placeholder="A-0012"
        error={errors.invoiceNumber?.message}
        {...register('invoiceNumber', { required: 'Requerido' })}
      />
      <Input
        label="Monto (RD$)"
        type="number"
        step="0.01"
        min="0"
        placeholder="5000"
        error={errors.amount?.message}
        {...register('amount', { required: 'Requerido', min: { value: 0.01, message: 'Inválido' } })}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Emisión" type="date" {...register('issueDate', { required: true })} />
        <Input
          label="Vencimiento"
          type="date"
          error={errors.dueDate?.message}
          {...register('dueDate', { required: 'Requerido' })}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Estado</label>
        <select className="field" {...register('status')}>
          <option value="pendiente">Pendiente</option>
          <option value="pagada">Pagada</option>
          <option value="vencida">Vencida</option>
        </select>
      </div>

      <Button type="submit" size="lg" fullWidth loading={saving}>
        Guardar factura
      </Button>
    </form>
  );
}
