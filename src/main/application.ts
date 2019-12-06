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
import { Dispatcher } from './dispatcher'
import LogWindow from './log-window'

export default class Application {
  private dispatcher: Dispatcher
  private mainWindow: MainWindow | null = null
  private logWindow: LogWindow | null = null
  private moduleManager: ModuleManager
  private webServer: WebServer
  private tray: AppTray | null = null
  private config: Store<any>

  constructor() {
    const port = process.env.WASSHOI_SERVER_PORT
      ? parseInt(process.env.WASSHOI_SERVER_PORT, 10)
      : 13232

    this.dispatcher = new Dispatcher()
    this.config = new Store()
    this.webServer = new WebServer(port)
    this.moduleManager = new ModuleManager(this)

    this.dispatcher.on('dispatch', (text, options) => {
      // Dispatch event to renderer process
      this.mainWindow && this.mainWindow.dispatch(text, options)
      this.logWindow && this.logWindow.dispatch(text, options)
    })
  }

  getConfig(): Store<any> {
    return this.config
  }

  getDispatcher(): Dispatcher {
    return this.dispatcher
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

  getMainWindow(): MainWindow {
    return this.mainWindow as MainWindow
  }

  getLogWindow(): LogWindow {
    return this.logWindow as LogWindow
  }

  getBrowserWindow(): BrowserWindow {
    return this.getMainWindow().getBrowserWindow()
  }

  dispatch(text: string, options: object = {}): void {
    this.dispatcher.dispatch(text, options)
  }

  private initializeMainWindow() {
    if (this.mainWindow) return
    this.mainWindow = new MainWindow(this)
  }

  private initializeLogWindow() {
    if (this.logWindow) return
    this.logWindow = new LogWindow(this)
  }

  private async initialize(): Promise<any> {
    this.initializeMainWindow()
    this.initializeLogWindow()

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
      if (this.logWindow === null) this.initializeLogWindow()
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
