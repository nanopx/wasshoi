import { screen, Menu } from 'electron'
import { Module } from '../module'

export default class WasshoiModule extends Module {
  name = 'wasshoi'

  private getCurrentDisplay() {
    return screen.getDisplayNearestPoint(this.getBrowserWindow().getBounds())
  }

  async setup(): Promise<any> {
    return Promise.resolve()
  }

  listen(): Promise<any> {
    return Promise.resolve()
  }

  async getTrayMenus() {
    const config = this.getConfig()
    const window = this.getBrowserWindow()
    const currentDisplay = this.getCurrentDisplay()

    return Promise.resolve([
      {
        label: '再読み込み',
        click: () => {
          this.getTray().update()
        },
      },
      {
        label: 'ディスプレイの切り替え',
        type: 'submenu' as const,
        submenu: (screen.getAllDisplays().map((display, i) => ({
          label: `ディスプレイ${i + 1}`,
          type: 'checkbox' as const,
          checked: currentDisplay.id === display.id,
          click: () => {
            window.setBounds(display.bounds)
            this.getMainWindow().bringToTop()
            this.getTray().update()
          },
        })) as any) as Menu,
      },
      {
        label: '表示設定',
        type: 'submenu' as const,
        submenu: ([
          {
            label: 'ユーザーの名前を表示する',
            type: 'checkbox' as const,
            checked: config.get('display.show_username', false),
            click: () => {
              config.set(
                'display.show_username',
                !config.get('display.show_username', false)
              )
            },
          },
          {
            label: '文字色',
            type: 'submenu' as const,
            submenu: ([
              {
                label: 'ランダム',
                type: 'radio' as const,
                checked:
                  config.get('display.font_color_mode', 'random') === 'random',
                click: () => {
                  config.set('display.font_color_mode', 'random')
                },
              },
              {
                label: '明るい色',
                type: 'radio' as const,
                checked:
                  config.get('display.font_color_mode', 'random') === 'light',
                click: () => {
                  config.set('display.font_color_mode', 'light')
                },
              },
              {
                label: '暗い色',
                type: 'radio' as const,
                checked:
                  config.get('display.font_color_mode', 'random') === 'dark',
                click: () => {
                  config.set('display.font_color_mode', 'dark')
                },
              },
              {
                label: '白',
                type: 'radio' as const,
                checked:
                  config.get('display.font_color_mode', 'random') === 'white',
                click: () => {
                  config.set('display.font_color_mode', 'white')
                },
              },
              {
                label: '黒',
                type: 'radio' as const,
                checked:
                  config.get('display.font_color_mode', 'random') === 'black',
                click: () => {
                  config.set('display.font_color_mode', 'black')
                },
              },
            ] as any) as Menu,
          },
          {
            label: '透過背景',
            type: 'submenu' as const,
            submenu: ([
              {
                label: 'なし',
                type: 'radio' as const,
                checked:
                  config.get('display.transparent_background', 'none') ===
                  'none',
                click: () => {
                  config.set('display.transparent_background', 'none')
                },
              },
              {
                label: '明るい色',
                type: 'radio' as const,
                checked:
                  config.get('display.transparent_background', 'none') ===
                  'light',
                click: () => {
                  config.set('display.transparent_background', 'light')
                },
              },
              {
                label: '暗い色',
                type: 'radio' as const,
                checked:
                  config.get('display.transparent_background', 'none') ===
                  'dark',
                click: () => {
                  config.set('display.transparent_background', 'dark')
                },
              },
            ] as any) as Menu,
          },
        ] as any) as Menu,
      },
    ])
  }
}
