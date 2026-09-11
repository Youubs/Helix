import { IpcMain, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../../src/shared/constants'

export function registerWindowHandlers(
  ipcMain: IpcMain,
  getWindow: () => BrowserWindow | null
) {
  ipcMain.handle(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
    getWindow()?.minimize()
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
    const win = getWindow()
    if (win?.isMaximized()) {
      win.unmaximize()
    } else {
      win?.maximize()
    }
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, () => {
    getWindow()?.close()
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW_IS_MAXIMIZED, () => {
    return getWindow()?.isMaximized() ?? false
  })
}
