export type IpcResult<T> = { ok: true; data: T } | { ok: false; error: string }

export interface CommitNode {
  hash: string
  abbreviatedHash: string
  parents: string[]
  message: string
  body: string
  authorName: string
  authorEmail: string
  authorDate: string
  refs: RefInfo[]
}

export interface RefInfo {
  name: string
  type: 'head' | 'local-branch' | 'remote-branch' | 'tag'
}

export interface BranchInfo {
  name: string
  current: boolean
  commit: string
  remote?: string
  tracking?: string
  ahead?: number
  behind?: number
}

export interface TagInfo {
  name: string
  commit: string
  message?: string
}

export interface StashEntry {
  index: number
  message: string
  date: string
}

export interface FileStatus {
  path: string
  index: string
  working_dir: string
  isStaged: boolean
}

export interface StatusResult {
  current: string | null
  tracking: string | null
  ahead: number
  behind: number
  staged: FileStatus[]
  unstaged: FileStatus[]
  untracked: string[]
  conflicted: string[]
}

export interface DiffFile {
  file: string
  status: 'added' | 'modified' | 'deleted' | 'renamed'
  additions: number
  deletions: number
  hunks: DiffHunk[]
}

export interface DiffHunk {
  header: string
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
  lines: DiffLine[]
}

export interface DiffLine {
  type: 'add' | 'remove' | 'context'
  content: string
  oldLineNumber?: number
  newLineNumber?: number
}

export interface RemoteInfo {
  name: string
  fetchUrl: string
  pushUrl: string
}

export interface RepoInfo {
  path: string
  name: string
  lastOpened: number
  pinned: boolean
}

export interface LogOptions {
  maxCount?: number
  from?: string
  to?: string
  file?: string
  all?: boolean
}

export interface CommitOptions {
  amend?: boolean
  coAuthors?: string[]
}

export interface PullOptions {
  remote?: string
  branch?: string
  rebase?: boolean
  ffOnly?: boolean
}

export interface PushOptions {
  remote?: string
  branch?: string
  force?: boolean
  setUpstream?: boolean
}

export interface ResetOptions {
  mode: 'soft' | 'mixed' | 'hard'
  ref: string
}

export interface BlameResult {
  lines: BlameLine[]
}

export interface BlameLine {
  hash: string
  author: string
  date: string
  lineNumber: number
  content: string
}

export interface PlatformInfo {
  platform: 'win32' | 'darwin' | 'linux'
  gitPath: string
  sshAvailable: boolean
}

// ─── Profiles ────────────────────────────────────────────────────────────────

export type ProfileAvatar =
  | { type: 'initials'; color: string }
  | { type: 'emoji'; value: string }

export interface ProfileProject {
  id: string
  path: string
  name: string
  remote?: string
  isPinned: boolean
  lastOpenedAt: string
  color?: string
}

export interface HelixProfile {
  id: string
  name: string
  avatar: ProfileAvatar
  createdAt: string
  updatedAt: string

  git: {
    userName: string
    userEmail: string
    signingKey?: string
    sshKeyPath?: string
  }

  preferences: {
    theme: 'dark' | 'light' | 'system'
    defaultBranch: string
    fetchOnStartup: boolean
    autofetchInterval: number
    showAuthorAvatars: boolean
    commitGraphDensity: 'compact' | 'comfortable' | 'spacious'
    diffFont: string
    diffTabSize: 2 | 4 | 8
    language: 'en' | 'fr' | 'de' | 'es'
  }

  projects: ProfileProject[]

  integrations: {
    azureDevOps?: AzureDevOpsIntegration[]
    github?: GitHubIntegration
    gitlab?: GitLabIntegration
    bitbucket?: BitbucketIntegration
  }
}

// ─── Azure DevOps ────────────────────────────────────────────────────────────

export type AzureScope =
  | 'code.read'
  | 'code.write'
  | 'pullrequest.read'
  | 'pullrequest.write'
  | 'workitems.read'
  | 'build.read'

export interface AzureDevOpsIntegration {
  id: string
  label: string
  organizationUrl: string
  defaultProject?: string
  connectedAt: string
  lastSyncAt?: string
  scopes: AzureScope[]
}

export interface AzureProject {
  id: string
  name: string
  description?: string
  url: string
}

export interface AzureRepo {
  id: string
  name: string
  project: string
  remoteUrl: string
  defaultBranch?: string
  size: number
}

export interface AzureReviewer {
  displayName: string
  uniqueName: string
  vote: number
  isRequired: boolean
}

export interface AzurePullRequest {
  id: number
  title: string
  description?: string
  status: 'active' | 'completed' | 'abandoned'
  createdBy: { displayName: string; uniqueName: string }
  creationDate: string
  sourceRefName: string
  targetRefName: string
  reviewers: AzureReviewer[]
  url: string
  isDraft: boolean
  mergeStatus: 'succeeded' | 'conflicts' | 'rejectedByPolicy' | 'queued' | 'notSet'
}

// Placeholder integration types (to be expanded later)
export interface GitHubIntegration {
  id: string
  label: string
  username: string
  connectedAt: string
}

export interface GitLabIntegration {
  id: string
  label: string
  instanceUrl: string
  connectedAt: string
}

export interface BitbucketIntegration {
  id: string
  label: string
  workspace: string
  connectedAt: string
}
