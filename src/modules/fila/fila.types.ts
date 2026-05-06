export type FilaDocumento = {
  id: string;
  documentoNumero: string;
  documentoChave: string;
  clienteNome: string;
  qtdItens: number;
  status: 'pendente' | 'em_andamento' | 'parcial' | 'finalizado' | 'cancelado';
  consultadoEm: string;
  tipoDocumento: 'NFE' | 'NFCE';
  qtdItensEntregues: number;
};

export type DocumentoConsultado = {
  documento: string;
  tipo: 'NFE' | 'NFCE';
  chaveAcesso: string;
  cliente: {
    codigo: string;
    nome: string;
    documento: string;
  };
  statusAtual: 'pendente' | 'parcial';
  itens: Array<{
    id: string;
    codigoProduto: string;
    descricao: string;
    qtdTotal: number;
    qtdEntregue: number;
    unidade: string;
  }>;
  consultadoEm: string;
};

export type NotaRecebida = {
  id: string;
  lojaCodigo: string;
  documentoNumero: string;
  chaveAcesso: string;
  clienteNome: string;
  clienteDocumento: string;
  tipoDocumento: 'NFE' | 'NFCE';
  qtdItens: number;
  valorTotal: number;
  status: 'pendente' | 'em_andamento' | 'parcial' | 'finalizado' | 'cancelado';
  recebidaEm: string;
};
