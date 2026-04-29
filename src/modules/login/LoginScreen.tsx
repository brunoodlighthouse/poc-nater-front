import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { Loading } from '@/components/Loading';
import { MensagemErro } from '@/components/MensagemErro';
import { useSessaoStore } from '@/stores/sessao.store';
import { apiRequest, HttpError } from '@/services/http';

type Loja = { codigo: string; nome: string; ativa: boolean };

type SessaoResponse = {
  token: string;
  loja: { id: string; nome: string; codigo: string };
};

type ScreenState = 'loading' | 'idle' | 'submitting' | 'error-lojas' | 'error-login';

function getDispositivoId(): string {
  const key = 'dispositivo_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export function LoginScreen() {
  const [state, setState] = useState<ScreenState>('loading');
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [selectedCodigo, setSelectedCodigo] = useState('');
  const [loginError, setLoginError] = useState<{ code: string; message: string } | null>(null);
  const login = useSessaoStore((s) => s.login);

  const fetchLojas = useCallback(async () => {
    setState('loading');
    try {
      const data = await apiRequest<Loja[]>('/lojas');
      setLojas(data);
      setSelectedCodigo(data[0]?.codigo ?? '');
      setState('idle');
    } catch {
      setState('error-lojas');
    }
  }, []);

  useEffect(() => {
    void fetchLojas();
  }, [fetchLojas]);

  const handleLogin = async () => {
    if (!selectedCodigo) return;
    setState('submitting');
    try {
      const data = await apiRequest<SessaoResponse>('/sessoes', {
        method: 'POST',
        body: JSON.stringify({ qrLoja: selectedCodigo, dispositivoId: getDispositivoId() }),
      });
      login(data.token, data.loja);
    } catch (err) {
      setLoginError(
        err instanceof HttpError
          ? { code: err.code, message: err.message }
          : { code: 'ERRO_DESCONHECIDO', message: 'Erro ao conectar com o servidor' },
      );
      setState('error-login');
    }
  };

  if (state === 'loading' || state === 'submitting') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <Loading message={state === 'submitting' ? 'Conectando...' : 'Carregando lojas...'} />
      </div>
    );
  }

  if (state === 'error-lojas') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <MensagemErro
          code="PROTHEUS_INDISPONIVEL"
          message="Não foi possível carregar a lista de lojas"
          onRetry={fetchLojas}
          onBack={fetchLojas}
        />
      </div>
    );
  }

  if (state === 'error-login' && loginError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <MensagemErro
          code={loginError.code}
          message={loginError.message}
          onRetry={() => setState('idle')}
          onBack={() => setState('idle')}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-surface-50 p-8">
      <span className="text-6xl">🏪</span>
      <h1 className="text-[32px] font-bold text-surface-900">Selecione a Loja</h1>

      <div className="flex w-full max-w-sm flex-col gap-6">
        <select
          value={selectedCodigo}
          onChange={(e) => setSelectedCodigo(e.target.value)}
          className="min-h-[56px] w-full rounded-xl border-2 border-surface-200 bg-white px-4 text-lg text-surface-900 focus:border-brand-500 focus:outline-none"
        >
          {lojas.map((loja) => (
            <option key={loja.codigo} value={loja.codigo}>
              {loja.nome} ({loja.codigo})
            </option>
          ))}
        </select>

        <Button
          variant="primary"
          size="xl"
          fullWidth
          disabled={!selectedCodigo}
          onClick={handleLogin}
        >
          ENTRAR
        </Button>
      </div>
    </div>
  );
}
