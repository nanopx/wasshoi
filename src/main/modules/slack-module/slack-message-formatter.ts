import { WebClient } from '@slack/web-api'
import punycode from 'punycode'
import emojiData from './emoji_pretty.json'

const slackMd2Html = (message: string) => {
  const converted = [
    {
      pattern: /(^|\s|,)\*([^]+?)\*($|\s|,)/gm,
      replace: '$1<b>$2</b>$3',
    },
    {
      pattern: /(^|\s|,)~([^~]+?)~($|\s|,)/gm,
      replace: '$1<strike>$2</strike>$3',
    },
    {
      pattern: /(^|\s|,)_([^_]+?)_($|\s|,)/gm,
      replace: '$1<i>$2</i>$3',
    },
  ].reduce(
    (acc, { pattern, replace }) => acc.replace(pattern, replace),
    message
  )

  return converted.replace(/\n/g, '<br />')
}

export default class SlackMessageFormatter {
  // TODO: Pass resources instead of WebClient
  constructor(
    private botWebClient: WebClient,
    private userWebClient: WebClient
  ) {}

  private async replaceEmojis(message: string) {
    // Must use user token to use emoji.list
    const { emoji = {} } = await this.userWebClient.emoji.list()

    const emojiMatches = message.match(/:[^:\s]*:/g)

    if (emojiMatches) {
      message = emojiMatches.reduce((acc, emojiMatch) => {
        const emojiName = emojiMatch.replace(/:/g, '')
        let emojiUrl = (emoji as any)[emojiName]
        if (!emojiUrl) {
          const data = emojiData.find((el) => el.short_name === emojiName)

          if (data) {
            const points = data.unified.split('-')
            const pointsHex = points.map((p) => parseInt(p, 16))
            return acc.replace(emojiMatch, punycode.ucs2.encode(pointsHex))
          }

          return acc
        }
        if (emojiUrl.startsWith('alias:')) {
          emojiUrl = (emoji as any)[emojiUrl.replace('alias:', '')]
        }

        return acc.replace(
          new RegExp(emojiMatch, 'g'),
          `<img style="height: 1em; margin: 0 0.1em -0.1em" alt="${emojiName}" src="${emojiUrl}" />`
        )
      }, message)
    }

    return message
  }

  private async replaceTags(message: string) {
    const slackTags = message.match(/<(.*?)>/g)

    if (slackTags) {
      await Promise.all(
        slackTags.map(async (slackTag) => {
          const tag = slackTag.replace(/<|>/g, '')
          // Message contains channel
          if (tag.startsWith('#')) {
            message = message.replace(slackTag, `#${tag.split('|')[1]}`)
          }

          // Message contains mention
          if (tag.startsWith('@')) {
            const {
              ok,
              user: mentionUser,
            } = await this.botWebClient.users.info({
              user: tag.replace('@', ''),
            })

            if (ok) {
              message = message.replace(
                slackTag,
                `@${(mentionUser as any).profile.display_name}`
              )
            }
          }
          // message contains image
          if (tag.startsWith('http://') || tag.startsWith('https://')) {
            message = message.replace(slackTag, tag)
          }
        })
      )
    }

    return message
  }

  async format(message: string) {
    message = await this.replaceTags(message)
    message = slackMd2Html(message)
    message = await this.replaceEmojis(message)

    return message
  }
}
