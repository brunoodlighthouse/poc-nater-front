import { formatDistanceToNowStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { NotaRecebida } from './fila.types';

type Props = {
  nota: NotaRecebida;
  onClick?: () => void;
};

const statusConfig: Record<NotaRecebida['status'], { label: string; className: string }> = {
  pendente: { label: 'Pendente', className: 'bg-warning-400/15 text-warning-600' },
  em_andamento: { label: 'Em andamento', className: 'bg-brand-500/15 text-brand-600' },
  parcial: { label: 'Parcial', className: 'bg-info-400/15 text-info-600' },
  finalizado: { label: 'Finalizado', className: 'bg-success-400/15 text-success-600' },
  cancelado: { label: 'Cancelado', className: 'bg-danger-400/15 text-danger-600' },
};

export function NotaRecebidaCard({ nota, onClick }: Props) {
  const valorFormatado = nota.valorTotal > 0
    ? nota.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : null;
  const status = statusConfig[nota.status];

  return (
    <button
      type="button"
      onClick={onClick}
      className="block min-h-[120px] w-full rounded-3xl border border-surface-200 bg-white p-5 text-left shadow-sm transition-transform active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-lg text-surface-900/40">📄</span>
            <span className="text-xl font-bold text-surface-900">
              {nota.tipoDocumento} {nota.documentoNumero}
            </span>
          </div>
          <p className="text-lg text-surface-900/80">{nota.clienteNome}</p>
          <p className="text-base text-surface-900/50">
            {nota.qtdItens} {nota.qtdItens === 1 ? 'item' : 'itens'}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${status.className}`}>
            {status.label}
          </span>
          {valorFormatado && (
            <span className="text-sm font-semibold text-surface-900/60">
              {valorFormatado}
            </span>
          )}
        </div>
      </div>
      <p className="mt-4 text-sm text-surface-900/40">
        Recebida ha{' '}
        {formatDistanceToNowStrict(new Date(nota.recebidaEm), {
          addSuffix: false,
          locale: ptBR,
        })}
      </p>
    </button>
  );
}
