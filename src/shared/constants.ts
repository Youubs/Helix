export const IPC_CHANNELS = {
  // Git operations
  GIT_OPEN: 'git:open',
  GIT_LOG: 'git:log',
  GIT_STATUS: 'git:status',
  GIT_STAGE: 'git:stage',
  GIT_UNSTAGE: 'git:unstage',
  GIT_COMMIT: 'git:commit',
  GIT_BRANCHES: 'git:branches',
  GIT_BRANCH_DELETE: 'git:branch-delete',
  GIT_CHECKOUT: 'git:checkout',
  GIT_DIFF: 'git:diff',
  GIT_DIFF_COMMIT: 'git:diff-commit',
  GIT_PULL: 'git:pull',
  GIT_PUSH: 'git:push',
  GIT_FETCH: 'git:fetch',
  GIT_MERGE: 'git:merge',
  GIT_REBASE: 'git:rebase',
  GIT_CHERRY_PICK: 'git:cherry-pick',
  GIT_STASH_LIST: 'git:stash-list',
  GIT_STASH_PUSH: 'git:stash-push',
  GIT_STASH_POP: 'git:stash-pop',
  GIT_STASH_APPLY: 'git:stash-apply',
  GIT_STASH_DROP: 'git:stash-drop',
  GIT_RESET: 'git:reset',
  GIT_REVERT: 'git:revert',
  GIT_TAG_LIST: 'git:tag-list',
  GIT_TAG_CREATE: 'git:tag-create',
  GIT_TAG_DELETE: 'git:tag-delete',
  GIT_TAG_PUSH: 'git:tag-push',
  GIT_BLAME: 'git:blame',
  GIT_REMOTE_LIST: 'git:remote-list',
  GIT_REMOTE_ADD: 'git:remote-add',
  GIT_REMOTE_REMOVE: 'git:remote-remove',
  GIT_CLONE: 'git:clone',
  GIT_INIT: 'git:init',

  // File system operations
  FS_OPEN_DIALOG: 'fs:open-dialog',
  FS_SAVE_DIALOG: 'fs:save-dialog',
  FS_READ_FILE: 'fs:read-file',
  FS_PLATFORM_INFO: 'fs:platform-info',

  // Events (main → renderer)
  REPO_CHANGED: 'git:repo-changed',

  // Window operations
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_IS_MAXIMIZED: 'window:is-maximized',

  // Profile operations
  PROFILE_LIST: 'profile:list',
  PROFILE_GET: 'profile:get',
  PROFILE_CREATE: 'profile:create',
  PROFILE_UPDATE: 'profile:update',
  PROFILE_DELETE: 'profile:delete',
  PROFILE_SET_ACTIVE: 'profile:set-active',
  PROFILE_GET_ACTIVE: 'profile:get-active',

  // Azure DevOps operations
  AZURE_VALIDATE_PAT: 'azure:validate-pat',
  AZURE_LIST_PROJECTS: 'azure:list-projects',
  AZURE_LIST_REPOS: 'azure:list-repos',
  AZURE_LIST_PRS: 'azure:list-pull-requests',
  AZURE_CREATE_PR: 'azure:create-pull-request',
  AZURE_CLONE_REPO: 'azure:clone-repo',
  AZURE_CHECK_TOKEN: 'azure:check-token',

  // Terminal operations & events
  TERMINAL_SPAWN: 'terminal:spawn',
  TERMINAL_DATA: 'terminal:data',
  TERMINAL_INPUT: 'terminal:input',
  TERMINAL_RESIZE: 'terminal:resize',
  TERMINAL_KILL: 'terminal:kill',

  // Events (main → renderer)
  AZURE_TOKEN_EXPIRED: 'azure:token-expired',
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]
