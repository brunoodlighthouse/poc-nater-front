type Props = {
  message?: string;
};

export function Loading({ message = 'Carregando...' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      <p className="text-lg text-surface-900/60">{message}</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="min-h-[120px] animate-pulse rounded-3xl border border-surface-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="h-5 w-1/3 rounded bg-surface-200" />
          <div className="h-5 w-2/3 rounded bg-surface-200" />
          <div className="h-4 w-1/4 rounded bg-surface-200" />
        </div>
        <div className="h-7 w-20 rounded-full bg-surface-200" />
      </div>
      <div className="mt-5 h-3 w-1/4 rounded bg-surface-200" />
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
