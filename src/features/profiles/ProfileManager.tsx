import React, { useState } from 'react'
import { Trash2, Pencil, Check } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { useProfileStore } from '@/stores/profileStore'
import { useProfile } from '@/hooks/useProfile'
import { AvatarBadge } from './ProfileSelector'
import type { HelixProfile } from '@/shared/types'

export function ProfileManager({
  open,
  onOpenChange,
  onEdit
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (profile: HelixProfile) => void
}) {
  const profiles = useProfileStore((s) => s.profiles)
  const activeProfile = useProfileStore((s) => s.activeProfile)
  const { switchProfile, deleteProfile } = useProfile()

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Manage Profiles">
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {profiles.map((profile) => {
          const isActive = profile.id === activeProfile?.id
          const azureCount = profile.integrations.azureDevOps?.length || 0

          return (
            <div
              key={profile.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)]"
            >
              <AvatarBadge avatar={profile.avatar} name={profile.name} size={36} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {profile.name}
                  </span>
                  {isActive && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-medium">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-xs text-[var(--text-tertiary)] truncate">
                  {profile.git.userEmail}
                  {profile.git.sshKeyPath && ` · SSH: ${profile.git.sshKeyPath.split(/[/\\]/).pop()}`}
                </div>
                <div className="text-[10px] text-[var(--text-tertiary)]">
                  {profile.projects.length} projects
                  {azureCount > 0 && ` · ${azureCount} Azure DevOps`}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!isActive && (
                  <Button variant="ghost" size="sm" onClick={() => switchProfile(profile.id)} title="Activate">
                    <Check size={13} />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => onEdit(profile)} title="Edit">
                  <Pencil size={13} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteProfile(profile.id)}
                  title="Delete"
                  disabled={profiles.length <= 1}
                >
                  <Trash2 size={13} className="text-[var(--color-danger)]" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </Dialog>
  )
}
