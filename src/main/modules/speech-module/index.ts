import path from 'path'
import { shell } from 'electron'
import { Module } from '../module'
import indexHtml from './index.html'

export default class SpeechModule extends Module {
  name = 'speech'

  isModuleListening = false

  async setup(): Promise<any> {
    const router = this.getRouter()

    router.get('/speech', (req, res) => {
      res.render(path.resolve(__dirname, indexHtml), {
        port: this.getApp().getInternalServerPort(),
      })
    })

    router.ws('/speech', (ws) => {
      ws.on('message', (message) => {
        this.dispatch(message as string)
        ws.send('OK')
      })
    })
  }

  listen(): Promise<any> {
    this.isModuleListening = true

    this.getTray().update()

    return Promise.resolve()
  }

  async getTrayMenus() {
    const port = this.getApp().getInternalServerPort()

    if (!this.isModuleListening) return Promise.resolve([])

    return Promise.resolve([
      {
        label: '音声入力',
        click: () => {
          shell.openExternal(`http://localhost:${port}/speech`)
        },
      },
    ])
  }
}
