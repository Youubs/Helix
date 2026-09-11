import { useEffect } from 'react'
import { useGitStore } from '@/stores/gitStore'

export function useWatcher() {
  const refresh = useGitStore((s) => s.refresh)

  useEffect(() => {
    // 1. Listen for filesystem and git changes from Electron main watcher (debounced chokidar)
    const cleanup = window.gitAPI.onRepoChanged(() => {
      refresh(true)
    })

    // 2. Automatically refresh whenever window regains focus (switching back from IDE/Terminal)
    const handleFocus = () => {
      refresh(true)
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      cleanup()
      window.removeEventListener('focus', handleFocus)
    }
  }, [refresh])
}
