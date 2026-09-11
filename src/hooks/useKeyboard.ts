import { useEffect, useMemo } from 'react'
import { useUiStore } from '@/stores/uiStore'
import { useGitStore } from '@/stores/gitStore'

interface Shortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  action: () => void
}

export function useKeyboard(shortcuts: Shortcut[]) {
  const isMac = navigator.platform.toLowerCase().includes('mac')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      for (const s of shortcuts) {
        const ctrlMatch = s.ctrl
          ? isMac
            ? e.metaKey
            : e.ctrlKey
          : true
        const shiftMatch = s.shift ? e.shiftKey : !e.shiftKey
        const altMatch = s.alt ? e.altKey : !e.altKey
        const keyMatch = e.key.toLowerCase() === s.key.toLowerCase()

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          e.preventDefault()
          s.action()
          return
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [shortcuts, isMac])
}

export function useGlobalShortcuts() {
  const toggleCommandPalette = useUiStore((s) => s.toggleCommandPalette)

  const shortcuts = useMemo(() => [
    { key: 'p', ctrl: true, action: toggleCommandPalette },
    { key: 'k', ctrl: true, action: toggleCommandPalette },
    { key: 'r', ctrl: true, action: () => { useGitStore.getState().refresh() } },
    { key: 'F5', action: () => { useGitStore.getState().refresh() } }
  ], [toggleCommandPalette])

  useKeyboard(shortcuts)
}

export function getModifierKey(): string {
  return navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'
}
