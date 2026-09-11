import { computeGraphLayout } from '../utils/graphLayout'
import type { CommitNode } from '../shared/types'

self.onmessage = (e: MessageEvent<{ commits: CommitNode[]; uncommittedCount: number }>) => {
  const { commits, uncommittedCount } = e.data
  const rows = computeGraphLayout(commits, uncommittedCount)
  self.postMessage({ rows })
}
