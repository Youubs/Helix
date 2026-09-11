import React, { useState, useEffect, useMemo } from 'react'
import {
  GitCommit,
  FolderTree,
  List,
  ArrowLeft,
  Copy,
  X,
  Search,
  Check,
  ChevronDown,
  ChevronRight,
  Folder
} from 'lucide-react'
import { useGitStore } from '@/stores/gitStore'
import { useUiStore } from '@/stores/uiStore'
import { parseDiff } from '@/utils/diffParser'
import type { DiffFile } from '@/shared/types'
import { toast } from 'sonner'

export function CommitDetail() {
  const commits = useGitStore((s) => s.commits)
  const selectedHash = useUiStore((s) => s.selectedCommitHash)
  const setSelectedCommit = useUiStore((s) => s.setSelectedCommit)
  const [diffFiles, setDiffFiles] = useState<DiffFile[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'path' | 'tree'>('path')
  const [searchFilter, setSearchFilter] = useState('')
  const [copied, setCopied] = useState(false)

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

  const handleCopyHash = () => {
    if (!commit?.hash) return
    navigator.clipboard.writeText(commit.hash)
    setCopied(true)
    toast.success('Commit hash copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleBackToWorkingTree = () => {
    setSelectedCommit('WORKING_TREE')
  }

  const stats = useMemo(() => {
    let modified = 0, added = 0, deleted = 0
    for (const f of diffFiles) {
      if (f.status === 'added') added++
      else if (f.status === 'deleted') deleted++
      else modified++
    }
    return { modified, added, deleted, total: diffFiles.length }
  }, [diffFiles])

  const filteredFiles = useMemo(() => {
    if (!searchFilter.trim()) return diffFiles
    const q = searchFilter.toLowerCase()
    return diffFiles.filter((f) => f.file?.toLowerCase().includes(q))
  }, [diffFiles, searchFilter])

  if (!commit) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-xs text-[var(--text-tertiary)] p-4">
        <p>No commit selected</p>
        <button
          onClick={handleBackToWorkingTree}
          className="mt-2 text-xs text-[var(--accent-primary)] hover:underline"
        >
          Return to Working Tree
        </button>
      </div>
    )
  }

  const authorName = commit.authorName || 'Unknown Author'
  const parentHash = commit.parents?.[0] || null
  const timeAgo = formatRelativeTime(commit.authorDate || '')
  const initials = getInitials(authorName)

  return (
    <div className="h-full flex flex-col bg-[var(--bg-surface)] overflow-hidden select-none">
      {/* Top navigation header (GitKraken-style) */}
      <div className="h-10 flex items-center justify-between px-3 border-b border-[var(--border-default)] bg-[var(--bg-app)] shrink-0">
        <button
          onClick={handleBackToWorkingTree}
          className="flex items-center gap-1.5 px-2 py-1 -ml-1 rounded text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          title="Return to Working Tree (uncommitted changes & staging)"
        >
          <ArrowLeft size={13} />
          <span>Working Tree</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopyHash}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            title="Copy full commit SHA"
          >
            <GitCommit size={11} className="text-[var(--accent-primary)]" />
            <span>{commit.abbreviatedHash || commit.hash?.slice(0, 7)}</span>
            {copied ? <Check size={10} className="text-emerald-400 ml-0.5" /> : <Copy size={10} className="ml-0.5 opacity-60" />}
          </button>

          <button
            onClick={handleBackToWorkingTree}
            className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
            title="Close commit details"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Scrollable commit summary */}
      <div className="flex flex-col border-b border-[var(--border-default)] shrink-0 bg-[var(--bg-surface)]">
        {/* Commit message */}
        <div className="px-3 pt-3 pb-1">
          <p className="text-[13px] font-semibold text-[var(--text-primary)] leading-snug break-words">
            {commit.message || '(No commit message)'}
          </p>
          {commit.body && (
            <p className="mt-1 text-[11px] text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed max-h-24 overflow-y-auto font-mono">
              {commit.body}
            </p>
          )}
        </div>

        {/* Author details */}
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-sm"
            style={{ background: stringToColor(authorName) }}
          >
            {initials}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-[12px] font-medium text-[var(--text-primary)] truncate">
                {authorName}
              </span>
              <span className="text-[10px] text-[var(--text-tertiary)] shrink-0">
                {timeAgo}
              </span>
            </div>
            {parentHash && (
              <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
                parent:{' '}
                <span
                  onClick={() => setSelectedCommit(parentHash)}
                  className="text-[var(--accent-primary)] cursor-pointer hover:underline"
                  title="View parent commit"
                >
                  {parentHash.slice(0, 7)}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* File statistics summary */}
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-[var(--border-default)] bg-[var(--bg-app)]/50 text-[11px]">
          <span className="text-[var(--text-secondary)] font-medium">
            {stats.total} file{stats.total === 1 ? '' : 's'} changed
          </span>
          <div className="flex items-center gap-2 font-mono text-[10px]">
            {stats.added > 0 && (
              <span className="text-emerald-400">+{stats.added}</span>
            )}
            {stats.modified > 0 && (
              <span className="text-amber-400">~{stats.modified}</span>
            )}
            {stats.deleted > 0 && (
              <span className="text-rose-400">-{stats.deleted}</span>
            )}
          </div>
        </div>
      </div>

      {/* Files toolbar: filter input & view mode toggle */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border-default)] bg-[var(--bg-surface)] shrink-0">
        <div className="relative flex-1 flex items-center">
          <Search size={12} className="absolute left-2 text-[var(--text-tertiary)] pointer-events-none" />
          <input
            type="text"
            placeholder="Filter files..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-[var(--bg-app)] text-[var(--text-primary)] pl-7 pr-2 py-1 rounded text-xs border border-[var(--border-default)] focus:outline-none focus:border-[var(--accent-primary)] placeholder:text-[var(--text-tertiary)]"
          />
          {searchFilter && (
            <button
              onClick={() => setSearchFilter('')}
              className="absolute right-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              <X size={11} />
            </button>
          )}
        </div>

        <div className="flex items-center border border-[var(--border-default)] rounded overflow-hidden">
          <button
            onClick={() => setViewMode('path')}
            className={`px-1.5 py-1 text-[10px] transition-colors ${
              viewMode === 'path'
                ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] font-medium'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
            title="List view"
          >
            <List size={12} />
          </button>
          <button
            onClick={() => setViewMode('tree')}
            className={`px-1.5 py-1 text-[10px] transition-colors ${
              viewMode === 'tree'
                ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] font-medium'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
            title="Tree view"
          >
            <FolderTree size={12} />
          </button>
        </div>
      </div>

      {/* Modified files list / tree */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-xs text-[var(--text-tertiary)] text-center">Loading changed files...</div>
        ) : filteredFiles.length === 0 ? (
          <div className="p-4 text-xs text-[var(--text-tertiary)] text-center">
            {searchFilter ? 'No files match filter' : 'No files modified in this commit'}
          </div>
        ) : viewMode === 'path' ? (
          <div className="py-0.5 divide-y divide-[var(--border-default)]/40">
            {filteredFiles.map((file, i) => (
              <CommitFileRow key={file.file || i} file={file} commitHash={selectedHash} />
            ))}
          </div>
        ) : (
          <div className="py-1">
            <CommitFileTree files={filteredFiles} commitHash={selectedHash} />
          </div>
        )}
      </div>
    </div>
  )
}

function CommitFileRow({ file, commitHash }: { file: DiffFile; commitHash: string | null }) {
  const selectedFileDiff = useUiStore((s) => s.selectedFileDiff)
  const setSelectedFileDiff = useUiStore((s) => s.setSelectedFileDiff)

  const fileName = file.file || 'Unknown file'
  const isSelected = selectedFileDiff?.file === file.file && selectedFileDiff?.commitHash === commitHash

  const handleSelect = () => {
    setSelectedFileDiff({
      file: file.file,
      commitHash: commitHash
    })
  }

  // GitKraken-like status badges
  let statusBadge = { letter: 'M', className: 'text-amber-400 bg-amber-500/15 border-amber-500/30' }
  if (file.status === 'added') {
    statusBadge = { letter: 'A', className: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' }
  } else if (file.status === 'deleted') {
    statusBadge = { letter: 'D', className: 'text-rose-400 bg-rose-500/15 border-rose-500/30' }
  } else if (file.status === 'renamed') {
    statusBadge = { letter: 'R', className: 'text-purple-400 bg-purple-500/15 border-purple-500/30' }
  }

  const additions = file.additions ?? 0
  const deletions = file.deletions ?? 0

  return (
    <div
      onClick={handleSelect}
      className={`flex items-center gap-2 px-3 py-2 text-xs cursor-pointer select-none transition-colors ${
        isSelected
          ? 'bg-[var(--bg-selection)] text-white'
          : 'hover:bg-[var(--bg-hover)] text-[var(--text-primary)]'
      }`}
      title={`Click to view diff of ${fileName}`}
    >
      <span
        className={`w-4 h-4 flex items-center justify-center rounded text-[9px] font-bold border shrink-0 ${statusBadge.className}`}
      >
        {statusBadge.letter}
      </span>

      <span className="flex-1 truncate font-mono text-[11px]">
        {fileName}
      </span>

      {(additions > 0 || deletions > 0) && (
        <div className="flex items-center gap-1.5 text-[10px] font-mono tabular-nums shrink-0">
          {additions > 0 && <span className="text-emerald-400">+{additions}</span>}
          {deletions > 0 && <span className="text-rose-400">-{deletions}</span>}
        </div>
      )}
    </div>
  )
}

interface TreeNode {
  name: string
  path: string
  isFile: boolean
  file?: DiffFile
  children?: Record<string, TreeNode>
}

function CommitFileTree({ files, commitHash }: { files: DiffFile[]; commitHash: string | null }) {
  const tree = useMemo(() => {
    const root: Record<string, TreeNode> = {}
    for (const f of files) {
      const parts = (f.file || '').split(/[/\\]/)
      let current = root
      let currentPath = ''
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        currentPath = currentPath ? `${currentPath}/${part}` : part
        const isFile = i === parts.length - 1
        if (!current[part]) {
          current[part] = {
            name: part,
            path: currentPath,
            isFile,
            file: isFile ? f : undefined,
            children: isFile ? undefined : {}
          }
        }
        if (!isFile) {
          current = current[part].children!
        }
      }
    }
    return root
  }, [files])

  return (
    <div className="text-xs">
      {Object.values(tree).map((node) => (
        <TreeNodeItem key={node.path} node={node} level={0} commitHash={commitHash} />
      ))}
    </div>
  )
}

function TreeNodeItem({
  node,
  level,
  commitHash
}: {
  node: TreeNode
  level: number
  commitHash: string | null
}) {
  const [open, setOpen] = useState(true)
  const selectedFileDiff = useUiStore((s) => s.selectedFileDiff)
  const setSelectedFileDiff = useUiStore((s) => s.setSelectedFileDiff)

  if (!node.isFile) {
    return (
      <div>
        <div
          onClick={() => setOpen(!open)}
          style={{ paddingLeft: `${level * 14 + 10}px` }}
          className="flex items-center gap-1.5 py-1 text-[11px] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] cursor-pointer select-none font-mono"
        >
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <Folder size={12} className="text-[var(--accent-primary)] opacity-80" />
          <span className="font-semibold">{node.name}</span>
        </div>
        {open && node.children && (
          <div>
            {Object.values(node.children).map((child) => (
              <TreeNodeItem key={child.path} node={child} level={level + 1} commitHash={commitHash} />
            ))}
          </div>
        )}
      </div>
    )
  }

  const file = node.file
  if (!file) return null

  const isSelected = selectedFileDiff?.file === file.file && selectedFileDiff?.commitHash === commitHash
  const additions = file.additions ?? 0
  const deletions = file.deletions ?? 0

  let statusLetter = 'M'
  let statusColor = 'text-amber-400 bg-amber-500/15 border-amber-500/30'
  if (file.status === 'added') {
    statusLetter = 'A'
    statusColor = 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
  } else if (file.status === 'deleted') {
    statusLetter = 'D'
    statusColor = 'text-rose-400 bg-rose-500/15 border-rose-500/30'
  }

  return (
    <div
      onClick={() => setSelectedFileDiff({ file: file.file, commitHash })}
      style={{ paddingLeft: `${level * 14 + 18}px` }}
      className={`flex items-center gap-2 pr-3 py-1 text-[11px] font-mono cursor-pointer select-none transition-colors ${
        isSelected
          ? 'bg-[var(--bg-selection)] text-white'
          : 'hover:bg-[var(--bg-hover)] text-[var(--text-primary)]'
      }`}
    >
      <span
        className={`w-3.5 h-3.5 flex items-center justify-center rounded text-[8px] font-bold border shrink-0 ${statusColor}`}
      >
        {statusLetter}
      </span>
      <span className="flex-1 truncate">{node.name}</span>
      {(additions > 0 || deletions > 0) && (
        <div className="flex items-center gap-1 text-[10px] tabular-nums shrink-0">
          {additions > 0 && <span className="text-emerald-400">+{additions}</span>}
          {deletions > 0 && <span className="text-rose-400">-{deletions}</span>}
        </div>
      )}
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
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  const years = Math.floor(months / 12)
  return `${years}y ago`
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
