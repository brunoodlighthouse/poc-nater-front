import { useState } from 'react';
import { Button } from '@/components/Button';

type Formato = 'qrcode' | 'barcode' | 'numero';

type Props = {
  loading: boolean;
  onClose: () => void;
  onSubmit: (input: { codigoLido: string; formato: Formato }) => void;
};

type Mode = 'camera' | 'numero';

const modeLabel: Record<Mode, string> = {
  camera: '📷  Câmera',
  numero: '#  Número da NF',
};

export function NovaConsultaPanel({ loading, onClose, onSubmit }: Props) {
  const [mode, setMode] = useState<Mode>('camera');
  const [numeroNf, setNumeroNf] = useState('');

  // Dev-only: simula o valor que o scanner de câmera produziria
  const codigoLido =
    'https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx?p=35240114200166000187550010000001231234567890|2|1|1';
  const [formato, setFormato] = useState<'qrcode' | 'barcode'>('qrcode');

  function handleConfirm() {
    if (mode === 'numero') {
      onSubmit({ codigoLido: numeroNf.trim(), formato: 'numero' });
    } else {
      onSubmit({ codigoLido, formato });
    }
  }

  const canConfirm = mode === 'camera' ? codigoLido.trim().length > 0 : numeroNf.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-surface-900/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-3xl rounded-[32px] bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 className="text-2xl font-bold text-surface-900">Nova consulta</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-surface-100 text-xl text-surface-900"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {/* Mode selector */}
        <div className="mb-6 flex gap-2 rounded-2xl bg-surface-100 p-1">
          {(['camera', 'numero'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 min-h-[52px] rounded-xl px-4 text-base font-semibold transition-colors duration-150 ${
                mode === m
                  ? 'bg-white text-surface-900 shadow-sm'
                  : 'text-surface-900/50 active:bg-white/50'
              }`}
            >
              {modeLabel[m]}
            </button>
          ))}
        </div>

        {/* Camera mode */}
        {mode === 'camera' && (
          <>
            <div className="mb-6 flex h-56 items-center justify-center rounded-3xl border-2 border-dashed border-surface-200 bg-surface-50">
              <p className="max-w-sm text-center text-lg text-surface-900/45">
                Aponte a câmera para o QR Code ou código de barras do documento.
              </p>
            </div>

            {import.meta.env.DEV && (
              <div className="mb-4 space-y-4 rounded-3xl bg-warning-400/10 p-5">
                <div className="flex flex-wrap gap-3">
                  {(['qrcode', 'barcode'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFormato(f)}
                      className={`min-h-[56px] rounded-2xl px-5 text-base font-semibold ${
                        formato === f ? 'bg-brand-500 text-white' : 'bg-white text-surface-900'
                      }`}
                    >
                      {f === 'qrcode' ? 'QR Code' : 'Código de barras'}
                    </button>
                  ))}
                </div>
                <textarea
                  value={codigoLido}
                  disabled
                  className="min-h-[120px] w-full rounded-2xl border border-surface-200 bg-surface-100 p-4 text-base text-surface-900/50 cursor-not-allowed"
                />
              </div>
            )}
          </>
        )}

        {/* Manual number mode */}
        {mode === 'numero' && (
          <div className="mb-6">
            <label className="mb-3 block text-base font-semibold text-surface-900/60">
              Número da nota fiscal
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={numeroNf}
              onChange={(e) => setNumeroNf(e.target.value.replace(/\D/g, ''))}
              placeholder="Ex: 123456"
              autoFocus
              className="min-h-[72px] w-full rounded-2xl border-2 border-surface-200 bg-white px-5 text-2xl font-semibold tracking-widest text-surface-900 placeholder:text-surface-900/25 focus:border-brand-500 focus:outline-none"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 md:flex-row">
          <Button variant="secondary" size="lg" fullWidth onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="xl"
            fullWidth
            loading={loading}
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            Confirmar Consulta
          </Button>
        </div>
      </div>
    </div>
  );
}
