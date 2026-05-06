import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { Loading } from '@/components/Loading';
import { MensagemErro } from '@/components/MensagemErro';
import { adminRequest } from '@/services/adminHttp';
import { HttpError } from '@/services/http';
import { useAdminStore } from '@/stores/admin.store';
import type { AdminDocumentoDetalhe, AdminEntrega, AdminLogAlteracao } from './admin.types';
import { AdminEditarEntregaModal } from './AdminEditarEntregaModal';

type Props = {
  documentoNumero: string;
  onBack: () => void;
};

const STATUS_BADGE: Record<string, string> = {
  pendente: 'bg-warning-400/20 text-warning-600',
  parcial: 'bg-info-400/20 text-info-600',
  finalizado: 'bg-success-400/20 text-success-600',
  cancelado: 'bg-danger-400/20 text-danger-600',
  em_andamento: 'bg-brand-400/20 text-brand-600',
  finalizada_total: 'bg-success-400/20 text-success-600',
  finalizada_parcial: 'bg-info-400/20 text-info-600',
  cancelada: 'bg-danger-400/20 text-danger-600',
};

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  parcial: 'Parcial',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
  em_andamento: 'Em andamento',
  finalizada_total: 'Finalizada Total',
  finalizada_parcial: 'Finalizada Parcial',
  cancelada: 'Cancelada',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// --- Friendly log description helpers ---

type DadosSnapshot = {
  status?: string;
  itens?: Array<{ itemIdProtheus: string; qtdEntregue: number }>;
};

function parseDados(raw: unknown): DadosSnapshot | null {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as DadosSnapshot;
  }
  return null;
}

function describeLogChanges(log: AdminLogAlteracao): string[] {
  const antes = parseDados(log.dadosAntes);
  const depois = parseDados(log.dadosDepois);
  const changes: string[] = [];

  if (antes?.status && depois?.status && antes.status !== depois.status) {
    changes.push(
      `Status alterado de "${STATUS_LABEL[antes.status] ?? antes.status}" para "${STATUS_LABEL[depois.status] ?? depois.status}"`,
    );
  }

  if (antes?.itens && depois?.itens) {
    const antesMap = new Map(antes.itens.map((i) => [i.itemIdProtheus, i.qtdEntregue]));
    for (const item of depois.itens) {
      const qtdAntes = antesMap.get(item.itemIdProtheus);
      if (qtdAntes !== undefined && qtdAntes !== item.qtdEntregue) {
        changes.push(
          `Item ${item.itemIdProtheus}: quantidade entregue alterada de ${qtdAntes} para ${item.qtdEntregue}`,
        );
      }
    }
  }

  if (changes.length === 0) {
    changes.push(log.acao === 'editar_status' ? 'Status alterado' : 'Quantidades alteradas');
  }

  return changes;
}

// --- Unified timeline ---

type TimelineEntry =
  | { type: 'entrega'; date: string; entrega: AdminEntrega }
  | { type: 'alteracao'; date: string; log: AdminLogAlteracao; entregaId: string };

function buildTimeline(data: AdminDocumentoDetalhe): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  for (const entrega of data.entregas) {
    entries.push({
      type: 'entrega',
      date: entrega.finalizadaEm ?? entrega.iniciadaEm,
      entrega,
    });

    for (const log of entrega.logsAlteracao) {
      entries.push({
        type: 'alteracao',
        date: log.realizadaEm,
        log,
        entregaId: entrega.id,
      });
    }
  }

  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return entries;
}

export function AdminDocumentoDetalheScreen({ documentoNumero, onBack }: Props) {
  const logout = useAdminStore((s) => s.logout);
  const [data, setData] = useState<AdminDocumentoDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [editingEntrega, setEditingEntrega] = useState<AdminEntrega | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminRequest<AdminDocumentoDetalhe>(
        `/documentos/${encodeURIComponent(documentoNumero)}`,
      );
      setData(result);
    } catch (err) {
      if (err instanceof HttpError) {
        if (err.code === 'ADMIN_SESSAO_INVALIDA') {
          logout();
          return;
        }
        setError({ code: err.code, message: err.message });
      } else {
        setError({ code: 'ERRO_DESCONHECIDO', message: 'Erro ao carregar documento' });
      }
    } finally {
      setLoading(false);
    }
  }, [documentoNumero, logout]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  function handleEditSuccess() {
    setEditingEntrega(null);
    void fetchData();
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-surface-50">
        <div className="p-6">
          <MensagemErro
            code={error.code}
            message={error.message}
            onRetry={() => void fetchData()}
            onBack={onBack}
          />
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <Loading message="Carregando documento..." />
      </div>
    );
  }

  if (!data) return null;

  const timeline = buildTimeline(data);

  return (
    <div className="flex min-h-screen flex-col bg-surface-50">
      {/* Header */}
      <header className="flex items-center gap-4 border-b border-surface-200 bg-white px-6 py-4">
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-surface-900/60 active:bg-surface-100"
          aria-label="Voltar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-surface-900">Documento {data.documentoNumero}</h1>
          <p className="text-sm text-surface-900/60">{data.clienteNome}</p>
        </div>
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[data.status] ?? 'bg-surface-200 text-surface-900'}`}>
          {STATUS_LABEL[data.status] ?? data.status}
        </span>
      </header>

      <main className="flex-1 space-y-6 px-6 py-6">
        {/* Info do documento */}
        <div className="rounded-2xl border border-surface-200 bg-white p-5">
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <span className="text-surface-900/50">Chave</span>
              <p className="mt-1 break-all font-mono text-xs text-surface-900">{data.documentoChave}</p>
            </div>
            <div>
              <span className="text-surface-900/50">Itens</span>
              <p className="mt-1 font-semibold text-surface-900">{data.qtdItens}</p>
            </div>
            <div>
              <span className="text-surface-900/50">Consultado em</span>
              <p className="mt-1 text-surface-900">{formatDate(data.consultadoEm)}</p>
            </div>
            <div>
              <span className="text-surface-900/50">Entregas</span>
              <p className="mt-1 font-semibold text-surface-900">{data.entregas.length}</p>
            </div>
          </div>
        </div>

        {/* Entregas */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-surface-900">Entregas</h2>
          {data.entregas.length === 0 ? (
            <p className="py-8 text-center text-surface-900/40">Nenhuma entrega registrada</p>
          ) : (
            <div className="space-y-4">
              {data.entregas.map((entrega) => (
                <div key={entrega.id} className="rounded-2xl border border-surface-200 bg-white p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <span className="text-sm text-surface-900/50">Entregador</span>
                      <p className="font-semibold text-surface-900">{entrega.entregadorNome}</p>
                      <p className="text-xs text-surface-900/50">Cod: {entrega.entregadorCodigo}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[entrega.status] ?? 'bg-surface-200 text-surface-900'}`}>
                        {STATUS_LABEL[entrega.status] ?? entrega.status}
                      </span>
                      <Button
                        variant="secondary"
                        size="lg"
                        onClick={() => setEditingEntrega(entrega)}
                      >
                        Editar
                      </Button>
                    </div>
                  </div>

                  <div className="mb-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-surface-900/60">
                    <span>Iniciada: {formatDate(entrega.iniciadaEm)}</span>
                    {entrega.finalizadaEm && <span>Finalizada: {formatDate(entrega.finalizadaEm)}</span>}
                    {entrega.motivoPendencia && (
                      <span className="text-warning-600">Motivo: {entrega.motivoPendencia}</span>
                    )}
                  </div>

                  {/* Itens da entrega */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-surface-100">
                          <th className="pb-2 pr-4 font-semibold text-surface-900/50">Item</th>
                          <th className="pb-2 pr-4 font-semibold text-surface-900/50">Descricao</th>
                          <th className="pb-2 pr-4 text-right font-semibold text-surface-900/50">Un</th>
                          <th className="pb-2 pr-4 text-right font-semibold text-surface-900/50">Total</th>
                          <th className="pb-2 text-right font-semibold text-surface-900/50">Entregue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entrega.itens.map((item) => (
                          <tr key={item.id} className="border-b border-surface-50 last:border-0">
                            <td className="py-2 pr-4 font-mono text-xs text-surface-900">{item.itemIdProtheus}</td>
                            <td className="py-2 pr-4 text-surface-900">{item.descricao}</td>
                            <td className="py-2 pr-4 text-right text-surface-900/60">{item.unidade}</td>
                            <td className="py-2 pr-4 text-right font-semibold text-surface-900">{item.qtdTotal}</td>
                            <td className={`py-2 text-right font-semibold ${item.qtdEntregue < item.qtdTotal ? 'text-warning-600' : 'text-success-600'}`}>
                              {item.qtdEntregue}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Admin edits inline */}
                  {entrega.logsAlteracao.length > 0 && (
                    <div className="mt-4 border-t border-surface-100 pt-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-900/40">
                        Alteracoes administrativas ({entrega.logsAlteracao.length})
                      </p>
                      <div className="space-y-2">
                        {entrega.logsAlteracao.map((log) => (
                          <LogEntry key={log.id} log={log} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Historico unificado */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-surface-900">Historico</h2>
          {timeline.length === 0 ? (
            <p className="py-8 text-center text-surface-900/40">Nenhum evento registrado</p>
          ) : (
            <div className="relative space-y-0">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-px bg-surface-200" />

              {timeline.map((entry) => (
                <div key={entry.type === 'entrega' ? `e-${entry.entrega.id}` : `l-${entry.log.id}`} className="relative flex gap-4 pb-6">
                  {/* Timeline dot */}
                  <div className={`relative z-10 mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    entry.type === 'alteracao'
                      ? 'bg-warning-400/20 text-warning-600'
                      : STATUS_BADGE[entry.type === 'entrega' ? entry.entrega.status : ''] ?? 'bg-surface-200 text-surface-900'
                  }`}>
                    {entry.type === 'alteracao' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="3" width="15" height="13" />
                        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                        <circle cx="5.5" cy="18.5" r="2.5" />
                        <circle cx="18.5" cy="18.5" r="2.5" />
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 rounded-xl border border-surface-100 bg-white p-4">
                    {entry.type === 'entrega' ? (
                      <TimelineEntregaEntry entrega={entry.entrega} />
                    ) : (
                      <TimelineLogEntry log={entry.log} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {editingEntrega && (
        <AdminEditarEntregaModal
          entrega={editingEntrega}
          onClose={() => setEditingEntrega(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}

function TimelineEntregaEntry({ entrega }: { entrega: AdminEntrega }) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-surface-900">
            Entrega {STATUS_LABEL[entrega.status]?.toLowerCase() ?? entrega.status}
          </p>
          <p className="text-sm text-surface-900/60">
            Entregador: {entrega.entregadorNome}
          </p>
        </div>
        <span className="shrink-0 text-xs text-surface-900/40">
          {formatDate(entrega.finalizadaEm ?? entrega.iniciadaEm)}
        </span>
      </div>
      {entrega.motivoPendencia && (
        <p className="mt-1 text-sm text-warning-600">
          Pendencia: {entrega.motivoPendencia === 'retirada_futura' ? 'Cliente vai retirar depois' : 'Vamos entregar depois'}
        </p>
      )}
      {entrega.itens.some((i) => i.qtdEntregue > 0) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {entrega.itens
            .filter((i) => i.qtdEntregue > 0)
            .map((item) => (
              <span key={item.id} className="rounded-lg bg-surface-50 px-2 py-1 text-xs text-surface-900">
                {item.descricao}: <strong>{item.qtdEntregue}/{item.qtdTotal}</strong>
              </span>
            ))}
        </div>
      )}
    </>
  );
}

function TimelineLogEntry({ log }: { log: AdminLogAlteracao }) {
  const changes = describeLogChanges(log);

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-warning-700">Alteracao administrativa</p>
        <span className="shrink-0 text-xs text-surface-900/40">{formatDate(log.realizadaEm)}</span>
      </div>
      <div className="mt-1 space-y-1">
        {changes.map((change, i) => (
          <p key={i} className="text-sm text-surface-900">
            {change}
          </p>
        ))}
      </div>
      <p className="mt-2 text-sm text-surface-900/70">
        <span className="font-medium">Motivo:</span> {log.motivo}
      </p>
      <p className="mt-1 text-xs text-surface-900/40">
        Por {log.usuarioAdmin}
      </p>
    </>
  );
}

function LogEntry({ log }: { log: AdminLogAlteracao }) {
  const changes = describeLogChanges(log);

  return (
    <div className="rounded-lg bg-warning-400/5 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          {changes.map((change, i) => (
            <p key={i} className="text-sm text-surface-900">{change}</p>
          ))}
        </div>
        <span className="shrink-0 text-xs text-surface-900/40">{formatDate(log.realizadaEm)}</span>
      </div>
      <p className="mt-1 text-sm text-surface-900/70">
        <span className="font-medium">Motivo:</span> {log.motivo}
      </p>
      <p className="mt-0.5 text-xs text-surface-900/40">Por {log.usuarioAdmin}</p>
    </div>
  );
}
