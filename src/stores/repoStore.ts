import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { RepoInfo } from '@/shared/types'

interface RepoTab {
  id: string
  path: string
  name: string
}

interface RepoState {
  tabs: RepoTab[]
  activeTabId: string | null
  recentRepos: RepoInfo[]
  addTab: (path: string, name: string) => void
  removeTab: (id: string) => void
  setActiveTab: (id: string) => void
  setRecentRepos: (repos: RepoInfo[]) => void
  addRecentRepo: (repo: RepoInfo) => void
  removeRecentRepo: (path: string) => void
  togglePin: (path: string) => void
}

export const useRepoStore = create<RepoState>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,
      recentRepos: [],

  addTab: (path, name) => {
    const existing = get().tabs.find((t) => t.path === path)
    if (existing) {
      set({ activeTabId: existing.id })
      return
    }
    const id = crypto.randomUUID()
    set((state) => ({
      tabs: [...state.tabs, { id, path, name }],
      activeTabId: id
    }))
  },

  removeTab: (id) => {
    set((state) => {
      const tabs = state.tabs.filter((t) => t.id !== id)
      let activeTabId = state.activeTabId
      if (activeTabId === id) {
        activeTabId = tabs.length > 0 ? tabs[tabs.length - 1].id : null
      }
      return { tabs, activeTabId }
    })
  },

  setActiveTab: (id) => set({ activeTabId: id }),

  setRecentRepos: (repos) => set({ recentRepos: repos }),

  addRecentRepo: (repo) => {
    set((state) => {
      const filtered = state.recentRepos.filter((r) => r.path !== repo.path)
      return { recentRepos: [repo, ...filtered].slice(0, 20) }
    })
  },

  removeRecentRepo: (path) => {
    set((state) => ({
      recentRepos: state.recentRepos.filter((r) => r.path !== path)
    }))
  },

  togglePin: (path) => {
    set((state) => ({
      recentRepos: state.recentRepos.map((r) =>
        r.path === path ? { ...r, pinned: !r.pinned } : r
      )
    }))
  }
}),
    {
      name: 'helix-repo-storage'
    }
  )
)
