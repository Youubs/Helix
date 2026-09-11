import React, { useState } from 'react'
import { FolderOpen, GitBranch, Download, Plus, Pin, Clock, Star, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRepoStore } from '@/stores/repoStore'
import { useGit } from '@/hooks/useGit'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'

export function WelcomeScreen() {
  const recentRepos = useRepoStore((s) => s.recentRepos)
  const { openRepo, cloneRepo, initRepo } = useGit()
  const [cloneOpen, setCloneOpen] = useState(false)
  const [initOpen, setInitOpen] = useState(false)

  const pinnedRepos = recentRepos.filter((r) => r.pinned)
  const unpinnedRepos = recentRepos.filter((r) => !r.pinned)

  return (
    <div className="h-full flex items-center justify-center bg-[var(--bg-app)]">
      <div className="max-w-lg w-full px-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <GitBranch size={28} className="text-[var(--accent-primary)]" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Helix</h1>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            A modern Git desktop client
          </p>
        </div>

        <div className="flex gap-2 justify-center mb-8">
          <Button onClick={() => openRepo()} size="md">
            <FolderOpen size={14} />
            Open Repository
          </Button>
          <Button onClick={() => setCloneOpen(true)} size="md">
            <Download size={14} />
            Clone
          </Button>
          <Button onClick={() => setInitOpen(true)} size="md">
            <Plus size={14} />
            Init
          </Button>
        </div>

        {recentRepos.length > 0 && (
          <div>
            <h2 className="text-xs font-medium text-[var(--text-tertiary)] uppercase mb-2 px-1">
              Recent Repositories
            </h2>
            <div className="space-y-0.5">
              {pinnedRepos.map((repo) => (
                <RepoItem key={repo.path} repo={repo} onOpen={openRepo} pinned />
              ))}
              {unpinnedRepos.map((repo) => (
                <RepoItem key={repo.path} repo={repo} onOpen={openRepo} />
              ))}
            </div>
          </div>
        )}
      </div>

      <CloneDialog open={cloneOpen} onClose={() => setCloneOpen(false)} onClone={cloneRepo} />
      <InitDialog open={initOpen} onClose={() => setInitOpen(false)} onInit={initRepo} />
    </div>
  )
}

function RepoItem({
  repo,
  onOpen,
  pinned
}: {
  repo: { path: string; name: string; lastOpened: number }
  onOpen: (path: string) => void
  pinned?: boolean
}) {
  const togglePin = useRepoStore((s) => s.togglePin)
  const removeRecentRepo = useRepoStore((s) => s.removeRecentRepo)

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    removeRecentRepo(repo.path)
    toast.success(`Removed "${repo.name}" from recent repositories`)
  }

  return (
    <button
      onClick={() => onOpen(repo.path)}
      className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--bg-hover)] group"
    >
      {pinned ? (
        <Star size={12} className="text-[var(--color-warning)] fill-current shrink-0" />
      ) : (
        <Clock size={12} className="text-[var(--text-tertiary)] shrink-0" />
      )}
      <span className="text-sm text-[var(--text-primary)] flex-1 text-left truncate">
        {repo.name}
      </span>
      <span className="text-[10px] text-[var(--text-tertiary)] truncate max-w-[200px]">
        {repo.path}
      </span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation()
            togglePin(repo.path)
          }}
          className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--color-warning)] hover:bg-[var(--bg-app)] transition-colors"
          title={pinned ? 'Unpin repository' : 'Pin repository'}
        >
          <Pin size={11} />
        </button>
        <button
          onClick={handleRemove}
          className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--diff-del-text)] hover:bg-[var(--bg-app)] transition-colors"
          title="Remove from recent repositories"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </button>
  )
}

function CloneDialog({
  open,
  onClose,
  onClone
}: {
  open: boolean
  onClose: () => void
  onClone: (url: string, path: string) => Promise<boolean>
}) {
  const [url, setUrl] = useState('')
  const [localPath, setLocalPath] = useState('')
  const [loading, setLoading] = useState(false)

  const handleClone = async () => {
    if (!url || !localPath) return
    setLoading(true)
    await onClone(url, localPath)
    setLoading(false)
    onClose()
  }

  const handleBrowse = async () => {
    const result = await window.fsAPI.openDialog()
    if (result.ok && result.data) {
      setLocalPath(result.data)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose} title="Clone Repository">
      <div className="space-y-3">
        <div>
          <label className="text-xs text-[var(--text-secondary)] mb-1 block">
            Repository URL
          </label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/user/repo.git"
          />
        </div>
        <div>
          <label className="text-xs text-[var(--text-secondary)] mb-1 block">
            Local Path
          </label>
          <div className="flex gap-2">
            <Input
              value={localPath}
              onChange={(e) => setLocalPath(e.target.value)}
              placeholder="/path/to/clone"
              className="flex-1"
            />
            <Button onClick={handleBrowse} size="md">Browse</Button>
          </div>
        </div>
        <Button
          variant="primary"
          className="w-full"
          onClick={handleClone}
          disabled={!url || !localPath || loading}
        >
          {loading ? 'Cloning...' : 'Clone'}
        </Button>
      </div>
    </Dialog>
  )
}

function InitDialog({
  open,
  onClose,
  onInit
}: {
  open: boolean
  onClose: () => void
  onInit: (path: string) => Promise<boolean>
}) {
  const [localPath, setLocalPath] = useState('')
  const [loading, setLoading] = useState(false)

  const handleInit = async () => {
    if (!localPath) return
    setLoading(true)
    await onInit(localPath)
    setLoading(false)
    onClose()
  }

  const handleBrowse = async () => {
    const result = await window.fsAPI.openDialog()
    if (result.ok && result.data) {
      setLocalPath(result.data)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose} title="Initialize Repository">
      <div className="space-y-3">
        <div>
          <label className="text-xs text-[var(--text-secondary)] mb-1 block">
            Directory
          </label>
          <div className="flex gap-2">
            <Input
              value={localPath}
              onChange={(e) => setLocalPath(e.target.value)}
              placeholder="/path/to/directory"
              className="flex-1"
            />
            <Button onClick={handleBrowse} size="md">Browse</Button>
          </div>
        </div>
        <Button
          variant="primary"
          className="w-full"
          onClick={handleInit}
          disabled={!localPath || loading}
        >
          {loading ? 'Initializing...' : 'Initialize'}
        </Button>
      </div>
    </Dialog>
  )
}
