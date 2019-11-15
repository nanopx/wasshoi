import { ipcRenderer } from 'electron'
import Wasshoi from './lib/wasshoi'

import './core/block-mouse-events'
import commandParser from './lib/command-parser'

// App
const $screen = document.getElementById('screen') as HTMLDivElement

const wasshoi = new Wasshoi($screen)

const sleep = (sec = 1) => {
  const time = sec * 1000
  return new Promise((resolve) =>
    setTimeout(resolve, Number.isNaN(time) ? 1000 : time)
  )
}

ipcRenderer.on('message', async (event, { text, options = {} }) => {
  const {
    message,
    type,
    position,
    duration,
    color,
    size,
    direction,
    ease,
    repeat,
    effect,
  } = commandParser(text)

  if (type && type === 'broadcast') {
    wasshoi.broadcast(message, {
      duration,
      position,
      color,
      effect,
      size,
    })
  } else {
    const fire = () => {
      wasshoi.fire(message, {
        duration: parseFloat(duration),
        color,
        size: parseInt(size, 10),
        direction,
        ease,
        effect,
      })
    }

    if (!repeat) {
      fire()
    } else {
      let [count, wait] = repeat.split(',')
      count = parseInt(count, 10)
      wait = wait ? parseFloat(wait) : 1

      if (Number.isNaN(count)) {
        count = 1
      }

      if (count > 100) {
        count = 100
      }

      if (Number.isNaN(wait) || wait < 0) {
        wait = 1
      }

      if (wait > 2) {
        wait = 2
      }

      fire()

      // eslint-disable-next-line no-plusplus
      for (let i = count - 1; i > 0; i--) {
        // eslint-disable-next-line no-await-in-loop
        await sleep(wait)
        fire()
      }
    }
  }
})
