import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-brand)] disabled:pointer-events-none disabled:opacity-50'

  const variants = {
    default: 'bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] rounded-[var(--radius-md)]',
    primary: 'bg-[var(--accent-primary)] text-[var(--text-inverse)] hover:bg-[var(--accent-primary-hover)] font-semibold rounded-[var(--radius-md)]',
    danger: 'bg-[var(--color-danger)] text-[var(--text-inverse)] hover:brightness-90 rounded-[var(--radius-md)]',
    ghost: 'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] rounded-[var(--radius-md)]'
  }

  const sizes = {
    sm: 'h-7 px-2 text-xs gap-1',
    md: 'h-8 px-3 text-sm gap-2',
    lg: 'h-10 px-4 text-base gap-2'
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
