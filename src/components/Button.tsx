import type { ReactNode, ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
type ButtonSize = 'lg' | 'xl';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
  children: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand-500 text-white active:bg-brand-500/80',
  secondary: 'bg-surface-200 text-surface-900 active:bg-surface-200/80',
  danger: 'bg-danger-500 text-white active:bg-danger-600',
  success: 'bg-success-500 text-white active:bg-success-600',
  warning: 'bg-warning-500 text-white active:bg-warning-600',
};

const sizeClasses: Record<ButtonSize, string> = {
  lg: 'min-h-[56px] px-6 text-lg',
  xl: 'min-h-[80px] px-8 text-xl font-semibold',
};

export function Button({
  variant = 'primary',
  size = 'lg',
  loading = false,
  icon,
  fullWidth = false,
  children,
  disabled,
  ...rest
}: Props) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl
        font-semibold transition-colors duration-150 select-none
        min-w-[200px]
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
      `}
      {...rest}
    >
      {loading ? (
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
      ) : (
        icon
      )}
      {loading ? 'Aguarde...' : children}
    </button>
  );
}
