import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Wallet, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

interface FormValues {
  name: string;
  email: string;
  password: string;
}

export function LoginPage() {
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(data: FormValues) {
    setLoading(true);
    try {
      if (mode === 'login') await signIn(data.email, data.password);
      else await signUp(data.name, data.email, data.password);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error de autenticación', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-600 to-brand-800 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center text-white">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <Wallet size={28} />
          </div>
          <h1 className="text-3xl font-extrabold">GastosPro</h1>
          <p className="mt-1 text-sm text-brand-100">Control de gastos y facturas, sin fricción.</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-xl">
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={
                  'rounded-lg py-2 text-sm font-semibold transition ' +
                  (mode === m ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500')
                }
              >
                {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {mode === 'register' && (
              <Input
                label="Nombre"
                placeholder="Tu nombre"
                error={errors.name?.message}
                {...register('name', { required: mode === 'register' ? 'Requerido' : false })}
              />
            )}
            <Input
              label="Correo"
              type="email"
              placeholder="tu@correo.com"
              error={errors.email?.message}
              {...register('email', { required: 'Requerido' })}
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password', {
                required: 'Requerido',
                minLength: { value: 6, message: 'Mínimo 6 caracteres' },
              })}
            />
            <Button type="submit" size="lg" fullWidth loading={loading}>
              {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </Button>
          </form>

          <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
            <Zap size={16} className="mt-0.5 shrink-0 text-brand-500" />
            <span>
              {mode === 'register'
                ? 'Crea tu cuenta: tus gastos y facturas se guardan de forma segura en el servidor.'
                : 'Tus datos quedan guardados en tu cuenta. Inicia sesión para continuar.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
