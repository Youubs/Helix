import React, { useState, useEffect } from 'react'
import { ExternalLink, GitBranch, ArrowRight, Filter } from 'lucide-react'
import { useProfileStore } from '@/stores/profileStore'
import { useGitStore } from '@/stores/gitStore'
import { useGit } from '@/hooks/useGit'
import { toast } from 'sonner'
import type { AzurePullRequest } from '@/shared/types'

type PRFilter = 'active' | 'completed' | 'all'

export function PullRequestPanel() {
  const activeProfile = useProfileStore((s) => s.activeProfile)
  const remotes = useGitStore((s) => s.remotes)
  const [prs, setPrs] = useState<AzurePullRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<PRFilter>('active')
  const { checkout } = useGit()

  const azureRemote = remotes.find((r) =>
    r.fetchUrl.includes('dev.azure.com') || r.fetchUrl.includes('visualstudio.com')
  )

  const integration = activeProfile?.integrations.azureDevOps?.find((i) => {
    if (!azureRemote) return false
    return azureRemote.fetchUrl.includes(
      new URL(i.organizationUrl).hostname
    )
  })

  const repoIdFromRemote = azureRemote?.fetchUrl.match(/_git\/([^/]+)/)?.[1]
  const projectFromRemote = azureRemote?.fetchUrl.match(/dev\.azure\.com\/[^/]+\/([^/]+)/)?.[1]

  useEffect(() => {
    if (!activeProfile || !integration || !repoIdFromRemote || !projectFromRemote) return
    loadPRs()
  }, [activeProfile?.id, integration?.id, filter])

  const loadPRs = async () => {
    if (!activeProfile || !integration || !repoIdFromRemote || !projectFromRemote) return
    setLoading(true)
    const result = await window.azureAPI.listPullRequests({
      profileId: activeProfile.id,
      integrationId: integration.id,
      project: projectFromRemote,
      repoId: repoIdFromRemote,
      status: filter === 'all' ? undefined : filter
    })
    if (result.ok) setPrs(result.data)
    else toast.error(result.error)
    setLoading(false)
  }

  if (!azureRemote || !integration) {
    return (
      <div className="p-4 text-xs text-[var(--text-tertiary)] text-center">
        No Azure DevOps remote detected for this repository.
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border-default)]">
        <span className="text-xs font-medium text-[var(--text-secondary)]">Pull Requests</span>
        <div className="flex-1" />
        <div className="flex items-center gap-0.5 rounded border border-[var(--border-default)] overflow-hidden">
          {(['active', 'completed', 'all'] as PRFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-0.5 text-[10px] capitalize ${
                filter === f
                  ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]'
                  : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-xs text-[var(--text-tertiary)]">Loading...</div>
        ) : prs.length === 0 ? (
          <div className="p-4 text-xs text-[var(--text-tertiary)] text-center">No pull requests</div>
        ) : (
          prs.map((pr) => (
            <PRRow key={pr.id} pr={pr} onCheckout={checkout} />
          ))
        )}
      </div>
    </div>
  )
}

function PRRow({ pr, onCheckout }: { pr: AzurePullRequest; onCheckout: (ref: string) => void }) {
  const sourceBranch = pr.sourceRefName.replace('refs/heads/', '')
  const targetBranch = pr.targetRefName.replace('refs/heads/', '')

  const statusColor =
    pr.status === 'active'
      ? 'text-[var(--accent-primary)]'
      : pr.status === 'completed'
        ? 'text-[var(--diff-add-text)]'
        : 'text-[var(--text-tertiary)]'

  return (
    <div className="px-3 py-2 border-b border-[var(--border-default)]/50 hover:bg-[var(--bg-hover)]">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {pr.isDraft && (
              <span className="text-[9px] px-1 py-0.5 rounded bg-[var(--color-warning)]/15 text-[var(--color-warning)] font-medium uppercase">
                Draft
              </span>
            )}
            <span className="text-xs font-medium text-[var(--text-primary)] truncate">
              {pr.title}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5 text-[10px] text-[var(--text-tertiary)]">
            <GitBranch size={9} />
            <span className="truncate">{sourceBranch}</span>
            <ArrowRight size={8} />
            <span className="truncate">{targetBranch}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--text-tertiary)]">
            <span>{pr.createdBy.displayName}</span>
            <span className={statusColor}>• {pr.status}</span>
            {pr.mergeStatus === 'conflicts' && (
              <span className="text-[var(--color-danger)]">⚠ conflicts</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onCheckout(sourceBranch)}
            className="p-1 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            title="Checkout branch"
          >
            <GitBranch size={11} />
          </button>
          <button
            onClick={() => window.open(pr.url, '_blank')}
            className="p-1 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            title="Open in browser"
          >
            <ExternalLink size={11} />
          </button>
        </div>
      </div>

      {pr.reviewers.length > 0 && (
        <div className="flex items-center gap-1 mt-1.5">
          {pr.reviewers.slice(0, 4).map((r) => (
            <span
              key={r.uniqueName}
              className={`text-[9px] px-1 py-0.5 rounded border ${
                r.vote > 0
                  ? 'border-[var(--diff-add-text)]/50 text-[var(--diff-add-text)]'
                  : r.vote < 0
                    ? 'border-[var(--color-danger)]/50 text-[var(--color-danger)]'
                    : 'border-[var(--border-default)] text-[var(--text-tertiary)]'
              }`}
              title={r.displayName}
            >
              {r.displayName.split(' ').map((w) => w[0]).join('').slice(0, 2)}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
