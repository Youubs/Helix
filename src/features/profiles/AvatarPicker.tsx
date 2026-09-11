import React from 'react'
import type { ProfileAvatar } from '@/shared/types'
import { AvatarBadge } from './ProfileSelector'

/* Avatar colors — persisted to profile data, must be concrete hex values.
   These mirror the brand palette from tokens.css. */
const AVATAR_COLORS = [
  '#00d0a3', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#00b894', '#f97316',
  '#818cf8', '#00d0a3'
]

const EMOJIS = [
  '💼', '🦊', '🔥', '🚀', '🎯', '💡', '🌊', '🎨',
  '🐙', '☕', '🏠', '🎮', '🔐', '⚡', '🌐', '🛠️'
]

export function AvatarPicker({
  avatar,
  onChange,
  name
}: {
  avatar: ProfileAvatar
  onChange: (a: ProfileAvatar) => void
  name: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <AvatarBadge avatar={avatar} name={name || '?'} size={40} />
        <span className="text-xs text-[var(--text-secondary)]">Choose an avatar style</span>
      </div>

      <div className="space-y-1.5">
        <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Colors (initials)</span>
        <div className="flex flex-wrap gap-1.5">
          {AVATAR_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onChange({ type: 'initials', color })}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${
                avatar.type === 'initials' && avatar.color === color
                  ? 'border-[var(--text-primary)] scale-110'
                  : 'border-transparent hover:scale-110'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Emoji</span>
        <div className="flex flex-wrap gap-1.5">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onChange({ type: 'emoji', value: emoji })}
              className={`w-7 h-7 rounded flex items-center justify-center text-sm border transition-transform ${
                avatar.type === 'emoji' && avatar.value === emoji
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 scale-110'
                  : 'border-[var(--border-default)] hover:bg-[var(--bg-hover)] hover:scale-110'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
