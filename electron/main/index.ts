import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { createWindow } from './windowManager'
import { registerGitHandlers } from './ipc/git.ipc'
import { registerFsHandlers } from './ipc/fs.ipc'
import { registerWindowHandlers } from './ipc/window.ipc'
import { initWatcher, stopWatcher } from './watcher'
import { initStore } from './store'

let mainWindow: BrowserWindow | null = null

function init() {
  initStore()

  mainWindow = createWindow()

  registerGitHandlers(ipcMain)
  registerFsHandlers(ipcMain)
  registerWindowHandlers(ipcMain, () => mainWindow)

  mainWindow.on('closed', () => {
    mainWindow = null
    stopWatcher()
  })
}

app.whenReady().then(init)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createWindow()
  }
})

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

export { initWatcher, stopWatcher }
