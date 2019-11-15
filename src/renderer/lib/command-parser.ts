const commandKeys: string[] = [
  'type',
  'position',
  'duration',
  'color',
  'size',
  'direction',
  'ease',
  'repeat',
  'effect',
]

const commandParser = (
  text: string,
  keywords: string[] = commandKeys
): { [key: string]: any } => {
  if (text.indexOf(':') === -1) {
    return {
      text: text,
    }
  }

  const parts = text.split(/\s/)

  const commands: { [key: string]: string } = {}

  const commandsMap = parts.reduce((acc, part) => {
    if (!part) return acc

    const match = part.match(new RegExp(`(${keywords.join('|')}):(.+)`))

    if (!match) return acc

    const [, cmd, value] = match

    commands[cmd] = value

    return [
      ...acc,
      {
        key: [cmd],
        value,
      },
    ]
  }, [] as any[])

  const message = commandsMap.reduce(
    (str: string, { key, value }) =>
      str.replace(
        new RegExp(
          `\\s?${key}:${value.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')}\\s?`
        ),
        ''
      ),
    text as string
  )

  return {
    message,
    ...commands,
  }
}

export default commandParser
