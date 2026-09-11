import React, { useState } from 'react'
import {
  GitBranch,
  Tag,
  Archive,
  Globe,
  ChevronDown,
  ChevronRight,
  Search,
  Plus,
  Check,
  Trash2,
  Cloud
} from 'lucide-react'
import { useGitStore } from '@/stores/gitStore'
import { useGit } from '@/hooks/useGit'
import { getBranchColorByName } from '@/utils/graphLayout'
import { ContextMenu } from '@/components/ui/ContextMenu'
import { Input } from '@/components/ui/Input'
import { ProfileSelector } from '@/features/profiles/ProfileSelector'
import { ProfileManager } from '@/features/profiles/ProfileManager'
import { ProfileWizard } from '@/features/profiles/ProfileWizard'
import { AzurePanel } from '@/features/azure/AzurePanel'
import { AzureSetup } from '@/features/azure/AzureSetup'
import type { BranchInfo, TagInfo, StashEntry, HelixProfile } from '@/shared/types'

export function Sidebar() {
  const branches = useGitStore((s) => s.branches)
  const tags = useGitStore((s) => s.tags)
  const stash = useGitStore((s) => s.stash)
  const [searchQuery, setSearchQuery] = useState('')
  const [managerOpen, setManagerOpen] = useState(false)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<HelixProfile | null>(null)
  const [azureSetupOpen, setAzureSetupOpen] = useState(false)

  const localBranches = branches.filter((b) => !b.name.startsWith('remotes/'))
  const remoteBranches = branches.filter((b) => b.name.startsWith('remotes/'))

  const filtered = searchQuery
    ? {
        local: localBranches.filter((b) =>
          b.name.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        remote: remoteBranches.filter((b) =>
          b.name.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        tags: tags.filter((t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }
    : { local: localBranches, remote: remoteBranches, tags }

  return (
    <div className="h-full flex flex-col bg-[var(--bg-surface)]">
      <div className="p-2 border-b border-[var(--border-default)]">
        <ProfileSelector
          onManage={() => setManagerOpen(true)}
          onNew={() => { setEditingProfile(null); setWizardOpen(true) }}
        />
      </div>

      <div className="p-2">
        <div className="relative">
          <Search
            size={12}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="pl-7 h-7 text-xs"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-1">
        <SidebarSection
          icon={<GitBranch size={13} />}
          title="Local Branches"
          count={filtered.local.length}
          defaultOpen
        >
          {filtered.local.map((branch) => (
            <BranchItem key={branch.name} branch={branch} />
          ))}
        </SidebarSection>

        <SidebarSection
          icon={<Globe size={13} />}
          title="Remote Branches"
          count={filtered.remote.length}
        >
          {filtered.remote.map((branch) => (
            <BranchItem key={branch.name} branch={branch} isRemote />
          ))}
        </SidebarSection>

        <SidebarSection
          icon={<Tag size={13} />}
          title="Tags"
          count={filtered.tags.length}
        >
          {filtered.tags.map((tag) => (
            <TagItem key={tag.name} tag={tag} />
          ))}
        </SidebarSection>

        <SidebarSection
          icon={<Archive size={13} />}
          title="Stash"
          count={stash.length}
        >
          {stash.map((entry) => (
            <StashItem key={entry.index} entry={entry} />
          ))}
        </SidebarSection>

        <SidebarSection
          icon={<Cloud size={13} />}
          title="Azure DevOps"
          count={0}
        >
          <AzurePanel onSetup={() => setAzureSetupOpen(true)} />
        </SidebarSection>
      </div>

      <ProfileManager
        open={managerOpen}
        onOpenChange={setManagerOpen}
        onEdit={(p) => { setEditingProfile(p); setWizardOpen(true); setManagerOpen(false) }}
      />
      <ProfileWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        editProfile={editingProfile}
      />
      <AzureSetup open={azureSetupOpen} onOpenChange={setAzureSetupOpen} />
    </div>
  )
}

function SidebarSection({
  icon,
  title,
  count,
  defaultOpen = false,
  children
}: {
  icon: React.ReactNode
  title: string
  count: number
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded"
      >
        {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        {icon}
        <span className="flex-1 text-left">{title}</span>
        <span className="text-[var(--text-tertiary)] text-[10px]">{count}</span>
      </button>
      {open && <div className="ml-2">{children}</div>}
    </div>
  )
}

function BranchItem({ branch, isRemote }: { branch: BranchInfo; isRemote?: boolean }) {
  const { checkout, merge, rebase, deleteBranch } = useGit()
  const color = getBranchColorByName(branch.name)

  const displayName = isRemote
    ? branch.name.replace(/^remotes\/[^/]+\//, '')
    : branch.name

  const menuItems = [
    { label: 'Checkout', action: () => checkout(branch.name) },
    { label: 'Merge into current', action: () => merge(branch.name) },
    { label: 'Rebase onto this', action: () => rebase(branch.name) },
    { label: '', action: () => {}, separator: true },
    { label: 'Delete', action: () => deleteBranch(branch.name), variant: 'danger' as const, disabled: branch.current }
  ]

  const status = useGitStore((s) => s.status)
  const ahead = branch.current ? status?.ahead ?? 0 : 0
  const behind = branch.current ? status?.behind ?? 0 : 0

  return (
    <ContextMenu items={menuItems}>
      <button
        onDoubleClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          checkout(branch.name)
        }}
        title={`Double-click to checkout ${displayName}`}
        className="w-full flex items-center gap-1.5 px-2 py-0.5 text-xs rounded hover:bg-[var(--bg-hover)] group cursor-pointer select-none"
      >
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span
          className={`truncate flex-1 text-left ${
            branch.current
              ? 'text-[var(--accent-primary)] font-medium'
              : 'text-[var(--text-primary)]'
          }`}
        >
          {displayName}
        </span>
        {ahead > 0 && (
          <span className="text-[10px] text-[var(--diff-add-text)] font-mono font-bold" title={`${ahead} commits ahead of remote`}>
            ↑{ahead}
          </span>
        )}
        {behind > 0 && (
          <span className="text-[10px] text-[var(--color-warning)] font-mono font-bold" title={`${behind} commits behind remote`}>
            ↓{behind}
          </span>
        )}
        {branch.current && <Check size={11} className="text-[var(--accent-primary)] shrink-0" />}
      </button>
    </ContextMenu>
  )
}

function TagItem({ tag }: { tag: TagInfo }) {
  const { deleteTag, pushTag } = useGit()

  const menuItems = [
    { label: 'Push tag', action: () => pushTag(tag.name) },
    { label: '', action: () => {}, separator: true },
    { label: 'Delete', action: () => deleteTag(tag.name), variant: 'danger' as const }
  ]

  return (
    <ContextMenu items={menuItems}>
      <div className="w-full flex items-center gap-1.5 px-2 py-0.5 text-xs rounded hover:bg-[var(--bg-hover)]">
        <Tag size={10} className="text-[var(--color-warning)] shrink-0" />
        <span className="truncate text-[var(--text-primary)]">{tag.name}</span>
      </div>
    </ContextMenu>
  )
}

function StashItem({ entry }: { entry: StashEntry }) {
  const { stashPop, stashApply, stashDrop } = useGit()

  const menuItems = [
    { label: 'Pop', action: () => stashPop(entry.index) },
    { label: 'Apply', action: () => stashApply(entry.index) },
    { label: '', action: () => {}, separator: true },
    { label: 'Drop', action: () => stashDrop(entry.index), variant: 'danger' as const }
  ]

  return (
    <ContextMenu items={menuItems}>
      <div className="w-full flex items-center gap-1.5 px-2 py-0.5 text-xs rounded hover:bg-[var(--bg-hover)]">
        <Archive size={10} className="text-[var(--text-tertiary)] shrink-0" />
        <span className="truncate text-[var(--text-primary)]">
          {entry.message || `stash@{${entry.index}}`}
        </span>
      </div>
    </ContextMenu>
  )
}
