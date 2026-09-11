import { ipcMain, BrowserWindow } from 'electron'
import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import os from 'os'
import { IPC_CHANNELS } from '../../../src/shared/constants'

let activeTerminalProcess: ChildProcessWithoutNullStreams | null = null

export function registerTerminalIPC() {
  ipcMain.handle(IPC_CHANNELS.TERMINAL_SPAWN, async (event, cwd: string) => {
    try {
      if (activeTerminalProcess) {
        activeTerminalProcess.kill()
        activeTerminalProcess = null
      }

      const shell = os.platform() === 'win32' ? 'powershell.exe' : process.env.SHELL || 'bash'
      const args = os.platform() === 'win32' ? ['-NoLogo'] : []

      activeTerminalProcess = spawn(shell, args, {
        cwd: cwd || process.cwd(),
        env: { ...process.env, TERM: 'xterm-256color' }
      })

      activeTerminalProcess.stdout.on('data', (chunk: Buffer) => {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (win) {
          win.webContents.send(IPC_CHANNELS.TERMINAL_DATA, chunk.toString('utf-8'))
        }
      })

      activeTerminalProcess.stderr.on('data', (chunk: Buffer) => {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (win) {
          win.webContents.send(IPC_CHANNELS.TERMINAL_DATA, chunk.toString('utf-8'))
        }
      })

      activeTerminalProcess.on('exit', () => {
        activeTerminalProcess = null
      })

      return { ok: true, data: true }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.TERMINAL_INPUT, async (_event, data: string) => {
    if (activeTerminalProcess && activeTerminalProcess.stdin) {
      activeTerminalProcess.stdin.write(data)
      return { ok: true, data: true }
    }
    return { ok: false, error: 'No active terminal session' }
  })

  ipcMain.handle(IPC_CHANNELS.TERMINAL_KILL, async () => {
    if (activeTerminalProcess) {
      activeTerminalProcess.kill()
      activeTerminalProcess = null
    }
    return { ok: true, data: true }
  })
}
