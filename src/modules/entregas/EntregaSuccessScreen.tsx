import { useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/Button';
import { vibrateSuccess } from '@/hooks/useVibrate';
import type { FinalizarEntregaResponse } from './entrega.types';

type Props = {
  result: FinalizarEntregaResponse;
  onBackToQueue: () => void;
  onOpenDetail: () => void;
};

export function EntregaSuccessScreen({ result, onBackToQueue, onOpenDetail }: Props) {
  const isTotal = result.status === 'finalizada_total';

  useEffect(() => {
    vibrateSuccess();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 p-6">
      <main className="w-full max-w-xl rounded-[2rem] bg-white p-8 text-center shadow-sm">
        {/* Animated checkmark */}
        <div
          className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full ${
            isTotal ? 'bg-success-500' : 'bg-warning-500'
          }`}
          style={{ animation: 'checkmark-scale 0.5s ease-out forwards' }}
        >
          {isTotal ? (
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path
                d="M12 24L20 32L36 16"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="48"
                strokeDashoffset="0"
                style={{ animation: 'checkmark-draw 0.6s ease-out 0.3s both' }}
              />
            </svg>
          ) : (
            <span className="text-4xl text-white font-bold">!</span>
          )}
        </div>

        <h1 className="mt-6 text-[32px] font-bold leading-tight text-surface-900">
          {isTotal ? 'Entrega concluida' : 'Entrega parcial registrada'}
        </h1>
        <p className="mt-3 text-lg text-surface-900/60">Documento {result.documento}</p>
        <p className="mt-2 text-base text-surface-900/55">
          Finalizado em{' '}
          {format(new Date(result.finalizadaEm), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
        </p>

        {!isTotal && result.motivoPendencia && (
          <p className="mt-4 rounded-2xl bg-warning-400/15 px-4 py-3 text-sm font-semibold text-warning-700">
            {result.motivoPendencia === 'retirada_futura'
              ? 'Saldo reservado para retirada futura.'
              : 'Saldo mantido para nova entrega futura.'}
          </p>
        )}

        <div className="mt-8 space-y-3">
          <Button variant="primary" size="xl" fullWidth onClick={onBackToQueue}>
            NOVA CONSULTA
          </Button>
          <Button variant="secondary" size="lg" fullWidth onClick={onOpenDetail}>
            VER DETALHE DO DOCUMENTO
          </Button>
        </div>
      </main>
    </div>
  );
}
