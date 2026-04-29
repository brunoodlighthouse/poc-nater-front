type Props = {
  onClick: () => void;
  label?: string;
};

export function BackButton({ onClick, label = 'Voltar' }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-surface-100 px-4 py-2 text-base font-semibold text-surface-900 active:bg-surface-200"
      aria-label={label}
    >
      {label}
    </button>
  );
}
