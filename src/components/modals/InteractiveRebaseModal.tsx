import React, { useState } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Play } from 'lucide-react'
import type { CommitNode } from '@/shared/types'
import { useGit } from '@/hooks/useGit'

export type RebaseActionType = 'pick' | 'squash' | 'reword' | 'drop'

export interface RebaseItem {
  commit: CommitNode
  action: RebaseActionType
  rewordMessage?: string
}

interface InteractiveRebaseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetCommits: CommitNode[]
}

export function InteractiveRebaseModal({
  open,
  onOpenChange,
  targetCommits
}: InteractiveRebaseModalProps) {
  const { rebase } = useGit()
  const [items, setItems] = useState<RebaseItem[]>(() =>
    targetCommits.map((c) => ({ commit: c, action: 'pick' }))
  )

  const handleActionChange = (hash: string, action: RebaseActionType) => {
    setItems((prev) =>
      prev.map((item) => (item.commit.hash === hash ? { ...item, action } : item))
    )
  }

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= items.length) return
    const updated = [...items]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp
    setItems(updated)
  }

  const handleExecute = async () => {
    if (items.length === 0) return
    const baseCommit = items[items.length - 1].commit.hash
    await rebase(baseCommit)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Interactive Rebase Planner (git rebase -i)">
      <div className="space-y-3 py-2 select-none">
        <div className="max-h-80 overflow-y-auto space-y-2 font-mono text-xs pr-1">
          {items.map((item, index) => (
            <div
              key={item.commit.hash}
              className={`flex items-center gap-2 p-2 border rounded transition-all ${
                item.action === 'drop'
                  ? 'bg-red-500/10 border-red-500/30 opacity-60'
                  : 'bg-[var(--bg-surface)] border-[var(--border-default)]'
              }`}
            >
              {/* Order Controls */}
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => handleMove(index, 'up')}
                  disabled={index === 0}
                  className="hover:text-[var(--accent-primary)] disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  onClick={() => handleMove(index, 'down')}
                  disabled={index === items.length - 1}
                  className="hover:text-[var(--accent-primary)] disabled:opacity-30"
                >
                  ▼
                </button>
              </div>

              {/* Action Selector */}
              <select
                value={item.action}
                onChange={(e) => handleActionChange(item.commit.hash, e.target.value as RebaseActionType)}
                className="px-2 py-1 bg-[var(--bg-app)] border border-[var(--border-default)] rounded text-[11px] font-semibold text-[var(--text-primary)] focus:outline-none"
              >
                <option value="pick">pick</option>
                <option value="squash">squash</option>
                <option value="reword">reword</option>
                <option value="drop">drop</option>
              </select>

              {/* SHA */}
              <span className="text-[var(--text-tertiary)] font-bold">{item.commit.abbreviatedHash}</span>

              {/* Message */}
              <span className="flex-1 truncate text-[var(--text-primary)]">{item.commit.message}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-[var(--border-default)]">
          <button
            onClick={() => onOpenChange(false)}
            className="px-3 py-1.5 text-xs bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleExecute}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-[var(--accent-primary)] text-white font-medium rounded hover:brightness-110"
          >
            <Play size={13} />
            <span>Start Rebase</span>
          </button>
        </div>
      </div>
    </Dialog>
  )
}
