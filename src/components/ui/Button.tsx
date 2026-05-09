import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'ai';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ReactNode;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', icon, loading, children, disabled, ...props }, ref) => {
    const variants: Record<ButtonVariant, string> = {
      primary: 'gradient-cta text-white shadow-lg shadow-brand-500/20',
      secondary:
        'surface-card text-[color:var(--text)] hover:border-brand-500/45 hover:bg-[color:var(--card-2)]',
      ghost: 'text-[color:var(--muted)] hover:bg-white/8 hover:text-[color:var(--text)]',
      danger: 'bg-red-500 text-white hover:bg-red-400 shadow-lg shadow-red-500/20',
      ai: 'ai-pill text-white',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex min-h-11 items-center justify-center gap-2 rounded-sm px-4 py-2 text-sm font-semibold transition-all duration-200 ease-expo focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-[color:var(--surface)] disabled:pointer-events-none disabled:opacity-55',
          variants[variant],
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <span className="spinner" /> : icon}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
