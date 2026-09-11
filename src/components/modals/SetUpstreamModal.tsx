import React, { useState } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { CloudUpload, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useGit } from '@/hooks/useGit'
import { useGitStore } from '@/stores/gitStore'
import { toast } from 'sonner'

interface SetUpstreamModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  branch: string
  remote?: string
  onSuccess?: () => void
}

export function SetUpstreamModal({
  open,
  onOpenChange,
  branch,
  remote = 'origin',
  onSuccess
}: SetUpstreamModalProps) {
  const { push } = useGit()
  const refresh = useGitStore((s) => s.refresh)
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const result = await window.gitAPI.push({
        remote,
        branch,
        setUpstream: true
      })

      if (result.ok) {
        toast.success(`Published ${branch} and set upstream to ${remote}/${branch}`)
        onOpenChange(false)
        await refresh()
        onSuccess?.()
      } else {
        toast.error(result.error || 'Failed to push with upstream')
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred during push')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Push Branch & Set Upstream"
      description={`The branch "${branch}" has no upstream tracking branch configured on remote "${remote}".`}
    >
      <div className="space-y-4 pt-2">
        <div className="flex items-start gap-3 p-3 bg-[var(--bg-app)] border border-[var(--border-default)] rounded text-xs">
          <AlertCircle size={16} className="text-[var(--color-warning)] shrink-0 mt-0.5" />
          <div className="space-y-1 text-[var(--text-secondary)]">
            <p>
              To push commits, Git requires publishing this branch to the remote and configuring it as the upstream tracking branch.
            </p>
            <div className="font-mono text-[11px] text-[var(--accent-primary)] bg-[var(--bg-surface)] p-1.5 rounded border border-[var(--border-default)] mt-2">
              git push --set-upstream {remote} {branch}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            disabled={loading}
          >
            <CloudUpload size={14} className={loading ? 'animate-bounce' : ''} />
            {loading ? 'Pushing...' : 'Push & Set Upstream'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
