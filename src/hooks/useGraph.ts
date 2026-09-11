import { useMemo } from 'react'
import { CommitNode } from '@/shared/types'
import { computeGraphLayout, RowData } from '@/utils/graphLayout'

export function useGraph(commits: CommitNode[], uncommittedCount: number = 0): RowData[] {
  return useMemo(() => computeGraphLayout(commits, uncommittedCount), [commits, uncommittedCount])
}
