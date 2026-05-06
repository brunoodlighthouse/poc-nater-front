import { useState } from 'react';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { adminRequest } from '@/services/adminHttp';
import { HttpError } from '@/services/http';
import type { AdminEntrega } from './admin.types';

type Props = {
  entrega: AdminEntrega;
  onClose: () => void;
  onSuccess: () => void;
};

const STATUS_OPTIONS = [
  { value: '', label: 'Manter atual' },
  { value: 'finalizada_total', label: 'Finalizada Total' },
  { value: 'finalizada_parcial', label: 'Finalizada Parcial' },
  { value: 'cancelada', label: 'Cancelada' },
];

export function AdminEditarEntregaModal({ entrega, onClose, onSuccess }: Props) {
  const [status, setStatus] = useState('');
  const [motivo, setMotivo] = useState('');
  const [itens, setItens] = useState(
    entrega.itens.map((item) => ({
      itemIdProtheus: item.itemIdProtheus,
      qtdEntregue: item.qtdEntregue,
      qtdTotal: item.qtdTotal,
      descricao: item.descricao,
      unidade: item.unidade,
      changed: false,
    })),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleQtdChange(index: number, value: string) {
    const num = Number(value);
    if (Number.isNaN(num) || num < 0) return;

    setItens((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, qtdEntregue: Math.min(num, item.qtdTotal), changed: true }
          : item,
      ),
    );
  }

  const hasItemChanges = itens.some((item) => item.changed);
  const hasStatusChange = status !== '';
  const canSubmit = motivo.trim().length >= 10 && (hasStatusChange || hasItemChanges);

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        motivo: motivo.trim(),
      };

      if (hasStatusChange) {
        body.status = status;
      }

      if (hasItemChanges) {
        body.itens = itens
          .filter((item) => item.changed)
          .map((item) => ({
            itemIdProtheus: item.itemIdProtheus,
            qtdEntregue: item.qtdEntregue,
          }));
      }

      await adminRequest(`/entregas/${entrega.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });

      onSuccess();
    } catch (err) {
      if (err instanceof HttpError) {
        setError(err.message);
      } else {
        setError('Erro ao salvar alteracao');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal>
      <div className="max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-surface-900">Editar Entrega</h2>
        <p className="mt-1 text-sm text-surface-900/60">
          Entregador: {entrega.entregadorNome} | Status atual: {entrega.status}
        </p>

        {error && (
          <div className="mt-4 rounded-xl bg-danger-500/10 p-3 text-sm text-danger-600">
            {error}
          </div>
        )}

        {/* Status */}
        <div className="mt-6">
          <label className="mb-2 block text-sm font-semibold text-surface-900">Alterar status</label>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  status === opt.value
                    ? 'bg-brand-500 text-white'
                    : 'bg-surface-100 text-surface-900 active:bg-surface-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Itens */}
        <div className="mt-6">
          <label className="mb-2 block text-sm font-semibold text-surface-900">Quantidades entregues</label>
          <div className="space-y-3">
            {itens.map((item, index) => (
              <div key={item.itemIdProtheus} className="flex items-center gap-3 rounded-xl border border-surface-100 bg-surface-50 p-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-surface-900">{item.descricao}</p>
                  <p className="text-xs text-surface-900/50">
                    {item.itemIdProtheus} | {item.unidade} | Total: {item.qtdTotal}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQtdChange(index, String(item.qtdEntregue - 1))}
                    disabled={item.qtdEntregue <= 0}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-surface-200 bg-white text-lg font-bold text-surface-900 disabled:opacity-30"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={item.qtdEntregue}
                    onChange={(e) => handleQtdChange(index, e.target.value)}
                    min={0}
                    max={item.qtdTotal}
                    className="w-16 rounded-lg border border-surface-200 bg-white px-2 py-2 text-center text-base font-semibold text-surface-900 outline-none focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleQtdChange(index, String(item.qtdEntregue + 1))}
                    disabled={item.qtdEntregue >= item.qtdTotal}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-surface-200 bg-white text-lg font-bold text-surface-900 disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Motivo */}
        <div className="mt-6">
          <label htmlFor="motivo" className="mb-2 block text-sm font-semibold text-surface-900">
            Motivo da alteracao <span className="text-danger-500">*</span>
          </label>
          <textarea
            id="motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Descreva o motivo da alteracao (minimo 10 caracteres)"
            rows={3}
            maxLength={500}
            className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-base text-surface-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
          <p className="mt-1 text-xs text-surface-900/40">
            {motivo.trim().length}/500 (minimo 10)
          </p>
        </div>

        {/* Acoes */}
        <div className="mt-6 flex flex-col gap-3">
          <Button
            variant="primary"
            size="xl"
            fullWidth
            loading={loading}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            SALVAR ALTERACAO
          </Button>
          <Button variant="secondary" size="lg" fullWidth onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
