import React, { useState, useEffect, useMemo } from 'react'
import { X, ArrowLeft, FileCode, Columns, AlignJustify } from 'lucide-react'
import { useUiStore } from '@/stores/uiStore'
import { parseSingleFileDiff, parseDiff } from '@/utils/diffParser'
import type { DiffHunk, DiffLine } from '@/shared/types'

interface SplitCell {
  lineNumber?: number
  content: string
  type: 'remove' | 'add' | 'context'
}

interface SplitRow {
  left?: SplitCell
  right?: SplitCell
}

function buildSplitRows(lines: DiffLine[]): SplitRow[] {
  const rows: SplitRow[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (!line) {
      i++
      continue
    }

    if (line.type === 'context') {
      rows.push({
        left: { lineNumber: line.oldLineNumber, content: line.content || '', type: 'context' },
        right: { lineNumber: line.newLineNumber, content: line.content || '', type: 'context' }
      })
      i++
    } else {
      const removals: DiffLine[] = []
      const additions: DiffLine[] = []

      while (i < lines.length && lines[i] && (lines[i].type === 'remove' || lines[i].type === 'add')) {
        if (lines[i].type === 'remove') removals.push(lines[i])
        else additions.push(lines[i])
        i++
      }

      const count = Math.max(removals.length, additions.length)
      for (let j = 0; j < count; j++) {
        const rem = removals[j]
        const add = additions[j]
        rows.push({
          left: rem
            ? { lineNumber: rem.oldLineNumber, content: rem.content || '', type: 'remove' }
            : undefined,
          right: add
            ? { lineNumber: add.newLineNumber, content: add.content || '', type: 'add' }
            : undefined
        })
      }
    }
  }

  return rows
}

export function FullFileDiffView() {
  const selectedFileDiff = useUiStore((s) => s.selectedFileDiff)
  const setSelectedFileDiff = useUiStore((s) => s.setSelectedFileDiff)
  const [hunks, setHunks] = useState<DiffHunk[]>([])
  const [loading, setLoading] = useState(false)
  const [diffMode, setDiffMode] = useState<'split' | 'unified'>('split')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedFileDiff(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setSelectedFileDiff])

  useEffect(() => {
    if (!selectedFileDiff) {
      setHunks([])
      return
    }
    let isMounted = true
    setLoading(true)

    const { file, isStaged, commitHash } = selectedFileDiff

    if (commitHash && commitHash !== 'WORKING_TREE') {
      window.gitAPI
        .getDiffCommit(commitHash)
        .then((res) => {
          if (!isMounted) return
          if (res && res.ok && typeof res.data === 'string') {
            const files = parseDiff(res.data)
            const target = files.find(
              (f) => f.file === file || f.file.endsWith('/' + file) || f.file.endsWith('\\' + file)
            )
            setHunks(target?.hunks || [])
          } else {
            setHunks([])
          }
          setLoading(false)
        })
        .catch(() => {
          if (isMounted) {
            setHunks([])
            setLoading(false)
          }
        })
    } else {
      window.gitAPI
        .getDiff(file, !!isStaged)
        .then((res) => {
          if (!isMounted) return
          if (res && res.ok && typeof res.data === 'string') {
            setHunks(parseSingleFileDiff(res.data))
          } else {
            setHunks([])
          }
          setLoading(false)
        })
        .catch(() => {
          if (isMounted) {
            setHunks([])
            setLoading(false)
          }
        })
    }

    return () => {
      isMounted = false
    }
  }, [selectedFileDiff])

  const { totalAdditions, totalDeletions } = useMemo(() => {
    let add = 0
    let del = 0
    for (const hunk of hunks) {
      for (const line of hunk.lines || []) {
        if (line?.type === 'add') add++
        else if (line?.type === 'remove') del++
      }
    }
    return { totalAdditions: add, totalDeletions: del }
  }, [hunks])

  if (!selectedFileDiff) return null

  const fileName = selectedFileDiff.file.split(/[/\\]/).pop() || selectedFileDiff.file
  const dirPath =
    selectedFileDiff.file.includes('/') || selectedFileDiff.file.includes('\\')
      ? selectedFileDiff.file.slice(0, selectedFileDiff.file.length - fileName.length)
      : ''

  return (
    <div className="h-full flex flex-col bg-[var(--bg-app)]">
      {/* Header bar */}
      <div className="h-9 flex items-center justify-between px-3 border-b border-[var(--border-default)] bg-[var(--bg-header)] shrink-0 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setSelectedFileDiff(null)}
            className="flex items-center gap-1 text-xs text-[var(--accent-primary)] hover:underline mr-2"
          >
            <ArrowLeft size={13} />
            <span>Back to Graph</span>
          </button>
          <div className="w-px h-4 bg-[var(--border-default)]" />
          <FileCode size={13} className="text-[var(--text-tertiary)] shrink-0" />
          <span className="text-xs font-medium text-[var(--text-primary)] truncate font-mono">
            {fileName}
          </span>
          {dirPath && (
            <span className="text-xs text-[var(--text-tertiary)] truncate font-mono">
              {dirPath}
            </span>
          )}

          {/* Additions & Deletions metrics badges */}
          <div className="flex items-center gap-1.5 ml-2 font-mono text-[11px]">
            <span className="text-[var(--diff-add-text)] font-semibold">+{totalAdditions}</span>
            <span className="text-[var(--diff-del-text)] font-semibold">-{totalDeletions}</span>
          </div>

          {selectedFileDiff.isStaged != null && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                selectedFileDiff.isStaged
                  ? 'bg-[var(--diff-add-bg)] text-[var(--diff-add-text)]'
                  : 'bg-[var(--color-warning)]/20 text-[var(--color-warning)]'
              }`}
            >
              {selectedFileDiff.isStaged ? 'Staged' : 'Unstaged'}
            </span>
          )}
        </div>

        {/* View Mode Toggle: Split vs Unified */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[var(--bg-surface)] p-0.5 rounded border border-[var(--border-default)]">
            <button
              onClick={() => setDiffMode('split')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                diffMode === 'split'
                  ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
              title="Split View (Side-by-Side: Old code left, New code right)"
            >
              <Columns size={11} />
              <span>Split (Side-by-Side)</span>
            </button>
            <button
              onClick={() => setDiffMode('unified')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                diffMode === 'unified'
                  ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
              title="Unified View (Inline single column)"
            >
              <AlignJustify size={11} />
              <span>Unified</span>
            </button>
          </div>

          <button
            onClick={() => setSelectedFileDiff(null)}
            className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            title="Close diff view (Esc)"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Diff Content Area */}
      <div className="flex-1 overflow-auto font-mono text-xs">
        {loading ? (
          <div className="p-4 text-xs text-[var(--text-tertiary)]">Loading file diff...</div>
        ) : hunks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-xs text-[var(--text-tertiary)]">
            <span>No diff available for this file</span>
          </div>
        ) : diffMode === 'split' ? (
          /* Split / Side-by-Side View */
          <div className="min-w-full w-max">
            {hunks.map((hunk, i) => (
              <SplitHunkView key={i} hunk={hunk} />
            ))}
          </div>
        ) : (
          /* Unified / Inline View */
          <div className="min-w-full">
            {hunks.map((hunk, i) => (
              <div key={i} className="border-b border-[var(--border-default)]/40">
                <div className="px-4 py-1 bg-[var(--bg-elevated)] text-[var(--text-tertiary)] border-y border-[var(--border-default)]/60 text-[11px] sticky top-0 z-10 font-bold">
                  {hunk.header}
                </div>
                {(hunk.lines || []).map((line, j) => (
                  <UnifiedDiffLineView key={j} line={line} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SplitHunkView({ hunk }: { hunk: DiffHunk }) {
  const splitRows = useMemo(() => buildSplitRows(hunk.lines || []), [hunk.lines])

  return (
    <div className="border-b border-[var(--border-default)]/40">
      {/* Header bar */}
      <div className="flex items-center px-4 py-1 bg-[var(--bg-elevated)] text-[var(--text-tertiary)] border-y border-[var(--border-default)]/60 text-[11px] sticky top-0 z-10 font-bold">
        <div className="w-1/2 pr-2 border-r border-[var(--border-default)]/50">
          <span>Old version &mdash; {hunk.header}</span>
        </div>
        <div className="w-1/2 pl-4">
          <span>New version &mdash; {hunk.header}</span>
        </div>
      </div>

      {/* Split Rows */}
      {splitRows.map((row, i) => (
        <div key={i} className="flex border-b border-[var(--border-default)]/20 leading-5 text-xs">
          {/* Left Column: Old Version */}
          <div
            className={`w-1/2 flex items-stretch border-r border-[var(--border-default)]/40 overflow-hidden ${
              row.left?.type === 'remove'
                ? 'bg-[var(--diff-del-bg)]'
                : row.left
                  ? ''
                  : 'bg-[var(--bg-app)]/50'
            }`}
          >
            <span className="w-12 shrink-0 text-right pr-3 text-[var(--text-tertiary)] select-none text-[11px] py-0.5 border-r border-[var(--border-default)]/30">
              {row.left?.lineNumber || ''}
            </span>
            <span
              className={`w-5 shrink-0 text-center select-none text-[11px] py-0.5 ${
                row.left?.type === 'remove' ? 'text-[var(--diff-del-text)] font-medium' : ''
              }`}
            >
              {row.left?.type === 'remove' ? '-' : ' '}
            </span>
            <span
              className={`flex-1 whitespace-pre pl-1 py-0.5 ${
                row.left?.type === 'remove'
                  ? 'text-[var(--diff-del-text)] font-medium'
                  : 'text-[var(--text-primary)]'
              }`}
            >
              {row.left?.content || ''}
            </span>
          </div>

          {/* Right Column: New Version */}
          <div
            className={`w-1/2 flex items-stretch overflow-hidden ${
              row.right?.type === 'add'
                ? 'bg-[var(--diff-add-bg)]'
                : row.right
                  ? ''
                  : 'bg-[var(--bg-app)]/50'
            }`}
          >
            <span className="w-12 shrink-0 text-right pr-3 text-[var(--text-tertiary)] select-none text-[11px] py-0.5 border-r border-[var(--border-default)]/30">
              {row.right?.lineNumber || ''}
            </span>
            <span
              className={`w-5 shrink-0 text-center select-none text-[11px] py-0.5 ${
                row.right?.type === 'add' ? 'text-[var(--diff-add-text)] font-medium' : ''
              }`}
            >
              {row.right?.type === 'add' ? '+' : ' '}
            </span>
            <span
              className={`flex-1 whitespace-pre pl-1 py-0.5 ${
                row.right?.type === 'add'
                  ? 'text-[var(--diff-add-text)] font-medium'
                  : 'text-[var(--text-primary)]'
              }`}
            >
              {row.right?.content || ''}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function UnifiedDiffLineView({ line }: { line: DiffLine }) {
  if (!line) return null

  const bgClass =
    line.type === 'add'
      ? 'bg-[var(--diff-add-bg)]'
      : line.type === 'remove'
        ? 'bg-[var(--diff-del-bg)]'
        : ''

  const textClass =
    line.type === 'add'
      ? 'text-[var(--diff-add-text)] font-medium'
      : line.type === 'remove'
        ? 'text-[var(--diff-del-text)] font-medium'
        : 'text-[var(--text-primary)]'

  const prefix = line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '

  return (
    <div className={`flex items-stretch hover:brightness-110 ${bgClass} leading-5`}>
      <span className="w-12 shrink-0 text-right pr-3 text-[var(--text-tertiary)] select-none text-[11px] py-0.5 border-r border-[var(--border-default)]/30">
        {line.oldLineNumber || ''}
      </span>
      <span className="w-12 shrink-0 text-right pr-3 text-[var(--text-tertiary)] select-none text-[11px] py-0.5 border-r border-[var(--border-default)]/30">
        {line.newLineNumber || ''}
      </span>
      <span className={`w-6 shrink-0 text-center select-none text-[11px] py-0.5 ${textClass}`}>
        {prefix}
      </span>
      <span className={`flex-1 whitespace-pre pl-2 py-0.5 font-mono ${textClass}`}>
        {line.content || ''}
      </span>
    </div>
  )
}
