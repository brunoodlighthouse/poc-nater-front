import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export function Modal({ children }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/50 p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-[2rem] bg-white p-8 shadow-2xl">
        {children}
      </div>
    </div>
  );
}
