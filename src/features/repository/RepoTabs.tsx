import React from 'react'
import { X, FolderGit2, Plus } from 'lucide-react'
import { useRepoStore } from '@/stores/repoStore'
import { useGit } from '@/hooks/useGit'

export function RepoTabs() {
  const tabs = useRepoStore((s) => s.tabs)
  const activeTabId = useRepoStore((s) => s.activeTabId)
  const setActiveTab = useRepoStore((s) => s.setActiveTab)
  const removeTab = useRepoStore((s) => s.removeTab)
  const { openRepo, switchTab } = useGit()

  if (tabs.length === 0) return null

  return (
    <div className="h-8 flex items-end bg-[var(--bg-app)] border-b border-[var(--border-default)] shrink-0 overflow-x-auto">
      {tabs.map((tab) => {
        const active = tab.id === activeTabId
        return (
          <div
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className={`group relative flex items-center gap-1.5 h-full px-3 cursor-pointer text-xs border-r border-[var(--border-default)] max-w-[200px] ${
              active
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)]'
                : 'bg-[var(--bg-app)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]/50'
            }`}
          >
            {active && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-[var(--accent-primary)]" />
            )}
            <FolderGit2 size={12} className="shrink-0" />
            <span className="truncate">{tab.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                removeTab(tab.id)
              }}
              className="ml-auto shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-hover)]"
            >
              <X size={10} />
            </button>
          </div>
        )
      })}
      <button
        onClick={() => openRepo()}
        className="h-full px-2 flex items-center text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]/50"
        title="Open repository"
      >
        <Plus size={12} />
      </button>
    </div>
  )
}
