import React, { useState } from 'react'
import {
  Plus,
  Minus,
  FileText,
  FilePlus,
  FileX,
  FilePen,
  ChevronDown,
  ChevronRight,
  Check
} from 'lucide-react'
import { useGitStore } from '@/stores/gitStore'
import { useGit } from '@/hooks/useGit'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import type { FileStatus } from '@/shared/types'
import { useUiStore } from '@/stores/uiStore'

export function WorkingTree() {
  const status = useGitStore((s) => s.status)
  const setSelectedFileDiff = useUiStore((s) => s.setSelectedFileDiff)
  const { stage, unstage, commit } = useGit()
  const [commitMessage, setCommitMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [isStaged, setIsStaged] = useState(false)

  const handleSelectFile = (path: string, staged: boolean) => {
    setSelectedFile(path)
    setIsStaged(staged)
    setSelectedFileDiff({
      file: path,
      isStaged: staged,
      commitHash: 'WORKING_TREE'
    })
  }

  const handleCommit = async () => {
    if (!commitMessage.trim()) return
    const result = await commit(commitMessage)
    if (result?.ok) setCommitMessage('')
  }

  const handleStageAll = () => {
    if (!status) return
    const files = [
      ...status.unstaged.map((f) => f.path),
      ...status.untracked
    ]
    if (files.length > 0) stage(files)
  }

  const handleUnstageAll = () => {
    if (!status) return
    const files = status.staged.map((f) => f.path)
    if (files.length > 0) unstage(files)
  }

  if (!status) return null

  return (
    <div className="h-full flex flex-col bg-[var(--bg-app)]">
      <div className="h-8 flex items-center px-3 border-b border-[var(--border-default)] shrink-0">
        <span className="text-xs font-medium text-[var(--text-secondary)]">
          Working Tree
        </span>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden min-h-0">
        <div className="flex-1 overflow-y-auto">
          {/* Staged */}
          <FileSection
            title="Staged"
            count={status.staged.length}
            action={{ icon: <Minus size={12} />, label: 'Unstage all', onClick: handleUnstageAll }}
          >
            {status.staged.map((file) => (
              <FileItem
                key={file.path}
                file={file}
                selected={selectedFile === file.path && isStaged}
                onSelect={() => handleSelectFile(file.path, true)}
                onAction={() => unstage([file.path])}
                actionIcon={<Minus size={11} />}
              />
            ))}
          </FileSection>

          {/* Unstaged */}
          <FileSection
            title="Unstaged"
            count={status.unstaged.length}
            action={{ icon: <Plus size={12} />, label: 'Stage all', onClick: handleStageAll }}
          >
            {status.unstaged.map((file) => (
              <FileItem
                key={file.path}
                file={file}
                selected={selectedFile === file.path && !isStaged}
                onSelect={() => handleSelectFile(file.path, false)}
                onAction={() => stage([file.path])}
                actionIcon={<Plus size={11} />}
              />
            ))}
          </FileSection>

          {/* Untracked */}
          {status.untracked.length > 0 && (
            <FileSection title="Untracked" count={status.untracked.length}>
              {status.untracked.map((path) => (
                <FileItem
                  key={path}
                  file={{ path, index: '?', working_dir: '?', isStaged: false }}
                  selected={selectedFile === path}
                  onSelect={() => handleSelectFile(path, false)}
                  onAction={() => stage([path])}
                  actionIcon={<Plus size={11} />}
                />
              ))}
            </FileSection>
          )}
        </div>

        {/* Commit area */}
        <div className="p-3 border-t border-[var(--border-default)] bg-[var(--bg-surface)] shrink-0">
          <Textarea
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Commit message (Ctrl+Enter to commit)..."
            className="min-h-[72px] text-xs mb-2 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleCommit()
              }
            }}
          />
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            disabled={!commitMessage.trim() || status.staged.length === 0}
            onClick={handleCommit}
          >
            <Check size={12} />
            Commit ({status.staged.length} staged file{status.staged.length !== 1 ? 's' : ''})
          </Button>
        </div>
      </div>
    </div>
  )
}

function FileSection({
  title,
  count,
  action,
  children
}: {
  title: string
  count: number
  action?: { icon: React.ReactNode; label: string; onClick: () => void }
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)

  return (
    <div>
      <div className="flex items-center gap-1 px-2 py-1 border-b border-[var(--border-default)]/50">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-1 flex-1 text-xs font-medium text-[var(--text-secondary)]">
          {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          {title}
          <span className="text-[var(--text-tertiary)]">({count})</span>
        </button>
        {action && count > 0 && (
          <button
            onClick={action.onClick}
            title={action.label}
            className="p-0.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)]"
          >
            {action.icon}
          </button>
        )}
      </div>
      {open && <div>{children}</div>}
    </div>
  )
}

function FileItem({
  file,
  selected,
  onSelect,
  onAction,
  actionIcon
}: {
  file: FileStatus
  selected: boolean
  onSelect: () => void
  onAction: () => void
  actionIcon: React.ReactNode
}) {
  const statusChar = file.isStaged ? file.index : file.working_dir
  const StatusIcon =
    statusChar === 'A' || statusChar === '?'
      ? FilePlus
      : statusChar === 'D'
        ? FileX
        : statusChar === 'R'
          ? FileText
          : FilePen

  const statusColor =
    statusChar === 'A' || statusChar === '?'
      ? 'text-[var(--diff-add-text)]'
      : statusChar === 'D'
        ? 'text-[var(--diff-del-text)]'
        : 'text-[var(--color-warning)]'

  const fileName = file.path.split(/[/\\]/).pop() || file.path
  const dirPath = file.path.includes('/') || file.path.includes('\\')
    ? file.path.slice(0, file.path.length - fileName.length)
    : ''

  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-1.5 px-2 py-0.5 text-xs cursor-pointer group ${
        selected ? 'bg-[var(--accent-primary)]/10' : 'hover:bg-[var(--bg-hover)]'
      }`}
    >
      <StatusIcon size={12} className={statusColor} />
      <span className="truncate flex-1 text-[var(--text-primary)]">
        {fileName}
        {dirPath && (
          <span className="text-[var(--text-tertiary)] ml-1">{dirPath}</span>
        )}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); onAction() }}
        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-tertiary)]"
      >
        {actionIcon}
      </button>
    </div>
  )
}
