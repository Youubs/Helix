import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  color?: string
  variant?: 'solid' | 'outline'
}

export function Badge({ children, color = 'var(--accent-primary)', variant = 'solid' }: BadgeProps) {
  if (variant === 'outline') {
    return (
      <span
        className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-[var(--radius-sm)] border"
        style={{ borderColor: color, color }}
      >
        {children}
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded-[var(--radius-sm)]"
      style={{ backgroundColor: color + '22', color }}
    >
      {children}
    </span>
  )
}
