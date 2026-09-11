import React, { useEffect } from 'react'
import { Toaster } from 'sonner'
import { Titlebar } from '@/components/layout/Titlebar'
import { StatusBar } from '@/components/layout/StatusBar'
import { ResizableLayout } from '@/components/layout/ResizableLayout'
import { CommitPanel } from '@/features/repository/CommitPanel'
import { WorkingTree } from '@/features/repository/WorkingTree'
import { Toolbar } from '@/features/repository/Toolbar'
import { RepoTabs } from '@/features/repository/RepoTabs'
import { WelcomeScreen } from '@/features/welcome/WelcomeScreen'
import { useRepoStore } from '@/stores/repoStore'
import { useGitStore } from '@/stores/gitStore'
import { useUiStore } from '@/stores/uiStore'
import { useWatcher } from '@/hooks/useWatcher'
import { useGlobalShortcuts } from '@/hooks/useKeyboard'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { FullFileDiffView } from '@/features/repository/FullFileDiffView'

export default function App() {
  const tabs = useRepoStore((s) => s.tabs)
  const activeTabId = useRepoStore((s) => s.activeTabId)
  const detailWidth = useUiStore((s) => s.detailWidth)
  const setDetailWidth = useUiStore((s) => s.setDetailWidth)
  const selectedFileDiff = useUiStore((s) => s.selectedFileDiff)

  useWatcher()
  useGlobalShortcuts()

  useEffect(() => {
    const activeTab = tabs.find((t) => t.id === activeTabId)
    if (activeTab) {
      window.gitAPI.openRepository(activeTab.path).then((res) => {
        if (res.ok) {
          useGitStore.getState().refresh()
        }
      })
    }
  }, [activeTabId, tabs])

  const hasRepo = activeTabId !== null

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--bg-app)]">
      <Titlebar />

      {hasRepo ? (
        <>
          <RepoTabs />
          <Toolbar />
          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
              <ResizableLayout
                left={null}
                center={
                  <ErrorBoundary>
                    {selectedFileDiff ? <FullFileDiffView /> : <CommitPanel />}
                  </ErrorBoundary>
                }
                right={
                  <ErrorBoundary>
                    <WorkingTree />
                  </ErrorBoundary>
                }
                leftWidth={0}
                rightWidth={detailWidth}
                onLeftResize={() => {}}
                onRightResize={setDetailWidth}
                minLeft={0}
                maxLeft={0}
                minRight={280}
                maxRight={560}
              />
            </div>
          </div>
          <StatusBar />
        </>
      ) : (
        <WelcomeScreen />
      )}

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)'
          }
        }}
      />
    </div>
  )
}
