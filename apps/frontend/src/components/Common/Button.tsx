'use client';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  isLoading = false,
  disabled,
  className,
  ...props 
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 font-semibold tracking-wide transition duration-200 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 hover:-translate-y-0.5';

  const variantClasses = {
    primary: 'border-cyan-400/50 bg-cyan-400 text-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.18)] hover:bg-cyan-300',
    secondary: 'border-slate-300/70 bg-slate-100 text-slate-800 hover:border-cyan-400/60 hover:bg-cyan-50',
    danger: 'border-rose-400/50 bg-rose-500 text-white shadow-[0_0_18px_rgba(244,63,94,0.16)] hover:bg-rose-400',
  };

  return (
    <button
      className={[baseClasses, variantClasses[variant], className].filter(Boolean).join(' ')}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? 'Memuat...' : children}
    </button>
  );
}
