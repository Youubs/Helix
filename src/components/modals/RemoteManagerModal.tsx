import React, { useState, useEffect } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Plus, Trash2, RefreshCw } from 'lucide-react'
import { useGitStore } from '@/stores/gitStore'
import { useGit } from '@/hooks/useGit'
import { toast } from 'sonner'

interface RemoteManagerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RemoteManagerModal({ open, onOpenChange }: RemoteManagerModalProps) {
  const remotes = useGitStore((s) => s.remotes)
  const refresh = useGitStore((s) => s.refresh)
  const { fetchAll } = useGit()

  const [name, setName] = useState('origin')
  const [url, setUrl] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (open && remotes.length === 0 && !name) {
      setName('origin')
    }
  }, [open, remotes.length])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const remoteName = name.trim()
    const remoteUrl = url.trim()
    if (!remoteName || !remoteUrl) return
    setAdding(true)
    const res = await window.gitAPI.addRemote(remoteName, remoteUrl)
    if (res?.ok) {
      toast.success(`Remote "${remoteName}" added successfully`)
      setName(remotes.length === 0 ? '' : 'origin')
      setUrl('')
      refresh()
    } else {
      toast.error(res?.error || 'Failed to add remote')
    }
    setAdding(false)
  }

  const handleRemove = async (remoteName: string) => {
    const res = await window.gitAPI.removeRemote(remoteName)
    if (res?.ok) {
      toast.success(`Remote "${remoteName}" removed`)
      refresh()
    } else {
      toast.error(res?.error || 'Failed to remove remote')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Remote Repository Management">
      <div className="space-y-4 pt-2">
        {/* Action Bar */}
        <div className="flex justify-end">
          <button
            onClick={() => fetchAll()}
            className="flex items-center gap-1.5 px-3 py-1 text-xs bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] rounded transition-colors"
          >
            <RefreshCw size={12} />
            <span>Fetch All & Prune</span>
          </button>
        </div>

        {/* Remote List */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {remotes.length === 0 ? (
            <div className="p-3 text-center text-xs text-[var(--text-tertiary)] border border-dashed border-[var(--border-default)] rounded">
              No remotes configured
            </div>
          ) : (
            remotes.map((remote) => (
              <div
                key={remote.name}
                className="flex items-center justify-between p-2.5 bg-[var(--bg-app)] border border-[var(--border-default)] rounded text-xs"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                    <span>{remote.name}</span>
                  </div>
                  <div className="text-[11px] text-[var(--text-tertiary)] truncate font-mono mt-0.5">
                    {remote.fetchUrl || remote.pushUrl}
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(remote.name)}
                  className="p-1 rounded hover:bg-red-500/20 text-[var(--text-tertiary)] hover:text-red-400 transition-colors"
                  title={`Delete remote ${remote.name}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add Remote Form */}
        <form onSubmit={handleAdd} className="p-3 bg-[var(--bg-app)] border border-[var(--border-default)] rounded space-y-2">
          <div className="text-xs font-semibold text-[var(--text-secondary)]">Add Remote</div>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name (e.g. origin)"
              className="w-1/3 px-2 py-1 text-xs bg-[var(--bg-surface)] border border-[var(--border-default)] rounded font-mono focus:outline-none focus:border-[var(--accent-primary)]"
            />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Git URL (git@... or https://...)"
              className="flex-1 px-2 py-1 text-xs bg-[var(--bg-surface)] border border-[var(--border-default)] rounded font-mono focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
          <button
            type="submit"
            disabled={adding || !name.trim() || !url.trim()}
            className="w-full flex items-center justify-center gap-1 py-1 text-xs bg-[var(--accent-primary)] text-white font-medium rounded hover:brightness-110 disabled:opacity-50 transition-all"
          >
            <Plus size={13} />
            <span>Add Remote</span>
          </button>
        </form>
      </div>
    </Dialog>
  )
}
