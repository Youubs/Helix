import { create } from 'zustand'
import {
  CommitNode,
  BranchInfo,
  TagInfo,
  StashEntry,
  StatusResult,
  RemoteInfo
} from '@/shared/types'

interface GitState {
  commits: CommitNode[]
  branches: BranchInfo[]
  tags: TagInfo[]
  stash: StashEntry[]
  remotes: RemoteInfo[]
  status: StatusResult | null
  loading: boolean
  error: string | null

  setCommits: (commits: CommitNode[]) => void
  setBranches: (branches: BranchInfo[]) => void
  setTags: (tags: TagInfo[]) => void
  setStash: (stash: StashEntry[]) => void
  setRemotes: (remotes: RemoteInfo[]) => void
  setStatus: (status: StatusResult | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  refresh: () => Promise<void>
}

export const useGitStore = create<GitState>((set, get) => ({
  commits: [],
  branches: [],
  tags: [],
  stash: [],
  remotes: [],
  status: null,
  loading: false,
  error: null,

  setCommits: (commits) => set({ commits }),
  setBranches: (branches) => set({ branches }),
  setTags: (tags) => set({ tags }),
  setStash: (stash) => set({ stash }),
  setRemotes: (remotes) => set({ remotes }),
  setStatus: (status) => set({ status }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  refresh: async () => {
    try {
      set({ loading: true, error: null })

      const [logResult, branchResult, statusResult, tagResult, stashResult, remoteResult] =
        await Promise.all([
          window.gitAPI.getLog({ all: true }),
          window.gitAPI.getBranches(),
          window.gitAPI.getStatus(),
          window.gitAPI.getTagList(),
          window.gitAPI.getStashList(),
          window.gitAPI.getRemotes()
        ])

      if (logResult.ok) {
        set({ commits: logResult.data })
      } else {
        set({ error: logResult.error })
      }
      if (branchResult.ok) set({ branches: branchResult.data })
      if (statusResult.ok) set({ status: statusResult.data })
      if (tagResult.ok) set({ tags: tagResult.data })
      if (stashResult.ok) set({ stash: stashResult.data })
      if (remoteResult.ok) set({ remotes: remoteResult.data })

      set({ loading: false })
    } catch (e: any) {
      set({ loading: false, error: e.message })
    }
  }
}))
