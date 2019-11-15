import Store from 'electron-store'
import randomColor from 'randomcolor'

const config = new Store()

export enum FontColor {
  RANDOM = '__RANDOM__',
}

export enum Direction {
  LTR = 'ltr',
  RTL = 'rtl',
}

interface WasshoiOptions {
  fontColor?: FontColor | string
  minDuration?: number
  maxDuration?: number
  randMinDuration?: number
  randMaxDuration?: number
  minFontSize?: number
  maxFontSize?: number
  randMinFontSize?: number
  randMaxFontSize?: number
}

const rand = (min = 1, max = 5) => {
  return Math.floor(Math.random() * Math.floor(max)) + min
}

const createMessage = (
  comment: string,
  fontSize: number,
  textColor: string
) => {
  const div = document.createElement('div')

  div.innerHTML = comment
  div.style.display = 'inline-block'
  div.style.whiteSpace = 'nowrap'
  div.style.position = 'absolute'
  div.style.fontSize = `${fontSize}px`
  div.style.color = textColor

  const backgroundMode = config.get('display.transparent_background', 'none')

  switch (backgroundMode) {
    case 'none':
      break

    case 'dark':
      div.style.backgroundColor = 'rgba(0, 0, 0, 0.2)'
      div.style.padding = '0 0.3em'
      div.style.borderRadius = '3px'
      break

    case 'light':
    default:
      div.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
      div.style.padding = '0 0.3em'
      div.style.borderRadius = '3px'
  }

  return div
}

const applyEffect = (div: HTMLDivElement, effect: string) => {
  const child = document.createElement('div')
  child.classList.add(`effect-${effect}`)
  child.innerHTML = div.innerHTML
  div.innerText = ''
  div.appendChild(child)
  return child
}

const applyEffects = (div: HTMLDivElement, effect: string | null = null) => {
  const effects = effect ? effect.split(',') : []

  if (effects.includes('blink')) {
    applyEffect(div, 'blink')
  }

  if (effects.includes('wave')) {
    applyEffect(div, 'wave')
  }

  if (effects.includes('jump')) {
    applyEffect(div, 'jump')
  }

  if (effects.includes('shake')) {
    applyEffect(div, 'shake')
  }

  if (effects.includes('glow')) {
    applyEffect(div, 'glow')
  }

  return div
}

const isValidColor = (color: string) => {
  const { style } = new Option()
  style.color = color
  return style.color === color || /^#[0-9A-F]{6}$/i.test(color)
}

export default class Wasshoi {
  private el: HTMLElement

  private options: Required<WasshoiOptions> = {
    fontColor: FontColor.RANDOM,
    minDuration: 0,
    maxDuration: 100,
    randMinDuration: 4,
    randMaxDuration: 10,
    minFontSize: 10,
    maxFontSize: 400,
    randMinFontSize: 25,
    randMaxFontSize: 65,
  }

  constructor(el: HTMLElement, options: WasshoiOptions = {}) {
    this.el = el
    this.el.style.position = 'relative'
    this.el.style.overflow = 'hidden'

    this.options = {
      ...this.options,
      ...options,
    }
  }

  moveElement(
    div: HTMLDivElement,
    direction: Direction,
    yPos: number,
    duration: number,
    ease: string | null = null
  ) {
    div.style.willChange = 'transform'
    div.style.transition = `transform ${duration}s ${ease || 'linear'}`

    div.addEventListener(
      'transitionend',
      () => {
        div.remove()
      },
      false
    )

    switch (direction) {
      case Direction.LTR:
        div.style.transform = `translate3d(-100%, ${yPos}px, 0)`
        break

      case Direction.RTL:
      default:
        div.style.transform = `translate3d(${this.el.clientWidth}px, ${yPos}px, 0)`
    }

    this.el.appendChild(div)

    switch (direction) {
      case Direction.LTR:
        div.style.transform = `translate3d(${this.el.clientWidth}px, ${yPos}px, 0)`
        break

      case Direction.RTL:
      default:
        div.style.transform = `translate3d(-${div.clientWidth}px, ${yPos}px, 0)`
    }
  }

  showElement(
    div: HTMLDivElement,
    position: 'top' | 'bottom',
    duration: number
  ) {
    const pos =
      position === 'top' || position === 'bottom' ? position : 'bottom'
    div.style[pos] = '50px'
    div.style.left = '50%'
    div.style.transform = 'translate3d(-50%, 0, 0)'
    this.el.appendChild(div)
    setTimeout(() => div.remove(), duration * 1000)
  }

  getElementSize(div: HTMLDivElement) {
    // Hide div and get height
    div.style.opacity = '0'
    this.el.appendChild(div)
    const height = div.clientHeight
    const width = div.clientWidth
    this.el.removeChild(div)
    div.style.opacity = '1'

    return {
      height,
      width,
    }
  }

  getRandColor(color: string | null = null) {
    if (color && isValidColor(color)) return color

    return this.options.fontColor === FontColor.RANDOM
      ? randomColor({
          seed: Date.now(),
          luminosity: config.get('display.font_color_mode', 'random') as any,
        })
      : this.options.fontColor
  }

  getRandFontSize(inputFontSize: number | null = null) {
    if (!inputFontSize) {
      return rand(this.options.randMinFontSize, this.options.randMaxFontSize)
    }

    if (inputFontSize && inputFontSize > this.options.maxFontSize) {
      return this.options.maxFontSize
    }

    if (inputFontSize && inputFontSize < this.options.minFontSize) {
      return this.options.minFontSize
    }

    return inputFontSize
  }

  getRandTop(targetHeight: number) {
    const maxTop = this.el.clientHeight - targetHeight
    // TODO: change font size to fit to screen
    return maxTop < 0 ? 0 : rand(0, maxTop)
  }

  getRandDuration(targetWidth: number, inputDuration: number | null = null) {
    if (!inputDuration) {
      const diff = this.options.randMaxDuration - this.options.randMinDuration
      const borderline = this.options.randMinDuration + Math.round(diff / 1.5)

      if (this.el.clientWidth / targetWidth > 1) {
        // 画面幅と同じ幅か小さい場合は早めに
        return rand(this.options.randMinDuration, borderline)
      }
      // 画面幅より大きい場合は遅めに
      return rand(borderline, this.options.randMaxDuration)
    }

    // const duration = inputDuration

    if (inputDuration && inputDuration > this.options.maxDuration) {
      return this.options.maxDuration
    }

    if (inputDuration && inputDuration < this.options.minDuration) {
      return this.options.minDuration
    }

    return inputDuration
  }

  adjustFontSize(div: HTMLDivElement, fontSize: number) {
    const { height } = this.getElementSize(div)

    // return if comment fits in screen
    if (height <= this.el.clientHeight) return

    const newFontSize = fontSize - rand(2, 4)

    div.style.fontSize = `${newFontSize}px`

    this.adjustFontSize(div, newFontSize)
  }

  fire(
    comment: string,
    {
      duration = null,
      color = null,
      size = null,
      direction = Direction.RTL,
      ease = null,
      effect = null,
    }: {
      duration?: number | null
      color?: string | null
      size?: number | null
      position?: 'top' | 'bottom'
      direction?: Direction
      ease?: string | null
      effect?: string | null
    } = {}
  ) {
    const fontSize = this.getRandFontSize(size)

    const colorMode = config.get('display.font_color_mode', 'random')

    const div = createMessage(
      comment,
      fontSize,
      colorMode === 'black'
        ? '#000'
        : colorMode === 'white'
        ? '#fff'
        : this.getRandColor(color)
    )

    this.adjustFontSize(div, fontSize)

    const { height, width } = this.getElementSize(div)

    applyEffects(div, effect)

    this.moveElement(
      div,
      direction,
      this.getRandTop(height),
      this.getRandDuration(width, duration),
      ease
    )
  }

  broadcast(
    comment: string,
    {
      duration = null,
      color = null,
      size = null,
      position = 'top',
      effect = null,
    }: {
      duration?: number | null
      color?: string | null
      size?: number | null
      position?: 'top' | 'bottom'
      effect?: string | null
    } = {}
  ) {
    const fontSize = size || 50
    const colorMode = config.get('display.font_color_mode', 'random')

    const div = createMessage(
      comment,
      fontSize,
      colorMode === 'black'
        ? '#000'
        : colorMode === 'white'
        ? '#fff'
        : this.getRandColor(color)
    )

    const { width } = this.getElementSize(div)

    applyEffects(div, effect)

    this.showElement(
      div,
      position as 'bottom' | 'top',
      this.getRandDuration(width, duration)
    )
  }
}
