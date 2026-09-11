import type { RefInfo, BranchInfo } from '@/shared/types'
import type { BranchRef, SyncStatus } from '@/components/graph/BranchLabel'
import { stripRemotePrefix } from '@/utils/refParser'

export function mergeRefs(
  rawRefs: RefInfo[],
  laneColor: string,
  branchInfos: BranchInfo[] = [],
  remoteNames: string[] = ['origin']
): BranchRef[] {
  const result: BranchRef[] = []
  const consumedRemotes = new Set<string>()

  const currentBranch = branchInfos.find((b) => b.current)

  const localBranches = rawRefs.filter((r) => r.type === 'local-branch')
  const remoteBranches = rawRefs.filter((r) => {
    if (r.type !== 'remote-branch') return false
    const { shortName } = stripRemotePrefix(r.name, remoteNames)
    return shortName !== 'HEAD' && !r.name.endsWith('/HEAD')
  })

  const seenNames = new Set<string>()

  for (const local of localBranches) {
    const shortName = local.name
    if (!shortName || shortName === 'HEAD' || seenNames.has(shortName)) continue
    seenNames.add(shortName)

    const matchingRemotes = remoteBranches.filter((r) => {
      const { shortName: remoteShort } = stripRemotePrefix(r.name, remoteNames)
      return remoteShort === shortName
    })

    if (matchingRemotes.length > 0) {
      for (const mr of matchingRemotes) {
        consumedRemotes.add(mr.name)
      }
      const { remoteName } = stripRemotePrefix(matchingRemotes[0].name, remoteNames)

      const info = branchInfos.find((b) => b.name === shortName)
      const syncStatus = computeSyncFromInfo(info)

      result.push({
        kind: 'merged',
        name: shortName,
        remoteName: remoteName ?? undefined,
        syncStatus,
        isActive: currentBranch?.name === shortName,
        laneColor,
      })
    } else {
      result.push({
        kind: 'local',
        name: shortName,
        isActive: currentBranch?.name === shortName,
        laneColor,
      })
    }
  }

  for (const remote of remoteBranches) {
    if (consumedRemotes.has(remote.name)) continue
    const { shortName, remoteName } = stripRemotePrefix(remote.name, remoteNames)
    if (!shortName || shortName === 'HEAD' || seenNames.has(shortName)) continue
    seenNames.add(shortName)

    result.push({
      kind: 'remote',
      name: shortName,
      remoteName: remoteName ?? undefined,
      isActive: false,
      laneColor,
    })
  }

  return result
}

function computeSyncFromInfo(info: BranchInfo | undefined): SyncStatus {
  if (!info) return 'synced'
  const ahead = info.ahead ?? 0
  const behind = info.behind ?? 0
  if (ahead === 0 && behind === 0) return 'synced'
  if (ahead > 0 && behind === 0) return 'ahead'
  if (behind > 0 && ahead === 0) return 'behind'
  return 'diverged'
}
