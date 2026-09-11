import { useEffect } from 'react'
import { useGitStore } from '@/stores/gitStore'

export function useWatcher() {
  const refresh = useGitStore((s) => s.refresh)

  useEffect(() => {
    // 1. Listen for filesystem and git changes from Electron main watcher
    const cleanup = window.gitAPI.onRepoChanged(() => {
      refresh()
    })

    // 2. Automatically refresh whenever window regains focus (switching back from IDE/Terminal)
    const handleFocus = () => {
      refresh()
    }
    window.addEventListener('focus', handleFocus)

    // 3. Periodic heartbeat (every 3 seconds) while document is visible
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refresh()
      }
    }, 3000)

    return () => {
      cleanup()
      window.removeEventListener('focus', handleFocus)
      clearInterval(interval)
    }
  }, [refresh])
}
