import { useEffect } from 'react';
import { Button } from './Button';
import { vibrateError } from '@/hooks/useVibrate';

type ErrorCode =
  | 'DOCUMENTO_INVALIDO'
  | 'DOCUMENTO_VENDA_FUTURA'
  | 'ENTREGA_JA_REALIZADA'
  | 'QTD_EXCEDE_TOTAL'
  | 'QTD_INVALIDA'
  | 'ENTREGA_JA_EM_ANDAMENTO'
  | 'DOCUMENTO_NAO_NA_FILA'
  | 'ENTREGADOR_NAO_ENCONTRADO'
  | 'ENTREGA_NAO_ENCONTRADA'
  | 'ENTREGA_SEM_PENDENCIAS'
  | 'NENHUM_ITEM_ENTREGUE'
  | 'PROTHEUS_INDISPONIVEL'
  | 'SESSAO_INVALIDA'
  | string;

type Props = {
  code: ErrorCode;
  message: string;
  onRetry?: () => void;
  onBack?: () => void;
};

type ErrorConfig = {
  icon: string;
  color: string;
  retryable: boolean;
};

const errorConfigs: Record<string, ErrorConfig> = {
  DOCUMENTO_INVALIDO: { icon: '❌', color: 'text-danger-500', retryable: true },
  DOCUMENTO_VENDA_FUTURA: { icon: '⚠️', color: 'text-warning-500', retryable: false },
  ENTREGA_JA_REALIZADA: { icon: '✓', color: 'text-info-500', retryable: false },
  QTD_EXCEDE_TOTAL: { icon: '⚠️', color: 'text-warning-500', retryable: false },
  QTD_INVALIDA: { icon: '⚠️', color: 'text-warning-500', retryable: false },
  ENTREGA_JA_EM_ANDAMENTO: { icon: '🔒', color: 'text-warning-500', retryable: false },
  DOCUMENTO_NAO_NA_FILA: { icon: '📋', color: 'text-warning-500', retryable: false },
  ENTREGADOR_NAO_ENCONTRADO: { icon: '🚶', color: 'text-warning-500', retryable: true },
  ENTREGA_NAO_ENCONTRADA: { icon: '📦', color: 'text-warning-500', retryable: true },
  ENTREGA_SEM_PENDENCIAS: { icon: '✓', color: 'text-success-500', retryable: false },
  NENHUM_ITEM_ENTREGUE: { icon: '⚠️', color: 'text-warning-500', retryable: false },
  PROTHEUS_INDISPONIVEL: { icon: '🔌', color: 'text-danger-500', retryable: true },
  SESSAO_INVALIDA: { icon: '🔑', color: 'text-danger-500', retryable: false },
};

const defaultConfig: ErrorConfig = { icon: '❌', color: 'text-danger-500', retryable: true };

export function MensagemErro({ code, message, onRetry, onBack }: Props) {
  const config = errorConfigs[code] ?? defaultConfig;

  useEffect(() => {
    vibrateError();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8 text-center animate-[shake_0.3s_ease-in-out]">
      <span className={`text-6xl ${config.color}`}>{config.icon}</span>
      <p className="text-xl font-semibold text-surface-900">{message}</p>
      <div className="flex gap-4">
        {config.retryable && onRetry && (
          <Button variant="primary" onClick={onRetry}>
            Tentar Novamente
          </Button>
        )}
        {onBack && (
          <Button variant="secondary" onClick={onBack}>
            Voltar
          </Button>
        )}
      </div>
    </div>
  );
}
