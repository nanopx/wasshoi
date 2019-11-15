import { Tray, Menu, MenuItem } from 'electron'
import pkg from '../../package.json'
import Application from './application.js'
import trayIcon from './assets/tray.png'

export default class AppTray {
  private tray: Tray
  private menuItems: MenuItem[] = []

  constructor(private app: Application) {
    this.tray = new Tray(trayIcon)
    this.tray.setToolTip(pkg.name)
  }

  async initialize() {
    const modules = this.app.getModules()

    const moduleMenus = await modules.reduce(async (prev, module) => {
      const menus = await prev
      const items = (await module.getTrayMenus()) as MenuItem[]
      return [
        ...menus,
        {
          type: 'separator' as const,
        },
        ...items,
      ]
    }, [] as any)

    this.menuItems = [
      ...moduleMenus,
      {
        type: 'separator' as const,
      },
      {
        label: '終了',
        type: 'normal',
        click: () => {
          this.app.quit()
        },
      } as any,
    ]

    this.tray.setContextMenu(Menu.buildFromTemplate(this.menuItems))
  }

  update(): void {
    this.initialize()
  }
}
