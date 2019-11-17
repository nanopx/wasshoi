import express, { Application } from 'express'
import expressWs, { Router } from 'express-ws'
import { Server } from 'http'
import ejs from 'ejs'

export default class WebServer {
  private app: Application
  private server: Server | null = null

  constructor(private port: number, private host = '0.0.0.0') {
    this.app = express()
    this.app.engine('html', ejs.renderFile as any)
    expressWs(this.app)
  }

  getPort() {
    return this.port
  }

  getHost() {
    return this.host
  }

  getRouter(): Router {
    return express.Router()
  }

  setRouter(router: Router): void {
    this.app.use(router)
  }

  listen(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, this.host, (err) => {
        if (err) return reject(err)
        console.log(
          `Internal server running at: http://${this.host}:${this.port}`
        )
        resolve()
      })
    })
  }

  close(): void {
    if (this.server) this.server.close()
  }
}
