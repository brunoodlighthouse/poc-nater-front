export function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

export function vibrateSuccess(): void {
  vibrate(100);
}

export function vibrateError(): void {
  vibrate([50, 30, 50, 30, 50]);
}
