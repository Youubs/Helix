import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      className={`flex h-8 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-1 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus-visible:outline-none focus-visible:border-[var(--accent-primary)] focus-visible:shadow-[0_0_0_2px_var(--accent-primary-muted)] ${className}`}
      {...props}
    />
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function Textarea({ className = '', ...props }: TextareaProps) {
  return (
    <textarea
      className={`flex w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus-visible:outline-none focus-visible:border-[var(--accent-primary)] focus-visible:shadow-[0_0_0_2px_var(--accent-primary-muted)] resize-none ${className}`}
      {...props}
    />
  )
}
