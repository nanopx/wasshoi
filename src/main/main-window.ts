import { BrowserWindow, app as electronApp } from 'electron'
import { client } from 'electron-connect'
import loadDevtool from 'electron-load-devtool'
import Application from './application'

const isDev = process.env.NODE_ENV === 'development'

export default class MainWindow {
  window: BrowserWindow | null = null

  constructor(private app: Application) {
    this.window = new BrowserWindow({
      width: 800,
      height: 600,
      frame: false,
      transparent: true,
      hasShadow: false,
      alwaysOnTop: true,
      webPreferences: {
        nodeIntegration: true,
      },
      fullscreenable: false,
    })

    this.window.maximize()
    this.window.setIgnoreMouseEvents(true)

    this.window.loadFile('./build/index.html')

    this.bringToTop()

    this.window.on('closed', () => {
      this.window = null
      app.quit()
    })

    this.window.on('ready-to-show', (): void => {
      if (this.window) this.window.show()
    })

    this.window.on('closed', (): void => {
      this.window = null
    })

    if (isDev) {
      client.create(this.window)
      loadDevtool(loadDevtool.REACT_DEVELOPER_TOOLS)
    }
  }

  bringToTop() {
    if (!this.window) return
    if (process.platform === 'darwin') electronApp.dock.hide()
    this.window.setAlwaysOnTop(true, 'floating')
    this.window.setVisibleOnAllWorkspaces(true)
    if (process.platform === 'darwin') electronApp.dock.show()
  }

  getBrowserWindow(): BrowserWindow | null {
    return this.window
  }

  dispatch(text: string, options: object = {}): void {
    // Dispatch event to renderer process
    this.window &&
      this.window.webContents.send('message', {
        text,
        options,
      })
  }
}
