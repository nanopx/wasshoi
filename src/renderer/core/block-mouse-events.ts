/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-underscore-dangle */
import { remote } from 'electron'

const remoteWindow = remote.getCurrentWindow()
const { setIgnoreMouseEvents } = remoteWindow

// Click through transparent area
// eslint-disable-next-line no-restricted-globals
addEventListener('pointerover', function mousePolicy(event) {
  ;(mousePolicy as any)._canClick =
    event.target === document.documentElement
      ? (mousePolicy as any)._canClick &&
        setIgnoreMouseEvents(true, {
          forward: true,
        })
      : (mousePolicy as any)._canClick || setIgnoreMouseEvents(false) || 1
})

setIgnoreMouseEvents(true, {
  forward: true,
})
