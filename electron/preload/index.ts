import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../../src/shared/constants'
import type {
  IpcResult,
  CommitNode,
  BranchInfo,
  StatusResult,
  TagInfo,
  StashEntry,
  RemoteInfo,
  BlameResult,
  PlatformInfo,
  LogOptions,
  CommitOptions,
  PullOptions,
  PushOptions,
  ResetOptions,
  HelixProfile,
  AzureProject,
  AzureRepo,
  AzurePullRequest
} from '../../src/shared/types'

const gitAPI = {
  openRepository: (path: string): Promise<IpcResult<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_OPEN, path),
  getLog: (opts?: LogOptions): Promise<IpcResult<CommitNode[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_LOG, opts),
  getStatus: (): Promise<IpcResult<StatusResult>> =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_STATUS),
  stage: (files: string[]): Promise<IpcResult<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_STAGE, files),
  unstage: (files: string[]): Promise<IpcResult<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_UNSTAGE, files),
  commit: (message: string, opts?: CommitOptions): Promise<IpcResult<string>> =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_COMMIT, message, opts),
  getBranches: (): Promise<IpcResult<BranchInfo[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_BRANCHES),
  deleteBranch: (branch: string, force?: boolean): Promise<IpcResult<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_BRANCH_DELETE, branch, force),
  checkout: (ref: string): Promise<IpcResult<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_CHECKOUT, ref),
  getDiff: (file: string, staged?: boolean): Promise<IpcResult<string>> =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_DIFF, file, staged),
  getDiffCommit: (hash: string): Promise<IpcResult<string>> =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_DIFF_COMMIT, hash),
  pull: (opts?: PullOptions): Promise<IpcResult<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_PULL, opts),
  push: (opts?: PushOptions): Promise<IpcResult<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_PUSH, opts),
  fetch: (remote?: string): Promise<IpcResult<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_FETCH, remote),
  merge: (branch: string): Promise<IpcResult<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_MERGE, branch),
  rebase: (branch: string, opts?: { abort?: boolean; continue_?: boolean }): Promise<IpcResult<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_REBASE, branch, opts),
  cherryPick: (hash: string): Promise<IpcResult<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_CHERRY_PICK, hash),
  getStashList: (): Promise<IpcResult<StashEntry[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_STASH_LIST),
  stashPush: (message?: string): Promise<IpcResult<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_STASH_PUSH, message),
  stashPop: (index?: number): Promise<IpcResult<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_STASH_POP, index),
  stashApply: (index?: number): Promise<IpcResult<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_STASH_APPLY, index),
  stashDrop: (index?: number): Promise<IpcResult<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_STASH_DROP, index),
  reset: (opts: ResetOptions): Promise<IpcResult<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_RESET, opts),
  revert: (hash: string): Promise<IpcResult<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_REVERT, hash),
  getTagList: (): Promise<IpcResult<TagInfo[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_TAG_LIST),
  createTag: (name: string, ref?: string, message?: string): Promise<IpcResult<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_TAG_CREATE, name, ref, message),
  deleteTag: (name: string): Promise<IpcResult<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_TAG_DELETE, name),
  pushTag: (name: string, remote?: string): Promise<IpcResult<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_TAG_PUSH, name, remote),
  blame: (file: string): Promise<IpcResult<BlameResult>> =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_BLAME, file),
  getRemotes: (): Promise<IpcResult<RemoteInfo[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_REMOTE_LIST),
  addRemote: (name: string, url: string): Promise<IpcResult<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_REMOTE_ADD, name, url),
  removeRemote: (name: string): Promise<IpcResult<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_REMOTE_REMOVE, name),
  clone: (url: string, localPath: string): Promise<IpcResult<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_CLONE, url, localPath),
  init: (localPath: string): Promise<IpcResult<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_INIT, localPath),

  onRepoChanged: (callback: () => void) => {
    ipcRenderer.on(IPC_CHANNELS.REPO_CHANGED, callback)
    return () => { ipcRenderer.removeListener(IPC_CHANNELS.REPO_CHANGED, callback) }
  }
}

const fsAPI = {
  openDialog: (): Promise<IpcResult<string | null>> =>
    ipcRenderer.invoke(IPC_CHANNELS.FS_OPEN_DIALOG),
  saveDialog: (defaultPath?: string): Promise<IpcResult<string | null>> =>
    ipcRenderer.invoke(IPC_CHANNELS.FS_SAVE_DIALOG, defaultPath),
  readFile: (path: string): Promise<IpcResult<string>> =>
    ipcRenderer.invoke(IPC_CHANNELS.FS_READ_FILE, path),
  getPlatformInfo: (): Promise<IpcResult<PlatformInfo>> =>
    ipcRenderer.invoke(IPC_CHANNELS.FS_PLATFORM_INFO)
}

const windowAPI = {
  minimize: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MINIMIZE),
  maximize: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MAXIMIZE),
  close: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_CLOSE),
  isMaximized: (): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.WINDOW_IS_MAXIMIZED)
}

const profileAPI = {
  list: (): Promise<IpcResult<HelixProfile[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.PROFILE_LIST),
  get: (id: string): Promise<IpcResult<HelixProfile | null>> =>
    ipcRenderer.invoke(IPC_CHANNELS.PROFILE_GET, id),
  create: (data: Omit<HelixProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<IpcResult<HelixProfile>> =>
    ipcRenderer.invoke(IPC_CHANNELS.PROFILE_CREATE, data),
  update: (id: string, patch: Partial<HelixProfile>): Promise<IpcResult<HelixProfile>> =>
    ipcRenderer.invoke(IPC_CHANNELS.PROFILE_UPDATE, id, patch),
  delete: (id: string): Promise<IpcResult<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.PROFILE_DELETE, id),
  setActive: (id: string): Promise<IpcResult<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.PROFILE_SET_ACTIVE, id),
  getActive: (): Promise<IpcResult<HelixProfile | null>> =>
    ipcRenderer.invoke(IPC_CHANNELS.PROFILE_GET_ACTIVE)
}

const azureAPI = {
  validatePat: (args: { orgUrl: string; pat: string; profileId: string; integrationId: string }): Promise<IpcResult<{ projects: AzureProject[] }>> =>
    ipcRenderer.invoke(IPC_CHANNELS.AZURE_VALIDATE_PAT, args),
  listProjects: (args: { profileId: string; integrationId: string }): Promise<IpcResult<AzureProject[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.AZURE_LIST_PROJECTS, args),
  listRepos: (args: { profileId: string; integrationId: string; project: string }): Promise<IpcResult<AzureRepo[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.AZURE_LIST_REPOS, args),
  listPullRequests: (args: { profileId: string; integrationId: string; project: string; repoId: string; status?: string }): Promise<IpcResult<AzurePullRequest[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.AZURE_LIST_PRS, args),
  createPR: (args: { profileId: string; integrationId: string; project: string; repoId: string; title: string; description?: string; sourceRefName: string; targetRefName: string; isDraft?: boolean; reviewers?: string[] }): Promise<IpcResult<AzurePullRequest>> =>
    ipcRenderer.invoke(IPC_CHANNELS.AZURE_CREATE_PR, args),
  cloneRepo: (args: { profileId: string; integrationId: string; remoteUrl: string; destPath: string }): Promise<IpcResult<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.AZURE_CLONE_REPO, args),
  checkToken: (args: { profileId: string; integrationId: string }): Promise<IpcResult<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.AZURE_CHECK_TOKEN, args),
  onTokenExpired: (callback: (data: { profileId: string; integrationId: string; orgLabel: string }) => void) => {
    const handler = (_event: any, data: any) => callback(data)
    ipcRenderer.on(IPC_CHANNELS.AZURE_TOKEN_EXPIRED, handler)
    return () => { ipcRenderer.removeListener(IPC_CHANNELS.AZURE_TOKEN_EXPIRED, handler) }
  }
}

const terminalAPI = {
  spawn: (cwd: string): Promise<IpcResult<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.TERMINAL_SPAWN, cwd),
  sendInput: (data: string): Promise<IpcResult<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.TERMINAL_INPUT, data),
  kill: (): Promise<IpcResult<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.TERMINAL_KILL),
  onData: (callback: (data: string) => void) => {
    const handler = (_event: any, data: string) => callback(data)
    ipcRenderer.on(IPC_CHANNELS.TERMINAL_DATA, handler)
    return () => { ipcRenderer.removeListener(IPC_CHANNELS.TERMINAL_DATA, handler) }
  }
}

contextBridge.exposeInMainWorld('gitAPI', gitAPI)
contextBridge.exposeInMainWorld('fsAPI', fsAPI)
contextBridge.exposeInMainWorld('windowAPI', windowAPI)
contextBridge.exposeInMainWorld('profileAPI', profileAPI)
contextBridge.exposeInMainWorld('azureAPI', azureAPI)
contextBridge.exposeInMainWorld('terminalAPI', terminalAPI)

export type GitAPI = typeof gitAPI
export type FsAPI = typeof fsAPI
export type WindowAPI = typeof windowAPI
export type ProfileAPI = typeof profileAPI
export type AzureAPI = typeof azureAPI
export type TerminalAPI = typeof terminalAPI
