import path from 'path'

import express from 'express'
import dotenv from 'dotenv'
import pino from 'pino'
import db from './utils/db'

dotenv.config({ path: path.join(__dirname, '..', '.env') })
const logger = pino()
const app = express()
const port: string = process.env.PORT ?? '8080'

const DB_PASSWORD: string = process.env?.DB_PASSWORD ?? ''
const URI: string = process.env.DB_URI?.replace('<password>', DB_PASSWORD) ?? ''

const server = app.listen(() => {
  void db(URI)
  logger.info(`Listening http://localhost:${port}`)
})

process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0)
  })
})

export default app
