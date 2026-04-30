import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/Button';
import { BackButton } from '@/components/BackButton';
import { NumberInput } from '@/components/NumberInput';
import { Modal } from '@/components/Modal';
import { MensagemErro } from '@/components/MensagemErro';
import { apiRequest, HttpError } from '@/services/http';
import { useSessaoStore } from '@/stores/sessao.store';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import type {
  EntregaAtiva,
  EntregaPendenciaMotivo,
  FinalizarEntregaResponse,
} from './entrega.types';

type Props = {
  entrega: EntregaAtiva;
  onBack: () => void;
  onSuccess: (result: FinalizarEntregaResponse) => void;
};

type QuantityState = Record<string, number>;

export function EntregaExecutionScreen({ entrega, onBack, onSuccess }: Props) {
  const logout = useSessaoStore((state) => state.logout);
  const [isPartialMode, setIsPartialMode] = useState(false);
  const [reason, setReason] = useState<EntregaPendenciaMotivo>('retirada_futura');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [showConfirmTotal, setShowConfirmTotal] = useState(false);
  const [quantities, setQuantities] = useState<QuantityState>(() =>
    Object.fromEntries(entrega.itens.map((item) => [item.itemIdProtheus, item.qtdTotal])),
  );

  const summary = useMemo(() => {
    let totalItems = 0;
    let totalUnits = 0;
    for (const item of entrega.itens) {
      const qty = quantities[item.itemIdProtheus] ?? 0;
      if (qty > 0) {
        totalItems++;
        totalUnits += qty;
      }
    }
    return { totalItems, totalUnits: Math.round(totalUnits * 1000) / 1000 };
  }, [quantities, entrega.itens]);

  function getStep(unit: string): number {
    return unit === 'KG' ? 0.5 : 1;
  }

  function changeQuantity(itemId: string, nextValue: number) {
    setQuantities((current) => ({ ...current, [itemId]: nextValue }));
  }

  async function doFinalizeTotal() {
    setShowConfirmTotal(false);
    setSubmitting(true);
    try {
      const result = await apiRequest<FinalizarEntregaResponse>(
        `/entregas/${entrega.id}/finalizar`,
        { method: 'POST', body: JSON.stringify({ tipo: 'total' }) },
      );
      onSuccess(result);
    } catch (err) {
      handleApiError(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function doFinalizePartial() {
    setSubmitting(true);
    try {
      const result = await apiRequest<FinalizarEntregaResponse>(
        `/entregas/${entrega.id}/finalizar`,
        {
          method: 'POST',
          body: JSON.stringify({
            tipo: 'parcial',
            motivoPendencia: reason,
            itens: entrega.itens.map((item) => ({
              itemIdProtheus: item.itemIdProtheus,
              qtdEntregue: quantities[item.itemIdProtheus] ?? 0,
            })),
          }),
        },
      );
      onSuccess(result);
    } catch (err) {
      handleApiError(err);
    } finally {
      setSubmitting(false);
    }
  }

  function handleApiError(err: unknown) {
    if (err instanceof HttpError) {
      setError({ code: err.code, message: err.message });
      if (err.code === 'SESSAO_INVALIDA') logout();
    } else {
      setError({ code: 'ERRO_DESCONHECIDO', message: 'Erro ao finalizar a entrega' });
    }
  }

  const debouncedFinalizeTotal = useDebouncedCallback(() => setShowConfirmTotal(true), 500);
  const debouncedFinalizePartial = useDebouncedCallback(() => void doFinalizePartial(), 500);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50 p-6">
        <MensagemErro code={error.code} message={error.message} onRetry={onBack} onBack={() => setError(null)} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-surface-200 bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <BackButton onClick={onBack} />
          <div>
            <p className="text-sm uppercase tracking-[0.16em] text-surface-900/45">
              {entrega.modo === 'reentrega' ? 'Reentrega' : 'Entrega'}
            </p>
            <h1 className="text-xl font-bold text-surface-900">
              Documento {entrega.documento}
            </h1>
          </div>
        </div>
      </header>

      {/* Sticky summary bar */}
      <div className="sticky top-[73px] z-10 border-b border-surface-200 bg-white px-5 py-3">
        <p className="text-center text-base font-semibold text-surface-900">
          {summary.totalItems} de {entrega.itens.length} itens &bull; {summary.totalUnits}
        </p>
      </div>

      {/* Scrollable content */}
      <main className="flex-1 space-y-5 p-5 pb-[200px]">
        {/* Entregador info */}
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.16em] text-surface-900/45">Entregador</p>
              <h2 className="mt-1 text-2xl font-bold text-surface-900">{entrega.entregador.nome}</h2>
              <p className="mt-2 text-base text-surface-900/55">{entrega.entregador.codigo}</p>
            </div>
            <div className="rounded-2xl bg-surface-100 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.12em] text-surface-900/45">Inicio</p>
              <p className="mt-1 text-sm font-semibold text-surface-900">
                {format(new Date(entrega.iniciadaEm), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </p>
            </div>
          </div>
        </section>

        {/* Items */}
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-surface-900">Itens da entrega</h2>
            <p className="text-sm text-surface-900/55">
              {isPartialMode
                ? 'Ajuste apenas o que saiu agora.'
                : 'Se tudo saiu completo, finalize com um toque.'}
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {entrega.itens.map((item) => (
              <article key={item.itemIdProtheus} className="rounded-2xl border border-surface-200 bg-surface-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-surface-900 leading-snug">{item.descricao}</h3>
                    <p className="text-sm text-surface-900/55">{item.itemIdProtheus}</p>
                  </div>

                  {isPartialMode ? (
                    <NumberInput
                      value={quantities[item.itemIdProtheus] ?? 0}
                      max={item.qtdTotal}
                      step={getStep(item.unidade)}
                      showDeliverAll={false}
                      onChange={(v) => changeQuantity(item.itemIdProtheus, v)}
                    />
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-white px-4 py-3 text-center">
                        <p className="text-xs uppercase tracking-[0.12em] text-surface-900/45">Disponivel</p>
                        <p className="mt-1 text-2xl font-bold text-surface-900">{item.qtdTotal}</p>
                      </div>
                      <div className="rounded-2xl bg-success-500 px-4 py-3 text-center text-white">
                        <p className="text-xs uppercase tracking-[0.12em] text-white/70">Saida</p>
                        <p className="mt-1 text-2xl font-bold">{item.qtdTotal}</p>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Motivo (parcial) */}
        {isPartialMode && (
          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-surface-900">Motivo da pendencia</h2>
            <div className="mt-4 grid gap-3">
              {([
                { key: 'retirada_futura' as const, title: 'Cliente vai retirar depois', desc: 'Saldo fica reservado para retirada futura.' },
                { key: 'entrega_futura' as const, title: 'Vamos entregar depois', desc: 'Saldo continua pendente para nova entrega.' },
              ]).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setReason(opt.key)}
                  className={`min-h-[56px] rounded-2xl border px-4 py-4 text-left ${
                    reason === opt.key
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-surface-200 bg-surface-50 text-surface-900'
                  }`}
                >
                  <p className="text-lg font-bold">{opt.title}</p>
                  <p className={reason === opt.key ? 'text-white/80' : 'text-surface-900/55'}>{opt.desc}</p>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Sticky footer buttons */}
      <div className="sticky bottom-0 z-10 border-t border-surface-200 bg-white p-5 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        {!isPartialMode ? (
          <div className="flex flex-col gap-3">
            <Button
              variant="success"
              size="xl"
              fullWidth
              loading={submitting}
              onClick={debouncedFinalizeTotal}
            >
              ENTREGA COMPLETA
            </Button>
            <Button
              variant="warning"
              size="lg"
              fullWidth
              onClick={() => setIsPartialMode(true)}
            >
              ENTREGA PARCIAL
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-center text-sm text-surface-900/55">
              {summary.totalItems} item(ns) com saida informada
            </p>
            <Button
              variant="primary"
              size="xl"
              fullWidth
              loading={submitting}
              disabled={summary.totalItems === 0}
              onClick={debouncedFinalizePartial}
            >
              CONFIRMAR ENTREGA PARCIAL
            </Button>
            <button
              type="button"
              onClick={() => setIsPartialMode(false)}
              className="min-h-[44px] text-sm font-semibold text-surface-900/55 underline-offset-2 hover:underline"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Confirmation modal (total delivery) */}
      {showConfirmTotal && (
        <Modal>
          <div className="text-center">
            <span className="text-5xl">📦</span>
            <h2 className="mt-4 text-2xl font-bold text-surface-900">
              Confirma que TODOS os {entrega.itens.length} itens foram entregues?
            </h2>
            <p className="mt-3 text-lg text-surface-900/60">
              Essa acao nao pode ser desfeita.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Button variant="success" size="xl" fullWidth loading={submitting} onClick={() => void doFinalizeTotal()}>
                Sim, finalizar
              </Button>
              <Button variant="secondary" size="lg" fullWidth onClick={() => setShowConfirmTotal(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
