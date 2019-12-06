import Application from '../application'
import AppTray from '../app-tray'
import { MenuItem } from 'electron'
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
    return this.app.getMainWindow()
  }

  getLogWindow() {
    return this.app.getLogWindow()
  }

  dispatch(text: string, options?: object) {
    this.app.dispatch(text, options)
  }

  getBrowserWindow() {
    return this.app.getBrowserWindow()
  }

  getTray() {
    return this.app.getTray() as AppTray
  }

  getTrayMenus(): Promise<Partial<MenuItem>[]> {
    return Promise.resolve([])
  }

  async setup(): Promise<any> {
    return Promise.resolve()
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  listen(dispatch: DispatchFn): Promise<any> {
    return Promise.resolve()
  }
}

export type ModuleClass = new (app: Application) => Module
