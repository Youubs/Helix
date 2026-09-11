import React, { useState, useMemo, useEffect } from 'react'
import {
  Trash2,
  Sparkles,
  SlidersHorizontal,
  Search,
  ArrowUpDown,
  AlignLeft,
  FolderTree,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
  Minus,
  GitCommit,
  Archive,
  Cloud,
  Check
} from 'lucide-react'
import { useGitStore } from '@/stores/gitStore'
import { useGit } from '@/hooks/useGit'
import { useUiStore } from '@/stores/uiStore'
import type { FileStatus } from '@/shared/types'
import { toast } from 'sonner'

interface TreeNode {
  name: string
  path: string
  isFile: boolean
  file?: FileStatus
  children?: Record<string, TreeNode>
}

export function WorkingTree() {
  const status = useGitStore((s) => s.status)
  const commits = useGitStore((s) => s.commits)
  const setSelectedFileDiff = useUiStore((s) => s.setSelectedFileDiff)
  const selectedFileDiff = useUiStore((s) => s.selectedFileDiff)
  const { stage, unstage, commit, push } = useGit()

  // View options
  const [viewMode, setViewMode] = useState<'path' | 'tree'>('path')
  const [sortAsc, setSortAsc] = useState(true)

  // Accordion fold states
  const [unstagedOpen, setUnstagedOpen] = useState(true)
  const [stagedOpen, setStagedOpen] = useState(true)

  // Commit form state
  const [activeTab, setActiveTab] = useState<'commit' | 'stash' | 'cloud'>('commit')
  const [isAmend, setIsAmend] = useState(false)
  const [commitSummary, setCommitSummary] = useState('')
  const [commitDescription, setCommitDescription] = useState('')
  const [pushAfterCommit, setPushAfterCommit] = useState(false)
  const [commitOptionsOpen, setCommitOptionsOpen] = useState(false)
  const [isCommitting, setIsCommitting] = useState(false)

  const currentBranch = status?.current ?? 'main'

  // Pre-fill last commit message when toggling amend
  useEffect(() => {
    if (isAmend) {
      const lastCommit = commits[0]
      if (lastCommit) {
        const parts = lastCommit.message.split('\n\n')
        setCommitSummary(parts[0] || lastCommit.message)
        setCommitDescription(parts.slice(1).join('\n\n'))
      }
    }
  }, [isAmend, commits])

  const unstagedFiles: FileStatus[] = useMemo(() => {
    if (!status) return []
    const allUnstaged = [
      ...status.unstaged,
      ...status.untracked.map((path) => ({
        path,
        index: '?' as const,
        working_dir: '?' as const,
        isStaged: false
      }))
    ]
    if (!sortAsc) {
      return [...allUnstaged].sort((a, b) => b.path.localeCompare(a.path))
    }
    return [...allUnstaged].sort((a, b) => a.path.localeCompare(b.path))
  }, [status, sortAsc])

  const stagedFiles: FileStatus[] = useMemo(() => {
    if (!status) return []
    const files = [...status.staged]
    if (!sortAsc) {
      return files.sort((a, b) => b.path.localeCompare(a.path))
    }
    return files.sort((a, b) => a.path.localeCompare(b.path))
  }, [status?.staged, sortAsc])

  const totalChanges = unstagedFiles.length + stagedFiles.length

  const handleSelectFile = (path: string, isFileStaged: boolean) => {
    setSelectedFileDiff({
      file: path,
      isStaged: isFileStaged,
      commitHash: 'WORKING_TREE'
    })
  }

  const handleStageAll = () => {
    if (unstagedFiles.length > 0) {
      stage(unstagedFiles.map((f) => f.path))
    }
  }

  const handleUnstageAll = () => {
    if (stagedFiles.length > 0) {
      unstage(stagedFiles.map((f) => f.path))
    }
  }

  const handleDiscardAll = async () => {
    if (unstagedFiles.length === 0) {
      toast.info('No unstaged changes to discard')
      return
    }
    const confirmed = window.confirm(
      `Are you sure you want to discard all changes in ${unstagedFiles.length} unstaged files? This cannot be undone.`
    )
    if (!confirmed) return

    try {
      const res = await window.gitAPI.reset({ mode: 'hard', ref: 'HEAD' })
      if (res.ok) {
        toast.success('All unstaged changes discarded')
        useGitStore.getState().refresh()
      } else {
        toast.error(res.error || 'Failed to discard changes')
      }
    } catch {
      toast.error('Failed to discard changes')
    }
  }

  const handleCommit = async () => {
    const summary = commitSummary.trim()
    if (!summary || stagedFiles.length === 0 || isCommitting) return

    setIsCommitting(true)
    const fullMessage = commitDescription.trim()
      ? `${summary}\n\n${commitDescription.trim()}`
      : summary

    const result = await commit(fullMessage, { amend: isAmend })
    setIsCommitting(false)

    if (result?.ok) {
      setCommitSummary('')
      setCommitDescription('')
      if (isAmend) setIsAmend(false)

      if (pushAfterCommit) {
        await push()
      }
    }
  }

  const handleGenerateAiCommit = () => {
    if (stagedFiles.length === 0) {
      toast.info('Stage files first to generate a commit message')
      return
    }

    const fileNames = stagedFiles.map((f) => f.path.split(/[/\\]/).pop() || f.path)
    let suggestedSummary = ''
    if (fileNames.length === 1) {
      suggestedSummary = `feat: update ${fileNames[0]}`
    } else if (fileNames.length <= 3) {
      suggestedSummary = `feat: update ${fileNames.join(', ')}`
    } else {
      suggestedSummary = `feat: update ${fileNames[0]} and ${fileNames.length - 1} other files`
    }

    setCommitSummary(suggestedSummary)
    setCommitDescription(
      `- Modified: ${fileNames.slice(0, 5).join('\n- Modified: ')}${
        fileNames.length > 5 ? `\n- and ${fileNames.length - 5} more files` : ''
      }`
    )
    toast.success('Generated commit draft from staged files')
  }

  const handleStash = async () => {
    const res = await window.gitAPI.stashPush()
    if (res.ok) {
      toast.success('Changes stashed')
      useGitStore.getState().refresh()
    } else {
      toast.error(res.error || 'Failed to stash')
    }
  }

  if (!status) return null

  const charLimit = 72
  const charCount = commitSummary.length
  const charsRemaining = charLimit - charCount

  return (
    <div className="h-full flex flex-col bg-[#161b22] text-[var(--text-primary)] select-none overflow-hidden">
      {/* ── Top utility row (Actions, Search) ── */}
      <div className="flex items-center justify-end gap-3 px-3 pt-2 text-[11px] text-zinc-400">
        <button
          className="flex items-center gap-1 hover:text-zinc-200 transition-colors"
          title="Repository actions"
          onClick={() => toast.info('Working tree actions')}
        >
          <SlidersHorizontal size={12} />
          <span>Actions</span>
        </button>
        <button
          className="flex items-center gap-1 hover:text-zinc-200 transition-colors"
          title="Search files"
          onClick={() => {
            const el = document.getElementById('search-working-tree-input')
            el?.focus()
          }}
        >
          <Search size={12} />
          <span>Search</span>
        </button>
      </div>

      {/* ── Top status row (Discard, Changes summary, AI) ── */}
      <div className="flex items-center justify-between px-3 py-1.5 shrink-0">
        {/* Discard all red button */}
        <button
          onClick={handleDiscardAll}
          className="p-1 rounded border border-rose-500/50 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
          title="Discard all unstaged changes"
        >
          <Trash2 size={13} />
        </button>

        {/* Change count & branch pill */}
        <div className="flex items-center gap-1.5 text-xs font-normal text-zinc-300">
          <span>{totalChanges} file changes on</span>
          <span className="px-1.5 py-0.5 rounded font-mono font-medium text-[11px] bg-[#1d4ed8] text-white">
            {currentBranch}
          </span>
        </div>

        {/* AI Action button */}
        <button
          onClick={handleGenerateAiCommit}
          className="p-1 rounded border border-purple-500 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors"
          title="Generate commit message with AI"
        >
          <Sparkles size={13} />
        </button>
      </div>

      {/* ── View mode toolbar (Sort A-Z, Path / Tree segmented control) ── */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-zinc-800 shrink-0">
        {/* Alphabetical sort toggle */}
        <button
          onClick={() => setSortAsc(!sortAsc)}
          className={`p-1 rounded flex items-center gap-0.5 text-xs transition-colors ${
            sortAsc
              ? 'text-zinc-300 hover:bg-zinc-800'
              : 'text-[var(--accent-primary)] hover:bg-zinc-800'
          }`}
          title={sortAsc ? 'Sort A to Z (click for Z to A)' : 'Sort Z to A (click for A to Z)'}
        >
          <ArrowUpDown size={12} />
          <span className="text-[9px] font-bold leading-none font-mono">A<br />Z</span>
        </button>

        {/* Segmented Path vs Tree toggle */}
        <div className="flex items-center p-0.5 rounded border border-zinc-700/70 bg-[#0d1117] text-[11px]">
          <button
            onClick={() => setViewMode('path')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded font-medium transition-colors ${
              viewMode === 'path'
                ? 'bg-[#2563eb] text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <AlignLeft size={12} />
            <span>Path</span>
          </button>
          <button
            onClick={() => setViewMode('tree')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded font-medium transition-colors ${
              viewMode === 'tree'
                ? 'bg-[#2563eb] text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FolderTree size={12} />
            <span>Tree</span>
          </button>
        </div>
      </div>

      {/* ── 3-Section Equal Height Container (Unstaged, Staged, Commit) ── */}
      <div className="flex-1 min-h-0 grid grid-rows-3 overflow-hidden">
        {/* Row 1: Unstaged Files */}
        <div className="flex flex-col min-h-0 border-b border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 shrink-0 bg-[#161b22]">
            <button
              onClick={() => setUnstagedOpen(!unstagedOpen)}
              className="flex items-center gap-1 text-xs font-semibold text-zinc-300 hover:text-white"
            >
              {unstagedOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <span>Unstaged Files ({unstagedFiles.length})</span>
            </button>

            {unstagedFiles.length > 0 && (
              <button
                onClick={handleStageAll}
                className="text-[11px] font-medium text-emerald-400 border border-emerald-500/60 px-2 py-0.5 rounded hover:bg-emerald-500/10 transition-colors"
              >
                Stage All Changes
              </button>
            )}
          </div>

          {unstagedOpen && (
            <div className="flex-1 min-h-0 overflow-y-auto">
              {unstagedFiles.length === 0 ? (
                <div className="px-6 py-2 text-[11px] text-zinc-500 italic">No unstaged files</div>
              ) : viewMode === 'path' ? (
                unstagedFiles.map((file) => (
                  <GitKrakenFileRow
                    key={file.path}
                    file={file}
                    isStaged={false}
                    isSelected={selectedFileDiff?.file === file.path && !selectedFileDiff.isStaged}
                    onSelect={() => handleSelectFile(file.path, false)}
                    onAction={() => stage([file.path])}
                    actionIcon={<Plus size={11} />}
                    actionTitle="Stage change"
                  />
                ))
              ) : (
                <GitKrakenFileTree
                  files={unstagedFiles}
                  isStaged={false}
                  selectedFileDiff={selectedFileDiff}
                  onSelect={(path) => handleSelectFile(path, false)}
                  onAction={(path) => stage([path])}
                  actionIcon={<Plus size={11} />}
                />
              )}
            </div>
          )}
        </div>

        {/* Row 2: Staged Files */}
        <div className="flex flex-col min-h-0 border-b border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 shrink-0 bg-[#161b22]">
            <button
              onClick={() => setStagedOpen(!stagedOpen)}
              className="flex items-center gap-1 text-xs font-semibold text-zinc-300 hover:text-white"
            >
              {stagedOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <span>Staged Files ({stagedFiles.length})</span>
            </button>

            {stagedFiles.length > 0 && (
              <button
                onClick={handleUnstageAll}
                className="text-[11px] font-medium text-[#f87171] border border-[#ef4444]/60 px-2 py-0.5 rounded hover:bg-[#ef4444]/10 transition-colors"
              >
                Unstage All Changes
              </button>
            )}
          </div>

          {stagedOpen && (
            <div className="flex-1 min-h-0 overflow-y-auto">
              {stagedFiles.length === 0 ? (
                <div className="px-6 py-2 text-[11px] text-zinc-500 italic">No staged files</div>
              ) : viewMode === 'path' ? (
                stagedFiles.map((file) => (
                  <GitKrakenFileRow
                    key={file.path}
                    file={file}
                    isStaged={true}
                    isSelected={selectedFileDiff?.file === file.path && Boolean(selectedFileDiff.isStaged)}
                    onSelect={() => handleSelectFile(file.path, true)}
                    onAction={() => unstage([file.path])}
                    actionIcon={<Minus size={11} />}
                    actionTitle="Unstage change"
                  />
                ))
              ) : (
                <GitKrakenFileTree
                  files={stagedFiles}
                  isStaged={true}
                  selectedFileDiff={selectedFileDiff}
                  onSelect={(path) => handleSelectFile(path, true)}
                  onAction={(path) => unstage([path])}
                  actionIcon={<Minus size={11} />}
                />
              )}
            </div>
          )}
        </div>

        {/* Row 3: GitKraken Commit Area */}
        <div className="flex flex-col min-h-0 p-3 bg-[#161b22] overflow-hidden">
          {/* Top handle divider */}
          <div className="w-10 h-1 bg-zinc-700/60 rounded-full mx-auto mb-2 shrink-0" />

          {/* Scrollable commit form controls */}
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2.5 pr-0.5">
            {/* Tab switcher: Commit, Stash, Cloud */}
            <div className="flex items-center gap-1 border-b border-zinc-800 pb-0 shrink-0">
              <button
                onClick={() => setActiveTab('commit')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-t font-medium text-xs border-t border-x transition-colors ${
                  activeTab === 'commit'
                    ? 'bg-[#21262d] text-white border-zinc-700 border-b-[#21262d]'
                    : 'text-zinc-400 hover:text-zinc-200 border-transparent'
                }`}
              >
                <GitCommit size={13} className={activeTab === 'commit' ? 'text-zinc-200' : 'text-zinc-500'} />
                <span>Commit</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('stash')
                  handleStash()
                }}
                className="p-1 text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-800/50 transition-colors"
                title="Stash all changes"
              >
                <Archive size={13} />
              </button>

              <button
                onClick={() => {
                  setActiveTab('cloud')
                  toast.info('Remote sync options')
                }}
                className="p-1 text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-800/50 transition-colors"
                title="Cloud & Remotes"
              >
                <Cloud size={13} />
              </button>
            </div>

            {/* Amend previous commit checkbox */}
            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none shrink-0">
              <input
                type="checkbox"
                checked={isAmend}
                onChange={(e) => setIsAmend(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-0"
              />
              <span>Amend previous commit</span>
            </label>

            {/* Unified Commit message card (Summary + Description) */}
            <div className="rounded-md border border-zinc-700/80 bg-[#161b22] focus-within:border-zinc-500 transition-colors overflow-hidden shrink-0">
              {/* Commit summary row */}
              <div className="flex items-center pr-1.5">
                <input
                  type="text"
                  value={commitSummary}
                  onChange={(e) => setCommitSummary(e.target.value)}
                  placeholder="Commit summary"
                  className="flex-1 bg-transparent px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      handleCommit()
                    }
                  }}
                />

                {/* 72 Character counter indicator */}
                <span
                  className={`text-xs font-mono pr-2 ${
                    charsRemaining < 0
                      ? 'text-rose-400 font-bold'
                      : charsRemaining < 10
                        ? 'text-amber-400'
                        : 'text-zinc-500'
                  }`}
                  title={`${charCount} / ${charLimit} characters`}
                >
                  {charsRemaining}
                </span>

                {/* AI sparkle action button */}
                <button
                  onClick={handleGenerateAiCommit}
                  className="p-1 rounded border border-purple-500 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors"
                  title="Generate commit summary with AI"
                >
                  <Sparkles size={12} />
                </button>
              </div>

              {/* Description textarea row */}
              <textarea
                value={commitDescription}
                onChange={(e) => setCommitDescription(e.target.value)}
                placeholder="Description"
                rows={2}
                className="w-full bg-transparent px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 border-t border-zinc-800/80 focus:outline-none resize-none min-h-[50px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    handleCommit()
                  }
                }}
              />
            </div>

            {/* Options & AI Compose row */}
            <div className="flex items-center justify-between shrink-0">
              <button
                onClick={() => setCommitOptionsOpen(!commitOptionsOpen)}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {commitOptionsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                <span>Commit options</span>
              </button>

              <button
                onClick={handleGenerateAiCommit}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-purple-500/80 bg-purple-950/40 text-purple-300 hover:bg-purple-900/50 text-[11px] font-medium transition-colors"
              >
                <Sparkles size={12} className="text-purple-400" />
                <span>Compose commits with AI</span>
              </button>
            </div>

            {/* Push after committing checkbox */}
            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none shrink-0">
              <input
                type="checkbox"
                checked={pushAfterCommit}
                onChange={(e) => setPushAfterCommit(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-0"
              />
              <span>Push after committing</span>
            </label>
          </div>

          {/* Primary Action Button (-o- Commit) */}
          <button
            disabled={!commitSummary.trim() || stagedFiles.length === 0 || isCommitting}
            onClick={handleCommit}
            className="w-full py-2 px-3 mt-2 rounded border border-emerald-500/40 bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-400 disabled:opacity-40 disabled:border-zinc-700 disabled:bg-zinc-800/30 disabled:text-zinc-500 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
          >
            <GitCommit size={14} />
            <span>
              {commitSummary.trim()
                ? isAmend
                  ? `Amend Commit (${stagedFiles.length} file${stagedFiles.length !== 1 ? 's' : ''})`
                  : `Commit changes to ${stagedFiles.length} file${stagedFiles.length !== 1 ? 's' : ''}`
                : 'Type a Message to Commit'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   GitKraken-Style File Row (Path mode)
   Formats parent directory as muted text and basename as white.
   ───────────────────────────────────────────────────────────── */
function GitKrakenFileRow({
  file,
  isStaged,
  isSelected,
  onSelect,
  onAction,
  actionIcon,
  actionTitle
}: {
  file: FileStatus
  isStaged: boolean
  isSelected: boolean
  onSelect: () => void
  onAction: () => void
  actionIcon: React.ReactNode
  actionTitle: string
}) {
  const statusChar = isStaged ? file.index : file.working_dir

  // GitKraken status icons: orange pencil for modified, green plus for added, red minus for deleted
  const isModified = statusChar === 'M'
  const isAdded = statusChar === 'A' || statusChar === '?'
  const isDeleted = statusChar === 'D'

  // Split directory prefix and basename
  const normalizedPath = file.path.replace(/\\/g, '/')
  const lastSlashIndex = normalizedPath.lastIndexOf('/')
  const parentDir = lastSlashIndex !== -1 ? normalizedPath.slice(0, lastSlashIndex + 1) : ''
  const fileName = lastSlashIndex !== -1 ? normalizedPath.slice(lastSlashIndex + 1) : normalizedPath

  return (
    <div
      onClick={onSelect}
      className={`group flex items-center gap-2 px-3 py-1 text-xs cursor-pointer select-none transition-colors ${
        isSelected
          ? 'bg-blue-600/20 text-white border-l-2 border-blue-500'
          : 'hover:bg-zinc-800/60 text-zinc-300'
      }`}
      title={`Click to view diff for ${file.path}`}
    >
      {/* GitKraken icon */}
      <span className="shrink-0">
        {isModified ? (
          <Pencil size={11} className="text-amber-500" />
        ) : isAdded ? (
          <Plus size={11} className="text-emerald-500" />
        ) : isDeleted ? (
          <Minus size={11} className="text-rose-500" />
        ) : (
          <Pencil size={11} className="text-amber-500" />
        )}
      </span>

      {/* Formatted path: dimmed directory + bold filename */}
      <span className="truncate flex-1 font-mono text-xs">
        {parentDir && <span className="text-zinc-500 font-normal">{parentDir}</span>}
        <span className="text-zinc-100 font-semibold">{fileName}</span>
      </span>

      {/* Action button on hover (stage/unstage) */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onAction()
        }}
        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-zinc-700/60 text-zinc-400 hover:text-white transition-opacity"
        title={actionTitle}
      >
        {actionIcon}
      </button>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   GitKraken-Style File Tree (Tree mode)
   ───────────────────────────────────────────────────────────── */
function GitKrakenFileTree({
  files,
  isStaged,
  selectedFileDiff,
  onSelect,
  onAction,
  actionIcon
}: {
  files: FileStatus[]
  isStaged: boolean
  selectedFileDiff: any
  onSelect: (path: string) => void
  onAction: (path: string) => void
  actionIcon: React.ReactNode
}) {
  const tree = useMemo(() => {
    const root: Record<string, TreeNode> = {}
    for (const f of files) {
      const parts = f.path.replace(/\\/g, '/').split('/')
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
        if (!isFile && current[part].children) {
          current = current[part].children!
        }
      }
    }
    return root
  }, [files])

  return (
    <div className="py-0.5">
      {Object.values(tree).map((node) => (
        <TreeNodeItem
          key={node.path}
          node={node}
          depth={0}
          isStaged={isStaged}
          selectedFileDiff={selectedFileDiff}
          onSelect={onSelect}
          onAction={onAction}
          actionIcon={actionIcon}
        />
      ))}
    </div>
  )
}

function TreeNodeItem({
  node,
  depth,
  isStaged,
  selectedFileDiff,
  onSelect,
  onAction,
  actionIcon
}: {
  node: TreeNode
  depth: number
  isStaged: boolean
  selectedFileDiff: any
  onSelect: (path: string) => void
  onAction: (path: string) => void
  actionIcon: React.ReactNode
}) {
  const [open, setOpen] = useState(true)

  if (node.isFile && node.file) {
    const isSelected =
      selectedFileDiff?.file === node.file.path && Boolean(selectedFileDiff.isStaged) === isStaged
    const statusChar = isStaged ? node.file.index : node.file.working_dir
    const isModified = statusChar === 'M'
    const isAdded = statusChar === 'A' || statusChar === '?'
    const isDeleted = statusChar === 'D'

    return (
      <div
        onClick={() => onSelect(node.file!.path)}
        style={{ paddingLeft: `${depth * 14 + 12}px` }}
        className={`group flex items-center gap-2 pr-3 py-1 text-xs cursor-pointer select-none transition-colors ${
          isSelected
            ? 'bg-blue-600/20 text-white border-l-2 border-blue-500'
            : 'hover:bg-zinc-800/60 text-zinc-300'
        }`}
      >
        <span className="shrink-0">
          {isModified ? (
            <Pencil size={11} className="text-amber-500" />
          ) : isAdded ? (
            <Plus size={11} className="text-emerald-500" />
          ) : isDeleted ? (
            <Minus size={11} className="text-rose-500" />
          ) : (
            <Pencil size={11} className="text-amber-500" />
          )}
        </span>

        <span className="truncate flex-1 font-mono text-xs text-zinc-100 font-medium">
          {node.name}
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onAction(node.file!.path)
          }}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-zinc-700/60 text-zinc-400 hover:text-white transition-opacity"
        >
          {actionIcon}
        </button>
      </div>
    )
  }

  // Folder
  return (
    <div>
      <div
        onClick={() => setOpen(!open)}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        className="flex items-center gap-1.5 pr-3 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 cursor-pointer select-none"
      >
        {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        {open ? (
          <FolderOpen size={13} className="text-amber-400/80 shrink-0" />
        ) : (
          <Folder size={13} className="text-amber-400/80 shrink-0" />
        )}
        <span className="truncate font-mono text-[11px] font-medium text-zinc-300">
          {node.name}
        </span>
      </div>

      {open && node.children && (
        <div>
          {Object.values(node.children).map((child) => (
            <TreeNodeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              isStaged={isStaged}
              selectedFileDiff={selectedFileDiff}
              onSelect={onSelect}
              onAction={onAction}
              actionIcon={actionIcon}
            />
          ))}
        </div>
      )}
    </div>
  )
}
