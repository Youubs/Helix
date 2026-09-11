import React, { useState } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useProfileStore } from '@/stores/profileStore'
import { useGitStore } from '@/stores/gitStore'
import { toast } from 'sonner'

interface CreatePRDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreatePRDialog({ open, onOpenChange }: CreatePRDialogProps) {
  const activeProfile = useProfileStore((s) => s.activeProfile)
  const remotes = useGitStore((s) => s.remotes)
  const status = useGitStore((s) => s.status)
  const commits = useGitStore((s) => s.commits)

  const [title, setTitle] = useState(commits[0]?.message || '')
  const [description, setDescription] = useState('')
  const [targetBranch, setTargetBranch] = useState('main')
  const [isDraft, setIsDraft] = useState(false)
  const [creating, setCreating] = useState(false)

  const currentBranch = status?.current || ''
  const azureRemote = remotes.find((r) =>
    r.fetchUrl.includes('dev.azure.com') || r.fetchUrl.includes('visualstudio.com')
  )

  const integration = activeProfile?.integrations.azureDevOps?.find((i) => {
    if (!azureRemote) return false
    return azureRemote.fetchUrl.includes(new URL(i.organizationUrl).hostname)
  })

  const repoIdFromRemote = azureRemote?.fetchUrl.match(/_git\/([^/]+)/)?.[1]
  const projectFromRemote = azureRemote?.fetchUrl.match(/dev\.azure\.com\/[^/]+\/([^/]+)/)?.[1]

  const handleCreate = async () => {
    if (!activeProfile || !integration || !repoIdFromRemote || !projectFromRemote) return
    setCreating(true)

    const result = await window.azureAPI.createPR({
      profileId: activeProfile.id,
      integrationId: integration.id,
      project: projectFromRemote,
      repoId: repoIdFromRemote,
      title,
      description,
      sourceRefName: `refs/heads/${currentBranch}`,
      targetRefName: `refs/heads/${targetBranch}`,
      isDraft
    })

    if (result.ok) {
      toast.success('Pull request created')
      if (result.data.url) {
        window.open(result.data.url, '_blank')
      }
      onOpenChange(false)
    } else {
      toast.error(result.error)
    }
    setCreating(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Create Pull Request">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
          <span className="px-1.5 py-0.5 rounded bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-mono">
            {currentBranch}
          </span>
          <span>→</span>
          <Input
            value={targetBranch}
            onChange={(e) => setTargetBranch(e.target.value)}
            placeholder="main"
            className="w-32 text-xs"
          />
        </div>

        <div>
          <label className="text-xs text-[var(--text-secondary)] mb-1 block">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="PR title"
          />
        </div>

        <div>
          <label className="text-xs text-[var(--text-secondary)] mb-1 block">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your changes (Markdown)"
            className="w-full h-24 px-3 py-2 text-xs rounded border border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-primary)] resize-none focus:outline-none focus:border-[var(--accent-primary)]"
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer">
          <input
            type="checkbox"
            checked={isDraft}
            onChange={(e) => setIsDraft(e.target.checked)}
            className="rounded"
          />
          Create as draft
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!title || creating}>
            {creating ? 'Creating...' : 'Create Pull Request'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
