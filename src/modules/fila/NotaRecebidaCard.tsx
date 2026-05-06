import { formatDistanceToNowStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { NotaRecebida } from './nota-recebida.types';

type Props = {
  nota: NotaRecebida;
  onClick?: () => void;
};

export function NotaRecebidaCard({ nota, onClick }: Props) {
  const valorFormatado = nota.valorTotal.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

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
        <span className="shrink-0 rounded-full bg-brand-500/10 px-3 py-1 text-sm font-semibold text-brand-600">
          {valorFormatado}
        </span>
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
