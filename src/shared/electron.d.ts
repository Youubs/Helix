import type { GitAPI, FsAPI, WindowAPI, ProfileAPI, AzureAPI, TerminalAPI } from '../../electron/preload/index'

declare global {
  interface Window {
    gitAPI: GitAPI
    fsAPI: FsAPI
    windowAPI: WindowAPI
    profileAPI: ProfileAPI
    azureAPI: AzureAPI
    terminalAPI: TerminalAPI
  }
}
