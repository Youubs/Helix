import React, { useState, useEffect } from 'react'
import { Minus, Square, X, Copy } from 'lucide-react'
import { usePlatform } from '@/hooks/usePlatform'

export function Titlebar() {
  const { isMac } = usePlatform()
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    const check = async () => {
      const result = await window.windowAPI.isMaximized()
      setMaximized(result)
    }
    check()
  }, [])

  const handleMinimize = () => window.windowAPI.minimize()
  const handleMaximize = async () => {
    await window.windowAPI.maximize()
    setMaximized(!maximized)
  }
  const handleClose = () => window.windowAPI.close()

  return (
    <div className="titlebar-drag h-8 flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-surface)] select-none shrink-0">
      {isMac ? (
        <div className="w-20" />
      ) : (
        <div className="px-3 text-xs font-medium text-[var(--text-secondary)]">
          Helix
        </div>
      )}

      <div className="flex-1" />

      {!isMac && (
        <div className="titlebar-no-drag flex h-full">
          <button
            onClick={handleMinimize}
            className="h-full px-3 hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-tertiary)]"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={handleMaximize}
            className="h-full px-3 hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-tertiary)]"
          >
            {maximized ? <Copy size={12} /> : <Square size={12} />}
          </button>
          <button
            onClick={handleClose}
            className="h-full px-3 hover:bg-[var(--color-danger)] transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-inverse)]"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
