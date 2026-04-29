const API_BASE = '/api/v1';

export class HttpError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}

function getToken(): string | null {
  return localStorage.getItem('sessao_token');
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
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
