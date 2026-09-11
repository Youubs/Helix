import { create } from 'zustand'

type Theme = 'dark' | 'light' | 'system'

export interface SelectedFileDiff {
  file: string
  isStaged?: boolean
  commitHash?: string | null
}

interface UiState {
  theme: Theme
  sidebarWidth: number
  leftWidth: number
  detailWidth: number
  commandPaletteOpen: boolean
  selectedCommitHash: string | null
  selectedFileDiff: SelectedFileDiff | null
  activeView: 'graph' | 'working-tree'
  terminalOpen: boolean
  searchQuery: string
  colBranchWidth: number
  colAuthorWidth: number
  colDateWidth: number
  colShaWidth: number

  setTheme: (theme: Theme) => void
  setSidebarWidth: (width: number) => void
  setLeftWidth: (width: number) => void
  setDetailWidth: (width: number) => void
  toggleCommandPalette: () => void
  setCommandPaletteOpen: (open: boolean) => void
  toggleTerminal: () => void
  setTerminalOpen: (open: boolean) => void
  setSearchQuery: (query: string) => void
  setSelectedCommit: (hash: string | null) => void
  setSelectedFileDiff: (diff: SelectedFileDiff | null) => void
  setActiveView: (view: 'graph' | 'working-tree') => void
  setColBranchWidth: (w: number) => void
  setColAuthorWidth: (w: number) => void
  setColDateWidth: (w: number) => void
  setColShaWidth: (w: number) => void
}

export const useUiStore = create<UiState>((set) => ({
  theme: 'dark',
  sidebarWidth: 240,
  leftWidth: 280,
  detailWidth: 380,
  commandPaletteOpen: false,
  terminalOpen: false,
  searchQuery: '',
  selectedCommitHash: null,
  selectedFileDiff: null,
  activeView: 'graph',
  colBranchWidth: 200,
  colAuthorWidth: 160,
  colDateWidth: 150,
  colShaWidth: 80,

  setTheme: (theme) => {
    set({ theme })
    applyTheme(theme)
  },
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  setLeftWidth: (width) => set({ leftWidth: width }),
  setDetailWidth: (width) => set({ detailWidth: width }),
  toggleCommandPalette: () =>
    set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleTerminal: () =>
    set((state) => ({ terminalOpen: !state.terminalOpen })),
  setTerminalOpen: (open) => set({ terminalOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCommit: (hash) => set({ selectedCommitHash: hash, selectedFileDiff: null }),
  setSelectedFileDiff: (diff) => set({ selectedFileDiff: diff }),
  setActiveView: (view) => set({ activeView: view }),
  setColBranchWidth: (w) => set({ colBranchWidth: Math.max(60, Math.min(600, w)) }),
  setColAuthorWidth: (w) => set({ colAuthorWidth: Math.max(60, Math.min(400, w)) }),
  setColDateWidth: (w) => set({ colDateWidth: Math.max(80, Math.min(300, w)) }),
  setColShaWidth: (w) => set({ colShaWidth: Math.max(50, Math.min(200, w)) })
}))

function applyTheme(theme: Theme) {
  const resolved = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme
  document.documentElement.dataset.theme = resolved
}

applyTheme(useUiStore.getState().theme)
