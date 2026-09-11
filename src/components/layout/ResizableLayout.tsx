import React, { useState, useCallback, useRef } from 'react'

interface ResizablePanelProps {
  left: React.ReactNode
  center: React.ReactNode
  right: React.ReactNode
  leftWidth: number
  rightWidth: number
  onLeftResize: (width: number) => void
  onRightResize: (width: number) => void
  minLeft?: number
  maxLeft?: number
  minRight?: number
  maxRight?: number
}

export function ResizableLayout({
  left,
  center,
  right,
  leftWidth,
  rightWidth,
  onLeftResize,
  onRightResize,
  minLeft = 180,
  maxLeft = 400,
  minRight = 280,
  maxRight = 600
}: ResizablePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const handleLeftDrag = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const startX = e.clientX
      const startWidth = leftWidth

      const onMouseMove = (ev: MouseEvent) => {
        const delta = ev.clientX - startX
        const newWidth = Math.min(maxLeft, Math.max(minLeft, startWidth + delta))
        onLeftResize(newWidth)
      }

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    },
    [leftWidth, onLeftResize, minLeft, maxLeft]
  )

  const handleRightDrag = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const startX = e.clientX
      const startWidth = rightWidth

      const onMouseMove = (ev: MouseEvent) => {
        const delta = startX - ev.clientX
        const newWidth = Math.min(maxRight, Math.max(minRight, startWidth + delta))
        onRightResize(newWidth)
      }

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    },
    [rightWidth, onRightResize, minRight, maxRight]
  )

  return (
    <div ref={containerRef} className="flex flex-1 h-full overflow-hidden">
      {left && leftWidth > 0 && (
        <>
          <div className="shrink-0 h-full flex flex-col overflow-hidden" style={{ width: leftWidth }}>
            {left}
          </div>

          <div
            onMouseDown={handleLeftDrag}
            className="w-px shrink-0 bg-[var(--border-default)] hover:bg-[var(--accent-primary)] cursor-col-resize transition-colors"
          />
        </>
      )}

      <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">{center}</div>

      <div
        onMouseDown={handleRightDrag}
        className="w-px shrink-0 bg-[var(--border-default)] hover:bg-[var(--accent-primary)] cursor-col-resize transition-colors"
      />

      <div className="shrink-0 h-full flex flex-col overflow-hidden" style={{ width: rightWidth }}>
        {right}
      </div>
    </div>
  )
}
