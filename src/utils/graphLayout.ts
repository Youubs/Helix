import { CommitNode } from '@/shared/types'

export const LANE_WIDTH = 14
export const ROW_HEIGHT = 24
export const NODE_RADIUS = 3.5
export const NODE_RADIUS_HEAD = 4.5
export const LANE_OFFSET = LANE_WIDTH / 2 + 2
export const EDGE_WIDTH = 1.5
export const EDGE_OPACITY = 0.6

export const GRAPH_COL_PADDING_LEFT = 10
export const GRAPH_COL_PADDING_RIGHT = 10
export const GRAPH_COL_MIN_WIDTH = 40
export const GRAPH_COL_MAX_WIDTH = 280

export function getRowHeight(_branchCount?: number): number {
  return ROW_HEIGHT
}

export interface Segment {
  fromLane: number
  toLane: number
  fromY: number
  toY: number
  color: string
}

export interface RowData {
  hash: string
  abbreviatedHash: string
  message: string
  body: string
  authorName: string
  authorEmail: string
  authorDate: string
  refs: CommitNode['refs']
  parents: string[]
  row: number
  nodeLane: number
  nodeColor: string
  segments: Segment[]
  maxLane: number
}

const LANE_COLORS = [
  'var(--lane-0)',
  'var(--lane-1)',
  'var(--lane-2)',
  'var(--lane-3)',
  'var(--lane-4)',
  'var(--lane-5)',
  'var(--lane-6)',
  'var(--lane-7)'
]

export function getBranchColor(lane: number): string {
  return LANE_COLORS[Math.abs(lane) % LANE_COLORS.length]
}

export function getBranchColorByName(name: string): string {
  if (/^(main|master)$/.test(name)) return LANE_COLORS[0]
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = ((h << 5) - h + name.charCodeAt(i)) | 0
  }
  return LANE_COLORS[Math.abs(h) % LANE_COLORS.length]
}

export function laneX(lane: number): number {
  return lane * LANE_WIDTH + LANE_OFFSET
}

export function computeGraphLayout(commits: CommitNode[], uncommittedCount: number = 0): RowData[] {
  if (commits.length === 0) {
    if (uncommittedCount > 0) {
      return [
        {
          hash: 'WORKING_TREE',
          abbreviatedHash: '*',
          message: `Uncommitted changes (${uncommittedCount} file${uncommittedCount > 1 ? 's' : ''})`,
          body: '',
          authorName: 'Local Changes',
          authorEmail: '',
          authorDate: '',
          refs: [],
          parents: [],
          row: 0,
          nodeLane: 0,
          nodeColor: 'var(--color-warning)',
          segments: [],
          maxLane: 0
        }
      ]
    }
    return []
  }

  const commitIndex = new Map<string, number>()
  commits.forEach((c, i) => commitIndex.set(c.hash, i))

  // `lanes[i]` is the hash that's reserved for the next commit in lane i
  // (i.e., a parent waiting to be drawn at its row). null = free slot.
  const lanes: (string | null)[] = []
  const rows: RowData[] = []

  // Track stable lane colors keyed by lane index assignment
  const laneColor = new Map<number, string>()

  for (let row = 0; row < commits.length; row++) {
    const commit = commits[row]

    // Snapshot lanes at top of row
    const topLanes = lanes.slice()

    // Determine this commit's lane
    let nodeLane = lanes.indexOf(commit.hash)
    if (nodeLane === -1) {
      nodeLane = lanes.indexOf(null)
      if (nodeLane === -1) {
        nodeLane = lanes.length
        lanes.push(null)
        topLanes.push(null)
      }
    }

    // Node consumes its lane
    lanes[nodeLane] = null

    // Assign / preserve lane color
    if (!laneColor.has(nodeLane)) {
      laneColor.set(nodeLane, LANE_COLORS[nodeLane % LANE_COLORS.length])
    }
    const nodeColor = laneColor.get(nodeLane)!

    // Reserve lanes for parents
    if (commit.parents.length > 0) {
      const firstParent = commit.parents[0]
      // First parent continues in node's lane unless already reserved elsewhere
      if (lanes.indexOf(firstParent) === -1) {
        lanes[nodeLane] = firstParent
      }
      for (let p = 1; p < commit.parents.length; p++) {
        const parent = commit.parents[p]
        if (lanes.indexOf(parent) === -1) {
          const free = lanes.indexOf(null)
          if (free === -1) {
            lanes.push(parent)
          } else {
            lanes[free] = parent
          }
        }
      }
    }

    const bottomLanes = lanes.slice()

    // Build segments
    const segments: Segment[] = []
    const maxLanes = Math.max(topLanes.length, bottomLanes.length)

    for (let lane = 0; lane < maxLanes; lane++) {
      const topHash = topLanes[lane]
      const bottomHash = bottomLanes[lane]

      if (topHash !== null && topHash !== undefined) {
        if (topHash === commit.hash) {
          // Line from top of this lane down to the node
          const color = laneColor.get(lane) || nodeColor
          segments.push({
            fromLane: lane,
            toLane: nodeLane,
            fromY: 0,
            toY: ROW_HEIGHT / 2,
            color
          })
        } else if (bottomHash === topHash) {
          // Pass-through line
          const color = laneColor.get(lane) || LANE_COLORS[lane % LANE_COLORS.length]
          if (!laneColor.has(lane)) laneColor.set(lane, color)
          segments.push({
            fromLane: lane,
            toLane: lane,
            fromY: 0,
            toY: ROW_HEIGHT,
            color
          })
        } else {
          // Hash moved to another lane at bottom
          const newLane = bottomLanes.indexOf(topHash)
          if (newLane !== -1) {
            const color = laneColor.get(lane) || LANE_COLORS[lane % LANE_COLORS.length]
            segments.push({
              fromLane: lane,
              toLane: newLane,
              fromY: 0,
              toY: ROW_HEIGHT,
              color
            })
          }
        }
      }
    }

    // Parent connections going out from node
    for (let p = 0; p < commit.parents.length; p++) {
      const parent = commit.parents[p]
      const parentLane = bottomLanes.indexOf(parent)
      if (parentLane === -1) continue

      // Color of the outgoing line is the parent lane's color
      if (!laneColor.has(parentLane)) {
        laneColor.set(parentLane, LANE_COLORS[parentLane % LANE_COLORS.length])
      }
      const color = laneColor.get(parentLane)!

      // Skip if topLanes already had this lane drawn as pass-through with same hash
      const alreadyDrawn = topLanes[parentLane] === parent
      if (alreadyDrawn && parentLane === nodeLane) {
        // First parent staying in same lane: draw node-to-bottom
        segments.push({
          fromLane: nodeLane,
          toLane: parentLane,
          fromY: ROW_HEIGHT / 2,
          toY: ROW_HEIGHT,
          color
        })
      } else if (!alreadyDrawn) {
        // New lane allocated for this parent
        segments.push({
          fromLane: nodeLane,
          toLane: parentLane,
          fromY: ROW_HEIGHT / 2,
          toY: ROW_HEIGHT,
          color
        })
      }
    }

    // Trim trailing nulls
    while (lanes.length > 0 && lanes[lanes.length - 1] === null) {
      lanes.pop()
    }

    rows.push({
      hash: commit.hash,
      abbreviatedHash: commit.abbreviatedHash,
      message: commit.message,
      body: commit.body,
      authorName: commit.authorName,
      authorEmail: commit.authorEmail,
      authorDate: commit.authorDate,
      refs: commit.refs,
      parents: commit.parents,
      row,
      nodeLane,
      nodeColor,
      segments,
      maxLane: Math.max(topLanes.length, bottomLanes.length) - 1
    })
  }

  if (uncommittedCount > 0 && rows.length > 0) {
    const headRow = rows[0]
    const headLane = headRow.nodeLane
    const wtColor = 'var(--color-warning)'
    const wtRow: RowData = {
      hash: 'WORKING_TREE',
      abbreviatedHash: '*',
      message: `Uncommitted changes (${uncommittedCount} file${uncommittedCount > 1 ? 's' : ''})`,
      body: '',
      authorName: 'Local Changes',
      authorEmail: '',
      authorDate: '',
      refs: [],
      parents: [headRow.hash],
      row: 0,
      nodeLane: headLane,
      nodeColor: wtColor,
      segments: [
        {
          fromLane: headLane,
          toLane: headLane,
          fromY: ROW_HEIGHT / 2,
          toY: ROW_HEIGHT,
          color: wtColor
        }
      ],
      maxLane: headRow.maxLane
    }

    for (const r of rows) {
      r.row += 1
    }

    return [wtRow, ...rows]
  }

  return rows
}

export function getMaxLane(rows: RowData[]): number {
  if (rows.length === 0) return 0
  return rows.reduce((m, r) => Math.max(m, r.maxLane, r.nodeLane), 0)
}

export function getMaxConcurrentLanes(rows: RowData[]): number {
  let max = 0
  for (const row of rows) {
    max = Math.max(max, row.maxLane + 1, row.nodeLane + 1)
  }
  return Math.max(1, max)
}

export function computeGraphColWidth(maxLanes: number): number {
  const raw = GRAPH_COL_PADDING_LEFT + maxLanes * LANE_WIDTH + GRAPH_COL_PADDING_RIGHT
  return Math.min(Math.max(raw, GRAPH_COL_MIN_WIDTH), GRAPH_COL_MAX_WIDTH)
}

export function getLaneX(laneIndex: number, colWidth: number, totalLanes: number): number {
  const totalWidth = totalLanes * LANE_WIDTH
  const offsetX = (colWidth - totalWidth) / 2
  return offsetX + laneIndex * LANE_WIDTH + LANE_WIDTH / 2
}
