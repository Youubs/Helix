import { create } from 'zustand'
import { HelixProfile } from '@/shared/types'
import { useUiStore } from './uiStore'

interface ProfileState {
  profiles: HelixProfile[]
  activeProfile: HelixProfile | null
  loading: boolean

  loadProfiles: () => Promise<void>
  switchProfile: (id: string) => Promise<void>
  createProfile: (data: Omit<HelixProfile, 'id' | 'createdAt' | 'updatedAt'>) => Promise<HelixProfile | null>
  updateProfile: (id: string, patch: Partial<HelixProfile>) => Promise<void>
  deleteProfile: (id: string) => Promise<void>
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profiles: [],
  activeProfile: null,
  loading: false,

  loadProfiles: async () => {
    set({ loading: true })
    const [listResult, activeResult] = await Promise.all([
      window.profileAPI.list(),
      window.profileAPI.getActive()
    ])
    if (listResult.ok) set({ profiles: listResult.data })
    if (activeResult.ok && activeResult.data) {
      set({ activeProfile: activeResult.data })
      applyProfilePreferences(activeResult.data)
    }
    set({ loading: false })
  },

  switchProfile: async (id: string) => {
    const result = await window.profileAPI.setActive(id)
    if (!result.ok) return
    const profileResult = await window.profileAPI.get(id)
    if (profileResult.ok && profileResult.data) {
      set({ activeProfile: profileResult.data })
      applyProfilePreferences(profileResult.data)
    }
  },

  createProfile: async (data) => {
    const result = await window.profileAPI.create(data)
    if (!result.ok) return null
    const profiles = [...get().profiles, result.data]
    set({ profiles })
    return result.data
  },

  updateProfile: async (id, patch) => {
    const result = await window.profileAPI.update(id, patch)
    if (!result.ok) return
    const profiles = get().profiles.map((p) => (p.id === id ? result.data : p))
    set({ profiles })
    if (get().activeProfile?.id === id) {
      set({ activeProfile: result.data })
      applyProfilePreferences(result.data)
    }
  },

  deleteProfile: async (id) => {
    const result = await window.profileAPI.delete(id)
    if (!result.ok) return
    const profiles = get().profiles.filter((p) => p.id !== id)
    set({ profiles })
    if (get().activeProfile?.id === id) {
      const activeResult = await window.profileAPI.getActive()
      if (activeResult.ok) {
        set({ activeProfile: activeResult.data })
        if (activeResult.data) applyProfilePreferences(activeResult.data)
      }
    }
  }
}))

function applyProfilePreferences(profile: HelixProfile) {
  const setTheme = useUiStore.getState().setTheme
  setTheme(profile.preferences.theme)
}
