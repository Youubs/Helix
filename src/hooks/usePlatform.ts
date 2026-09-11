import { useState, useEffect } from 'react'
import { PlatformInfo } from '@/shared/types'

let cachedPlatform: PlatformInfo | null = null
let fetchPromise: Promise<void> | null = null

function ensurePlatform(cb: (p: PlatformInfo) => void) {
  if (cachedPlatform) {
    cb(cachedPlatform)
    return
  }
  if (!fetchPromise) {
    fetchPromise = window.fsAPI.getPlatformInfo().then((result) => {
      if (result.ok) cachedPlatform = result.data
    })
  }
  fetchPromise.then(() => {
    if (cachedPlatform) cb(cachedPlatform)
  })
}

export function usePlatform() {
  const [platform, setPlatform] = useState<PlatformInfo | null>(cachedPlatform)

  useEffect(() => {
    if (!cachedPlatform) {
      ensurePlatform(setPlatform)
    }
  }, [])

  const isWindows = platform?.platform === 'win32'
  const isMac = platform?.platform === 'darwin'
  const isLinux = platform?.platform === 'linux'

  return { platform, isWindows, isMac, isLinux }
}
