import { BrowserWindow, app as electronApp } from 'electron'
import { client } from 'electron-connect'
import loadDevtool from 'electron-load-devtool'
import Application from './application'

const isDev = process.env.NODE_ENV === 'development'

export default class LogWindow {
  private window: BrowserWindow | null = null

  constructor(private app: Application) {
    this.window = new BrowserWindow({
      show: false,
      width: 500,
      height: 800,
      frame: false,
      transparent: true,
      hasShadow: false,
      alwaysOnTop: true,
      fullscreenable: false,
      webPreferences: {
        nodeIntegration: true,
      },
    })

    this.window.loadFile('./build/log-view.html')

    this.window.on('closed', () => {
      this.window = null
    })

    this.window.on('closed', (): void => {
      this.window = null
    })

    if (isDev) {
      client.create(this.window)
      loadDevtool(loadDevtool.REACT_DEVELOPER_TOOLS)
    }
  }

  isOpen(): boolean {
    return this.window ? this.window.isVisible() : false
  }

  show() {
    this.window && this.window.show()
    this.bringToTop()
  }

  hide() {
    this.window && this.window.hide()
  }

  bringToTop() {
    if (!this.window) return
    if (process.platform === 'darwin') electronApp.dock.hide()
    this.window.setAlwaysOnTop(true, 'screen-saver', 1)
    this.window.moveTop()
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
