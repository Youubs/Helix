import React from 'react'
import * as ContextMenuPrimitive from '@radix-ui/react-context-menu'

interface ContextMenuProps {
  children: React.ReactNode
  items: ContextMenuItem[]
}

interface ContextMenuItem {
  label: string
  action: () => void
  variant?: 'default' | 'danger'
  disabled?: boolean
  separator?: boolean
}

export function ContextMenu({ children, items }: ContextMenuProps) {
  return (
    <ContextMenuPrimitive.Root>
      <ContextMenuPrimitive.Trigger asChild>{children}</ContextMenuPrimitive.Trigger>
      <ContextMenuPrimitive.Portal>
        <ContextMenuPrimitive.Content className="min-w-[180px] overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-1 shadow-[var(--shadow-md)] z-50">
          {items.map((item, i) =>
            item.separator ? (
              <ContextMenuPrimitive.Separator
                key={i}
                className="h-px my-1 bg-[var(--border-subtle)]"
              />
            ) : (
              <ContextMenuPrimitive.Item
                key={i}
                disabled={item.disabled}
                onSelect={item.action}
                className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors
                  ${item.variant === 'danger' ? 'text-[var(--color-danger)] focus:bg-[var(--color-danger-muted)]' : 'text-[var(--text-primary)] focus:bg-[var(--bg-hover)]'}
                  ${item.disabled ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {item.label}
              </ContextMenuPrimitive.Item>
            )
          )}
        </ContextMenuPrimitive.Content>
      </ContextMenuPrimitive.Portal>
    </ContextMenuPrimitive.Root>
  )
}
