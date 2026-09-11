import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Folder, Package, Plus, Download, FolderOpen } from 'lucide-react'
import { useProfileStore } from '@/stores/profileStore'
import { useGit } from '@/hooks/useGit'
import { toast } from 'sonner'
import type { AzureDevOpsIntegration, AzureProject, AzureRepo } from '@/shared/types'

export function AzurePanel({ onSetup }: { onSetup: () => void }) {
  const activeProfile = useProfileStore((s) => s.activeProfile)
  const integrations = activeProfile?.integrations.azureDevOps || []

  if (integrations.length === 0) {
    return (
      <button
        onClick={onSetup}
        className="w-full flex items-center gap-1.5 px-2 py-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-hover)] rounded"
      >
        <Plus size={11} />
        Connect Azure DevOps
      </button>
    )
  }

  return (
    <div>
      {integrations.map((integration) => (
        <AzureOrgTree key={integration.id} integration={integration} />
      ))}
      <button
        onClick={onSetup}
        className="w-full flex items-center gap-1.5 px-2 py-0.5 text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded"
      >
        <Plus size={9} />
        Add organization
      </button>
    </div>
  )
}

function AzureOrgTree({ integration }: { integration: AzureDevOpsIntegration }) {
  const activeProfile = useProfileStore((s) => s.activeProfile)
  const [open, setOpen] = useState(false)
  const [projects, setProjects] = useState<AzureProject[]>([])
  const [loading, setLoading] = useState(false)

  const loadProjects = async () => {
    if (!activeProfile) return
    setLoading(true)
    const result = await window.azureAPI.listProjects({
      profileId: activeProfile.id,
      integrationId: integration.id
    })
    if (result.ok) setProjects(result.data)
    else toast.error(result.error)
    setLoading(false)
  }

  useEffect(() => {
    if (open && projects.length === 0) loadProjects()
  }, [open])

  return (
    <div className="mb-0.5">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded"
      >
        {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        <span className="truncate">{integration.label}</span>
      </button>
      {open && (
        <div className="ml-3">
          {loading ? (
            <div className="px-2 py-1 text-[10px] text-[var(--text-tertiary)]">Loading...</div>
          ) : (
            projects.map((project) => (
              <AzureProjectTree
                key={project.id}
                project={project}
                integration={integration}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

function AzureProjectTree({
  project,
  integration
}: {
  project: AzureProject
  integration: AzureDevOpsIntegration
}) {
  const activeProfile = useProfileStore((s) => s.activeProfile)
  const [open, setOpen] = useState(false)
  const [repos, setRepos] = useState<AzureRepo[]>([])
  const [loading, setLoading] = useState(false)

  const loadRepos = async () => {
    if (!activeProfile) return
    setLoading(true)
    const result = await window.azureAPI.listRepos({
      profileId: activeProfile.id,
      integrationId: integration.id,
      project: project.name
    })
    if (result.ok) setRepos(result.data)
    else toast.error(result.error)
    setLoading(false)
  }

  useEffect(() => {
    if (open && repos.length === 0) loadRepos()
  }, [open])

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-1.5 px-2 py-0.5 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded"
      >
        {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        <Folder size={11} className="text-[var(--color-warning)]" />
        <span className="truncate">{project.name}</span>
      </button>
      {open && (
        <div className="ml-4">
          {loading ? (
            <div className="px-2 py-0.5 text-[10px] text-[var(--text-tertiary)]">Loading...</div>
          ) : (
            repos.map((repo) => (
              <AzureRepoItem key={repo.id} repo={repo} integration={integration} />
            ))
          )}
        </div>
      )}
    </div>
  )
}

function AzureRepoItem({
  repo,
  integration
}: {
  repo: AzureRepo
  integration: AzureDevOpsIntegration
}) {
  const activeProfile = useProfileStore((s) => s.activeProfile)
  const { openRepo } = useGit()
  const [cloning, setCloning] = useState(false)

  const handleClone = async () => {
    if (!activeProfile) return
    const destResult = await window.fsAPI.saveDialog()
    if (!destResult.ok || !destResult.data) return

    const destPath = `${destResult.data}/${repo.name}`
    setCloning(true)
    const result = await window.azureAPI.cloneRepo({
      profileId: activeProfile.id,
      integrationId: integration.id,
      remoteUrl: repo.remoteUrl,
      destPath
    })
    if (result.ok) {
      toast.success(`Cloned ${repo.name}`)
      await openRepo(destPath)
    } else {
      toast.error(result.error)
    }
    setCloning(false)
  }

  return (
    <div className="flex items-center gap-1.5 px-2 py-0.5 text-xs rounded hover:bg-[var(--bg-hover)] group">
      <Package size={11} className="text-[var(--accent-primary)] shrink-0" />
      <span className="truncate flex-1 text-[var(--text-primary)]">{repo.name}</span>
      <button
        onClick={handleClone}
        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[var(--bg-elevated)]"
        title="Clone"
        disabled={cloning}
      >
        <Download size={10} className="text-[var(--text-tertiary)]" />
      </button>
    </div>
  )
}
