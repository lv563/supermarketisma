import { api, setToken, getToken } from './api';
import { resetExpenses } from './expenses.service';
import type { AppUser } from '@/types';

interface AuthResponse {
  token: string;
  user: AppUser;
}

/**
 * Observa el estado de sesión. Al arrancar valida el token guardado contra el
 * backend (/auth/me). Reacciona a login/logout y a tokens expirados.
 */
export function watchAuth(cb: (user: AppUser | null) => void): () => void {
  let active = true;

  async function check() {
    const token = getToken();
    if (!token) {
      if (active) cb(null);
      return;
    }
    try {
      const { user } = await api<{ user: AppUser }>('/auth/me');
      if (active) cb(user);
    } catch {
      setToken(null);
      if (active) cb(null);
    }
  }

  void check();

  const onChange = () => void check();
  window.addEventListener('auth:changed', onChange);
  window.addEventListener('auth:expired', onChange);

  return () => {
    active = false;
    window.removeEventListener('auth:changed', onChange);
    window.removeEventListener('auth:expired', onChange);
  };
}

export async function signIn(email: string, password: string): Promise<void> {
  const res = await api<AuthResponse>('/auth/login', {
    method: 'POST',
    auth: false,
    body: { email, password },
  });
  setToken(res.token);
  window.dispatchEvent(new Event('auth:changed'));
}

export async function signUp(name: string, email: string, password: string): Promise<void> {
  const res = await api<AuthResponse>('/auth/register', {
    method: 'POST',
    auth: false,
    body: { name, email, password },
  });
  setToken(res.token);
  window.dispatchEvent(new Event('auth:changed'));
}

export async function signOut(): Promise<void> {
  setToken(null);
  resetExpenses();
  window.dispatchEvent(new Event('auth:changed'));
}
