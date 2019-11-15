import path from 'path'
import authHtml from './auth.html'
import { clipboard, dialog, BrowserWindow, Menu } from 'electron'
import { RTMClient } from '@slack/rtm-api'
import { WebClient } from '@slack/web-api'
import { Module } from '../module'
import Application from '../../application'
import asyncHandler from '../../lib/async-handler'
import SlackMessageParser from './slack-message-parser'

export default class SlackModule extends Module {
  name = 'slack'
  webClient: WebClient | null = null
  rtmClient: RTMClient | null = null
  authWindow: BrowserWindow | null = null

  constructor(app: Application) {
    super(app)
  }

  private createAuthWindow() {
    this.authWindow = new BrowserWindow({
      width: 1000,
      height: 600,
      alwaysOnTop: true,
      webPreferences: {
        nodeIntegration: true,
      },
    })

    this.authWindow.loadFile(path.resolve(__dirname, authHtml))

    this.authWindow.on('closed', () => {
      this.authWindow = null

      const app = this.getApp()
      const config = this.getConfig()

      if (!config.get('access_token')) {
        app.quit()
      }
    })
  }

  private async listenToSlackEvents(token: string, bot: any) {
    this.webClient = new WebClient(bot.bot_access_token)
    this.rtmClient = new RTMClient(bot.bot_access_token)
    const config = this.getConfig()

    this.getTray().update()

    const parser = new SlackMessageParser(this.webClient, new WebClient(token))

    // Attach listeners to events by type. See: https://api.slack.com/events/message
    this.rtmClient.on('message', async (event) => {
      if (event.user === bot.bot_user_id && event.subtype === 'channel_join') {
        this.getTray().update()
      }

      const activatedChannels = config.get('activated_channels', [])
      if (!activatedChannels.includes(event.channel)) return

      if (event.type === 'message' && !event.subtype && event.text) {
        let message = await parser.parse(event.text)

        if (config.get('display.show_username', false)) {
          const { user } = await (this.webClient as WebClient).users.info({
            user: event.user,
          })
          message = `@${(user as any).profile.display_name}: ${message}`
        }

        this.dispatch(message)
      }
    })

    await this.rtmClient.start()
  }

  private handleAuth = asyncHandler(async (req, res) => {
    const { access_token: token, bot } = await new WebClient().oauth.access({
      client_id: process.env.SLACK_CLIENT_ID || '',
      client_secret: process.env.SLACK_CLIENT_SECRET || '',
      code: req.query.code,
    })

    const config = this.getConfig()
    config.set('access_token', token)
    config.set('bot', bot)

    // Close the auth window
    this.authWindow && this.authWindow.close()

    this.listenToSlackEvents(token as string, bot as string)

    return res.send({
      status: 'ok',
    })
  })

  async setup(): Promise<any> {
    const router = this.getRouter()

    // Register auth route
    router.get('/slack/auth', this.handleAuth)
  }

  async listen(): Promise<any> {
    const config = this.getConfig()
    const token = config.get('access_token')

    if (!token) {
      this.createAuthWindow()
    } else {
      const { ok } = await new WebClient().auth.test({ token })

      if (!ok) {
        this.createAuthWindow()
      } else {
        const bot = config.get('bot')
        await this.listenToSlackEvents(token, bot)
      }
    }
  }

  async getTrayMenus() {
    const config = this.getConfig()
    const { channels }: any = this.webClient
      ? await this.webClient.conversations.list({
          exclude_archived: true,
          limit: 1000,
          types: 'public_channel', // ,mpim,im'
        })
      : { channels: [] }

    const joinedChannels = channels.filter((channel: any) => channel.is_member)

    return [
      {
        label: '招待コマンドをコピー',
        click: () => {
          // TODO: APIから取得したbot名を使用する
          clipboard.writeText('/invite @wasshoi')
          dialog.showMessageBox(this.getBrowserWindow(), {
            title: 'クリップボードにコピーしました。',
            message:
              '以下のコマンドをクリップボードにコピーしました。\n使用したいチャンネルで@wasshoiを招待して、チャンネルを再読込みしてください。\n\n/invite @wasshoi',
          })
        },
      },
      {
        label: '参加中のチャンネル',
        type: 'submenu' as const,
        submenu: ([
          ...joinedChannels.map((channel: any) => ({
            label: channel.name,
            type: 'checkbox' as const,
            checked: config.get('activated_channels', []).includes(channel.id),
            click: () => {
              const activatedChannels = config.get('activated_channels', [])

              if (activatedChannels.includes(channel.id)) {
                config.set(
                  'activated_channels',
                  activatedChannels.filter(
                    (channelId: string) => channelId !== channel.id
                  )
                )
              } else {
                config.set('activated_channels', [
                  ...activatedChannels,
                  channel.id,
                ])
              }
            },
          })),
        ] as any) as Menu,
      },
      {
        label: 'Slack認証を取り消す',
        click: async () => {
          const { response } = await dialog.showMessageBox(
            this.getBrowserWindow(),
            {
              type: 'warning',
              title: 'Slack認証の取り消し',
              message:
                'Slack認証の取り消しを行い、関連する設定を初期化します。よろしいですか？',
              buttons: ['いいえ', 'はい'],
              defaultId: 0,
              cancelId: 0,
            }
          )

          if (response === 1) {
            const token = config.get('access_token')

            if (this.webClient)
              await this.webClient.auth.revoke({
                token,
                test: false,
              })

            config.delete('activated_channels')
            config.delete('access_token')
            config.delete('bot')

            this.createAuthWindow()
          }
        },
      },
    ]
  }
}
