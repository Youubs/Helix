import { IpcMain } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import * as keytar from 'keytar'
import { IPC_CHANNELS } from '../../../src/shared/constants'
import { IpcResult, HelixProfile } from '../../../src/shared/types'
import { getStore } from '../store'

const SERVICE_NAME = 'helix'

export function registerProfileHandlers(ipcMain: IpcMain) {
  ipcMain.handle(
    IPC_CHANNELS.PROFILE_LIST,
    async (): Promise<IpcResult<HelixProfile[]>> => {
      try {
        const profiles = getStore().get('profiles')
        return { ok: true, data: profiles }
      } catch (e: any) {
        return { ok: false, error: e.message }
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.PROFILE_GET,
    async (_event, id: string): Promise<IpcResult<HelixProfile | null>> => {
      try {
        const profiles = getStore().get('profiles')
        const profile = profiles.find((p) => p.id === id) || null
        return { ok: true, data: profile }
      } catch (e: any) {
        return { ok: false, error: e.message }
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.PROFILE_CREATE,
    async (_event, data: Omit<HelixProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<IpcResult<HelixProfile>> => {
      try {
        const store = getStore()
        const now = new Date().toISOString()
        const profile: HelixProfile = {
          ...data,
          id: uuidv4(),
          createdAt: now,
          updatedAt: now
        }
        const profiles = store.get('profiles')
        profiles.push(profile)
        store.set('profiles', profiles)

        if (!store.get('activeProfileId')) {
          store.set('activeProfileId', profile.id)
        }

        return { ok: true, data: profile }
      } catch (e: any) {
        return { ok: false, error: e.message }
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.PROFILE_UPDATE,
    async (_event, id: string, patch: Partial<HelixProfile>): Promise<IpcResult<HelixProfile>> => {
      try {
        const store = getStore()
        const profiles = store.get('profiles')
        const idx = profiles.findIndex((p) => p.id === id)
        if (idx === -1) return { ok: false, error: 'Profile not found' }

        profiles[idx] = {
          ...profiles[idx],
          ...patch,
          id,
          updatedAt: new Date().toISOString()
        }
        store.set('profiles', profiles)
        return { ok: true, data: profiles[idx] }
      } catch (e: any) {
        return { ok: false, error: e.message }
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.PROFILE_DELETE,
    async (_event, id: string): Promise<IpcResult<boolean>> => {
      try {
        const store = getStore()
        const profiles = store.get('profiles').filter((p) => p.id !== id)
        store.set('profiles', profiles)

        if (store.get('activeProfileId') === id) {
          store.set('activeProfileId', profiles.length > 0 ? profiles[0].id : null)
        }

        // Clean up credentials
        try {
          const creds = await keytar.findCredentials(SERVICE_NAME)
          for (const cred of creds) {
            if (cred.account.startsWith(`profile:${id}:`)) {
              await keytar.deletePassword(SERVICE_NAME, cred.account)
            }
          }
        } catch {
          // keytar may not be available on all platforms
        }

        return { ok: true, data: true }
      } catch (e: any) {
        return { ok: false, error: e.message }
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.PROFILE_SET_ACTIVE,
    async (_event, id: string): Promise<IpcResult<boolean>> => {
      try {
        const store = getStore()
        const profiles = store.get('profiles')
        if (!profiles.find((p) => p.id === id)) {
          return { ok: false, error: 'Profile not found' }
        }
        store.set('activeProfileId', id)
        return { ok: true, data: true }
      } catch (e: any) {
        return { ok: false, error: e.message }
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.PROFILE_GET_ACTIVE,
    async (): Promise<IpcResult<HelixProfile | null>> => {
      try {
        const store = getStore()
        const activeId = store.get('activeProfileId')
        if (!activeId) return { ok: true, data: null }
        const profiles = store.get('profiles')
        const profile = profiles.find((p) => p.id === activeId) || null
        return { ok: true, data: profile }
      } catch (e: any) {
        return { ok: false, error: e.message }
      }
    }
  )
}

// Credential helpers used by Azure IPC
export async function getSecureToken(profileId: string, service: string): Promise<string | null> {
  try {
    return await keytar.getPassword(SERVICE_NAME, `profile:${profileId}:${service}`)
  } catch {
    return null
  }
}

export async function setSecureToken(profileId: string, service: string, token: string): Promise<void> {
  try {
    await keytar.setPassword(SERVICE_NAME, `profile:${profileId}:${service}`, token)
  } catch (e: any) {
    throw new Error(`Failed to store credential: ${e.message}`)
  }
}

export async function deleteSecureToken(profileId: string, service: string): Promise<void> {
  try {
    await keytar.deletePassword(SERVICE_NAME, `profile:${profileId}:${service}`)
  } catch {
    // Silently ignore if not found
  }
}
