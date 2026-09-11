import React from 'react'
import { Check, Plus, Settings } from 'lucide-react'
import * as Popover from '@radix-ui/react-popover'
import { useProfileStore } from '@/stores/profileStore'
import { useProfile } from '@/hooks/useProfile'
import type { HelixProfile, ProfileAvatar } from '@/shared/types'

export function ProfileSelector({ onManage, onNew }: { onManage: () => void; onNew: () => void }) {
  const profiles = useProfileStore((s) => s.profiles)
  const activeProfile = useProfileStore((s) => s.activeProfile)
  const { switchProfile } = useProfile()

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--bg-hover)] w-full"
          title={activeProfile?.name || 'No profile'}
        >
          <AvatarBadge avatar={activeProfile?.avatar} name={activeProfile?.name || '?'} size={24} />
          <div className="flex-1 min-w-0 text-left">
            <div className="text-xs font-medium text-[var(--text-primary)] truncate">
              {activeProfile?.name || 'No profile'}
            </div>
            <div className="text-[10px] text-[var(--text-tertiary)] truncate">
              {activeProfile?.git.userEmail || ''}
            </div>
          </div>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={4}
          className="z-50 w-64 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-2xl p-1"
        >
          <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] border-b border-[var(--border-subtle)]">
            Profiles
          </div>

          {profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => switchProfile(profile.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--bg-hover)] text-left transition-colors ${
                profile.id === activeProfile?.id ? 'bg-[var(--bg-selected)]' : ''
              }`}
            >
              <AvatarBadge avatar={profile.avatar} name={profile.name} size={28} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-[var(--text-primary)] truncate">{profile.name}</div>
                <div className="text-[10px] text-[var(--text-secondary)] truncate">{profile.git.userEmail}</div>
              </div>
              {profile.id === activeProfile?.id && (
                <Check size={14} className="text-[var(--accent-primary)] shrink-0" />
              )}
            </button>
          ))}

          <div className="border-t border-[var(--border-subtle)] mt-1 pt-1">
            <button
              onClick={onNew}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--bg-hover)] text-xs text-[var(--text-secondary)] transition-colors"
            >
              <Plus size={12} />
              New profile
            </button>
            <button
              onClick={onManage}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--bg-hover)] text-xs text-[var(--text-secondary)] transition-colors"
            >
              <Settings size={12} />
              Manage profiles
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

export function AvatarBadge({ avatar, name, size = 24 }: { avatar?: ProfileAvatar; name: string; size?: number }) {
  if (avatar?.type === 'emoji') {
    return (
      <div
        className="flex items-center justify-center rounded-full bg-[var(--bg-elevated)] shrink-0 border border-[var(--border-default)]"
        style={{ width: size, height: size, fontSize: size * 0.55 }}
      >
        {avatar.value}
      </div>
    )
  }

  const color = avatar?.type === 'initials' ? avatar.color : 'var(--accent-secondary)'
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('')

  return (
    <div
      className="flex items-center justify-center rounded-full text-white font-bold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38, backgroundColor: color, letterSpacing: '-0.02em' }}
    >
      {initials}
    </div>
  )
}
