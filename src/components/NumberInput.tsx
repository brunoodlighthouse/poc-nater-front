import { useCallback, useEffect, useRef } from 'react';

type Props = {
  value: number;
  min?: number;
  max: number;
  step?: number;
  unit?: string;
  label?: string;
  showDeliverAll?: boolean;
  onChange: (value: number) => void;
};

export function NumberInput({
  value,
  min = 0,
  max,
  step = 1,
  unit,
  label,
  showDeliverAll = true,
  onChange,
}: Props) {
  const isAtMin = value <= min;
  const isAtMax = value >= max;
  const isAllDelivered = value === max;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return clearTimers;
  }, [clearTimers]);

  function clamp(v: number): number {
    const rounded = Math.round(v * 1000) / 1000;
    return Math.max(min, Math.min(max, rounded));
  }

  function handleDecrement() {
    onChange(clamp(value - step));
  }

  function handleIncrement() {
    onChange(clamp(value + step));
  }

  function startHold(direction: 'increment' | 'decrement') {
    const bigStep = step * 5;
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        const current = valueRef.current;
        const next = direction === 'increment' ? current + bigStep : current - bigStep;
        onChange(clamp(next));
      }, 150);
    }, 600);
  }

  function handlePointerDown(direction: 'increment' | 'decrement') {
    if (direction === 'increment') handleIncrement();
    else handleDecrement();
    startHold(direction);
  }

  function handleToggleAll() {
    onChange(isAllDelivered ? 0 : max);
  }

  return (
    <div className="space-y-3">
      {label && (
        <p className="text-xs uppercase tracking-[0.12em] text-surface-900/45">{label}</p>
      )}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          disabled={isAtMin}
          onPointerDown={() => handlePointerDown('decrement')}
          onPointerUp={clearTimers}
          onPointerLeave={clearTimers}
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-200 text-2xl font-bold text-surface-900 select-none disabled:opacity-30 disabled:cursor-not-allowed active:bg-surface-200/70"
          aria-label="Diminuir quantidade"
        >
          −
        </button>
        <div className="min-w-[100px] rounded-2xl bg-white px-4 py-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-brand-500">{value}</p>
          {unit && (
            <p className="text-xs uppercase tracking-[0.12em] text-surface-900/45">{unit}</p>
          )}
        </div>
        <button
          type="button"
          disabled={isAtMax}
          onPointerDown={() => handlePointerDown('increment')}
          onPointerUp={clearTimers}
          onPointerLeave={clearTimers}
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-2xl font-bold text-white select-none disabled:opacity-30 disabled:cursor-not-allowed active:bg-brand-500/80"
          aria-label="Aumentar quantidade"
        >
          +
        </button>
      </div>
      {showDeliverAll && (
        <label className="flex min-h-[44px] cursor-pointer items-center justify-center gap-2">
          <input
            type="checkbox"
            checked={isAllDelivered}
            onChange={handleToggleAll}
            className="h-5 w-5 accent-brand-500"
          />
          <span className="text-base font-semibold text-surface-900/70">Entregar tudo</span>
        </label>
      )}
    </div>
  );
}
