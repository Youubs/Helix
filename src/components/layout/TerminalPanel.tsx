import React, { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { Terminal as TerminalIcon, X, Trash2, RotateCw } from 'lucide-react'
import { useRepoStore } from '@/stores/repoStore'

interface TerminalPanelProps {
  onClose: () => void
}

export function TerminalPanel({ onClose }: TerminalPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const tabs = useRepoStore((s) => s.tabs)
  const activeTabId = useRepoStore((s) => s.activeTabId)
  const activeRepoPath = tabs.find((t) => t.id === activeTabId)?.path

  useEffect(() => {
    if (!containerRef.current) return

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 12,
      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
      theme: {
        background: '#121316',
        foreground: '#e1e4e8',
        cursor: '#58a6ff',
        selectionBackground: '#264f78',
        black: '#121316',
        red: '#ff7b72',
        green: '#3fb950',
        yellow: '#d29922',
        blue: '#58a6ff',
        magenta: '#bc8cff',
        cyan: '#39c5cf',
        white: '#b1bac4'
      }
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)

    term.open(containerRef.current)
    fitAddon.fit()

    termRef.current = term
    fitAddonRef.current = fitAddon

    // Handle user typing
    const onTermData = term.onData((data) => {
      window.terminalAPI.sendInput(data)
    })

    // Listen to incoming process output
    const cleanupOutput = window.terminalAPI.onData((data) => {
      term.write(data)
    })

    // Spawn terminal process in repo path
    window.terminalAPI.spawn(activeRepoPath || '')

    const handleResize = () => {
      try {
        fitAddon.fit()
      } catch (e) {
        // Ignore fit during unmount
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      onTermData.dispose()
      cleanupOutput()
      window.removeEventListener('resize', handleResize)
      term.dispose()
    }
  }, [activeRepoPath])

  const handleClear = () => {
    termRef.current?.clear()
  }

  const handleRestart = () => {
    termRef.current?.clear()
    window.terminalAPI.spawn(activeRepoPath || '')
  }

  return (
    <div className="h-48 flex flex-col bg-[#121316] border-t border-[var(--border-default)] select-none">
      {/* Header */}
      <div className="h-7 flex items-center justify-between px-3 bg-[var(--bg-header)] border-b border-[var(--border-default)] shrink-0">
        <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
          <TerminalIcon size={13} className="text-[var(--accent-primary)]" />
          <span>Integrated Terminal</span>
          {activeRepoPath && (
            <span className="text-[10px] text-[var(--text-tertiary)] font-mono truncate max-w-md">
              ({activeRepoPath})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleClear}
            className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            title="Clear terminal"
          >
            <Trash2 size={12} />
          </button>
          <button
            onClick={handleRestart}
            className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            title="Restart session"
          >
            <RotateCw size={12} />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            title="Close terminal"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Terminal View */}
      <div ref={containerRef} className="flex-1 p-2 overflow-hidden" />
    </div>
  )
}
