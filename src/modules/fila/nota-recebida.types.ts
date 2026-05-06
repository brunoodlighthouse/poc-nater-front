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
  recebidaEm: string;
};
