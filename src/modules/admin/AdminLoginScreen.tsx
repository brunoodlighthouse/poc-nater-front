import { useState } from 'react';
import { Button } from '@/components/Button';
import { MensagemErro } from '@/components/MensagemErro';
import { HttpError } from '@/services/http';
import { useAdminStore } from '@/stores/admin.store';

type LoginResponse = {
  token: string;
  loja: { codigo: string; nome: string };
};

export function AdminLoginScreen() {
  const login = useAdminStore((s) => s.login);
  const [lojaCodigo, setLojaCodigo] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lojaCodigo: lojaCodigo.trim(), senha }),
      });
      const body = await res.json();

      if (!res.ok || body.ok === false) {
        throw new HttpError(
          res.status,
          body.error?.code ?? 'ERRO_DESCONHECIDO',
          body.error?.message ?? 'Erro desconhecido',
        );
      }

      const data = body.data as LoginResponse;
      login(data.token, data.loja);
    } catch (err) {
      if (err instanceof HttpError) {
        setError({ code: err.code, message: err.message });
      } else {
        setError({ code: 'ERRO_DESCONHECIDO', message: 'Erro ao fazer login' });
      }
    } finally {
      setLoading(false);
    }
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <MensagemErro
          code={error.code}
          message={error.message}
          onRetry={() => setError(null)}
          onBack={() => setError(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <span className="text-5xl">🔒</span>
          <h1 className="mt-4 text-[32px] font-bold text-surface-900">Admin</h1>
          <p className="mt-2 text-lg text-surface-900/60">Acesso administrativo da loja</p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="lojaCodigo" className="mb-1 block text-sm font-semibold text-surface-900">
              Codigo da loja
            </label>
            <input
              id="lojaCodigo"
              type="text"
              value={lojaCodigo}
              onChange={(e) => setLojaCodigo(e.target.value)}
              placeholder="Ex: 001"
              autoComplete="username"
              className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-lg text-surface-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label htmlFor="senha" className="mb-1 block text-sm font-semibold text-surface-900">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Senha da loja"
              autoComplete="current-password"
              className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-lg text-surface-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <div className="mt-8">
          <Button
            type="submit"
            variant="primary"
            size="xl"
            fullWidth
            loading={loading}
            disabled={!lojaCodigo.trim() || !senha}
          >
            ENTRAR
          </Button>
        </div>
      </form>
    </div>
  );
}
