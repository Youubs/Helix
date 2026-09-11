import React from 'react'
import { CommitGraph } from '@/components/graph/CommitGraph'

export function CommitPanel() {
  return (
    <div className="h-full flex flex-col bg-[var(--bg-app)] overflow-hidden">
      <CommitGraph />
    </div>
  )
}
