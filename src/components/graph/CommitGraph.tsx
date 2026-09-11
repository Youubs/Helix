import React, { useRef, useState, useEffect, useCallback, useMemo, useDeferredValue } from 'react'
import { Settings2 } from 'lucide-react'
import { useGitStore } from '@/stores/gitStore'
import { useUiStore } from '@/stores/uiStore'
import { useGit } from '@/hooks/useGit'
import { useGraph } from '@/hooks/useGraph'
import {
  ROW_HEIGHT,
  NODE_RADIUS,
  NODE_RADIUS_HEAD,
  EDGE_WIDTH,
  EDGE_OPACITY,
  RowData,
  Segment,
  getMaxConcurrentLanes,
  computeGraphColWidth,
  getLaneX,
  getRowHeight
} from '@/utils/graphLayout'
import { BranchLabel } from '@/components/graph/BranchLabel'
import { mergeRefs } from '@/utils/branchMerger'
import type { BranchInfo, RemoteInfo } from '@/shared/types'

const OVERSCAN = 8
const HEADER_HEIGHT = 26
const COL_GEAR = 24
const MIN_MESSAGE_WIDTH = 240

import { filterCommits } from '@/utils/searchParser'

export function CommitGraph() {
  const commits = useGitStore((s) => s.commits)
  const branches = useGitStore((s) => s.branches)
  const remotes = useGitStore((s) => s.remotes)
  const loading = useGitStore((s) => s.loading)
  const error = useGitStore((s) => s.error)
  const status = useGitStore((s) => s.status)
  const searchQuery = useUiStore((s) => s.searchQuery)
  const selectedHash = useUiStore((s) => s.selectedCommitHash)
  const setSelectedCommit = useUiStore((s) => s.setSelectedCommit)
  const colBranchWidth = useUiStore((s) => s.colBranchWidth)
  const colAuthorWidth = useUiStore((s) => s.colAuthorWidth)
  const colDateWidth = useUiStore((s) => s.colDateWidth)
  const colShaWidth = useUiStore((s) => s.colShaWidth)
  const setColBranchWidth = useUiStore((s) => s.setColBranchWidth)
  const setColAuthorWidth = useUiStore((s) => s.setColAuthorWidth)
  const setColDateWidth = useUiStore((s) => s.setColDateWidth)
  const setColShaWidth = useUiStore((s) => s.setColShaWidth)
  const { checkout } = useGit()

  const filteredCommits = useMemo(
    () => filterCommits(commits, searchQuery),
    [commits, searchQuery]
  )

  const uncommittedCount =
    (status?.staged.length || 0) + (status?.unstaged.length || 0) + (status?.untracked.length || 0)

  const rows = useGraph(filteredCommits, uncommittedCount)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewHeight, setViewHeight] = useState(0)

  const remoteNames = useMemo(
    () => remotes.map((r) => r.name),
    [remotes]
  )

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (el.clientHeight > 0) setViewHeight(el.clientHeight)
    const obs = new ResizeObserver((entries) => {
      if (entries[0]?.contentRect?.height) {
        setViewHeight(entries[0].contentRect.height)
      }
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  const totalHeight = rows.length * ROW_HEIGHT

  const startRow = useMemo(() => {
    return Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN)
  }, [scrollTop])

  const endRow = useMemo(() => {
    const effectiveHeight = viewHeight > 0 ? viewHeight : 800
    const visibleCount = Math.ceil(effectiveHeight / ROW_HEIGHT) + OVERSCAN * 2
    return Math.min(rows.length, startRow + visibleCount)
  }, [viewHeight, startRow, rows.length])

  const visible = rows.slice(startRow, endRow)

  // Stable graph column width based on overall repository lanes
  const totalMaxLanes = useMemo(
    () => getMaxConcurrentLanes(rows),
    [rows]
  )
  const graphWidth = computeGraphColWidth(totalMaxLanes)

  const cols = useMemo(() => ({
    branch: colBranchWidth,
    graph: graphWidth,
    graphLanes: totalMaxLanes,
    author: colAuthorWidth,
    date: colDateWidth,
    sha: colShaWidth
  }), [colBranchWidth, graphWidth, totalMaxLanes, colAuthorWidth, colDateWidth, colShaWidth])

  const handleSelect = useCallback((hash: string) => {
    setSelectedCommit(hash)
  }, [setSelectedCommit])

  if (rows.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-[var(--text-tertiary)] p-4">
        {loading ? (
          'Loading commits...'
        ) : error ? (
          <span className="text-[var(--diff-del-text)]">Error loading repository: {error}</span>
        ) : (
          'No commits found in this repository'
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[var(--bg-app)]">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto"
      >
        {/* Inner wrapper sized to full table width so columns line up */}
        <div style={{ minWidth: '100%', width: 'max-content' }}>
          <ColumnHeader
            cols={cols}
            setColBranchWidth={setColBranchWidth}
            setColAuthorWidth={setColAuthorWidth}
            setColDateWidth={setColDateWidth}
            setColShaWidth={setColShaWidth}
          />
          <div style={{ height: totalHeight, position: 'relative' }}>
            {visible.map((row, i) => {
              const rowIdx = startRow + i
              return (
                <CommitRowView
                  key={row.hash}
                  row={row}
                  top={rowIdx * ROW_HEIGHT}
                  height={ROW_HEIGHT}
                  cols={cols}
                  branches={branches}
                  remoteNames={remoteNames}
                  selected={row.hash === selectedHash}
                  onSelect={handleSelect}
                  onCheckout={checkout}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

type Cols = {
  branch: number
  graph: number
  graphLanes: number
  author: number
  date: number
  sha: number
}

function ColumnHeader({
  cols,
  setColBranchWidth,
  setColAuthorWidth,
  setColDateWidth,
  setColShaWidth
}: {
  cols: Cols
  setColBranchWidth: (w: number) => void
  setColAuthorWidth: (w: number) => void
  setColDateWidth: (w: number) => void
  setColShaWidth: (w: number) => void
}) {
  return (
    <div
      className="sticky top-0 z-10 flex items-stretch text-[10px] font-semibold tracking-[0.07em] uppercase text-[var(--text-tertiary)] bg-[var(--bg-header)] border-b border-[var(--border-default)] select-none"
      style={{ height: HEADER_HEIGHT }}
    >
      <HeaderCell width={cols.branch} label="Branch / Tag" />
      <Resizer current={cols.branch} onChange={setColBranchWidth} />
      <HeaderCell width={cols.graph} label="Graph" />
      <div className="w-px bg-[var(--border-default)]" />
      <HeaderCell label="Commit Message" grow />
      <Resizer current={cols.author} onChange={setColAuthorWidth} reverse />
      <HeaderCell width={cols.author} label="Author" />
      <Resizer current={cols.date} onChange={setColDateWidth} reverse />
      <HeaderCell width={cols.date} label="Commit Date / Time" />
      <Resizer current={cols.sha} onChange={setColShaWidth} reverse />
      <HeaderCell width={cols.sha} label="SHA" />
      <div
        className="h-full flex items-center justify-center border-l border-[var(--border-default)] text-[var(--text-tertiary)]"
        style={{ width: COL_GEAR }}
      >
        <Settings2 size={12} />
      </div>
    </div>
  )
}

function HeaderCell({
  width,
  label,
  grow = false
}: {
  width?: number
  label: string
  grow?: boolean
}) {
  return (
    <div
      className="h-full flex items-center px-3"
      style={grow ? { flex: 1, minWidth: MIN_MESSAGE_WIDTH } : { width, minWidth: width, transition: 'width 200ms ease' }}
    >
      {label}
    </div>
  )
}

/**
 * Vertical resizer handle. `reverse=true` means dragging right SHRINKS the
 * column to the right (used for right-side fixed columns).
 */
function Resizer({
  current,
  onChange,
  reverse = false
}: {
  current: number
  onChange: (w: number) => void
  reverse?: boolean
}) {
  const startRef = useRef<{ x: number; w: number } | null>(null)

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    startRef.current = { x: e.clientX, w: current }

    const onMove = (ev: MouseEvent) => {
      if (!startRef.current) return
      const dx = ev.clientX - startRef.current.x
      const next = reverse ? startRef.current.w - dx : startRef.current.w + dx
      onChange(next)
    }
    const onUp = () => {
      startRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div
      onMouseDown={onMouseDown}
      className="w-1 cursor-col-resize bg-[var(--border-default)] hover:bg-[var(--accent-primary)] transition-colors shrink-0"
      title="Drag to resize"
    />
  )
}

const CommitRowView = React.memo(function CommitRowView({
  row,
  top,
  height,
  cols,
  branches,
  remoteNames,
  selected,
  onSelect,
  onCheckout
}: {
  row: RowData
  top: number
  height: number
  cols: Cols
  branches: BranchInfo[]
  remoteNames: string[]
  selected: boolean
  onSelect: (hash: string) => void
  onCheckout: (ref: string) => void
}) {
  const isWorkingTree = row.hash === 'WORKING_TREE'
  const isHead = row.refs.some((r) => r.type === 'head')
  const branchRefs = useMemo(
    () => mergeRefs(row.refs, row.nodeColor, branches, remoteNames),
    [row.refs, row.nodeColor, branches, remoteNames]
  )

  return (
    <div
      onClick={() => onSelect(row.hash)}
      className={`absolute left-0 right-0 flex items-stretch cursor-pointer border-b border-[var(--border-default)] ${
        selected
          ? 'bg-[var(--bg-selection)]'
          : isWorkingTree
            ? 'bg-[var(--color-warning)]/10 hover:bg-[var(--color-warning)]/20'
            : 'hover:bg-[var(--bg-hover)]'
      }`}
      style={{ height, top }}
    >
      {/* BRANCH / TAG column — horizontal single-line badges */}
      <div
        className="flex items-center px-2 overflow-hidden shrink-0"
        style={{ width: cols.branch, minWidth: cols.branch }}
      >
        {branchRefs.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-hidden shrink-0">
            {branchRefs.map((branch, i) => (
              <BranchLabel key={i} branch={branch} onCheckout={onCheckout} />
            ))}
          </div>
        )}
      </div>
      <div className="w-px shrink-0" />

      {/* GRAPH column — node + segments */}
      <div
        className="relative shrink-0 overflow-hidden"
        style={{ width: cols.graph, minWidth: cols.graph, transition: 'width 200ms ease' }}
      >
        {row.refs.length > 0 && (
          <svg
            className="absolute pointer-events-none"
            width={getLaneX(row.nodeLane, cols.graph, cols.graphLanes)}
            height={height}
            style={{ left: 0, top: 0 }}
          >
            <line
              x1={0}
              y1={height / 2}
              x2={getLaneX(row.nodeLane, cols.graph, cols.graphLanes) - NODE_RADIUS - 2}
              y2={height / 2}
              stroke={selected ? 'var(--bg-selection-text)' : 'var(--border-default)'}
              strokeWidth={1}
              strokeDasharray="2 2"
            />
          </svg>
        )}
        <svg
          width={cols.graph}
          height={height}
          className="overflow-visible"
        >
          {row.segments.map((seg, i) => (
            <SegmentPath key={i} seg={seg} colWidth={cols.graph} totalLanes={cols.graphLanes} rowHeight={height} />
          ))}
          <circle
            cx={getLaneX(row.nodeLane, cols.graph, cols.graphLanes)}
            cy={height / 2}
            r={NODE_RADIUS + 1.5}
            fill="var(--bg-app)"
            stroke="var(--bg-app)"
            strokeWidth={1.5}
          />
          <circle
            cx={getLaneX(row.nodeLane, cols.graph, cols.graphLanes)}
            cy={height / 2}
            r={isWorkingTree ? NODE_RADIUS_HEAD + 1 : isHead ? NODE_RADIUS_HEAD : NODE_RADIUS}
            fill={isWorkingTree ? 'var(--color-warning)' : row.nodeColor}
            stroke="var(--bg-app)"
            strokeWidth={1.5}
            strokeDasharray={isWorkingTree ? '2 2' : undefined}
          />
        </svg>
      </div>
      <div className="w-px bg-[var(--border-default)]/40" />

      {/* COMMIT MESSAGE column */}
      <div className="flex-1 flex items-center px-2" style={{ minWidth: MIN_MESSAGE_WIDTH }}>
        <span
          className={`truncate text-[12px] ${
            selected
              ? 'text-[var(--bg-selection-text)] font-semibold'
              : isWorkingTree
                ? 'text-[var(--color-warning)] font-semibold'
                : 'text-[var(--text-primary)]'
          }`}
        >
          {row.message}
        </span>
      </div>

      {/* AUTHOR column */}
      <div
        className={`flex items-center px-2 truncate shrink-0 text-[11px] ${
          selected ? 'text-white font-semibold' : 'text-[var(--text-secondary)]'
        }`}
        style={{ width: cols.author, minWidth: cols.author }}
      >
        <span className="truncate">{row.authorName}</span>
      </div>

      {/* DATE column */}
      <div
        className={`flex items-center px-2 font-mono text-[11px] shrink-0 tabular-nums ${
          selected ? 'text-[var(--bg-selection-text)]/90' : 'text-[var(--text-secondary)]'
        }`}
        style={{ width: cols.date, minWidth: cols.date }}
      >
        {isWorkingTree ? 'Now' : formatDateTime(row.authorDate)}
      </div>

      {/* SHA column */}
      <div
        className={`flex items-center px-2 font-mono text-[11px] shrink-0 tracking-wide ${
          selected ? 'text-[var(--bg-selection-text)]/80' : 'text-[var(--text-tertiary)]'
        }`}
        style={{ width: cols.sha, minWidth: cols.sha }}
      >
        {row.abbreviatedHash}
      </div>

      <div className="shrink-0" style={{ width: COL_GEAR }} />
    </div>
  )
})

const SegmentPath = React.memo(function SegmentPath({ seg, colWidth, totalLanes, rowHeight }: { seg: Segment; colWidth: number; totalLanes: number; rowHeight: number }) {
  const x1 = getLaneX(seg.fromLane, colWidth, totalLanes)
  const x2 = getLaneX(seg.toLane, colWidth, totalLanes)
  const y1 = (seg.fromY / ROW_HEIGHT) * rowHeight
  const y2 = (seg.toY / ROW_HEIGHT) * rowHeight

  let d: string
  if (x1 === x2) {
    d = `M ${x1} ${y1} L ${x2} ${y2}`
  } else {
    const midY = (y1 + y2) / 2
    d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`
  }

  return (
    <path
      d={d}
      stroke={seg.color}
      strokeWidth={EDGE_WIDTH}
      fill="none"
      strokeLinecap="round"
      opacity={EDGE_OPACITY}
    />
  )
})

function formatDateTime(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} @ ${hours}:${minutes}`
}
