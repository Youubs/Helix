import React from 'react'
import {
  GitBranch,
  History,
  Users,
  Tag,
  Box,
  GitPullRequest,
  CircleDot,
  Menu
} from 'lucide-react'
import './IconSidebar.css'

interface SidebarIcon {
  icon: React.ReactNode
  tooltip: string
  badge?: number | null
  id: string
}

const ICONS: SidebarIcon[] = [
  { id: 'branches', icon: <GitBranch size={14} />, tooltip: 'Branches', badge: null },
  { id: 'commits', icon: <History size={14} />, tooltip: 'Commits', badge: null },
  { id: 'remotes', icon: <Users size={14} />, tooltip: 'Remotes', badge: null },
  { id: 'tags', icon: <Tag size={14} />, tooltip: 'Tags', badge: null },
  { id: 'submodules', icon: <Box size={14} />, tooltip: 'Submodules', badge: null },
  { id: 'prs', icon: <GitPullRequest size={14} />, tooltip: 'Pull Requests', badge: null },
  { id: 'issues', icon: <CircleDot size={14} />, tooltip: 'Issues', badge: null },
  { id: 'more', icon: <Menu size={14} />, tooltip: 'More', badge: null },
]

export function IconSidebar({
  activePanel,
  onTogglePanel
}: {
  activePanel: string | null
  onTogglePanel: (id: string) => void
}) {
  return (
    <div className="icon-sidebar">
      {ICONS.map((item) => (
        <button
          key={item.id}
          className={`icon-sidebar-btn${activePanel === item.id ? ' active' : ''}`}
          title={item.tooltip}
          onClick={() => onTogglePanel(item.id)}
        >
          {item.icon}
          {item.badge != null && item.badge > 0 && (
            <span className="badge">{item.badge}</span>
          )}
        </button>
      ))}
    </div>
  )
}
