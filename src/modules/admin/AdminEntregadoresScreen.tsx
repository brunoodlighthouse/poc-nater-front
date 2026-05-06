import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { Loading } from '@/components/Loading';
import { MensagemErro } from '@/components/MensagemErro';
import { Modal } from '@/components/Modal';
import { adminRequest } from '@/services/adminHttp';
import { HttpError } from '@/services/http';
import { useAdminStore } from '@/stores/admin.store';

type Entregador = {
  id: string;
  codigo: string;
  nome: string;
  lojaCodigo: string;
  ativo: boolean;
};

export function AdminEntregadoresScreen() {
  const logout = useAdminStore((s) => s.logout);
  const [entregadores, setEntregadores] = useState<Entregador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Entregador | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminRequest<Entregador[]>('/entregadores');
      setEntregadores(data);
    } catch (err) {
      if (err instanceof HttpError && err.code === 'ADMIN_SESSAO_INVALIDA') {
        logout();
        return;
      }
      setError({
        code: err instanceof HttpError ? err.code : 'ERRO_DESCONHECIDO',
        message: err instanceof HttpError ? err.message : 'Erro ao carregar entregadores',
      });
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  function handleSuccess() {
    setShowForm(false);
    setEditing(null);
    void fetchData();
  }

  if (error) {
    return (
      <div className="p-6">
        <MensagemErro
          code={error.code}
          message={error.message}
          onRetry={() => void fetchData()}
          onBack={() => setError(null)}
        />
      </div>
    );
  }

  if (loading && entregadores.length === 0) {
    return <Loading message="Carregando entregadores..." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-surface-900">
          Entregadores ({entregadores.length})
        </h2>
        <Button variant="primary" size="lg" onClick={() => setShowForm(true)}>
          + Novo entregador
        </Button>
      </div>

      {entregadores.length === 0 ? (
        <p className="py-12 text-center text-lg text-surface-900/40">
          Nenhum entregador cadastrado
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-surface-200 bg-white">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50">
                <th className="px-4 py-3 text-sm font-semibold text-surface-900/60">Codigo</th>
                <th className="px-4 py-3 text-sm font-semibold text-surface-900/60">Nome</th>
                <th className="px-4 py-3 text-sm font-semibold text-surface-900/60">Status</th>
                <th className="px-4 py-3 text-sm font-semibold text-surface-900/60">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {entregadores.map((e) => (
                <tr key={e.id} className="border-b border-surface-100 last:border-0">
                  <td className="px-4 py-3 font-mono text-sm font-semibold text-surface-900">{e.codigo}</td>
                  <td className="px-4 py-3 text-surface-900">{e.nome}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                      e.ativo
                        ? 'bg-success-400/20 text-success-600'
                        : 'bg-danger-400/20 text-danger-600'
                    }`}>
                      {e.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setEditing(e)}
                      className="min-h-[44px] rounded-lg px-3 py-2 text-sm font-semibold text-brand-500 active:bg-brand-500/10"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <EntregadorFormModal onClose={() => setShowForm(false)} onSuccess={handleSuccess} />
      )}

      {editing && (
        <EntregadorEditModal
          entregador={editing}
          onClose={() => setEditing(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}

function EntregadorFormModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!codigo.trim() || !nome.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await adminRequest('/entregadores', {
        method: 'POST',
        body: JSON.stringify({ codigo: codigo.trim(), nome: nome.trim() }),
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Erro ao cadastrar entregador');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal>
      <h2 className="text-2xl font-bold text-surface-900">Novo entregador</h2>

      {error && (
        <div className="mt-3 rounded-xl bg-danger-500/10 p-3 text-sm text-danger-600">{error}</div>
      )}

      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="entregador-codigo" className="mb-1 block text-sm font-semibold text-surface-900">
            Codigo
          </label>
          <input
            id="entregador-codigo"
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Ex: E0001"
            className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-base text-surface-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div>
          <label htmlFor="entregador-nome" className="mb-1 block text-sm font-semibold text-surface-900">
            Nome
          </label>
          <input
            id="entregador-nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome do entregador"
            className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-base text-surface-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Button
          variant="primary"
          size="xl"
          fullWidth
          loading={loading}
          disabled={!codigo.trim() || !nome.trim()}
          onClick={handleSubmit}
        >
          CADASTRAR
        </Button>
        <Button variant="secondary" size="lg" fullWidth onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
      </div>
    </Modal>
  );
}

function EntregadorEditModal({
  entregador,
  onClose,
  onSuccess,
}: {
  entregador: Entregador;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [nome, setNome] = useState(entregador.nome);
  const [ativo, setAtivo] = useState(entregador.ativo);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanges = nome.trim() !== entregador.nome || ativo !== entregador.ativo;

  async function handleSubmit() {
    if (!hasChanges) return;
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {};
      if (nome.trim() !== entregador.nome) body.nome = nome.trim();
      if (ativo !== entregador.ativo) body.ativo = ativo;

      await adminRequest(`/entregadores/${entregador.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Erro ao editar entregador');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal>
      <h2 className="text-2xl font-bold text-surface-900">Editar entregador</h2>
      <p className="mt-1 text-sm text-surface-900/60">Codigo: {entregador.codigo}</p>

      {error && (
        <div className="mt-3 rounded-xl bg-danger-500/10 p-3 text-sm text-danger-600">{error}</div>
      )}

      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="edit-entregador-nome" className="mb-1 block text-sm font-semibold text-surface-900">
            Nome
          </label>
          <input
            id="edit-entregador-nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-base text-surface-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAtivo(!ativo)}
            className={`relative h-8 w-14 rounded-full transition-colors ${ativo ? 'bg-success-500' : 'bg-surface-300'}`}
          >
            <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${ativo ? 'left-7' : 'left-1'}`} />
          </button>
          <span className="text-sm font-semibold text-surface-900">{ativo ? 'Ativo' : 'Inativo'}</span>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Button
          variant="primary"
          size="xl"
          fullWidth
          loading={loading}
          disabled={!hasChanges || !nome.trim()}
          onClick={handleSubmit}
        >
          SALVAR
        </Button>
        <Button variant="secondary" size="lg" fullWidth onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
      </div>
    </Modal>
  );
}
