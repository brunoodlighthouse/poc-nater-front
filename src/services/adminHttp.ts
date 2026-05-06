import { HttpError } from './http';

const API_BASE = '/api/v1/admin';

function getAdminToken(): string | null {
  return localStorage.getItem('admin_token');
}

export async function adminRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const body = await res.json();

  if (!res.ok || body.ok === false) {
    throw new HttpError(
      res.status,
      body.error?.code ?? 'ERRO_DESCONHECIDO',
      body.error?.message ?? 'Erro desconhecido',
    );
  }

  return body.data as T;
}
