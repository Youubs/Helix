import React, { useRef, useEffect } from 'react'
import type { RowData } from '@/utils/graphLayout'
import { getLaneX, LANE_WIDTH, LANE_OFFSET } from '@/utils/graphLayout'

interface CanvasCommitGraphProps {
  rows: RowData[]
  width: number
  height: number
  rowHeight: number
  selectedHash: string | null
  onSelect: (hash: string) => void
}

export function CanvasCommitGraph({
  rows,
  width,
  height,
  rowHeight,
  selectedHash,
  onSelect
}: CanvasCommitGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, width, height)

    // Render segments and nodes
    rows.forEach((row, idx) => {
      const y = idx * rowHeight
      const centerY = y + rowHeight / 2

      // Draw segments
      row.segments.forEach((seg) => {
        const x1 = getLaneX(seg.fromLane, width, row.maxLane + 1)
        const x2 = getLaneX(seg.toLane, width, row.maxLane + 1)
        const y1 = y + seg.fromY
        const y2 = y + seg.toY

        ctx.beginPath()
        ctx.strokeStyle = seg.color || '#58a6ff'
        ctx.lineWidth = 2
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      })

      // Draw node circle
      const nodeX = getLaneX(row.nodeLane, width, row.maxLane + 1)
      ctx.beginPath()
      ctx.arc(nodeX, centerY, 5, 0, Math.PI * 2)
      ctx.fillStyle = row.nodeColor || '#58a6ff'
      ctx.fill()
      ctx.strokeStyle = '#121316'
      ctx.lineWidth = 1.5
      ctx.stroke()
    })
  }, [rows, width, height, rowHeight, selectedHash])

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="pointer-events-auto cursor-pointer"
    />
  )
}
