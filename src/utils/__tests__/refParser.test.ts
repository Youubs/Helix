import { describe, it, expect } from 'vitest'
import { stripRemotePrefix } from '../refParser'
import { mergeRefs } from '../branchMerger'
import type { RefInfo } from '@/shared/types'

const REMOTES = ['origin', 'upstream']

describe('stripRemotePrefix', () => {
  it('extracts shortName correctly for a remote with slashes in branch name', () => {
    const result = stripRemotePrefix('origin/feat/akr/magic-link-teams', REMOTES)
    expect(result.shortName).toBe('feat/akr/magic-link-teams')
    expect(result.remoteName).toBe('origin')
  })

  it('handles upstream as remote (not just origin)', () => {
    const result = stripRemotePrefix('upstream/feat/akr/magic-link-teams', REMOTES)
    expect(result.shortName).toBe('feat/akr/magic-link-teams')
    expect(result.remoteName).toBe('upstream')
  })

  it('strips remotes/ prefix if present', () => {
    const result = stripRemotePrefix('remotes/origin/feat/akr/magic-link-teams', REMOTES)
    expect(result.shortName).toBe('feat/akr/magic-link-teams')
    expect(result.remoteName).toBe('origin')
  })

  it('does not confuse a branch name starting like a remote name', () => {
    // If "feat" is NOT a known remote, it should not be stripped
    const result = stripRemotePrefix('feat/akr/magic-link-teams', REMOTES)
    // Falls back to first-segment strip since no known remote matches
    expect(result.shortName).toBe('akr/magic-link-teams')
    expect(result.remoteName).toBe('feat')
  })

  it('correctly handles a remote named "feat" if it exists', () => {
    const remotes = ['feat', 'origin']
    const result = stripRemotePrefix('feat/akr/magic-link-teams', remotes)
    expect(result.remoteName).toBe('feat')
    expect(result.shortName).toBe('akr/magic-link-teams')
  })

  it('prefers longest matching remote prefix', () => {
    const remotes = ['up', 'upstream']
    const result = stripRemotePrefix('upstream/main', remotes)
    expect(result.remoteName).toBe('upstream')
    expect(result.shortName).toBe('main')
  })

  it('handles simple branch name with known remote', () => {
    const result = stripRemotePrefix('origin/main', REMOTES)
    expect(result.shortName).toBe('main')
    expect(result.remoteName).toBe('origin')
  })
})

describe('mergeRefs - deduplication', () => {
  it('merges local and remote of same shortName into one merged label', () => {
    const refs: RefInfo[] = [
      { name: 'feat/akr/magic-link-teams', type: 'local-branch' },
      { name: 'origin/feat/akr/magic-link-teams', type: 'remote-branch' },
    ]
    const result = mergeRefs(refs, 'var(--lane-0)', [], REMOTES)
    const branchLabels = result.filter((b) => b.kind !== 'head')
    expect(branchLabels).toHaveLength(1)
    expect(branchLabels[0].kind).toBe('merged')
    expect(branchLabels[0].name).toBe('feat/akr/magic-link-teams')
    expect(branchLabels[0].remoteName).toBe('origin')
  })

  it('does NOT produce a ghost "akr/magic-link-teams" label', () => {
    const refs: RefInfo[] = [
      { name: 'feat/akr/magic-link-teams', type: 'local-branch' },
      { name: 'origin/feat/akr/magic-link-teams', type: 'remote-branch' },
    ]
    const result = mergeRefs(refs, 'var(--lane-0)', [], REMOTES)
    const names = result.map((b) => b.name)
    expect(names).not.toContain('akr/magic-link-teams')
  })

  it('HEAD + local + remote produces max 2 labels (HEAD + merged)', () => {
    const refs: RefInfo[] = [
      { name: 'HEAD', type: 'head' },
      { name: 'feat/akr/magic-link-teams', type: 'local-branch' },
      { name: 'origin/feat/akr/magic-link-teams', type: 'remote-branch' },
    ]
    const result = mergeRefs(refs, 'var(--lane-0)', [], REMOTES)
    expect(result).toHaveLength(2)
    expect(result[0].kind).toBe('head')
    expect(result[1].kind).toBe('merged')
  })

  it('shows remote-only branch when no local exists', () => {
    const refs: RefInfo[] = [
      { name: 'origin/fix/other-thing', type: 'remote-branch' },
    ]
    const result = mergeRefs(refs, 'var(--lane-0)', [], REMOTES)
    expect(result).toHaveLength(1)
    expect(result[0].kind).toBe('remote')
    expect(result[0].name).toBe('fix/other-thing')
    expect(result[0].remoteName).toBe('origin')
  })

  it('shows local-only branch when no remote exists', () => {
    const refs: RefInfo[] = [
      { name: 'feat/local-only', type: 'local-branch' },
    ]
    const result = mergeRefs(refs, 'var(--lane-0)', [], REMOTES)
    expect(result).toHaveLength(1)
    expect(result[0].kind).toBe('local')
    expect(result[0].name).toBe('feat/local-only')
  })

  it('handles upstream remote correctly', () => {
    const refs: RefInfo[] = [
      { name: 'main', type: 'local-branch' },
      { name: 'upstream/main', type: 'remote-branch' },
    ]
    const result = mergeRefs(refs, 'var(--lane-0)', [], REMOTES)
    const branchLabels = result.filter((b) => b.kind !== 'head')
    expect(branchLabels).toHaveLength(1)
    expect(branchLabels[0].kind).toBe('merged')
    expect(branchLabels[0].name).toBe('main')
    expect(branchLabels[0].remoteName).toBe('upstream')
  })

  it('handles tags correctly without dedup issues', () => {
    const refs: RefInfo[] = [
      { name: 'main', type: 'local-branch' },
      { name: 'origin/main', type: 'remote-branch' },
      { name: 'v2.1.0', type: 'tag' },
    ]
    const result = mergeRefs(refs, 'var(--lane-0)', [], REMOTES)
    expect(result).toHaveLength(2)
    expect(result[0].kind).toBe('merged')
    expect(result[1].kind).toBe('tag')
    expect(result[1].name).toBe('v2.1.0')
  })
})
