import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  GitBranch,
  FolderOpen,
  GitPullRequest,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Archive,
  Tag,
  RotateCcw
} from 'lucide-react'
import { useUiStore } from '@/stores/uiStore'
import { useGit } from '@/hooks/useGit'
import { getModifierKey } from '@/hooks/useKeyboard'

interface Command {
  id: string
  label: string
  icon: React.ReactNode
  action: () => void
  category: string
}

export function CommandPalette() {
  const open = useUiStore((s) => s.commandPaletteOpen)
  const setOpen = useUiStore((s) => s.setCommandPaletteOpen)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const git = useGit()

  const commands: Command[] = useMemo(
    () => [
      { id: 'open', label: 'Open Repository', icon: <FolderOpen size={14} />, action: () => git.openRepo(), category: 'Repository' },
      { id: 'fetch', label: 'Fetch All', icon: <RefreshCw size={14} />, action: () => git.fetchAll(), category: 'Remote' },
      { id: 'pull', label: 'Pull', icon: <ArrowDown size={14} />, action: () => git.pull(), category: 'Remote' },
      { id: 'push', label: 'Push', icon: <ArrowUp size={14} />, action: () => git.push(), category: 'Remote' },
      { id: 'stash', label: 'Stash Changes', icon: <Archive size={14} />, action: () => git.stashPush(), category: 'Stash' },
      { id: 'stash-pop', label: 'Pop Stash', icon: <Archive size={14} />, action: () => git.stashPop(), category: 'Stash' },
      { id: 'view-graph', label: 'Show Commit Graph', icon: <GitBranch size={14} />, action: () => useUiStore.getState().setActiveView('graph'), category: 'View' },
      { id: 'view-wt', label: 'Show Working Tree', icon: <GitPullRequest size={14} />, action: () => useUiStore.getState().setActiveView('working-tree'), category: 'View' },
    ],
    [git]
  )

  const filtered = useMemo(() => {
    if (!query) return commands
    const q = query.toLowerCase()
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    )
  }, [commands, query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  if (!open) return null

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      const cmd = filtered[selectedIndex]
      if (cmd) {
        cmd.action()
        setOpen(false)
      }
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-50"
        onClick={() => setOpen(false)}
      />
      <div className="fixed top-[15%] left-1/2 -translate-x-1/2 z-50 w-full max-w-md">
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-2xl overflow-hidden">
          <div className="px-3 py-2 border-b border-[var(--border-default)]">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Type a command... (${getModifierKey()}+P)`}
              className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none"
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-[var(--text-tertiary)]">
                No commands found
              </div>
            ) : (
              filtered.map((cmd, i) => (
                <button
                  key={cmd.id}
                  onClick={() => { cmd.action(); setOpen(false) }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-sm ${
                    i === selectedIndex
                      ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]'
                      : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <span className="text-[var(--text-tertiary)]">{cmd.icon}</span>
                  <span className="flex-1 text-left">{cmd.label}</span>
                  <span className="text-[10px] text-[var(--text-tertiary)]">{cmd.category}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}
