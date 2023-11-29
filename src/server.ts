import path from 'path'

import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import pino from 'pino'

dotenv.config({ path: path.join(__dirname, '..', '.env') })
const logger = pino()
const app = express()
const port: string = process.env.PORT ?? '8080'
app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

const server = app.listen(() => {
  logger.info(`Listening http://localhost:${port}`)
})

process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0)
  })
})

export default app
