import React, { useState, useEffect, useMemo } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Sparkles,
  GitCommit,
  FolderTree,
  List
} from 'lucide-react'
import { useGitStore } from '@/stores/gitStore'
import { useUiStore } from '@/stores/uiStore'
import { parseDiff } from '@/utils/diffParser'
import type { DiffFile, DiffHunk, DiffLine } from '@/shared/types'

export function CommitDetail() {
  const commits = useGitStore((s) => s.commits)
  const selectedHash = useUiStore((s) => s.selectedCommitHash)
  const [diffFiles, setDiffFiles] = useState<DiffFile[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'path' | 'tree'>('path')

  const commit = commits.find((c) => c.hash === selectedHash)

  useEffect(() => {
    if (!selectedHash || selectedHash === 'WORKING_TREE') {
      setDiffFiles([])
      return
    }
    let isMounted = true
    setLoading(true)
    window.gitAPI
      .getDiffCommit(selectedHash)
      .then((result) => {
        if (!isMounted) return
        if (result && result.ok && typeof result.data === 'string') {
          setDiffFiles(parseDiff(result.data))
        } else {
          setDiffFiles([])
        }
        setLoading(false)
      })
      .catch(() => {
        if (isMounted) {
          setDiffFiles([])
          setLoading(false)
        }
      })
    return () => {
      isMounted = false
    }
  }, [selectedHash])

  if (!commit) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-[var(--text-tertiary)]">
        Select a commit to view details
      </div>
    )
  }

  const stats = useMemo(() => {
    let modified = 0, added = 0, deleted = 0
    for (const f of diffFiles) {
      if (f.status === 'added') added++
      else if (f.status === 'deleted') deleted++
      else modified++
    }
    return { modified, added, deleted }
  }, [diffFiles])

  const authorName = commit.authorName || 'Unknown Author'
  const parentHash = commit.parents?.[0] || null
  const timeAgo = formatRelativeTime(commit.authorDate || '')
  const initials = getInitials(authorName)

  return (
    <div className="h-full flex flex-col bg-[var(--bg-surface)] overflow-y-auto">
      {/* Header: commit ID + AI button */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-default)]">
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] font-mono">
          <GitCommit size={11} className="text-[var(--text-tertiary)]" />
          <span>commit:</span>
          <span className="text-[var(--text-primary)]">{commit.abbreviatedHash || commit.hash?.slice(0, 7)}</span>
        </div>
        <button className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-indigo-300 bg-[rgba(99,102,241,0.18)] hover:bg-[rgba(99,102,241,0.28)] transition-colors">
          <Sparkles size={10} />
          AI
        </button>
      </div>

      {/* Commit description */}
      <div className="px-3 pt-3 pb-1">
        <p className="text-[15px] font-medium text-[var(--text-primary)] leading-tight">
          {commit.message || '(No commit message)'}
        </p>
        {commit.body && (
          <p className="mt-1.5 text-[11px] text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
            {commit.body}
          </p>
        )}
      </div>

      {/* Author section */}
      <div className="flex items-start gap-2.5 px-3 py-2.5">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
          style={{ background: stringToColor(authorName) }}
        >
          {initials}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[12px] font-semibold text-[var(--text-primary)] truncate">
            {authorName}
          </span>
          <span className="text-[11px] text-[var(--text-secondary)]">
            authored {timeAgo}
          </span>
          {parentHash && (
            <span className="text-[11px] text-[var(--text-tertiary)] mt-0.5 font-mono">
              parent{' '}
              <span className="text-[var(--accent-primary)] cursor-pointer hover:underline">
                {parentHash.slice(0, 7)}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* File stats bar */}
      <div className="flex items-center gap-3 px-3 py-2 border-t border-b border-[var(--border-default)] text-[11px]">
        {stats.modified > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[var(--color-warning)]" />
            <span className="text-[var(--text-secondary)]">{stats.modified} modified</span>
          </span>
        )}
        {stats.added > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[var(--diff-add-text)]" />
            <span className="text-[var(--text-secondary)]">{stats.added} added</span>
          </span>
        )}
        {stats.deleted > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[var(--diff-del-text)]" />
            <span className="text-[var(--text-secondary)]">{stats.deleted} deleted</span>
          </span>
        )}
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[var(--border-default)]">
        <button
          onClick={() => setViewMode('path')}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
            viewMode === 'path'
              ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
          }`}
        >
          <List size={10} />
          Path
        </button>
        <button
          onClick={() => setViewMode('tree')}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
            viewMode === 'tree'
              ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
          }`}
        >
          <FolderTree size={10} />
          Tree
        </button>
      </div>

      {/* File list */}
      {loading ? (
        <div className="p-4 text-[11px] text-[var(--text-tertiary)]">Loading diff...</div>
      ) : diffFiles.length === 0 ? (
        <div className="p-4 text-[11px] text-[var(--text-tertiary)]">No files modified in this commit</div>
      ) : (
        <div className="flex-1">
          {diffFiles.map((file, i) => (
            <DiffFileView key={file.file || i} file={file} />
          ))}
        </div>
      )}
    </div>
  )
}

const DiffFileView = React.memo(function DiffFileView({ file }: { file?: DiffFile }) {
  const selectedFileDiff = useUiStore((s) => s.selectedFileDiff)
  const setSelectedFileDiff = useUiStore((s) => s.setSelectedFileDiff)
  const selectedHash = useUiStore((s) => s.selectedCommitHash)

  if (!file) return null

  const fileName = file.file || 'Unknown File'
  const additions = file.additions ?? 0
  const deletions = file.deletions ?? 0
  const isSelected = selectedFileDiff?.file === file.file

  const handleFileClick = () => {
    setSelectedFileDiff({
      file: file.file,
      commitHash: selectedHash
    })
  }

  const statusColor =
    file.status === 'added'
      ? 'bg-[var(--diff-add-text)]'
      : file.status === 'deleted'
        ? 'bg-[var(--diff-del-text)]'
        : 'bg-[var(--color-warning)]'

  return (
    <div
      onClick={handleFileClick}
      className={`flex items-center gap-2 px-3 py-1.5 text-[11px] border-b border-[var(--border-default)] cursor-pointer select-none transition-colors ${
        isSelected
          ? 'bg-[var(--bg-selection)] text-white font-semibold'
          : 'hover:bg-[var(--bg-hover)] text-[var(--text-primary)]'
      }`}
      title="Click to view diff in center panel"
    >
      <span className={`w-2 h-2 rounded-sm shrink-0 ${statusColor}`} />
      <span className="flex-1 text-left truncate font-mono">
        {fileName}
      </span>
      <span className="text-[var(--diff-add-text)] tabular-nums">+{additions}</span>
      <span className="text-[var(--diff-del-text)] tabular-nums">-{deletions}</span>
    </div>
  )
})

function HunkView({ hunk }: { hunk?: DiffHunk }) {
  if (!hunk) return null
  const lines = hunk.lines || []

  return (
    <div className="font-mono text-[11px]">
      <div className="px-3 py-0.5 bg-[var(--bg-elevated)] text-[var(--text-tertiary)] border-y border-[var(--border-default)]/50">
        {hunk.header || ''}
      </div>
      {lines.map((line, i) => (
        <DiffLineView key={i} line={line} />
      ))}
    </div>
  )
}

function DiffLineView({ line }: { line?: DiffLine }) {
  if (!line) return null

  const bgClass =
    line.type === 'add'
      ? 'bg-[var(--diff-add-bg)]'
      : line.type === 'remove'
        ? 'bg-[var(--diff-del-bg)]'
        : ''

  const textClass =
    line.type === 'add'
      ? 'text-[var(--diff-add-text)]'
      : line.type === 'remove'
        ? 'text-[var(--diff-del-text)]'
        : 'text-[var(--text-primary)]'

  const prefix = line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '

  return (
    <div className={`flex ${bgClass} hover:brightness-110`}>
      <span className="w-10 shrink-0 text-right pr-2 text-[var(--text-tertiary)] select-none">
        {line.oldLineNumber || ''}
      </span>
      <span className="w-10 shrink-0 text-right pr-2 text-[var(--text-tertiary)] select-none">
        {line.newLineNumber || ''}
      </span>
      <span className={`w-4 shrink-0 text-center select-none ${textClass}`}>{prefix}</span>
      <span className={`flex-1 whitespace-pre ${textClass}`}>{line.content || ''}</span>
    </div>
  )
}

function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return ''
  const then = new Date(dateStr).getTime()
  if (isNaN(then)) return dateStr
  const now = Date.now()
  const seconds = Math.floor((now - then) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`
  const years = Math.floor(months / 12)
  return `${years} year${years > 1 ? 's' : ''} ago`
}

function getInitials(name?: string | null): string {
  if (!name) return '?'
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?'
  return ((parts[0][0] || '') + (parts[parts.length - 1][0] || '')).toUpperCase() || '?'
}

function stringToColor(str?: string | null): string {
  if (!str) return 'hsl(210, 55%, 45%)'
  const s = String(str)
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    hash = s.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 55%, 45%)`
}
