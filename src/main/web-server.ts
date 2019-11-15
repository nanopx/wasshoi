import express, { Application } from 'express'
import expressWs, { Router } from 'express-ws'
import { Server } from 'http'

export default class WebServer {
  private app: Application
  private server: Server | null = null

  constructor() {
    this.app = express()
    expressWs(this.app)
  }

  getRouter(): Router {
    return express.Router()
  }

  setRouter(router: Router): void {
    this.app.use(router)
  }

  listen(port: number, host = '0.0.0.0'): Promise<any> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(port, host, (err) => {
        if (err) return reject(err)
        console.log(`Internal server running at: http://${host}:${port}`)
        resolve(err)
      })
    })
  }

  close(): void {
    if (this.server) this.server.close()
  }
}
