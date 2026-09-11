import chokidar, { FSWatcher } from 'chokidar'
import { BrowserWindow } from 'electron'
import path from 'path'
import { IPC_CHANNELS } from '../../src/shared/constants'

let watcher: FSWatcher | null = null
let debounceTimer: NodeJS.Timeout | null = null

export function initWatcher(repoPath: string, window: BrowserWindow) {
  stopWatcher()

  const gitDir = path.join(repoPath, '.git')

  watcher = chokidar.watch(
    [
      gitDir,
      repoPath
    ],
    {
      ignored: [
        '**/objects/**',
        '**/logs/**',
        '**/*.lock',
        '**/node_modules/**',
        '**/out/**',
        '**/dist/**',
        '**/.vite/**',
        '**/.git/objects/**',
        '**/*.tsbuildinfo'
      ],
      ignoreInitial: true,
      persistent: true,
      depth: 4,
      awaitWriteFinish: {
        stabilityThreshold: 150,
        pollInterval: 50
      }
    }
  )

  const notify = () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      if (!window.isDestroyed()) {
        window.webContents.send(IPC_CHANNELS.REPO_CHANGED)
      }
    }, 250)
  }

  watcher.on('all', notify)
}

export function stopWatcher() {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  if (watcher) {
    watcher.close()
    watcher = null
  }
}
