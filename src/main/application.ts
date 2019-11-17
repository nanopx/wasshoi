import { app /*, crashReporter*/, BrowserWindow } from 'electron'
import Store from 'electron-store'
import AppTray from './app-tray'
import MainWindow from './main-window'
import ModuleManager from './module-manager'
import WebServer from './web-server'
import { Module } from './modules/module'
import SlackModule from './modules/slack-module'
import WasshoiModule from './modules/wasshoi-module'
import SpeechModule from './modules/speech-module'

export default class Application {
  private mainWindow: MainWindow | null = null
  private moduleManager: ModuleManager
  private webServer: WebServer
  private tray: AppTray | null = null
  private config: Store<any>

  constructor() {
    const port = process.env.WASSHOI_SERVER_PORT
      ? parseInt(process.env.WASSHOI_SERVER_PORT, 10)
      : 13232

    this.config = new Store()

    this.webServer = new WebServer(port)
    this.moduleManager = new ModuleManager(this)
  }

  getConfig(): Store<any> {
    return this.config
  }

  getInternalServer(): WebServer {
    return this.webServer
  }

  getInternalServerPort(): number {
    return this.webServer.getPort()
  }

  getTray(): AppTray | null {
    return this.tray
  }

  getModules(): Module[] {
    return this.moduleManager.getModules()
  }

  getModuleManager(): ModuleManager {
    return this.moduleManager
  }

  getMainWindow(): MainWindow | null {
    return this.mainWindow
  }

  getBrowserWindow(): BrowserWindow | null {
    return this.mainWindow ? this.mainWindow.getBrowserWindow() : null
  }

  dispatch(text: string, options: object = {}): void {
    // Dispatch event to renderer process
    this.mainWindow && this.mainWindow.dispatch(text, options)
  }

  private async initialize(): Promise<any> {
    this.mainWindow = new MainWindow(this)
    this.tray = new AppTray(this)

    this.moduleManager.register([WasshoiModule, SlackModule, SpeechModule])

    // Always initialize tray after the module registration
    this.tray.initialize()

    // Setup modules
    this.moduleManager.setup()

    // Initialize web server
    await this.webServer.listen()

    // Listen to messages from each datasource
    await this.moduleManager.listen()
    console.log('Listening to incoming messages...')
  }

  private registerAppHandlers(): void {
    app.on('ready', () => {
      this.initialize()
    })

    app.on('window-all-closed', () => {
      this.teardown()
      if (process.platform !== 'darwin') app.quit()
    })

    app.on('activate', () => {
      if (this.mainWindow === null) this.initialize()
    })
  }

  // startCrashReporter() {
  //   crashReporter.start()
  // }

  teardown(): void {
    this.webServer.close()
  }

  quit(): void {
    this.teardown()
    app.quit()
  }

  run(): void {
    this.registerAppHandlers()
    // this.startCrashReporter()
  }
}
