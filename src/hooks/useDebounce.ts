import { useRef, useCallback } from 'react';

export function useDebouncedCallback<T extends (...args: never[]) => void>(
  callback: T,
  delayMs = 500,
): T {
  const lastCallRef = useRef(0);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCallRef.current < delayMs) return;
      lastCallRef.current = now;
      callback(...args);
    },
    [callback, delayMs],
  ) as T;
}
