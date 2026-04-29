import { formatDistanceToNowStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { FilaDocumento } from './fila.types';

type Props = {
  documento: FilaDocumento;
  onClick?: () => void;
};

const statusConfig: Record<FilaDocumento['status'], { label: string; className: string }> = {
  pendente: { label: 'Pendente', className: 'bg-warning-400/15 text-warning-600' },
  parcial: { label: 'Parcial', className: 'bg-info-400/15 text-info-600' },
  finalizado: { label: 'Finalizado', className: 'bg-success-400/15 text-success-600' },
  cancelado: { label: 'Cancelado', className: 'bg-danger-400/15 text-danger-600' },
};

export function FilaDocumentoCard({ documento, onClick }: Props) {
  const status = statusConfig[documento.status];
  const subtitle =
    documento.status === 'parcial'
      ? `${documento.qtdItensEntregues} de ${documento.qtdItens} itens entregues`
      : `${documento.qtdItens} itens`;

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
              {documento.tipoDocumento} {documento.documentoNumero}
            </span>
          </div>
          <p className="text-lg text-surface-900/80">{documento.clienteNome}</p>
          <p className="text-base text-surface-900/50">{subtitle}</p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${status.className}`}>
          {status.label}
        </span>
      </div>
      <p className="mt-4 text-sm text-surface-900/40">
        Lido ha{' '}
        {formatDistanceToNowStrict(new Date(documento.consultadoEm), {
          addSuffix: false,
          locale: ptBR,
        })}
      </p>
    </button>
  );
}
