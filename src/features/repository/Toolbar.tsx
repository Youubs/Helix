import React, { useState } from 'react'
import { CloudDownload, CloudUpload, ChevronDown, Globe } from 'lucide-react'
import { useGit } from '@/hooks/useGit'
import { useGitStore } from '@/stores/gitStore'
import { useRepoStore } from '@/stores/repoStore'
import { RemoteManagerModal } from '@/components/modals/RemoteManagerModal'
import { SetUpstreamModal } from '@/components/modals/SetUpstreamModal'
import './Toolbar.css'

export function Toolbar() {
  const { fetchAll, push, openRepo } = useGit()
  const loading = useGitStore((s) => s.loading)
  const status = useGitStore((s) => s.status)
  const remotes = useGitStore((s) => s.remotes)
  const repoName = useRepoStore((s) => s.tabs.find((t) => t.id === s.activeTabId)?.name || 'Helix')
  const [remoteModalOpen, setRemoteModalOpen] = useState(false)
  const [setUpstreamOpen, setSetUpstreamOpen] = useState(false)

  const currentBranch = status?.current ?? 'HEAD'
  const primaryRemote = remotes[0]?.name || 'origin'

  const handlePush = async () => {
    if (remotes.length === 0) {
      setRemoteModalOpen(true)
      return
    }

    if (!status?.tracking) {
      setSetUpstreamOpen(true)
      return
    }

    const res = await push()
    if (
      res &&
      !res.ok &&
      (res.error?.includes('no upstream branch') || res.error?.includes('--set-upstream'))
    ) {
      setSetUpstreamOpen(true)
    }
  }

  return (
    <div className="toolbar titlebar-drag">
      {/* Left — repo & branch context */}
      <div className="toolbar-context titlebar-no-drag">
        <span className="toolbar-label">repository</span>
        <button className="toolbar-dropdown" onClick={() => openRepo()} title="Open another repository in new tab">
          {repoName}
          <ChevronDown size={10} />
        </button>

        <span className="toolbar-separator">{'\u203A'}</span>

        <span className="toolbar-label">branch</span>
        <button className="toolbar-dropdown font-mono text-[var(--accent-primary)]">
          {currentBranch}
          <ChevronDown size={10} />
        </button>
      </div>

      {/* Center — Actions (Pull, Push, Remotes) */}
      <div className="toolbar-center titlebar-no-drag">
        <button
          className="toolbar-action-btn"
          onClick={() => fetchAll()}
          disabled={loading}
          title="Pull from remote (git pull)"
        >
          <span className="icon"><CloudDownload size={16} /></span>
          <span className="label">Pull</span>
        </button>

        <button
          className="toolbar-action-btn"
          onClick={handlePush}
          disabled={loading}
          title="Push to remote (git push)"
        >
          <span className="icon"><CloudUpload size={16} /></span>
          <span className="label">Push</span>
        </button>

        <button
          className="toolbar-action-btn"
          onClick={() => setRemoteModalOpen(true)}
          disabled={loading}
          title="Manage remotes (add origin, remove, fetch)"
        >
          <span className="icon"><Globe size={15} /></span>
          <span className="label">Remotes</span>
        </button>
      </div>

      <div className="toolbar-right titlebar-no-drag" />

      <RemoteManagerModal
        open={remoteModalOpen}
        onOpenChange={setRemoteModalOpen}
      />

      <SetUpstreamModal
        open={setUpstreamOpen}
        onOpenChange={setSetUpstreamOpen}
        branch={currentBranch}
        remote={primaryRemote}
      />
    </div>
  )
}
