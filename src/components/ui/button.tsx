import { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
  isLoading?: boolean;
};

export function Button({ variant = 'primary', isLoading, children, disabled, className = '', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  const variants = {
    primary: 'bg-gray-900 text-white hover:bg-gray-700 focus-visible:ring-gray-900',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-400',
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={disabled || isLoading} {...props}>
      {isLoading ? <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : null}
      {children}
    </button>
  );
}
