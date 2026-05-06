import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { Loading } from '@/components/Loading';
import { MensagemErro } from '@/components/MensagemErro';
import { adminRequest } from '@/services/adminHttp';
import { HttpError } from '@/services/http';
import { useAdminStore } from '@/stores/admin.store';
import type { AdminDocumentoListResponse } from './admin.types';

type Filters = {
  page: number;
  perPage: number;
  status: string;
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
};

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'parcial', label: 'Parcial' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'cancelado', label: 'Cancelado' },
];

const SORT_OPTIONS = [
  { value: 'recebidoEm', label: 'Data recebimento' },
  { value: 'documentoNumero', label: 'Documento' },
  { value: 'clienteNome', label: 'Cliente' },
  { value: 'status', label: 'Status' },
];

const STATUS_BADGE: Record<string, string> = {
  pendente: 'bg-warning-400/20 text-warning-600',
  parcial: 'bg-info-400/20 text-info-600',
  finalizado: 'bg-success-400/20 text-success-600',
  cancelado: 'bg-danger-400/20 text-danger-600',
};

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  parcial: 'Parcial',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
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

type Props = {
  onOpenDocument: (documentoNumero: string) => void;
};

export function AdminDocumentosScreen({ onOpenDocument }: Props) {
  const logout = useAdminStore((s) => s.logout);
  const [data, setData] = useState<AdminDocumentoListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [filters, setFilters] = useState<Filters>({
    page: 1,
    perPage: 20,
    status: '',
    search: '',
    sortBy: 'recebidoEm',
    sortOrder: 'desc',
  });
  const [searchInput, setSearchInput] = useState('');

  const fetchData = useCallback(async (f: Filters) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', String(f.page));
      params.set('perPage', String(f.perPage));
      params.set('sortBy', f.sortBy);
      params.set('sortOrder', f.sortOrder);
      if (f.status) params.set('status', f.status);
      if (f.search) params.set('search', f.search);

      const result = await adminRequest<AdminDocumentoListResponse>(
        `/documentos?${params.toString()}`,
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
        setError({ code: 'ERRO_DESCONHECIDO', message: 'Erro ao carregar documentos' });
      }
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    void fetchData(filters);
  }, [filters, fetchData]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, page: 1, search: searchInput.trim() }));
  }

  function handleStatusChange(status: string) {
    setFilters((prev) => ({ ...prev, page: 1, status }));
  }

  function handleSortChange(sortBy: string) {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc',
    }));
  }

  function handlePageChange(page: number) {
    setFilters((prev) => ({ ...prev, page }));
  }

  return (
    <div className="space-y-4">
      {/* Barra de busca e filtros */}
      <div className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por documento ou cliente..."
            className="flex-1 rounded-xl border border-surface-200 bg-white px-4 py-3 text-base text-surface-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
          <Button type="submit" variant="primary" size="lg">
            Buscar
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-surface-900/60">Status:</span>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleStatusChange(opt.value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                filters.status === opt.value
                  ? 'bg-brand-500 text-white'
                  : 'bg-surface-200 text-surface-900 active:bg-surface-200/80'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-surface-900/60">Ordenar:</span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSortChange(opt.value)}
              className={`flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                filters.sortBy === opt.value
                  ? 'bg-brand-500 text-white'
                  : 'bg-surface-200 text-surface-900 active:bg-surface-200/80'
              }`}
            >
              {opt.label}
              {filters.sortBy === opt.value && (
                <span className="text-xs">{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Conteudo */}
      {error && (
        <MensagemErro
          code={error.code}
          message={error.message}
          onRetry={() => void fetchData(filters)}
          onBack={() => setError(null)}
        />
      )}

      {loading && !data && <Loading message="Carregando documentos..." />}

      {data && (
        <>
          <div className="text-sm text-surface-900/60">
            {data.total} documento{data.total !== 1 ? 's' : ''} encontrado{data.total !== 1 ? 's' : ''}
          </div>

          {data.items.length === 0 ? (
            <div className="py-16 text-center text-lg text-surface-900/40">
              Nenhum documento encontrado
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-surface-200 bg-white">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-surface-200 bg-surface-50">
                    <th className="px-4 py-3 text-sm font-semibold text-surface-900/60">Documento</th>
                    <th className="px-4 py-3 text-sm font-semibold text-surface-900/60">Cliente</th>
                    <th className="px-4 py-3 text-sm font-semibold text-surface-900/60">Itens</th>
                    <th className="px-4 py-3 text-sm font-semibold text-surface-900/60">Status</th>
                    <th className="px-4 py-3 text-sm font-semibold text-surface-900/60">Consultado em</th>
                    <th className="px-4 py-3 text-sm font-semibold text-surface-900/60">Ultima entrega</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => onOpenDocument(item.documentoNumero)}
                      className="cursor-pointer border-b border-surface-100 last:border-0 hover:bg-surface-50/50 active:bg-surface-100"
                    >
                      <td className="px-4 py-3 font-semibold text-surface-900">
                        {item.documentoNumero}
                      </td>
                      <td className="px-4 py-3 text-surface-900">{item.clienteNome}</td>
                      <td className="px-4 py-3 text-surface-900">{item.qtdItens}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[item.status] ?? ''}`}>
                          {STATUS_LABEL[item.status] ?? item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-surface-900/60">
                        {formatDate(item.consultadoEm)}
                      </td>
                      <td className="px-4 py-3 text-sm text-surface-900/60">
                        {item.ultimaEntrega ? (
                          <div>
                            <span className="font-medium text-surface-900">
                              {item.ultimaEntrega.entregadorNome}
                            </span>
                            {item.ultimaEntrega.finalizadaEm && (
                              <span className="ml-1 text-surface-900/40">
                                {formatDate(item.ultimaEntrega.finalizadaEm)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-surface-900/30">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginacao */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={data.page <= 1}
                onClick={() => handlePageChange(data.page - 1)}
                className="min-h-[44px] min-w-[44px] rounded-xl border border-surface-200 bg-white px-4 py-2 font-semibold text-surface-900 disabled:opacity-30"
              >
                Anterior
              </button>
              <span className="px-4 text-sm text-surface-900/60">
                {data.page} de {data.totalPages}
              </span>
              <button
                type="button"
                disabled={data.page >= data.totalPages}
                onClick={() => handlePageChange(data.page + 1)}
                className="min-h-[44px] min-w-[44px] rounded-xl border border-surface-200 bg-white px-4 py-2 font-semibold text-surface-900 disabled:opacity-30"
              >
                Proximo
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
