import React, { useState } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AvatarPicker } from './AvatarPicker'
import { useProfile } from '@/hooks/useProfile'
import type { HelixProfile, ProfileAvatar } from '@/shared/types'

type Step = 'identity' | 'ssh' | 'integrations'

interface WizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editProfile?: HelixProfile | null
  onComplete?: (profile: HelixProfile) => void
}

export function ProfileWizard({ open, onOpenChange, editProfile, onComplete }: WizardProps) {
  const { createProfile, updateProfile } = useProfile()
  const isEditing = !!editProfile

  const [step, setStep] = useState<Step>('identity')
  const [avatar, setAvatar] = useState<ProfileAvatar>(
    editProfile?.avatar || { type: 'initials', color: '#00d0a3' }
  )
  const [name, setName] = useState(editProfile?.name || '')
  const [userName, setUserName] = useState(editProfile?.git.userName || '')
  const [userEmail, setUserEmail] = useState(editProfile?.git.userEmail || '')
  const [signingKey, setSigningKey] = useState(editProfile?.git.signingKey || '')
  const [sshKeyPath, setSshKeyPath] = useState(editProfile?.git.sshKeyPath || '')
  const [saving, setSaving] = useState(false)

  const handleSelectSshKey = async () => {
    const result = await window.fsAPI.openDialog()
    if (result.ok && result.data) {
      setSshKeyPath(result.data)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const profileData = {
      name,
      avatar,
      git: {
        userName,
        userEmail,
        signingKey: signingKey || undefined,
        sshKeyPath: sshKeyPath || undefined
      },
      preferences: editProfile?.preferences || {
        theme: 'dark' as const,
        defaultBranch: 'main',
        fetchOnStartup: true,
        autofetchInterval: 5,
        showAuthorAvatars: false,
        commitGraphDensity: 'compact' as const,
        diffFont: 'JetBrains Mono',
        diffTabSize: 4 as const,
        language: 'en' as const
      },
      projects: editProfile?.projects || [],
      integrations: editProfile?.integrations || {}
    }

    if (isEditing && editProfile) {
      await updateProfile(editProfile.id, profileData)
      onComplete?.(editProfile)
    } else {
      const created = await createProfile(profileData)
      if (created) onComplete?.(created)
    }
    setSaving(false)
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit Profile' : 'Create Profile'}
    >
      <div className="space-y-4">
        {/* Step indicators */}
        <div className="flex gap-1">
          {(['identity', 'ssh', 'integrations'] as Step[]).map((s) => (
            <button
              key={s}
              onClick={() => setStep(s)}
              className={`flex-1 h-1 rounded-full ${
                s === step ? 'bg-[var(--accent-primary)]' : 'bg-[var(--border-default)]'
              }`}
            />
          ))}
        </div>

        {step === 'identity' && (
          <div className="space-y-3">
            <AvatarPicker avatar={avatar} onChange={setAvatar} name={name} />
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1 block">Profile Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Personal, Work" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1 block">Git User Name</label>
              <Input value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="John Doe" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1 block">Git Email</label>
              <Input value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="john@example.com" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1 block">GPG Signing Key (optional)</label>
              <Input value={signingKey} onChange={(e) => setSigningKey(e.target.value)} placeholder="Key ID" />
            </div>
            <Button onClick={() => setStep('ssh')} disabled={!name || !userName || !userEmail}>
              Next
            </Button>
          </div>
        )}

        {step === 'ssh' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1 block">SSH Key Path (optional)</label>
              <div className="flex gap-2">
                <Input
                  value={sshKeyPath}
                  onChange={(e) => setSshKeyPath(e.target.value)}
                  placeholder="~/.ssh/id_ed25519"
                  className="flex-1"
                />
                <Button variant="ghost" onClick={handleSelectSshKey}>
                  Browse
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep('identity')}>
                Back
              </Button>
              <Button onClick={() => setStep('integrations')}>
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 'integrations' && (
          <div className="space-y-3">
            <p className="text-xs text-[var(--text-secondary)]">
              Integrations (Azure DevOps, GitHub, etc.) can be configured after creating the profile in Settings.
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep('ssh')}>
                Back
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : isEditing ? 'Save' : 'Create Profile'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  )
}
