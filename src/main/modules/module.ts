import Application from '../application'
import AppTray from '../app-tray'
import { MenuItem, BrowserWindow } from 'electron'
import MainWindow from '../main-window'
import { Router } from 'express-ws'

export type DispatchFn = (text: string, options?: object) => void

export abstract class Module {
  abstract name: string
  private router: Router

  constructor(private app: Application) {
    const server = this.app.getInternalServer()
    this.router = server.getRouter()
  }

  getApp(): Application {
    return this.app
  }

  getConfig() {
    return this.getApp().getConfig()
  }

  getModuleName(): string {
    return this.name
  }

  getRouter() {
    return this.router
  }

  getMainWindow() {
    return this.app.getMainWindow() as MainWindow
  }

  dispatch(text: string, options?: object) {
    this.getMainWindow().dispatch(text, options)
  }

  getBrowserWindow() {
    return this.app.getBrowserWindow() as BrowserWindow
  }

  getTray() {
    return this.app.getTray() as AppTray
  }

  getTrayMenus(): Promise<Partial<MenuItem>[]> {
    return Promise.resolve([])
  }

  abstract setup(): Promise<any>

  abstract listen(dispatch: DispatchFn): Promise<any>
}

export type ModuleClass = new (app: Application) => Module
