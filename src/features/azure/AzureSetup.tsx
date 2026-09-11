import React, { useState } from 'react'
import { Eye, EyeOff, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useProfileStore } from '@/stores/profileStore'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'sonner'
import type { AzureDevOpsIntegration, AzureProject } from '@/shared/types'

interface AzureSetupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingIntegration?: AzureDevOpsIntegration
}

export function AzureSetup({ open, onOpenChange, existingIntegration }: AzureSetupProps) {
  const activeProfile = useProfileStore((s) => s.activeProfile)
  const updateProfile = useProfileStore((s) => s.updateProfile)

  const [orgSlug, setOrgSlug] = useState(
    existingIntegration?.organizationUrl.replace('https://dev.azure.com/', '') || ''
  )
  const [pat, setPat] = useState('')
  const [showPat, setShowPat] = useState(false)
  const [label, setLabel] = useState(existingIntegration?.label || '')
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const [projects, setProjects] = useState<AzureProject[]>([])
  const [error, setError] = useState<string | null>(null)

  const orgUrl = orgSlug.includes('visualstudio.com')
    ? `https://${orgSlug}`
    : `https://dev.azure.com/${orgSlug}`

  const handleVerify = async () => {
    if (!activeProfile || !pat || !orgSlug) return
    setVerifying(true)
    setError(null)
    setVerified(false)

    const integrationId = existingIntegration?.id || uuidv4()
    const result = await window.azureAPI.validatePat({
      orgUrl,
      pat,
      profileId: activeProfile.id,
      integrationId
    })

    if (result.ok) {
      setVerified(true)
      setProjects(result.data.projects)

      // Save integration to profile
      const currentIntegrations = activeProfile.integrations.azureDevOps || []
      const updated = existingIntegration
        ? currentIntegrations.map((i) =>
            i.id === existingIntegration.id
              ? { ...i, organizationUrl: orgUrl, label: label || orgSlug, lastSyncAt: new Date().toISOString() }
              : i
          )
        : [
            ...currentIntegrations,
            {
              id: integrationId,
              label: label || orgSlug,
              organizationUrl: orgUrl,
              connectedAt: new Date().toISOString(),
              scopes: ['code.read', 'code.write', 'pullrequest.read', 'pullrequest.write'] as any[]
            }
          ]

      await updateProfile(activeProfile.id, {
        integrations: { ...activeProfile.integrations, azureDevOps: updated }
      })
      toast.success('Azure DevOps connected')
    } else {
      setError(result.error)
    }
    setVerifying(false)
  }

  const handleOpenDocs = () => {
    // Will use shell.openExternal in prod, for now just open link
    window.open(
      'https://learn.microsoft.com/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate',
      '_blank'
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Connect Azure DevOps">
      <div className="space-y-4">
        <div>
          <label className="text-xs text-[var(--text-secondary)] mb-1 block">Label</label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Acme Corp Azure"
          />
        </div>

        <div>
          <label className="text-xs text-[var(--text-secondary)] mb-1 block">Organization</label>
          <div className="flex items-center gap-0">
            <span className="text-xs text-[var(--text-tertiary)] bg-[var(--bg-elevated)] px-2 py-1.5 rounded-l border border-r-0 border-[var(--border-default)]">
              https://dev.azure.com/
            </span>
            <Input
              value={orgSlug}
              onChange={(e) => setOrgSlug(e.target.value)}
              placeholder="your-org"
              className="rounded-l-none"
            />
          </div>
          <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
            Also supports: org.visualstudio.com
          </p>
        </div>

        <div>
          <label className="text-xs text-[var(--text-secondary)] mb-1 block">Personal Access Token</label>
          <div className="relative">
            <Input
              type={showPat ? 'text' : 'password'}
              value={pat}
              onChange={(e) => setPat(e.target.value)}
              placeholder="Enter your PAT"
              className="pr-8"
            />
            <button
              onClick={() => setShowPat(!showPat)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            >
              {showPat ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
            Stored securely in your OS keychain. Never saved to disk.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs text-[var(--color-danger)] bg-[var(--color-danger)]/10 p-2 rounded">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {verified && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-[var(--accent-primary)]">
              <CheckCircle size={14} />
              Connected — {projects.length} projects found
            </div>
            <div className="max-h-24 overflow-y-auto text-xs text-[var(--text-secondary)] space-y-0.5">
              {projects.map((p) => (
                <div key={p.id}>• {p.name}</div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleOpenDocs}
            className="text-xs text-[var(--accent-primary)] hover:underline flex items-center gap-1"
          >
            How to create a PAT <ExternalLink size={10} />
          </button>
          <Button onClick={handleVerify} disabled={!orgSlug || !pat || verifying}>
            {verifying ? 'Verifying...' : verified ? 'Done' : 'Verify & Connect'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
