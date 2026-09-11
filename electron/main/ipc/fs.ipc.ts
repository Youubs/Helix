import { IpcMain, dialog, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../../src/shared/constants'
import { IpcResult, PlatformInfo } from '../../../src/shared/types'
import { detectGitBinary } from '../gitDetect'
import { detectSSH } from '../sshDetect'
import fs from 'fs'
import path from 'path'

export function registerFsHandlers(ipcMain: IpcMain) {
  ipcMain.handle(
    IPC_CHANNELS.FS_OPEN_DIALOG,
    async (): Promise<IpcResult<string | null>> => {
      try {
        const result = await dialog.showOpenDialog({
          properties: ['openDirectory'],
          title: 'Open Git Repository'
        })
        if (result.canceled || result.filePaths.length === 0) {
          return { ok: true, data: null }
        }
        return { ok: true, data: result.filePaths[0] }
      } catch (e: any) {
        return { ok: false, error: e.message }
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.FS_SAVE_DIALOG,
    async (_event, defaultPath?: string): Promise<IpcResult<string | null>> => {
      try {
        const result = await dialog.showOpenDialog({
          properties: ['openDirectory', 'createDirectory'],
          title: 'Choose Directory',
          defaultPath
        })
        if (result.canceled || result.filePaths.length === 0) {
          return { ok: true, data: null }
        }
        return { ok: true, data: result.filePaths[0] }
      } catch (e: any) {
        return { ok: false, error: e.message }
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.FS_READ_FILE,
    async (_event, filePath: string): Promise<IpcResult<string>> => {
      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        return { ok: true, data: content }
      } catch (e: any) {
        return { ok: false, error: e.message }
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.FS_PLATFORM_INFO,
    async (): Promise<IpcResult<PlatformInfo>> => {
      try {
        const gitPath = (await detectGitBinary()) || 'git'
        const sshAvailable = await detectSSH()
        return {
          ok: true,
          data: {
            platform: process.platform as 'win32' | 'darwin' | 'linux',
            gitPath,
            sshAvailable
          }
        }
      } catch (e: any) {
        return { ok: false, error: e.message }
      }
    }
  )
}
