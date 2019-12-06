import { EventEmitter } from 'events'

export class Dispatcher extends EventEmitter {
  dispatch(text: string, options: object = {}): void {
    this.emit('dispatch', text, options)
  }
}
