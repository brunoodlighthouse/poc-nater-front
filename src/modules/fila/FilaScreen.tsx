import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { MensagemErro } from '@/components/MensagemErro';
import { Modal } from '@/components/Modal';
import { apiRequest, HttpError } from '@/services/http';
import { useSessaoStore } from '@/stores/sessao.store';
import { NovaConsultaPanel } from './NovaLeituraPanel';
import { FilaDocumentoCard } from './FilaDocumentoCard';
import { NotaRecebidaCard } from './NotaRecebidaCard';
import type { DocumentoConsultado, FilaDocumento, NotaRecebida } from './fila.types';

type Tab = 'documentos' | 'notas';

type Props = {
  onOpenDocument: (documentoNumero: string) => void;
};

export function FilaScreen({ onOpenDocument }: Props) {
  const loja = useSessaoStore((state) => state.loja);
  const logout = useSessaoStore((state) => state.logout);
  const [activeTab, setActiveTab] = useState<Tab>('documentos');
  const [isReading, setIsReading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [documentos, setDocumentos] = useState<FilaDocumento[]>([]);
  const [loadingDocumentos, setLoadingDocumentos] = useState(false);

  const [notas, setNotas] = useState<NotaRecebida[]>([]);
  const [loadingNotas, setLoadingNotas] = useState(false);

  useEffect(() => {
    loadDocumentos();
  }, []);

  useEffect(() => {
    if (activeTab === 'notas') {
      loadNotas();
    }
  }, [activeTab]);

  async function loadDocumentos() {
    setLoadingDocumentos(true);
    try {
      const data = await apiRequest<FilaDocumento[]>('/documentos');
      setDocumentos(data);
    } catch {
      // silently fail - list will be empty
    } finally {
      setLoadingDocumentos(false);
    }
  }

  async function loadNotas() {
    setLoadingNotas(true);
    try {
      const data = await apiRequest<NotaRecebida[]>('/documentos/notas-hoje');
      setNotas(data);
    } catch {
      // silently fail
    } finally {
      setLoadingNotas(false);
    }
  }

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

      {/* Tabs */}
      <div className="border-b border-surface-200 bg-white px-6">
        <div className="flex gap-1">
          <TabButton
            active={activeTab === 'documentos'}
            onClick={() => setActiveTab('documentos')}
            label="Documentos"
            count={documentos.length}
          />
          <TabButton
            active={activeTab === 'notas'}
            onClick={() => setActiveTab('notas')}
            label="Notas do Dia"
            count={notas.length}
          />
        </div>
      </div>

      {activeTab === 'documentos' && (
        <DocumentosTab
          documentos={documentos}
          loading={loadingDocumentos}
          onOpenDocument={onOpenDocument}
          onNewRead={() => setIsReading(true)}
          onRefresh={loadDocumentos}
        />
      )}

      {activeTab === 'notas' && (
        <NotasTab
          notas={notas}
          loading={loadingNotas}
          onOpenDocument={onOpenDocument}
          onRefresh={loadNotas}
        />
      )}

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

// ─── Tab Button ──────────────────────────────────

type TabButtonProps = {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
};

function TabButton({ active, onClick, label, count }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative min-h-[52px] px-5 text-base font-semibold transition-colors ${
        active
          ? 'text-brand-600'
          : 'text-surface-900/50 active:text-surface-900/70'
      }`}
    >
      <span className="flex items-center gap-2">
        {label}
        {count > 0 && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
              active ? 'bg-brand-500/10 text-brand-600' : 'bg-surface-200 text-surface-900/50'
            }`}
          >
            {count}
          </span>
        )}
      </span>
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full bg-brand-500" />
      )}
    </button>
  );
}

// ─── Documentos Tab ──────────────────────────────

type DocumentosTabProps = {
  documentos: FilaDocumento[];
  loading: boolean;
  onOpenDocument: (documentoNumero: string) => void;
  onNewRead: () => void;
  onRefresh: () => void;
};

function DocumentosTab({ documentos, loading, onOpenDocument, onNewRead, onRefresh }: DocumentosTabProps) {
  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-lg text-surface-900/50">Carregando...</p>
      </main>
    );
  }

  if (documentos.length === 0) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-8 py-12">
        <span className="text-8xl">📦</span>
        <div className="text-center">
          <h2 className="text-[32px] font-bold text-surface-900">Pronto para entregar?</h2>
          <p className="mt-3 text-lg text-surface-900/60">
            Consulte o documento fiscal para iniciar a separacao.
          </p>
        </div>
        <div className="w-full max-w-sm">
          <Button variant="primary" size="xl" fullWidth onClick={onNewRead}>
            CONSULTAR DOCUMENTO
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-4 px-6 py-6">
      <div className="flex items-center justify-between">
        <Button variant="primary" size="lg" onClick={onNewRead}>
          + NOVA CONSULTA
        </Button>
        <button
          type="button"
          onClick={onRefresh}
          className="min-h-[44px] min-w-[44px] rounded-xl p-2 text-surface-900/50 active:bg-surface-100"
          aria-label="Atualizar lista"
        >
          🔄
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {documentos.map((doc) => (
          <FilaDocumentoCard
            key={doc.id}
            documento={doc}
            onClick={() => onOpenDocument(doc.documentoNumero)}
          />
        ))}
      </div>
    </main>
  );
}

// ─── Notas Tab ───────────────────────────────────

type NotasTabProps = {
  notas: NotaRecebida[];
  loading: boolean;
  onOpenDocument: (documentoNumero: string) => void;
  onRefresh: () => void;
};

function NotasTab({ notas, loading, onOpenDocument, onRefresh }: NotasTabProps) {
  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-lg text-surface-900/50">Carregando...</p>
      </main>
    );
  }

  if (notas.length === 0) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-8 py-12">
        <span className="text-8xl">📋</span>
        <div className="text-center">
          <h2 className="text-[32px] font-bold text-surface-900">Nenhuma nota hoje</h2>
          <p className="mt-3 text-lg text-surface-900/60">
            As notas fiscais aparecerao aqui conforme forem geradas no ERP.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-4 px-6 py-6">
      <div className="flex items-center justify-between">
        <p className="text-base font-semibold text-surface-900/60">
          {notas.length} {notas.length === 1 ? 'nota' : 'notas'} recebidas hoje
        </p>
        <button
          type="button"
          onClick={onRefresh}
          className="min-h-[44px] min-w-[44px] rounded-xl p-2 text-surface-900/50 active:bg-surface-100"
          aria-label="Atualizar lista"
        >
          🔄
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {notas.map((nota) => (
          <NotaRecebidaCard
            key={nota.id}
            nota={nota}
            onClick={() => onOpenDocument(nota.documentoNumero)}
          />
        ))}
      </div>
    </main>
  );
}

// ─── Header ──────────────────────────────────────

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

// ─── Logout Modal ────────────────────────────────

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
