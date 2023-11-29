import path from 'path'

import express from 'express'
import dotenv from 'dotenv'
import pino from 'pino'

dotenv.config({ path: path.join(__dirname, '..', '.env') })
const logger = pino()
const app = express()
const port: string = process.env.PORT ?? '8080'

const server = app.listen(() => {
  logger.info(`Listening http://localhost:${port}`)
})

process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0)
  })
})

export default app
