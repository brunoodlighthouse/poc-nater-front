import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/Button';
import { BackButton } from '@/components/BackButton';
import { Loading } from '@/components/Loading';
import { MensagemErro } from '@/components/MensagemErro';
import { apiRequest, HttpError } from '@/services/http';
import { useSessaoStore } from '@/stores/sessao.store';
import type {
  EntregaAtiva,
  EntregaDetalhe,
  EntregadorOption,
  EntregaHistorico,
  EntregaHistoricoLog,
} from './entrega.types';

type Props = {
  documentoNumero: string;
  onBack: () => void;
  onContinue: (entrega: EntregaAtiva) => void;
  onStarted: () => void;
};

const historicoStatusLabel: Record<EntregaHistorico['status'], string> = {
  em_andamento: 'Em andamento',
  finalizada_total: 'Finalizada total',
  finalizada_parcial: 'Finalizada parcial',
  cancelada: 'Cancelada',
};

const historicoStatusStyle: Record<EntregaHistorico['status'], string> = {
  em_andamento: 'bg-info-400/15 text-info-700',
  finalizada_total: 'bg-success-500/15 text-success-700',
  finalizada_parcial: 'bg-warning-400/15 text-warning-700',
  cancelada: 'bg-danger-500/15 text-danger-600',
};

export function EntregaDetailScreen({ documentoNumero, onBack, onContinue, onStarted }: Props) {
  const logout = useSessaoStore((state) => state.logout);
  const [detail, setDetail] = useState<EntregaDetalhe | null>(null);
  const [couriers, setCouriers] = useState<EntregadorOption[]>([]);
  const [selectedCourier, setSelectedCourier] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedHistoryIds, setExpandedHistoryIds] = useState<Set<string>>(new Set());
  const [changingCourier, setChangingCourier] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadDetail() {
      try {
        const [detailData, couriersData] = await Promise.all([
          apiRequest<EntregaDetalhe>(`/entregas/detalhe/${documentoNumero}`),
          apiRequest<EntregadorOption[]>('/entregas/entregadores'),
        ]);
        if (!isMounted) return;
        setDetail(detailData);
        setCouriers(couriersData);
        setSelectedCourier(detailData.entregaEmAndamento?.entregador.codigo ?? couriersData[0]?.codigo ?? '');
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        if (err instanceof HttpError) {
          setError({ code: err.code, message: err.message });
          if (err.code === 'SESSAO_INVALIDA') logout();
        } else {
          setError({ code: 'ERRO_DESCONHECIDO', message: 'Erro ao carregar o detalhe da entrega' });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadDetail();
    return () => { isMounted = false; };
  }, [documentoNumero, logout]);

  async function handleStartDelivery() {
    if (!selectedCourier) return;
    setSubmitting(true);
    try {
      await apiRequest<EntregaAtiva>('/entregas/iniciar', {
        method: 'POST',
        body: JSON.stringify({ documento: documentoNumero, entregadorCodigo: selectedCourier }),
      });
      onStarted();
    } catch (err) {
      if (err instanceof HttpError) {
        setError({ code: err.code, message: err.message });
        if (err.code === 'SESSAO_INVALIDA') logout();
      } else {
        setError({ code: 'ERRO_DESCONHECIDO', message: 'Erro ao iniciar a entrega' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleChangeCourier() {
    if (!selectedCourier || !detail?.entregaEmAndamento) return;
    setSubmitting(true);
    try {
      await apiRequest(`/entregas/${detail.entregaEmAndamento.id}/cancelar`, { method: 'POST', body: JSON.stringify({}) });
      await apiRequest<EntregaAtiva>('/entregas/iniciar', {
        method: 'POST',
        body: JSON.stringify({ documento: documentoNumero, entregadorCodigo: selectedCourier }),
      });
      onStarted();
    } catch (err) {
      if (err instanceof HttpError) {
        setError({ code: err.code, message: err.message });
        if (err.code === 'SESSAO_INVALIDA') logout();
      } else {
        setError({ code: 'ERRO_DESCONHECIDO', message: 'Erro ao alterar entregador' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <Loading message="Carregando detalhe..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50 p-6">
        <MensagemErro code={error.code} message={error.message} onRetry={onBack} onBack={onBack} />
      </div>
    );
  }

  if (!detail) return null;

  const pendingItems = detail.itens.filter((item) => item.qtdPendente > 0);
  const hasOpenDelivery = detail.entregaEmAndamento !== null;
  const hasPendingItems = pendingItems.length > 0;
  const isReDelivery = detail.modo === 'reentrega';

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-surface-200 bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <BackButton onClick={onBack} />
          <div>
            <p className="text-sm uppercase tracking-[0.16em] text-surface-900/45">
              {detail.documento.tipo}
            </p>
            <h1 className="text-xl font-bold text-surface-900">
              Documento {detail.documento.numero}
            </h1>
          </div>
        </div>
      </header>

      <main className="space-y-5 p-5">
        {/* Cliente */}
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.16em] text-surface-900/45">Cliente</p>
              <h2 className="mt-1 text-2xl font-bold text-surface-900">
                {detail.documento.cliente.nome}
              </h2>
              <p className="mt-2 text-base text-surface-900/55">
                Consultado em{' '}
                {format(new Date(detail.documento.consultadoEm), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </p>
            </div>
            <span
              className={`rounded-full px-4 py-2 text-sm font-bold ${
                !hasOpenDelivery && !hasPendingItems
                  ? 'bg-success-500/15 text-success-700'
                  : isReDelivery
                    ? 'bg-info-400/15 text-info-600'
                    : 'bg-warning-400/15 text-warning-600'
              }`}
            >
              {!hasOpenDelivery && !hasPendingItems
                ? 'Concluído'
                : isReDelivery
                  ? 'Reentrega'
                  : 'Entrega inicial'}
            </span>
          </div>
        </section>

        {/* Entrega em andamento */}
        {hasOpenDelivery && detail.entregaEmAndamento && (
          <section className="rounded-3xl border border-info-400/30 bg-info-400/5 p-5 shadow-sm">
            <p className="text-sm uppercase tracking-[0.16em] text-info-700">Entrega em andamento</p>
            <h2 className="mt-2 text-2xl font-bold text-surface-900">
              {detail.entregaEmAndamento.entregador.nome}
            </h2>
            <p className="mt-2 text-base text-surface-900/60">
              Iniciada em{' '}
              {format(new Date(detail.entregaEmAndamento.iniciadaEm), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            </p>

            {!changingCourier ? (
              <div className="mt-4 flex flex-col gap-3">
                <Button variant="primary" size="xl" fullWidth onClick={() => onContinue(detail.entregaEmAndamento!)}>
                  CONTINUAR ENTREGA
                </Button>
                <button
                  type="button"
                  onClick={() => setChangingCourier(true)}
                  className="min-h-[44px] text-sm font-semibold text-info-700 underline-offset-2 hover:underline"
                >
                  Alterar entregador
                </button>
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-sm font-semibold text-surface-900">Selecione o novo entregador:</p>
                <div className="mt-3 grid gap-3">
                  {couriers.map((courier) => {
                    const selected = courier.codigo === selectedCourier;
                    return (
                      <button
                        key={courier.codigo}
                        type="button"
                        onClick={() => setSelectedCourier(courier.codigo)}
                        className={`min-h-[56px] rounded-2xl border px-4 py-4 text-left transition-colors ${
                          selected
                            ? 'border-brand-500 bg-brand-500 text-white'
                            : 'border-surface-200 bg-white text-surface-900'
                        }`}
                      >
                        <p className="text-lg font-bold">{courier.nome}</p>
                        <p className={selected ? 'text-white/80' : 'text-surface-900/55'}>{courier.codigo}</p>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 flex flex-col gap-3">
                  <Button
                    variant="primary"
                    size="xl"
                    fullWidth
                    loading={submitting}
                    disabled={!selectedCourier}
                    onClick={() => void handleChangeCourier()}
                  >
                    CONFIRMAR ALTERAÇÃO
                  </Button>
                  <button
                    type="button"
                    onClick={() => setChangingCourier(false)}
                    className="min-h-[44px] text-sm font-semibold text-surface-900/55 underline-offset-2 hover:underline"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Entrega concluida */}
        {!hasOpenDelivery && !hasPendingItems && (
          <section className="rounded-3xl border border-success-500/30 bg-success-500/5 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-3xl">✅</span>
              <div>
                <p className="text-lg font-bold text-success-700">Entrega concluída</p>
                <p className="text-sm text-surface-900/60">
                  Todos os itens deste documento foram entregues.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Selecao de entregador */}
        {!hasOpenDelivery && hasPendingItems && (
          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-surface-900">Selecionar entregador</h2>
            <p className="mt-1 text-sm text-surface-900/55">
              Escolha o entregador que vai assumir esta separacao.
            </p>
            <div className="mt-4 grid gap-3">
              {couriers.map((courier) => {
                const selected = courier.codigo === selectedCourier;
                return (
                  <button
                    key={courier.codigo}
                    type="button"
                    onClick={() => setSelectedCourier(courier.codigo)}
                    className={`min-h-[56px] rounded-2xl border px-4 py-4 text-left transition-colors ${
                      selected
                        ? 'border-brand-500 bg-brand-500 text-white'
                        : 'border-surface-200 bg-surface-50 text-surface-900'
                    }`}
                  >
                    <p className="text-lg font-bold">{courier.nome}</p>
                    <p className={selected ? 'text-white/80' : 'text-surface-900/55'}>{courier.codigo}</p>
                  </button>
                );
              })}
            </div>
            <div className="mt-5">
              <Button
                variant="primary"
                size="xl"
                fullWidth
                loading={submitting}
                disabled={!selectedCourier}
                onClick={() => void handleStartDelivery()}
              >
                {isReDelivery ? 'INICIAR REENTREGA' : 'INICIAR SEPARACAO'}
              </Button>
            </div>
          </section>
        )}

        {/* Historico colapsavel */}
        {detail.historico.length > 0 && (
          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              className="flex min-h-[44px] w-full items-center justify-between text-left"
            >
              <h2 className="text-xl font-bold text-surface-900">
                Historico ({detail.historico.length})
              </h2>
              <span className="text-lg text-surface-900/45">
                {showHistory ? '▲' : '▼'}
              </span>
            </button>

            {showHistory && (
              <div className="mt-4 space-y-3">
                {detail.historico.map((entry) => {
                  const deliveredItens = entry.itens.filter((item) => item.qtdEntregue > 0);
                  const isExpanded = expandedHistoryIds.has(entry.id);

                  function toggleItems() {
                    setExpandedHistoryIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(entry.id)) next.delete(entry.id);
                      else next.add(entry.id);
                      return next;
                    });
                  }

                  return (
                    <article key={entry.id} className="rounded-2xl border border-surface-200 bg-surface-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-bold text-surface-900">{entry.entregadorNome}</p>
                          <p className="text-sm text-surface-900/55">{entry.entregadorCodigo}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${historicoStatusStyle[entry.status]}`}>
                          {historicoStatusLabel[entry.status]}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-surface-900/55">
                        Inicio: {format(new Date(entry.iniciadaEm), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                      {entry.finalizadaEm && (
                        <p className="text-sm text-surface-900/55">
                          Fim: {format(new Date(entry.finalizadaEm), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      )}
                      {entry.motivoPendencia && (
                        <p className="mt-2 text-sm font-semibold text-warning-700">
                          Pendencia:{' '}
                          {entry.motivoPendencia === 'retirada_futura'
                            ? 'Cliente vai retirar depois'
                            : 'Vamos entregar depois'}
                        </p>
                      )}

                      {deliveredItens.length > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={toggleItems}
                            className="mt-3 flex min-h-[44px] w-full items-center justify-between border-t border-surface-200 pt-3 text-left"
                          >
                            <span className="text-sm font-semibold text-surface-900/70">
                              {deliveredItens.length} {deliveredItens.length === 1 ? 'item entregue' : 'itens entregues'}
                            </span>
                            <span className="text-xs text-surface-900/45">{isExpanded ? '▲' : '▼'}</span>
                          </button>

                          {isExpanded && (
                            <div className="mt-2 space-y-2">
                              {deliveredItens.map((item) => (
                                <div
                                  key={item.itemIdProtheus}
                                  className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2"
                                >
                                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-surface-900">
                                    {item.descricao}
                                  </p>
                                  <span className="shrink-0 text-sm font-bold text-surface-900">
                                    {item.qtdEntregue} / {item.qtdTotal}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {entry.alteracoesAdmin?.length > 0 && (
                        <div className="mt-3 border-t border-surface-200 pt-3">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-warning-600/70">
                            Alterado pelo admin
                          </p>
                          <div className="space-y-2">
                            {entry.alteracoesAdmin.map((log) => (
                              <AdminLogDisplay key={log.id} log={log} />
                            ))}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

const STATUS_LABEL_MAP: Record<string, string> = {
  em_andamento: 'Em andamento',
  finalizada_total: 'Finalizada total',
  finalizada_parcial: 'Finalizada parcial',
  cancelada: 'Cancelada',
};

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

function describeChanges(log: EntregaHistoricoLog): string[] {
  const antes = parseDados(log.dadosAntes);
  const depois = parseDados(log.dadosDepois);
  const changes: string[] = [];

  if (antes?.status && depois?.status && antes.status !== depois.status) {
    changes.push(
      `Status: ${STATUS_LABEL_MAP[antes.status] ?? antes.status} → ${STATUS_LABEL_MAP[depois.status] ?? depois.status}`,
    );
  }

  if (antes?.itens && depois?.itens) {
    const antesMap = new Map(antes.itens.map((i) => [i.itemIdProtheus, i.qtdEntregue]));
    for (const item of depois.itens) {
      const qtdAntes = antesMap.get(item.itemIdProtheus);
      if (qtdAntes !== undefined && qtdAntes !== item.qtdEntregue) {
        changes.push(`Item ${item.itemIdProtheus}: ${qtdAntes} → ${item.qtdEntregue}`);
      }
    }
  }

  if (changes.length === 0) {
    changes.push(log.acao === 'editar_status' ? 'Status alterado' : 'Quantidades alteradas');
  }

  return changes;
}

function AdminLogDisplay({ log }: { log: EntregaHistoricoLog }) {
  const changes = describeChanges(log);

  return (
    <div className="rounded-lg bg-warning-400/10 px-3 py-2">
      {changes.map((change, i) => (
        <p key={i} className="text-sm text-warning-800">{change}</p>
      ))}
      <p className="mt-1 text-xs text-surface-900/50">
        Motivo: {log.motivo} — {format(new Date(log.realizadaEm), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
      </p>
    </div>
  );
}
