import { desktopCapturer, screen, remote, ipcRenderer } from 'electron'
// const fs = require('fs')
// const Store = require('electron-store')

const currentWindow = remote.getCurrentWindow()

// const config = new Store()

const getImageBrightness = async (image: string) => {
  return new Promise((resolve) => {
    const img = document.createElement('img')
    img.src = image
    img.style.display = 'none'
    document.body.appendChild(img)

    let colorSum = 0

    img.onload = function onLoad() {
      // create canvas
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height

      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const { data } = imageData
      let r
      let g
      let b
      let avg

      for (let x = 0, len = data.length; x < len; x += 4) {
        r = data[x]
        g = data[x + 1]
        b = data[x + 2]

        avg = Math.floor((r + g + b) / 3)
        colorSum += avg
      }

      const brightness = Math.floor(colorSum / (img.width * img.height))
      resolve(brightness)
    }
  })
}

ipcRenderer.on('autoconfigure', async () => {
  const currentDisplay = screen.getDisplayNearestPoint(
    currentWindow.getBounds()
  )

  const sources = await desktopCapturer.getSources({
    types: ['screen'],
  })

  const currentScreen = (sources as any).find(
    (source: any) => parseInt(source.display_id, 10) === currentDisplay.id
  )

  if (!currentScreen) return

  const brightness = await getImageBrightness(
    currentScreen.thumbnail.toDataURL()
  )

  // eslint-disable-next-line no-alert
  alert(brightness)
})
