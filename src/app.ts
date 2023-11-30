import path from 'path'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import pino from 'pino'
import morgan from 'morgan'
import db from './utils/db'
import usersRouter from './routes/user-route'

export const logger = pino()
dotenv.config({ path: path.join(__dirname, '..', '.env') })
const port: string = process.env.PORT ?? '8080'
const app = express()
const DB_PASSWORD: string = process.env?.DB_PASSWORD ?? ''
const URI: string = process.env.DB_URI?.replace('<password>', DB_PASSWORD) ?? ''

process.env?.NODE_ENV === 'development' ? app.use(morgan('dev')) : app.use(morgan('combined'))

app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.use('/api/v1/users', usersRouter)

app.listen(port, () => {
  void db(URI)
  logger.info(`Listening http://localhost:${port}`)
})
