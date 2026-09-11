import { useCallback } from 'react'
import { useProfileStore } from '@/stores/profileStore'
import { toast } from 'sonner'
import type { HelixProfile } from '@/shared/types'

export function useProfile() {
  const loadProfiles = useProfileStore((s) => s.loadProfiles)
  const switchProfile = useProfileStore((s) => s.switchProfile)
  const createProfile = useProfileStore((s) => s.createProfile)
  const updateProfile = useProfileStore((s) => s.updateProfile)
  const deleteProfile = useProfileStore((s) => s.deleteProfile)

  const handleSwitch = useCallback(async (id: string) => {
    await switchProfile(id)
    toast.success('Profile switched')
  }, [switchProfile])

  const handleCreate = useCallback(async (data: Omit<HelixProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
    const profile = await createProfile(data)
    if (profile) {
      toast.success(`Profile "${profile.name}" created`)
      return profile
    }
    toast.error('Failed to create profile')
    return null
  }, [createProfile])

  const handleDelete = useCallback(async (id: string) => {
    await deleteProfile(id)
    toast.success('Profile deleted')
  }, [deleteProfile])

  return {
    loadProfiles,
    switchProfile: handleSwitch,
    createProfile: handleCreate,
    updateProfile,
    deleteProfile: handleDelete
  }
}
