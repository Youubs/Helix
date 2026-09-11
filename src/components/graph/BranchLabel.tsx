import React from 'react'
import { Check, Monitor, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import './BranchLabel.css'

export type BranchKind = 'local' | 'remote' | 'merged' | 'head' | 'tag'

export type SyncStatus = 'synced' | 'ahead' | 'behind' | 'diverged' | null

export interface BranchRef {
  kind: BranchKind
  name: string
  remoteName?: string
  syncStatus?: SyncStatus
  isActive: boolean
  laneColor: string
  aheadCount?: number
}

const SYNC_ICONS: Record<string, React.ReactNode> = {
  synced: <ArrowUpDown size={9} />,
  ahead: <ArrowUp size={9} />,
  behind: <ArrowDown size={9} />,
  diverged: <ArrowUpDown size={9} />,
}

export const BranchLabel = React.memo(function BranchLabel({
  branch,
  onCheckout
}: {
  branch: BranchRef
  onCheckout?: (branchName: string) => void
}) {
  return (
    <div
      className="branch-label cursor-pointer select-none"
      data-kind={branch.kind}
      data-active={branch.isActive}
      style={{ '--lane-color': branch.laneColor } as React.CSSProperties}
      title={`Double-click to checkout ${branch.name}`}
      onDoubleClick={(e) => {
        e.stopPropagation()
        onCheckout?.(branch.name)
      }}
    >
      {branch.isActive && (
        <span className="branch-label__check">
          <Check size={9} />
        </span>
      )}

      <span className="branch-label__name">
        {branch.name}
      </span>

      <span className="branch-label__icons" aria-hidden>
        {(branch.kind === 'merged' || branch.kind === 'local') && (
          <Monitor size={9} />
        )}
        {branch.kind === 'merged' && branch.syncStatus && SYNC_ICONS[branch.syncStatus]}
      </span>

      {branch.aheadCount != null && branch.aheadCount > 0 && (
        <span className="branch-label__badge">+{branch.aheadCount}</span>
      )}
    </div>
  )
})
