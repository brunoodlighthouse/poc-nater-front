import { useState } from 'react';
import { Button } from '@/components/Button';
import { MensagemErro } from '@/components/MensagemErro';
import { Modal } from '@/components/Modal';
import { apiRequest, HttpError } from '@/services/http';
import { useSessaoStore } from '@/stores/sessao.store';
import { NovaConsultaPanel } from './NovaLeituraPanel';
import type { DocumentoConsultado } from './fila.types';

type Props = {
  onOpenDocument: (documentoNumero: string) => void;
};

export function FilaScreen({ onOpenDocument }: Props) {
  const loja = useSessaoStore((state) => state.loja);
  const logout = useSessaoStore((state) => state.logout);
  const [isReading, setIsReading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  async function handleNewRead(input: { codigoLido: string; formato: 'qrcode' | 'barcode' | 'numero' }) {
    setSubmitting(true);
    try {
      const result = await apiRequest<DocumentoConsultado>('/documentos/consulta', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      setIsReading(false);
      onOpenDocument(result.documento);
    } catch (err) {
      if (err instanceof HttpError) {
        setError({ code: err.code, message: err.message });
        if (err.code === 'SESSAO_INVALIDA') logout();
      } else {
        setError({ code: 'ERRO_DESCONHECIDO', message: 'Erro ao consultar documento' });
      }
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-surface-50">
        <Header lojaName={loja?.nome} onLogout={() => setShowLogoutConfirm(true)} />
        <div className="flex flex-1 items-center justify-center">
          <MensagemErro
            code={error.code}
            message={error.message}
            onRetry={() => { setError(null); setIsReading(true); }}
            onBack={() => setError(null)}
          />
        </div>
        {showLogoutConfirm && <LogoutModal onConfirm={logout} onCancel={() => setShowLogoutConfirm(false)} />}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-50">
      <Header lojaName={loja?.nome} onLogout={() => setShowLogoutConfirm(true)} />

      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-8 py-12">
        <span className="text-8xl">📦</span>

        <div className="text-center">
          <h2 className="text-[32px] font-bold text-surface-900">Pronto para entregar?</h2>
          <p className="mt-3 text-lg text-surface-900/60">
            Consulte o documento fiscal para iniciar a separação.
          </p>
        </div>

        <div className="w-full max-w-sm">
          <Button variant="primary" size="xl" fullWidth onClick={() => setIsReading(true)}>
            CONSULTAR DOCUMENTO
          </Button>
        </div>
      </main>

      {isReading && (
        <NovaConsultaPanel
          loading={submitting}
          onClose={() => setIsReading(false)}
          onSubmit={(input) => void handleNewRead(input)}
        />
      )}

      {showLogoutConfirm && (
        <LogoutModal onConfirm={logout} onCancel={() => setShowLogoutConfirm(false)} />
      )}
    </div>
  );
}

type HeaderProps = { lojaName: string | undefined; onLogout: () => void };

function Header({ lojaName, onLogout }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-surface-200 bg-white px-6 py-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🏪</span>
        <h1 className="text-xl font-bold text-surface-900">{lojaName ?? 'Loja'}</h1>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-surface-900/60 active:bg-surface-100"
        aria-label="Sair da loja"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>
    </header>
  );
}

type LogoutModalProps = { onConfirm: () => void; onCancel: () => void };

function LogoutModal({ onConfirm, onCancel }: LogoutModalProps) {
  return (
    <Modal>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-surface-900">Sair da loja?</h2>
        <p className="mt-3 text-lg text-surface-900/60">
          Voce precisara selecionar a loja novamente ao retornar.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button variant="danger" size="lg" fullWidth onClick={onConfirm}>
            Sim, sair
          </Button>
          <Button variant="secondary" size="lg" fullWidth onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
