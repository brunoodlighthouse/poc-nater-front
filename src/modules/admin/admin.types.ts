export type AdminDocumentoListItem = {
  id: string;
  documentoNumero: string;
  documentoChave: string;
  clienteNome: string;
  qtdItens: number;
  status: 'pendente' | 'parcial' | 'finalizado' | 'cancelado';
  consultadoEm: string;
  ultimaEntrega: {
    id: string;
    status: string;
    entregadorNome: string;
    finalizadaEm: string | null;
  } | null;
};

export type AdminDocumentoListResponse = {
  items: AdminDocumentoListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type AdminEntregaItem = {
  id: string;
  itemIdProtheus: string;
  descricao: string;
  unidade: string;
  qtdTotal: number;
  qtdEntregue: number;
};

export type AdminLogAlteracao = {
  id: string;
  usuarioAdmin: string;
  acao: string;
  motivo: string;
  dadosAntes: unknown;
  dadosDepois: unknown;
  realizadaEm: string;
};

export type AdminEntrega = {
  id: string;
  documentoNumero: string;
  entregadorCodigo: string;
  entregadorNome: string;
  status: string;
  motivoPendencia: string | null;
  iniciadaEm: string;
  finalizadaEm: string | null;
  itens: AdminEntregaItem[];
  logsAlteracao: AdminLogAlteracao[];
};

export type AdminDocumentoDetalhe = {
  documentoNumero: string;
  documentoChave: string;
  clienteNome: string;
  qtdItens: number;
  status: string;
  consultadoEm: string;
  entregas: AdminEntrega[];
  logsAlteracao: AdminLogAlteracao[];
};
