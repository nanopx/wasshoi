import Application from './application'
import { Module, ModuleClass } from './modules/module'

export default class ModuleManager {
  modules: Module[] = []

  constructor(private app: Application) {}

  register(modules: ModuleClass | ModuleClass[]): void {
    if (!Array.isArray(modules)) {
      modules = [modules]
    }

    const moduleInstances = modules.map((Module) => new Module(this.app))

    this.modules = [...this.modules, ...moduleInstances]
  }

  private async eachModule(fn: (module: Module) => void): Promise<any[]> {
    return await Promise.all(this.getModules().map((module) => fn(module)))
  }

  getModule(name: string): Module | null {
    return this.modules.find((module) => module.name === name) || null
  }

  async setup(): Promise<any> {
    const server = this.app.getServer()
    await this.eachModule(async (module) => {
      await module.setup()

      // Setup router
      server.setRouter(module.getRouter())
    })
  }

  getModules(): Module[] {
    return this.modules
  }

  dispatch(text: string, options: object = {}): void {
    this.app.dispatch(text, options)
  }

  async listen(): Promise<any> {
    for (const module of this.modules) {
      await module.listen(this.dispatch.bind(this))
    }
  }
}
