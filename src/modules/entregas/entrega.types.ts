export type EntregaPendenciaMotivo = 'retirada_futura' | 'entrega_futura';

export type EntregadorOption = {
  codigo: string;
  nome: string;
  ativo?: boolean;
};

export type EntregaItemDetalhe = {
  id: string;
  codigoProduto: string;
  descricao: string;
  unidade: string;
  qtdTotal: number;
  qtdJaEntregue: number;
  qtdPendente: number;
};

export type EntregaHistorico = {
  id: string;
  status: 'em_andamento' | 'finalizada_total' | 'finalizada_parcial' | 'cancelada';
  entregadorCodigo: string;
  entregadorNome: string;
  motivoPendencia: EntregaPendenciaMotivo | null;
  iniciadaEm: string;
  finalizadaEm: string | null;
  itens: Array<{
    itemIdProtheus: string;
    descricao: string;
    unidade: string;
    qtdTotal: number;
    qtdEntregue: number;
  }>;
};

export type EntregaAtiva = {
  id: string;
  documento: string;
  modo: 'entrega' | 'reentrega';
  iniciadaEm: string;
  entregador: {
    codigo: string;
    nome: string;
  };
  itens: Array<{
    itemIdProtheus: string;
    descricao: string;
    unidade: string;
    qtdTotal: number;
    qtdEntregue: number;
  }>;
};

export type EntregaDetalhe = {
  documento: {
    numero: string;
    tipo: 'NFE' | 'NFCE';
    chaveAcesso: string;
    cliente: {
      codigo: string;
      nome: string;
      documento: string;
    };
    statusAtual: 'pendente' | 'parcial' | 'finalizado' | 'cancelado';
    consultadoEm: string;
  };
  modo: 'entrega' | 'reentrega';
  itens: EntregaItemDetalhe[];
  entregaEmAndamento: EntregaAtiva | null;
  historico: EntregaHistorico[];
};

export type FinalizarEntregaResponse = {
  entregaId: string;
  documento: string;
  status: 'finalizada_total' | 'finalizada_parcial';
  motivoPendencia: EntregaPendenciaMotivo | null;
  filaStatus: 'parcial' | 'finalizado';
  finalizadaEm: string;
  itens: Array<{
    itemIdProtheus: string;
    descricao: string;
    unidade: string;
    qtdTotal: number;
    qtdEntregue: number;
  }>;
};
