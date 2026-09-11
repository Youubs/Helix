import React from 'react'
import { GitBranch, ArrowUp, ArrowDown, Loader2 } from 'lucide-react'
import { useGitStore } from '@/stores/gitStore'

export function StatusBar() {
  const status = useGitStore((s) => s.status)
  const loading = useGitStore((s) => s.loading)

  return (
    <div className="h-6 flex items-center px-3 gap-3 border-t border-[var(--border-default)] bg-[var(--bg-surface)] text-[10px] text-[var(--text-tertiary)] shrink-0">
      {loading && <Loader2 size={10} className="animate-spin" />}

      {status?.current && (
        <div className="flex items-center gap-1">
          <GitBranch size={10} className="text-[var(--accent-primary)]" />
          <span className="text-[var(--text-secondary)]">{status.current}</span>
        </div>
      )}

      {status?.tracking && (
        <span className="text-[var(--text-tertiary)]">{status.tracking}</span>
      )}

      {(status?.ahead ?? 0) > 0 && (
        <div className="flex items-center gap-0.5">
          <ArrowUp size={9} />
          <span>{status!.ahead}</span>
        </div>
      )}

      {(status?.behind ?? 0) > 0 && (
        <div className="flex items-center gap-0.5">
          <ArrowDown size={9} />
          <span>{status!.behind}</span>
        </div>
      )}

      <div className="flex-1" />

      {status && (
        <span>
          {status.staged.length} staged, {status.unstaged.length} modified, {status.untracked.length} untracked
        </span>
      )}
    </div>
  )
}
